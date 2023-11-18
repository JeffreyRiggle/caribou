import sqlite3

class DBAccess:
    connection = sqlite3.connect("grepper.db")

    def setup(self):
        cursor = self.connection.cursor()
        cursor.execute("CREATE TABLE IF NOT EXISTS resources(url TEXT, refs NUM, content TEXT, lastIndex NUM, summary TEXT, status TEXT)")
        cursor.execute("CREATE TABLE IF NOT EXISTS domains(domain TEXT, status TEXT)")
        cursor.execute("CREATE TABLE IF NOT EXISTS metadata(url TEXT, jsBytes NUM, htmlByes NUM, cssBytes NUM, compressed TEXT)")
        cursor.connection.commit()

    def add_resource(self, url, content, status):
        cursor = self.connection.cursor()
        # TODO insert date instead of 0
        cursor.execute("INSERT INTO resources VALUES (?, ?, ?, ?, ?, ?)", (url, 0, content, 0, "TODO", status))
        cursor.connection.commit()

    def add_metadata(self, url, jsBytes, htmlBytes, cssBytes, compressed):
        cursor = self.connection.cursor()
        cursor.execute("INSERT INTO metadata VALUES (?, ?, ?, ?, ?)", (url, jsBytes, htmlBytes, cssBytes, compressed))
        cursor.connection.commit()
