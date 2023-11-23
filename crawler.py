import dbaccess
import policy
import page
import helpers
import time

startTime = time.time()
db = dbaccess.DBAccess()

db.setup()
policyManager = policy.PolicyManager()

crawlPages = policyManager.get_crawl_pages()
if (len(crawlPages) < 1):
    domain = input("No crawl pages set select a starting domain: ")
    policyManager.add_crawl_domain(domain)
    crawlPages.append(domain)
    
pendingPages = list(map(lambda p: page.Page(helpers.domainToFullURL(p)), crawlPages))

while len(pendingPages) > 0:
    relevantChildPages = []
    for pg in pendingPages:
        pgStart = time.time()
        networkTime = pg.load()
        
        if pg.failed == True:
            continue

        db.add_resource(pg.url, pg.content, "TODO")
        db.add_metadata(pg.url, pg.jsBytes, pg.htmlBytes, pg.cssBytes, pg.compression != None)
        pages = pg.get_links()
        for p in pages:
            if p == None:
                continue

            if db.get_resource_last_edit(p.url) > startTime:
                print(f"Page: {p.url} has already been processed not processing again")
                continue

            shouldCrawl = policyManager.should_crawl_url(p.url)

            if shouldCrawl[0] == False:
                print(f"Page: {p.url} is not allowed for crawling deferring crawl")
                db.add_resource(p.url, "", shouldCrawl[1])
                continue

            relevantChildPages.append(p)

        db.track_performance(pg.url, time.time() - pgStart - networkTime, networkTime)
        print(f"Processing {pg.url} took {time.time() - pgStart}")

    pendingPages = relevantChildPages

print(f"Operation finished in {time.time() - startTime}")
# TODO build pages from crawl root
# TODO traverse pages checking policy
