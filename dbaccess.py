import sqlite3

class DBAccess:
    connection = sqlite3.connect("grepper.db")

    def setup(self):
        cursor = self.connection.cursor()
        cursor.execute("CREATE TABLE IF NOT EXISTS resources(url TEXT, refs NUM, content TEXT, lastIndex NUM, summary TEXT, status TEXT)")
        cursor.execute("CREATE TABLE IF NOT EXISTS domains(domain TEXT, status TEXT)")
        cursor.execute("CREATE TABLE IF NOT EXISTS metadata(url TEXT, jsBytes NUM, htmlByes NUM, cssBytes NUM, compressed TEXT)")
        cursor.connection.commit()
