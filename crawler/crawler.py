from dbaccess import DBAccess
from policy import PolicyManager
from page import Page
import helpers
import time
import sqlite3
import concurrent.futures
from asset_repo import AssetRespositoy
from status import ResourceStatus
from uuid import uuid4

class Crawler:
    def __init__(self):
        self.conn = sqlite3.connect("../grepper.db", check_same_thread=False)
        self.db = DBAccess(self.conn)
        self.db.setup()
        self.policyManager = PolicyManager(self.db)
        self.processed = set()
        self.asset_respository = AssetRespositoy()
        self.pending_resouce_entries = []
        self.pending_metadata_entries = []
        self.pending_performance_traces = []

    def load(self):
        crawlPages = self.policyManager.get_crawl_pages()

        if (len(crawlPages) < 1):
            domain = input("No crawl pages set select a starting domain: ")
            self.policyManager.add_crawl_domain(domain)
            crawlPages.append(domain)
         
        self.pendingPages = list(map(lambda p: Page(helpers.domain_to_full_url(p), self.asset_respository), crawlPages))

    def crawl(self):
        while len(self.pendingPages) > 0:
            relevantChildPages = []

            # Traverse the pages by cleaning them as we go.
            # Interating all pages causes memory to pile up like crazy
            pop_size = 10 if len(self.pendingPages) > 10 else len(self.pendingPages)
            pgs = []
            while pop_size > 0:
                pgs.append(self.pendingPages.pop())
                pop_size -= 1

            while pgs:
                nextPgs = []
                with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
                    futures = []
                    for pg in pgs:
                        futures.append(executor.submit(self.process_page, pg, relevantChildPages))

                    for future in concurrent.futures.as_completed(futures):
                        result = future.result()
                        if result != None:
                            nextPgs.append(future.result())

                if len(nextPgs) > 0:
                    pgs = nextPgs
                else:
                    pgs = None

            with self.db.build_transaction() as transaction:
                for res in self.pending_resouce_entries:
                    self.db.add_resource(res['url'], res['file'], res['status'], res['title'], res['text'], res['description'], transaction)

                for metadata in self.pending_metadata_entries:
                    self.db.add_metadata(metadata['url'], metadata['jsBytes'], metadata['htmlBytes'], metadata['cssBytes'], metadata['compressed'], transaction)

                for perf in self.pending_performance_traces:
                    self.db.track_performance(perf['url'], perf['appTime'], perf['networkTime'], transaction)

                self.policyManager.flush_pending_domains()
                self.pending_resouce_entries.clear()
                self.pending_metadata_entries.clear()
                self.pending_performance_traces.clear()

            self.pendingPages = relevantChildPages

    def process_page(self, page, relevantChildPages):
        downloadChildPages = []
        pgStart = time.time()
        loadPageResult = self.record_page(page)
        networkTime = loadPageResult[1] 

        if loadPageResult[0]:
            if self.pendingPages:
                return self.pendingPages.pop()
            else:
                return None
        
        pages = loadPageResult[2] 
        for p in pages:
            self.process_child_page(p, downloadChildPages, relevantChildPages)

        self.pending_performance_traces.append({ 'url': page.url, 'appTime': time.time() - pgStart - networkTime, 'networkTime': networkTime })

        for dpg in downloadChildPages:
            self.download_child_page(dpg)

        self.processed.add(page.url)
        if self.pendingPages:
            return self.pendingPages.pop()

        return None

    def record_page(self, page):
        networkTime = page.load()
        failed = page.failed == True 
        if failed:
            self.pending_resouce_entries.append({ 'url': page.url, 'file': "", 'status': ResourceStatus.Failed.value, 'text': "", 'description': "", 'title' : "" })
            self.processed.add(page.url)
            return (failed, networkTime, [])

        dir_path = f"../contents/{helpers.get_domain(page.url)}"
        file_id = str(uuid4())
        file_name = f"{file_id}.html"
        helpers.write_file(dir_path, file_name, page.content)
        self.pending_resouce_entries.append({ 'url': page.url, 'file': f"{dir_path}/{file_name}", 'status': ResourceStatus.Processed.value, 'text': page.text, 'description': page.description, 'title': page.title })
        self.pending_metadata_entries.append({ 'url': page.url, 'jsBytes': page.jsBytes, 'htmlBytes': page.htmlBytes, 'cssBytes': page.cssBytes, 'compressed': page.compression != None })
        return (failed, networkTime, page.get_links())

    def process_child_page(self, page, download_child_pages, relevant_child_pages):
        if page == None:
            return

        if page.url in self.processed or self.db.get_resource_last_edit(page.url) > startTime:
            return 

        if self.policyManager.should_download_url(page.url):
            download_child_pages.append(page)
            return 

        shouldCrawl = self.policyManager.should_crawl_url(page.url)

        if shouldCrawl[0] == False:
            self.pending_resouce_entries.append({ 'url': page.url, 'file': "", 'status': shouldCrawl[1], 'text': "",  'description': "", 'title': "" })
            return 

        relevant_child_pages.append(page)

    def download_child_page(self, page):
        dpgStart = time.time()

        if page.url in self.processed or self.db.get_resource_last_edit(page.url) > startTime:
            return 

        dpgResult = self.record_page(page)
        self.pending_performance_traces.append({ 'url': page.url, 'appTime': time.time() - dpgStart - dpgResult[1], 'networkTime': dpgResult[1] })

startTime = time.time()
c = Crawler()
c.load()
c.crawl()
print(f"Operation finished in {time.time() - startTime}")
