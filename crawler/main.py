import time
from crawler import Crawler
from dbaccess import DBAccess
from ranker import Ranker

start_time = time.time()
db = DBAccess()
db.setup()
 
crawl = Crawler(db, start_time)
crawl.load()
crawl.crawl()

ranker = Ranker(db)
ranker.rank()
print(f"Operation finished in {time.time() - start_time}")
