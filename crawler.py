import dbaccess
import policy
import page
import helpers
import time
from status import ResourceStatus

startTime = time.time()
db = dbaccess.DBAccess()
processed = set()

db.setup()
policyManager = policy.PolicyManager()

def record_page(page):
    networkTime = page.load()
    failed = page.failed == True 
    if failed:
        db.add_resource(page.url, "", ResourceStatus.Failed.value)
        processed.add(page.url)
        return (failed, networkTime, []) 

    dir_path = f"contents/{helpers.get_domain(page.url)}"
    file_name = f"{len(processed)}.html"
    helpers.write_file(dir_path, file_name, page.content)
    db.add_resource(page.url, f"{dir_path}/{file_name}", ResourceStatus.Processed.value)
    db.add_metadata(page.url, page.jsBytes, page.htmlBytes, page.cssBytes, page.compression != None)
    return (failed, networkTime, page.get_links())


crawlPages = policyManager.get_crawl_pages()
if (len(crawlPages) < 1):
    domain = input("No crawl pages set select a starting domain: ")
    policyManager.add_crawl_domain(domain)
    crawlPages.append(domain)
    
pendingPages = list(map(lambda p: page.Page(helpers.domain_to_full_url(p)), crawlPages))

while len(pendingPages) > 0:
    relevantChildPages = []
    dowloadChildPages = []

    for pg in pendingPages:
        pgStart = time.time()
        loadPageResult = record_page(pg)
        networkTime = loadPageResult[1] 

        if loadPageResult[0]:
            continue
        
        pages = loadPageResult[2] 
        for p in pages:
            if p == None:
                continue

            if p.url in processed or db.get_resource_last_edit(p.url) > startTime:
                continue

            if policyManager.should_download_url(p.url):
                dowloadChildPages.append(p)
                continue

            shouldCrawl = policyManager.should_crawl_url(p.url)

            if shouldCrawl[0] == False:
                db.add_resource(p.url, "", shouldCrawl[1])
                continue

            relevantChildPages.append(p)

        db.track_performance(pg.url, time.time() - pgStart - networkTime, networkTime)

        for dpg in dowloadChildPages:
            dpgStart = time.time()

            if dpg.url in processed or db.get_resource_last_edit(dpg.url) > startTime:
                continue

            dpgResult = record_page(dpg)
            db.track_performance(dpg.url, time.time() - dpgStart - dpgResult[1], dpgResult[1])

        processed.add(pg.url)

    pendingPages = relevantChildPages

print(f"Operation finished in {time.time() - startTime}")
