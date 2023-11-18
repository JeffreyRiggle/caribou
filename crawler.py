import dbaccess
import policy
import page
import helpers

db = dbaccess.DBAccess()

print("Setting up database")
db.setup()
print("Database setup")
policyManager = policy.PolicyManager()

crawlPages = policyManager.getCrawlPages()
if (len(crawlPages) < 1):
    domain = input("No crawl pages set select a starting domain: ")
    policyManager.addCrawlDomain(domain)
    crawlPages.append(domain)
    
print("Getting ready to crawl", crawlPages)
rootPages = map(lambda p: page.Page(helpers.domainToFullURL(p)), crawlPages)

for pg in rootPages:
    pg.load()
    print(f"Page: {pg.url} resulted in html bytes: {pg.htmlBytes}, js bytes: {pg.jsBytes}, css bytes {pg.cssBytes}, and compression {pg.compression}")

# TODO build pages from crawl root
# TODO traverse pages checking policy
