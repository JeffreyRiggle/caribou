import time
import sqlite3
from crawler import Crawler
from dbaccess import DBAccess
from ranker import Ranker

start_time = time.time()
conn = sqlite3.connect("../grepper.db", check_same_thread=False)
db = DBAccess(conn)
db.setup()
 
crawler = Crawler(db, start_time)
crawler.load()
crawler.crawl()

ranker = Ranker(db)
ranker.rank()
print(f"Operation finished in {time.time() - start_time}")
