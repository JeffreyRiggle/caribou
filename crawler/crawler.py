from dbaccess import DBAccess
from policy import PolicyManager
from page import Page
import helpers
import time
import concurrent.futures
from asset_repo import AssetRespositoy
from status import ResourceStatus
from uuid import uuid4

class Crawler:
    def __init__(self, db: DBAccess, start_time: float):
        self.db = db
        self.policy_manager = PolicyManager(self.db)
        self.processed = set()
        self.asset_respository = AssetRespositoy()
        self.pending_resouce_entries = []
        self.pending_metadata_entries = []
        self.pending_performance_traces = []
        self.pending_links = []
        self.start_time = start_time

    def load(self):
        crawl_pages = self.policy_manager.get_crawl_pages()

        if (len(crawl_pages) < 1):
            domain = input("No crawl pages set select a starting domain: ")
            self.policy_manager.add_crawl_domain(domain)
            self.policy_manager.enable_content_download("image")
            self.policy_manager.enable_content_download('javascript')
            self.policy_manager.enable_content_download('css')
            crawl_pages.append(domain)
         
        self.pending_pages = list(map(lambda p: Page(helpers.domain_to_full_url(p), self.asset_respository), crawl_pages))

    def crawl(self):
        while len(self.pending_pages) > 0:
            relevant_child_pages = []

            # Traverse the pages by cleaning them as we go.
            # Interating all pages causes memory to pile up like crazy
            pop_size = 10 if len(self.pending_pages) > 10 else len(self.pending_pages)
            pgs = []
            while pop_size > 0:
                pgs.append(self.pending_pages.pop())
                pop_size -= 1

            while pgs:
                next_pages = []
                with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
                    futures = []
                    for pg in pgs:
                        futures.append(executor.submit(self.process_page, pg, relevant_child_pages))

                    for future in concurrent.futures.as_completed(futures):
                        result = future.result()
                        if result != None:
                            next_pages.append(future.result())

                if len(next_pages) > 0:
                    pgs = next_pages
                else:
                    pgs = None

            with self.db.build_transaction() as transaction:
                for res in self.pending_resouce_entries:
                    self.db.add_resource(res['url'], res['file'], res['status'], res['title'], res['text'], res['description'], res['contentType'], transaction)

                for metadata in self.pending_metadata_entries:
                    self.db.add_metadata(metadata['url'], metadata['jsBytes'], metadata['htmlBytes'], metadata['cssBytes'], metadata['compressed'], transaction)

                for perf in self.pending_performance_traces:
                    self.db.track_performance(perf['url'], perf['appTime'], perf['networkTime'], transaction)

                for link in self.pending_links:
                    self.db.add_link(link["sourceUrl"], link["targetUrl"], transaction)

                self.policy_manager.flush_pending_domains()
                self.pending_resouce_entries.clear()
                self.pending_metadata_entries.clear()
                self.pending_performance_traces.clear()

            self.pending_pages = relevant_child_pages

    def process_page(self, page: Page, relevant_child_pages: list[Page]):
        download_child_pages = []
        pg_start = time.time()
        load_page_result = self.record_page(page)
        network_time = load_page_result[1] 
        self.process_assets(page)

        if load_page_result[0]:
            if self.pending_pages:
                return self.pending_pages.pop()
            else:
                return None
        
        pages = load_page_result[2]
        for p in pages:
            self.process_child_page(p, download_child_pages, relevant_child_pages)

        self.pending_performance_traces.append({ 'url': page.url, 'appTime': time.time() - pg_start - network_time, 'networkTime': network_time })

        for dpg in download_child_pages:
            self.download_child_page(dpg)

        self.processed.add(page.url)
        if self.pending_pages:
            return self.pending_pages.pop()

        return None
    
    def process_assets(self, page: Page):
        if page == None:
            return

        asset_collection = page.get_downloadable_assets()
        if self.policy_manager.should_download_asset('image'):
            for img in asset_collection['image']:
                self.pending_links.append({ 'sourceUrl': page.url, 'targetUrl': img.url })
                
                if img.url in self.processed or self.db.get_resource_last_edit(img.url) > self.start_time:
                    continue

                file_path = img.download()
                if file_path == None:
                    continue

                self.pending_resouce_entries.append({ 'url': img.url, 'file': file_path, "status": ResourceStatus.Processed.value, 'text': '', 'description': img.description, 'title': img.title, 'contentType': "image" })
                self.processed.add(img.url)

        if self.policy_manager.should_download_asset('javascript'):
            for js_asset in asset_collection['javascript']:
                url = js_asset[0]
                content = js_asset[1]

                self.pending_links.append({ 'sourceUrl': page.url, 'targetUrl': url })
                if url == None or url in self.processed or self.db.get_resource_last_edit(url) > self.start_time:
                    continue

                dir_path = f"../contents/{helpers.get_domain(page.url)}/javascript"
                file_id = str(uuid4())
                file_name = f"{file_id}.js"
                helpers.write_file(dir_path, file_name, content)
                self.pending_resouce_entries.append({ 'url': url, 'file': f"{dir_path}/{file_name}", 'status': ResourceStatus.Processed.value, 'text': content, 'description': '', 'title': '', 'contentType': 'javascript' })
                self.processed.add(url)

        if self.policy_manager.should_download_asset('css'):
            for css_asset in asset_collection['css']:
                url = css_asset[0]
                content = css_asset[1]

                self.pending_links.append({ 'sourceUrl': page.url, 'targetUrl': url })
                if url == None or url in self.processed or self.db.get_resource_last_edit(url) > self.start_time:
                    continue

                dir_path = f"../contents/{helpers.get_domain(page.url)}/css"
                file_id = str(uuid4())
                file_name = f"{file_id}.css"
                helpers.write_file(dir_path, file_name, content)
                self.pending_resouce_entries.append({ 'url': url, 'file': f"{dir_path}/{file_name}", 'status': ResourceStatus.Processed.value, 'text': content, 'description': '', 'title': '', 'contentType': 'css' })
                self.processed.add(url)

    def record_page(self, page: Page):
        network_time = page.load()
        failed = page.failed == True 
        if failed:
            self.pending_resouce_entries.append({ 'url': page.url, 'file': "", 'status': ResourceStatus.Failed.value, 'text': "", 'description': "", 'title' : "", 'contentType': 'html' })
            self.processed.add(page.url)
            return (failed, network_time, [])

        dir_path = f"../contents/{helpers.get_domain(page.url)}"
        file_id = str(uuid4())
        file_name = f"{file_id}.html"
        helpers.write_file(dir_path, file_name, page.content)
        self.pending_resouce_entries.append({ 'url': page.url, 'file': f"{dir_path}/{file_name}", 'status': ResourceStatus.Processed.value, 'text': page.text, 'description': page.description, 'title': page.title, 'contentType': "html" })
        self.pending_metadata_entries.append({ 'url': page.url, 'jsBytes': page.js_bytes, 'htmlBytes': page.html_bytes, 'cssBytes': page.css_bytes, 'compressed': page.compression != None })
        
        links = page.get_links()
        for link in links:
            if link != None:
                self.pending_links.append({ 'sourceUrl': page.url, 'targetUrl': link.url })

        return (failed, network_time, links)

    def process_child_page(self, page: Page, download_child_pages: list[Page], relevant_child_pages: list[Page]):
        if page == None:
            return

        if page.url in self.processed or self.db.get_resource_last_edit(page.url) > self.start_time:
            return 

        if self.policy_manager.should_download_url(page.url):
            download_child_pages.append(page)
            return 

        shouldCrawl = self.policy_manager.should_crawl_url(page.url)

        if shouldCrawl[0] == False:
            self.pending_resouce_entries.append({ 'url': page.url, 'file': "", 'status': shouldCrawl[1], 'text': "",  'description': "", 'title': "", 'contentType': "html" })
            return 

        relevant_child_pages.append(page)

    def download_child_page(self, page: Page):
        dpgStart = time.time()

        if page.url in self.processed or self.db.get_resource_last_edit(page.url) > self.start_time:
            return 

        dpgResult = self.record_page(page)
        self.pending_performance_traces.append({ 'url': page.url, 'appTime': time.time() - dpgStart - dpgResult[1], 'networkTime': dpgResult[1] })

