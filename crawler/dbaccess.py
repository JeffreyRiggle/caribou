import time
import transactions
import threading

class DBAccess:
    def __init__(self, connection):
        self.connection = connection
        self.lock = threading.Lock()

    def setup(self):
        cursor = self.connection.cursor()
        cursor.execute("CREATE TABLE IF NOT EXISTS resources(url TEXT PRIMARY KEY, path TEXT, lastIndex NUM, title TEXT, summary TEXT, description TEXT, status TEXT)")
        cursor.execute("CREATE TABLE IF NOT EXISTS domains(domain TEXT PRIMARY KEY, status TEXT, downloadAssets TEXT)")
        cursor.execute("CREATE TABLE IF NOT EXISTS metadata(url TEXT PRIMARY KEY, jsBytes NUM, htmlBytes NUM, cssBytes NUM, compressed TEXT)")
        cursor.execute("CREATE TABLE IF NOT EXISTS perf(url TEXT, appTime NUM, networkTime NUM)") 
        cursor.execute("CREATE TABLE IF NOT EXISTS rank(url TEXT PRIMARY KEY, pageRank NUM)") 
        cursor.execute("CREATE TABLE IF NOT EXISTS links(sourceUrl TEXT, targetUrl TEXT)")
        cursor.connection.commit()

    def build_transaction(self):
        return transactions.DBTransaction(self.connection)

    def add_resource(self, url, path, status, title, summary, description, transaction):
        with self.lock:
            cursor = self.connection.cursor()
            cursor.execute("INSERT OR REPLACE INTO resources VALUES (?, ?, ?, ?, ?, ?, ?)", (url, path, time.time(), title, summary, description, status))

            if transaction == None:
                cursor.connection.commit()

    def get_resource_last_edit(self, url):
        with self.lock:
            cursor = self.connection.cursor()
            cursor.execute("SELECT lastIndex FROM resources WHERE url = ?", (url,))
            result = list(map(lambda r: r[0], cursor.fetchall()))

            if len(result) < 1:
                return 0

            return result[0]

    def add_metadata(self, url, jsBytes, htmlBytes, cssBytes, compressed, transaction):
        with self.lock:
            cursor = self.connection.cursor()
            cursor.execute("INSERT OR REPLACE INTO metadata VALUES (?, ?, ?, ?, ?)", (url, jsBytes, htmlBytes, cssBytes, compressed))

            if transaction == None:
                cursor.connection.commit()

    def track_performance(self, url, appTime, networkTime, transaction):
        with self.lock:
            cursor = self.connection.cursor()
            cursor.execute("INSERT INTO perf VALUES (?, ?, ?)", (url, appTime, networkTime))

            if transaction == None:
                cursor.connection.commit()

    def get_pages_by_status(self, status):
        with self.lock:
            result = self.connection.execute("SELECT domain from domains WHERE Status = ?", (status, ))
            return list(map(lambda r: r[0], result.fetchall()))

    def add_domain(self, domain, status, transaction=None):
        with self.lock:
            self.connection.execute("INSERT INTO domains VALUES (?, ?, ?);", (domain, status, ""))
            
            if transaction == None:
                self.connection.commit()

    def get_domain_status(self, domain):
        with self.lock:
            return self.connection.execute("SELECT Status FROM domains WHERE domain = ?", (domain,)).fetchall()

    def get_processed_pages(self):
        with self.lock:
            return self.connection.execute("SELECT url, path FROM resources where status = 'Processed'").fetchall()

    def add_page_rank(self, url, rank, transaction):
        with self.lock:
            cursor = self.connection.cursor()
            cursor.execute("INSERT OR REPLACE INTO rank VALUES (?, ?)", (url, rank))

            if transaction == None:
                cursor.connection.commit()

    def add_link(self, sourceUrl, targetUrl, transaction):
        with self.lock:
            cursor = self.connection.cursor()
            cursor.execute("INSERT INTO links VALUES (?, ?)", (sourceUrl, targetUrl))

            if transaction == None:
                self.connection.commit()

