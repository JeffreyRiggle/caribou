import sqlite3

class PolicyManager:
    connection = sqlite3.connect("grepper.db")

    def getCrawlPages(self):
        result = self.connection.execute("SELECT domain from domains WHERE Status = 'Crawl'")
        return list(map(lambda r: r[0], result.fetchall()))

    def addCrawlDomain(self, domain):
        self.connection.execute("INSERT INTO domains VALUES (?, ?);", (domain, "Crawl"))
        self.connection.commit()
