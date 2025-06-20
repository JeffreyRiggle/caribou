from core.transactions import DBTransaction
from os import listdir
from os.path import isfile, join
import re
import sqlite3
import threading
import time

class SQLiteDBAccess:
    def __init__(self, db_file: str = "../grepper.db"):
        self.db_file = db_file
        self.lock = threading.Lock()

    def setup(self):
        print(f"Setting up database at path {self.db_file}")
        should_initialize = isfile(self.db_file) == False
        self.connection = sqlite3.connect(self.db_file, check_same_thread=False)

        if should_initialize == False:
            return

        self.execute_sql_file("../db/sqlite/seed_db.sql")

    def run_migrations(self):
        migrations_dir = "../db/sqlite/migrations"
        migration_files = [f for f in listdir(migrations_dir) if isfile(join(migrations_dir, f))]

        for migration in migration_files:
            self.execute_sql_file(join(migrations_dir, migration))

    def execute_sql_file(self, sql_file):
        with open(sql_file, "r") as sql_script:
            cursor = self.connection.cursor()
            cursor.executescript(sql_script.read())
            cursor.connection.commit()

    def build_transaction(self):
        return DBTransaction(self.connection)

    def add_resource(self, url: str, path: str, status: str, title: str, summary: str, description: str, contentType: str, headers: str, transaction: DBTransaction | None):
        with self.lock:
            cursor = self.connection.cursor()
            now = time.time()
            all_headers = headers.split('\n')
            expires = None
            for header in all_headers:
                if header.startswith("Cache-Control") == False:
                    continue

                age_match = re.search(r'max-age=(\d+)', header)
                if age_match == None:
                    break

                try:
                    age = age_match.group(1)
                    expires = time.time() + (int(age) * 1000)
                except:
                    print(f"Failed to get expire time from {header}")
                    expires = None

                break
                
            expires = now if expires == None or expires <= 0 else expires
            cursor.execute("INSERT OR REPLACE INTO resources VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", (url, path, contentType, time.time(), title, summary, description, status, headers, expires))

            if transaction == None:
                cursor.connection.commit()

    def get_resource_last_edit(self, url: str):
        with self.lock:
            cursor = self.connection.cursor()
            cursor.execute("SELECT lastIndex FROM resources WHERE url = ?", (url,))
            result = list(map(lambda r: r[0], cursor.fetchall()))

            if len(result) < 1:
                return 0

            return result[0]
        
    def get_resource_expire_time(self, url: str):
        with self.lock:
            cursor = self.connection.cursor()
            cursor.execute("SELECT expires FROM resources WHERE url = ?", (url,))
            result = list(map(lambda r: r[0], cursor.fetchall()))

            if len(result) < 1:
                return 0

            return result[0]
        
    def add_favicon(self, document_url: str, url: str, sizes: str, media: str, type: str, transaction: DBTransaction | None):
        with self.lock:
            cursor = self.connection.cursor()
            cursor.execute("INSERT OR REPLACE INTO favicon VALUES (?, ?, ?, ?, ?)", (url, document_url, sizes, media, type))

            if transaction == None:
                cursor.connection.commit()

    def add_metadata(self, url: str, jsBytes: int, htmlBytes: int, cssBytes: int, compressed: bool, transaction: DBTransaction | None):
        with self.lock:
            cursor = self.connection.cursor()
            cursor.execute("INSERT OR REPLACE INTO metadata VALUES (?, ?, ?, ?, ?)", (url, jsBytes, htmlBytes, cssBytes, compressed))

            if transaction == None:
                cursor.connection.commit()

    def track_performance(self, url: str, appTime: float, networkTime: float, transaction: DBTransaction | None):
        with self.lock:
            cursor = self.connection.cursor()
            cursor.execute("INSERT INTO perf VALUES (?, ?, ?)", (url, appTime, networkTime))

            if transaction == None:
                cursor.connection.commit()

    def get_domains_by_status(self, status: str):
        with self.lock:
            result = self.connection.execute("SELECT domain from domains WHERE Status = ?", (status, ))
            return list(map(lambda r: r[0], result.fetchall()))
        
    def get_resources_by_status(self, status: str):
        with self.lock:
            result = self.connection.execute("SELECT url from resources WHERE Status = ?", (status, ))
            return list(map(lambda r: r[0], result.fetchall()))

    def add_domain(self, domain: str, status: str, transaction: DBTransaction | None=None):
        if domain == None:
            print(f"Invalid domain {domain} provided not adding to domains")
            return

        with self.lock:
            self.connection.execute("INSERT INTO domains VALUES (?, ?);", (domain, status))
            
            if transaction == None:
                self.connection.commit()

    def get_domain_status(self, domain: str):
        with self.lock:
            return self.connection.execute("SELECT Status FROM domains WHERE domain = ?", (domain,)).fetchall()

    def get_processed_pages(self):
        with self.lock:
            return self.connection.execute("SELECT url, path FROM resources where status = 'Processed' AND contentType = 'html'").fetchall()

    def add_page_rank(self, url: str, rank: float, transaction: DBTransaction | None):
        with self.lock:
            cursor = self.connection.cursor()
            cursor.execute("INSERT OR REPLACE INTO rank VALUES (?, ?)", (url, rank))

            if transaction == None:
                cursor.connection.commit()

    def add_link(self, sourceUrl: str, targetUrl: str, transaction: DBTransaction | None):
        with self.lock:
            cursor = self.connection.cursor()
            cursor.execute("INSERT OR REPLACE INTO links VALUES (?, ?)", (sourceUrl, targetUrl))

            if transaction == None:
                self.connection.commit()

    def add_download_policy(self, contentType: str, shouldDownload: bool, transaction: DBTransaction | None):
        with self.lock:
            cursor = self.connection.cursor()
            cursor.execute("INSERT OR REPLACE INTO downloadPolicy VALUES (?, ?)", (contentType, 1 if shouldDownload else 0)) 

            if transaction == None:
                self.connection.commit()

    def get_download_policy(self, contentType: str):
        with self.lock:
            return self.connection.execute("SELECT download FROM downloadPolicy WHERE contentType = ?", (contentType,)).fetchall()

