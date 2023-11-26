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

crawlPages = policyManager.get_crawl_pages()
if (len(crawlPages) < 1):
    domain = input("No crawl pages set select a starting domain: ")
    policyManager.add_crawl_domain(domain)
    crawlPages.append(domain)
    
pendingPages = list(map(lambda p: page.Page(helpers.domain_to_full_url(p)), crawlPages))

while len(pendingPages) > 0:
    relevantChildPages = []
    for pg in pendingPages:
        pgStart = time.time()
        networkTime = pg.load()
        
        if pg.failed == True:
            db.add_resource(pg.url, "", ResourceStatus.Failed.value)
            processed.add(pg.url)
            continue

        dir_path = f"contents/{helpers.get_domain(pg.url)}"
        file_name = f"{len(processed)}.html"
        helpers.write_file(dir_path, file_name, pg.content)
        db.add_resource(pg.url, f"{dir_path}/{file_name}", ResourceStatus.Processed.value)
        db.add_metadata(pg.url, pg.jsBytes, pg.htmlBytes, pg.cssBytes, pg.compression != None)
        pages = pg.get_links()
        for p in pages:
            if p == None:
                continue

            if pg.url in processed or db.get_resource_last_edit(p.url) > startTime:
                continue

            shouldCrawl = policyManager.should_crawl_url(p.url)

            if shouldCrawl[0] == False:
                db.add_resource(p.url, "", shouldCrawl[1])
                continue

            relevantChildPages.append(p)

        db.track_performance(pg.url, time.time() - pgStart - networkTime, networkTime)
        print(f"Processing {pg.url} took {time.time() - pgStart}")
        processed.add(pg.url)

    pendingPages = relevantChildPages

print(f"Operation finished in {time.time() - startTime}")
# TODO build pages from crawl root
# TODO traverse pages checking policy
