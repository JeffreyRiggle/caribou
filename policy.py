import sqlite3
import re

class PolicyManager:
    connection = sqlite3.connect("grepper.db")

    def get_crawl_pages(self):
        result = self.connection.execute("SELECT domain from domains WHERE Status = 'Crawl'")
        return list(map(lambda r: r[0], result.fetchall()))

    def add_crawl_domain(self, domain):
        self.connection.execute("INSERT INTO domains VALUES (?, ?);", (domain, "Crawl"))
        self.connection.commit()

    def should_crawl_url(self, url):
        domain = self.get_domain(url)
        result = self.connection.execute("SELECT Status FROM domains WHERE domain = ?", (domain,)).fetchall()
        
        if len(result) < 1:
            return (False, "Pending")

        status = result[0][0]
        if result[0][0] == 'Crawl':
            return (True, status)

        return (False, status)

    def get_domain(self, url):
        return re.search(r'^https?:\/\/([^\/]+)', url).group(1)
