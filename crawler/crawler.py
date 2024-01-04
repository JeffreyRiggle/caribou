import dbaccess
import policy
import page
import helpers
import time
import sqlite3
from status import ResourceStatus

conn = sqlite3.connect("../grepper.db")
startTime = time.time()
db = dbaccess.DBAccess(conn)
processed = set()

db.setup()
policyManager = policy.PolicyManager(conn)

def record_page(page, transaction):
    networkTime = page.load()
    failed = page.failed == True 
    if failed:
        db.add_resource(page.url, "", ResourceStatus.Failed.value, "", transaction)
        processed.add(page.url)
        return (failed, networkTime, [])

    dir_path = f"../contents/{helpers.get_domain(page.url)}"
    file_name = f"{len(processed)}.html"
    helpers.write_file(dir_path, file_name, page.content)
    db.add_resource(page.url, f"{dir_path}/{file_name}", ResourceStatus.Processed.value, page.text, transaction)
    db.add_metadata(page.url, page.jsBytes, page.htmlBytes, page.cssBytes, page.compression != None, transaction)
    return (failed, networkTime, page.get_links())

def process_child_page(page, download_child_pages, relevant_child_pages, transaction):
    if page == None:
        return

    if page.url in processed or db.get_resource_last_edit(page.url) > startTime:
        return 

    if policyManager.should_download_url(page.url):
        download_child_pages.append(page)
        return 

    shouldCrawl = policyManager.should_crawl_url(page.url)

    if shouldCrawl[0] == False:
        db.add_resource(page.url, "", shouldCrawl[1], "", transaction)
        return 

    relevant_child_pages.append(page)

def download_child_page(page, transaction):
    dpgStart = time.time()

    if page.url in processed or db.get_resource_last_edit(page.url) > startTime:
        return 

    dpgResult = record_page(page, transaction)
    db.track_performance(page.url, time.time() - dpgStart - dpgResult[1], dpgResult[1], transaction)

crawlPages = policyManager.get_crawl_pages()
if (len(crawlPages) < 1):
    domain = input("No crawl pages set select a starting domain: ")
    policyManager.add_crawl_domain(domain)
    crawlPages.append(domain)
    
pendingPages = list(map(lambda p: page.Page(helpers.domain_to_full_url(p)), crawlPages))

while len(pendingPages) > 0:
    relevantChildPages = []

    with db.build_transaction() as transaction:
        # Traverse the pages by cleaning them as we go.
        # Interating all pages causes memory to pile up like crazy
        pg = pendingPages.pop()
        while pg:
            downloadChildPages = []
            pgStart = time.time()
            loadPageResult = record_page(pg, transaction)
            networkTime = loadPageResult[1] 

            if loadPageResult[0]:
                if pendingPages:
                    pg = pendingPages.pop()
                else:
                    pg = None
                continue
            
            pages = loadPageResult[2] 
            for p in pages:
                process_child_page(p, downloadChildPages, relevantChildPages, transaction)

            db.track_performance(pg.url, time.time() - pgStart - networkTime, networkTime, transaction)

            for dpg in downloadChildPages:
                download_child_page(dpg, transaction)

            processed.add(pg.url)
            if pendingPages:
                pg = pendingPages.pop()
            else:
                pg = None

    pendingPages = relevantChildPages

print(f"Operation finished in {time.time() - startTime}")
