import dbaccess
import policy
import page
import helpers
import time
import sqlite3
from status import ResourceStatus

class Crawler:
    def __init__(self):
        self.conn = sqlite3.connect("../grepper.db")
        self.db = dbaccess.DBAccess(self.conn)
        self.db.setup()
        self.policyManager = policy.PolicyManager(self.conn)
        self.processed = set()

    def load(self):
        crawlPages = self.policyManager.get_crawl_pages()

        if (len(crawlPages) < 1):
            domain = input("No crawl pages set select a starting domain: ")
            self.policyManager.add_crawl_domain(domain)
            crawlPages.append(domain)
         
        self.pendingPages = list(map(lambda p: page.Page(helpers.domain_to_full_url(p)), crawlPages))

    def crawl(self):
        while len(self.pendingPages) > 0:
            relevantChildPages = []

            with self.db.build_transaction() as transaction:
                # Traverse the pages by cleaning them as we go.
                # Interating all pages causes memory to pile up like crazy
                pg = self.pendingPages.pop()
                while pg:
                    downloadChildPages = []
                    pgStart = time.time()
                    loadPageResult = self.record_page(pg, transaction)
                    networkTime = loadPageResult[1] 

                    if loadPageResult[0]:
                        if self.pendingPages:
                            pg = self.pendingPages.pop()
                        else:
                            pg = None
                        continue
                    
                    pages = loadPageResult[2] 
                    for p in pages:
                        self.process_child_page(p, downloadChildPages, relevantChildPages, transaction)

                    self.db.track_performance(pg.url, time.time() - pgStart - networkTime, networkTime, transaction)

                    for dpg in downloadChildPages:
                        self.download_child_page(dpg, transaction)

                    self.processed.add(pg.url)
                    if self.pendingPages:
                        pg = self.pendingPages.pop()
                    else:
                        pg = None

            self.pendingPages = relevantChildPages

    def record_page(self, page, transaction):
        networkTime = page.load()
        failed = page.failed == True 
        if failed:
            self.db.add_resource(page.url, "", ResourceStatus.Failed.value, "", "", transaction)
            self.processed.add(page.url)
            return (failed, networkTime, [])

        dir_path = f"../contents/{helpers.get_domain(page.url)}"
        file_name = f"{len(self.processed)}.html"
        helpers.write_file(dir_path, file_name, page.content)
        self.db.add_resource(page.url, f"{dir_path}/{file_name}", ResourceStatus.Processed.value, page.text, page.description, transaction)
        self.db.add_metadata(page.url, page.jsBytes, page.htmlBytes, page.cssBytes, page.compression != None, transaction)
        return (failed, networkTime, page.get_links())

    def process_child_page(self, page, download_child_pages, relevant_child_pages, transaction):
        if page == None:
            return

        if page.url in self.processed or self.db.get_resource_last_edit(page.url) > startTime:
            return 

        if self.policyManager.should_download_url(page.url):
            download_child_pages.append(page)
            return 

        shouldCrawl = self.policyManager.should_crawl_url(page.url)

        if shouldCrawl[0] == False:
            self.db.add_resource(page.url, "", shouldCrawl[1], "", "", transaction)
            return 

        relevant_child_pages.append(page)

    def download_child_page(self, page, transaction):
        dpgStart = time.time()

        if page.url in self.processed or self.db.get_resource_last_edit(page.url) > startTime:
            return 

        dpgResult = self.record_page(page, transaction)
        self.db.track_performance(page.url, time.time() - dpgStart - dpgResult[1], dpgResult[1], transaction)

startTime = time.time()
c = Crawler()
c.load()
c.crawl()
print(f"Operation finished in {time.time() - startTime}")
