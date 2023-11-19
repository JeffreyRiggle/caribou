import sqlite3
import time

class DBAccess:
    connection = sqlite3.connect("grepper.db")

    def setup(self):
        cursor = self.connection.cursor()
        cursor.execute("CREATE TABLE IF NOT EXISTS resources(url TEXT PRIMARY KEY, refs NUM, content TEXT, lastIndex NUM, summary TEXT, status TEXT)")
        cursor.execute("CREATE TABLE IF NOT EXISTS domains(domain TEXT PRIMARY KEY, status TEXT)")
        cursor.execute("CREATE TABLE IF NOT EXISTS metadata(url TEXT PRIMARY KEY, jsBytes NUM, htmlByes NUM, cssBytes NUM, compressed TEXT)")
        cursor.connection.commit()

    def add_resource(self, url, content, status):
        cursor = self.connection.cursor()
        cursor.execute("INSERT OR REPLACE INTO resources VALUES (?, ?, ?, ?, ?, ?)", (url, 0, content, time.time(), "", status))
        cursor.connection.commit()

    def get_resource_last_edit(self, url):
        cursor = self.connection.cursor()
        cursor.execute("SELECT lastIndex FROM resources WHERE url = ?", (url,))
        result = list(map(lambda r: r[0], cursor.fetchall()))

        if len(result) < 1:
            return 0

        return result[0]

    def add_metadata(self, url, jsBytes, htmlBytes, cssBytes, compressed):
        cursor = self.connection.cursor()
        cursor.execute("INSERT OR REPLACE INTO metadata VALUES (?, ?, ?, ?, ?)", (url, jsBytes, htmlBytes, cssBytes, compressed))
        cursor.connection.commit()
