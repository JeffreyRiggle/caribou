from core.asset_repo import AssetRespositoy
from core.dbaccess.postgres_access import PostgresDBAccess
from core.dbaccess.sqlite_access import SQLiteDBAccess
from core.helpers import domain_to_full_url, get_domain
from core.link import Link
from core.policy import PolicyManager
from core.page import Page
from core.status import ResourceStatus
from core.storage.file_access import FileAccess
from core.storage.s3_access import S3Access
from core.logger import Logger
import concurrent.futures
import time
from uuid import uuid4


class Crawler:
    def __init__(self, db: SQLiteDBAccess | PostgresDBAccess, policy_manager: PolicyManager, storage: FileAccess | S3Access, start_time: float, logger: Logger):
        self.db = db
        self.policy_manager = policy_manager
        self.processed = set()
        self.asset_respository = AssetRespositoy()
        self.pending_resouce_entries = []
        self.pending_metadata_entries = []
        self.pending_performance_traces = []
        self.pending_edges = []
        self.pending_favicons = []
        self.start_time = start_time
        self.storage = storage
        self.logger = logger

    def load(self):
        start_pages = self.policy_manager.get_crawl_pages()

        needs_status_pages = self.policy_manager.get_needs_status_pages()
        rate_limited_pages = self.policy_manager.get_rate_limited_pages()
        self.logger.log(f"Starting crawler with {len(needs_status_pages)} needs status pages and {len(rate_limited_pages)} rate limited pages")
        
        for pending_page in [*needs_status_pages, *rate_limited_pages]:
            if pending_page != None and (self.policy_manager.should_crawl_url(pending_page) or self.policy_manager.should_download_url(pending_page)):
                start_pages.append(pending_page)
         
        self.pending_links = list(map(lambda p: Link(self.storage, domain_to_full_url(p), self.asset_respository, self.policy_manager, self.logger), start_pages))

    def crawl(self):
        while len(self.pending_links) > 0:
            relevant_children = []

            # Traverse the links by cleaning them as we go.
            # Interating all links causes memory to pile up like crazy
            pop_size = 10 if len(self.pending_links) > 10 else len(self.pending_links)
            links = []
            while pop_size > 0:
                links.append(self.pending_links.pop())
                pop_size -= 1

            while links:
                next_links = []
                with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
                    futures = []
                    for link in links:
                        futures.append(executor.submit(self.process_link, link, relevant_children))

                    for future in concurrent.futures.as_completed(futures):
                        result = future.result()
                        if result != None:
                            next_links.append(future.result())

                if len(next_links) > 0:
                    links = next_links
                else:
                    links = None

            with self.db.build_transaction() as transaction:
                for res in self.pending_resouce_entries:
                    self.db.add_resource(res['url'], res['file'], res['status'], res['title'], res['text'], res['description'], res['contentType'], res['headers'] or '', transaction)

                for metadata in self.pending_metadata_entries:
                    self.db.add_metadata(metadata['url'], metadata['jsBytes'], metadata['htmlBytes'], metadata['cssBytes'], metadata['compressed'], transaction)

                for perf in self.pending_performance_traces:
                    self.db.track_performance(perf['url'], perf['appTime'], perf['networkTime'], transaction)

                for link in self.pending_edges:
                    self.db.add_link(link["sourceUrl"], link["targetUrl"], transaction)

                for favicon in self.pending_favicons:
                    self.db.add_favicon(favicon['docurl'], favicon['url'], favicon['sizes'], favicon['media'], favicon['type'], transaction)

                self.policy_manager.flush_pending_domains()
                self.pending_resouce_entries.clear()
                self.pending_metadata_entries.clear()
                self.pending_performance_traces.clear()
                self.pending_edges.clear()
                self.pending_favicons.clear()

            self.pending_links = relevant_children

    def process_link(self, link: Link, relevant_children: list[Link]):
        download_links = []
        pg_start = time.time()
        load_link_result = self.record_link(link)
        network_time = load_link_result[1]
        if link.is_page() == True:
            self.process_assets(link.result)

        if load_link_result[0]:
            if self.pending_links:
                return self.pending_links.pop()
            else:
                return None
        
        links = load_link_result[2]
        for link in links:
            self.process_child_link(link, download_links, relevant_children)

        self.pending_performance_traces.append({ 'url': link.url, 'appTime': time.time() - pg_start - network_time, 'networkTime': network_time })

        for download_link in download_links:
            self.download_child_link(download_link)

        self.processed.add(link.url)
        if self.pending_links:
            return self.pending_links.pop()

        return None
    
    def process_assets(self, page: Page):
        if page == None:
            return

        asset_collection = page.get_downloadable_assets()
        for favicon in page.favicons:
            self.pending_favicons.append({ 'docurl': favicon.document_url, 'url': favicon.url, 'type': favicon.type, 'media': favicon.media, 'sizes': favicon.sizes })

        if self.policy_manager.should_download_asset('image'):
            for img in asset_collection['image']:
                self.pending_edges.append({ 'sourceUrl': page.url, 'targetUrl': img.url })
                
                if self.asset_processed(img.url):
                    continue

                file_path = img.download()
                if file_path == None:
                    self.pending_resouce_entries.append({ 'url': img.url, 'file': '', "status": ResourceStatus.Failed.value, 'text': '', 'description': img.description, 'title': img.title, 'contentType': "image", 'headers': img.headers })
                else:
                    self.pending_resouce_entries.append({ 'url': img.url, 'file': file_path, "status": ResourceStatus.Processed.value, 'text': '', 'description': img.description, 'title': img.title, 'contentType': "image", 'headers': img.headers })
                self.processed.add(img.url)

        if self.policy_manager.should_download_asset('javascript'):
            for js_asset in asset_collection['javascript']:
                url = js_asset[0]
                content = js_asset[1]

                self.pending_edges.append({ 'sourceUrl': page.url, 'targetUrl': url })
                if url == None or self.asset_processed(url):
                    continue

                dir_path = f"{get_domain(page.url)}/javascript"
                file_id = str(uuid4())
                file_name = f"{file_id}.js"
                self.storage.write(dir_path, file_name, content)
                self.pending_resouce_entries.append({ 'url': url, 'file': f"{dir_path}/{file_name}", 'status': ResourceStatus.Processed.value, 'text': content, 'description': '', 'title': '', 'contentType': 'javascript', 'headers': "" })
                self.processed.add(url)

        if self.policy_manager.should_download_asset('css'):
            for css_asset in asset_collection['css']:
                url = css_asset[0]
                content = css_asset[1]

                self.pending_edges.append({ 'sourceUrl': page.url, 'targetUrl': url })
                if url == None or self.asset_processed(url):
                    continue

                dir_path = f"{get_domain(page.url)}/css"
                file_id = str(uuid4())
                file_name = f"{file_id}.css"
                self.storage.write(dir_path, file_name, content)
                self.pending_resouce_entries.append({ 'url': url, 'file': f"{dir_path}/{file_name}", 'status': ResourceStatus.Processed.value, 'text': content, 'description': '', 'title': '', 'contentType': 'css', 'headers': "" })
                self.processed.add(url)

    def record_link(self, link: Link):
        network_time = link.load()

        failed = link.failed == True
        if link.rate_limited == True:
            self.policy_manager.set_rate_limited(link.url)
            self.pending_resouce_entries.append({ 'url': link.url, 'file': "", 'status': ResourceStatus.RateLimited.value, 'text': "", 'description': "", 'title' : "", 'contentType': link.get_content_type(), 'headers': "" })
            self.processed.add(link.url)
            return (failed, network_time, [])

        if failed:
            self.pending_resouce_entries.append({ 'url': link.url, 'file': "", 'status': ResourceStatus.Failed.value, 'text': "", 'description': "", 'title' : "", 'contentType': link.get_content_type(), 'headers': "" })
            self.processed.add(link.url)
            return (failed, network_time, [])
        
        pending_resource = link.download()

        if pending_resource == None:
            return (failed, network_time, [])

        self.pending_resouce_entries.append(pending_resource)

        if link.is_page():
            page = link.result
            self.pending_metadata_entries.append({ 'url': page.url, 'jsBytes': page.js_bytes, 'htmlBytes': page.html_bytes, 'cssBytes': page.css_bytes, 'compressed': page.compression != None })
        
        links = link.get_links()
        for child_link in links:
            if child_link != None:
                self.pending_edges.append({ 'sourceUrl': link.url, 'targetUrl': child_link.url })

        return (failed, network_time, links)

    def process_child_link(self, link: Link, download_children: list[Link], relevant_children: list[Link]):
        if link == None:
            return

        if self.asset_processed(link.url):
            return 
        
        shouldCrawl = self.policy_manager.should_crawl_url(link.url)

        if shouldCrawl[0] == False and self.policy_manager.should_download_url(link.url):
            download_children.append(link)
            return


        if shouldCrawl[0] == False:
            self.pending_resouce_entries.append({ 'url': link.url, 'file': "", 'status': shouldCrawl[1], 'text': "",  'description': "", 'title': "", 'contentType': 'unknown', 'headers': "" })
            return 

        relevant_children.append(link)

    def download_child_link(self, link: Link):
        dpgStart = time.time()

        if self.asset_processed(link.url):
            return 

        dpgResult = self.record_link(link)
        self.pending_performance_traces.append({ 'url': link.url, 'appTime': time.time() - dpgStart - dpgResult[1], 'networkTime': dpgResult[1] })

    def asset_processed(self, url: str):
        return url in self.processed or self.db.get_resource_last_edit(url) > self.start_time or self.db.get_resource_expire_time(url) > time.time()
