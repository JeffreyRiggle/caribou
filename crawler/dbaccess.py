import time
import transactions

class DBAccess:
    def __init__(self, connection):
        self.connection = connection

    def setup(self):
        cursor = self.connection.cursor()
        cursor.execute("CREATE TABLE IF NOT EXISTS resources(url TEXT PRIMARY KEY, path TEXT, lastIndex NUM, summary TEXT, status TEXT)")
        cursor.execute("CREATE TABLE IF NOT EXISTS domains(domain TEXT PRIMARY KEY, status TEXT, downloadAssets TEXT)")
        cursor.execute("CREATE TABLE IF NOT EXISTS metadata(url TEXT PRIMARY KEY, jsBytes NUM, htmlBytes NUM, cssBytes NUM, compressed TEXT)")
        cursor.execute("CREATE TABLE IF NOT EXISTS perf(url TEXT, appTime NUM, networkTime NUM)") 
        cursor.connection.commit()

    def build_transaction(self):
        return transactions.DBTransaction(self.connection)

    def add_resource(self, url, path, status, summary, transaction):
        cursor = self.connection.cursor()
        cursor.execute("INSERT OR REPLACE INTO resources VALUES (?, ?, ?, ?, ?)", (url, path, time.time(), summary, status))

        if transaction == None:
            cursor.connection.commit()

    def get_resource_last_edit(self, url):
        cursor = self.connection.cursor()
        cursor.execute("SELECT lastIndex FROM resources WHERE url = ?", (url,))
        result = list(map(lambda r: r[0], cursor.fetchall()))

        if len(result) < 1:
            return 0

        return result[0]

    def add_metadata(self, url, jsBytes, htmlBytes, cssBytes, compressed, transaction):
        cursor = self.connection.cursor()
        cursor.execute("INSERT OR REPLACE INTO metadata VALUES (?, ?, ?, ?, ?)", (url, jsBytes, htmlBytes, cssBytes, compressed))

        if transaction == None:
            cursor.connection.commit()

    def track_performance(self, url, appTime, networkTime, transaction):
        cursor = self.connection.cursor()
        cursor.execute("INSERT INTO perf VALUES (?, ?, ?)", (url, appTime, networkTime))

        if transaction == None:
            cursor.connection.commit()
