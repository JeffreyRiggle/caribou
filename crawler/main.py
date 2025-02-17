from core.dbaccess.postgres_access import PostgresDBAccess
from core.dbaccess.sqlite_access import SQLiteDBAccess
from core.crawler import Crawler
from core.ranker import Ranker
from core.policy import PolicyManager
import time
import sys

start_time = time.time()
db = None
if '--postgres' in sys.argv:
    db = PostgresDBAccess()
else:
    db = SQLiteDBAccess()
db.setup()

policy_manager = PolicyManager(db)
crawl_pages = policy_manager.get_crawl_pages()

if (len(crawl_pages) < 1):
    domains = input("No crawl pages set select a starting domain (can add multiple with ,): ")
    crawl_domains = domains.split(",")
    for crawl_domain in crawl_domains:
        policy_manager.add_crawl_domain(crawl_domain)

crawl = Crawler(db, policy_manager, start_time)
crawl.load()
crawl.crawl()

ranker = Ranker(db)
ranker.rank()
print(f"Operation finished in {time.time() - start_time}")
