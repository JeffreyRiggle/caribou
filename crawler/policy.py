import sqlite3
from status import DomainStatus
from helpers import get_domain

class PolicyManager:
    connection = sqlite3.connect("../grepper.db")

    def get_crawl_pages(self):
        result = self.connection.execute("SELECT domain from domains WHERE Status = ?", (DomainStatus.Crawl.value, ))
        return list(map(lambda r: r[0], result.fetchall()))

    def add_crawl_domain(self, domain):
        self.add_domain(domain, DomainStatus.Crawl.value)

    def add_domain(self, domain, status):
        self.connection.execute("INSERT INTO domains VALUES (?, ?, ?);", (domain, status, ""))
        self.connection.commit()

    def should_download_url(self, url):
        domain = get_domain(url)
        result = self.connection.execute("SELECT Status FROM domains WHERE domain = ?", (domain,)).fetchall()

        if len(result) < 1:
            return False

        return result[0][0] == DomainStatus.Read.value

    def should_crawl_url(self, url):
        domain = get_domain(url)
        result = self.connection.execute("SELECT Status FROM domains WHERE domain = ?", (domain,)).fetchall()
        
        if len(result) < 1:
            self.add_domain(domain, DomainStatus.NeedsStatus.value)
            return (False, DomainStatus.NeedsStatus.value)

        status = result[0][0]
        if result[0][0] == DomainStatus.Crawl.value:
            return (True, status)

        return (False, status)
