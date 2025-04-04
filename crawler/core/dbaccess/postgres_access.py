from core.transactions import DBTransaction
from os import listdir, environ
from os.path import isfile, join
import re
import psycopg2
import threading
import time

class PostgresDBAccess:
    def __init__(self):
        self.lock = threading.Lock()

    def setup(self):
        self.connection = psycopg2.connect(environ['DB_CONNECTION_STRING'])

    def run_migrations(self):
        migrations_dir = "../db/postgres/migrations"
        migration_files = [f for f in listdir(migrations_dir) if isfile(join(migrations_dir, f))]

        for migration in migration_files:
            self.execute_sql_file(join(migrations_dir, migration))

    def execute_sql_file(self, sql_file):
        with open(sql_file, "r") as sql_script:
            cursor = self.connection.cursor()
            cursor.execute(sql_script.read())
            cursor.connection.commit()

    def build_transaction(self):
        return DBTransaction(self.connection)

    def add_resource(self, url: str, path: str, status: str, title: str, summary: str, description: str, contentType: str, headers: str, transaction: DBTransaction | None):
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
        params = {
            'url': url,
            'path': path,
            'contentType': contentType,
            'time': time.time(),
            'title': title,
            'summary': summary,
            'description': description,
            'status': status,
            'headers': headers,
            'expires': expires
        }
        cursor.execute("""
        INSERT INTO resources 
        VALUES (%(url)s, %(path)s, %(contentType)s, %(time)s, %(title)s, %(summary)s, %(description)s, %(status)s, %(headers)s, %(expires)s)
        ON CONFLICT (url) DO UPDATE
            SET path = %(path)s,
                contentType = %(contentType)s,
                lastIndex = %(time)s,
                title = %(title)s,
                summary = %(summary)s,
                description = %(description)s,
                status = %(status)s,
                headers = %(headers)s,
                expires = %(expires)s
        """, params)

        if transaction == None:
            cursor.connection.commit()

    def get_resource_last_edit(self, url: str):
        cursor = self.connection.cursor()
        cursor.execute("SELECT lastIndex FROM resources WHERE url = %(url)s", { 'url': url })
        result = list(map(lambda r: r[0], cursor.fetchall()))

        if len(result) < 1:
            return 0

        return result[0]
        
    def get_resource_expire_time(self, url: str):
        cursor = self.connection.cursor()
        cursor.execute("SELECT expires FROM resources WHERE url = %(url)s", { 'url': url })
        result = list(map(lambda r: r[0], cursor.fetchall()))

        if len(result) < 1:
            return 0

        return result[0]
        
    def add_favicon(self, document_url: str, url: str, sizes: str, media: str, type: str, transaction: DBTransaction | None):
        cursor = self.connection.cursor()
        params = { 'url': url, 'documentUrl': document_url, 'sizes': sizes, 'media': media, 'type': type }
        cursor.execute("""
        INSERT INTO favicon VALUES (%(url)s, %(documentUrl)s, %(sizes)s, %(media)s, %(type)s)
        ON CONFLICT (url, documentUrl) DO UPDATE
            SET sizes = %(sizes)s,
                media = %(media)s,
                type = %(type)s
        """, params)

        if transaction == None:
            cursor.connection.commit()

    def add_metadata(self, url: str, jsBytes: int, htmlBytes: int, cssBytes: int, compressed: bool, transaction: DBTransaction | None):
        cursor = self.connection.cursor()
        params = { 'url': url, 'jsBytes': jsBytes, 'htmlBytes': htmlBytes, 'cssBytes': cssBytes, 'compressed': compressed }
        cursor.execute("""
        INSERT INTO metadata VALUES (%(url)s, %(jsBytes)s, %(htmlBytes)s, %(cssBytes)s, %(compressed)s)
        ON CONFLICT(url) DO UPDATE
            SET jsBytes = %(jsBytes)s,
                htmlBytes = %(htmlBytes)s,
                cssBytes = %(cssBytes)s,
                compressed = %(compressed)s         
        """, params)

        if transaction == None:
            cursor.connection.commit()

    def track_performance(self, url: str, appTime: float, networkTime: float, transaction: DBTransaction | None):
        cursor = self.connection.cursor()
        params = { 'url': url, 'appTime': appTime, 'networkTime': networkTime }
        cursor.execute("INSERT INTO perf VALUES (%(url)s, %(appTime)s, %(networkTime)s)", params)

        if transaction == None:
            cursor.connection.commit()

    def get_pages_by_status(self, status: str):
        cursor = self.connection.cursor()
        cursor.execute("SELECT domain from domains WHERE Status = %(status)s", { 'status': status })
        return list(map(lambda r: r[0], cursor.fetchall()))

    def add_domain(self, domain: str, status: str, transaction: DBTransaction | None=None):
        if domain == None:
            print(f"Invalid domain {domain} provided not adding to domains")
            return

        cursor = self.connection.cursor()
        params = { 'domain': domain, 'status': status }
        cursor.execute("INSERT INTO domains VALUES (%(domain)s, %(status)s) ON CONFLICT DO NOTHING", params)
        
        if transaction == None:
            self.connection.commit()

    def get_domain_status(self, domain: str):
        cursor = self.connection.cursor()
        cursor.execute("SELECT Status FROM domains WHERE domain = %(domain)s", { 'domain': domain })
        return cursor.fetchall()

    def get_processed_pages(self):
        cursor = self.connection.cursor()
        cursor.execute("SELECT url, path FROM resources where status = 'Processed' AND contentType = 'html'")
        return cursor.fetchall()

    def add_page_rank(self, url: str, rank: float, transaction: DBTransaction | None):
        cursor = self.connection.cursor()
        params = { 'url': url, 'rank': rank }
        cursor.execute("""
        INSERT INTO rank VALUES (%(url)s, %(rank)s)
        ON CONFLICT(url) DO UPDATE
            SET pageRank = %(rank)s
        """, params)

        if transaction == None:
            cursor.connection.commit()

    def add_link(self, sourceUrl: str, targetUrl: str, transaction: DBTransaction | None):
        cursor = self.connection.cursor()
        params = { 'sourceUrl': sourceUrl, 'targetUrl': targetUrl }
        cursor.execute("""
        INSERT INTO links VALUES (%(sourceUrl)s, %(targetUrl)s)
        ON CONFLICT (sourceUrl, targetUrl) DO NOTHING
        """, params)

        if transaction == None:
            self.connection.commit()

    def add_download_policy(self, contentType: str, shouldDownload: bool, transaction: DBTransaction | None):
        cursor = self.connection.cursor()
        params = {
            'contentType': contentType,
            'shouldDownload': 1 if shouldDownload else 0
        }
        cursor.execute("""
        INSERT INTO downloadPolicy VALUES (%(contentType)s, %(shouldDownload)s)
        ON CONFLICT(contentType) UPDATE
            SET shouldDownload = %(shouldDownload)s
        """, params) 

        if transaction == None:
            self.connection.commit()

    def get_download_policy(self, contentType: str):
        cursor = self.connection.cursor()
        params = { 'contentType': contentType }
        cursor.execute("SELECT download FROM downloadPolicy WHERE contentType = %(contentType)s", params)
        return cursor.fetchall()

