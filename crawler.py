import dbaccess
import policy
import page
import helpers
import time

startTime = time.time()
db = dbaccess.DBAccess()

print("Setting up database")
db.setup()
print("Database setup")
policyManager = policy.PolicyManager()

crawlPages = policyManager.get_crawl_pages()
if (len(crawlPages) < 1):
    domain = input("No crawl pages set select a starting domain: ")
    policyManager.add_crawl_domain(domain)
    crawlPages.append(domain)
    
print("Getting ready to crawl", crawlPages)
pendingPages = list(map(lambda p: page.Page(helpers.domainToFullURL(p)), crawlPages))

while len(pendingPages) > 0:
    relevantChildPages = []
    for pg in pendingPages:
        pg.load()
        db.add_resource(pg.url, pg.content, "TODO")
        db.add_metadata(pg.url, pg.jsBytes, pg.htmlBytes, pg.cssBytes, pg.compression != None)
        print(f"Page: {pg.url} resulted in html bytes: {pg.htmlBytes}, js bytes: {pg.jsBytes}, css bytes {pg.cssBytes}, and compression {pg.compression}")
        pages = pg.get_links()
        for p in pages:
            if p == None:
                continue

            if db.get_resource_last_edit(p.url) > startTime:
                continue

            shouldCrawl = policyManager.should_crawl_url(p.url)

            if shouldCrawl[0] == False:
                db.add_resource(pg.url, "", shouldCrawl[1])

            relevantChildPages.append(p)

    pendingPages = relevantChildPages

# TODO build pages from crawl root
# TODO traverse pages checking policy
