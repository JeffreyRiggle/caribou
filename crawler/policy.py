from status import DomainStatus
from helpers import get_domain

class PolicyManager:
    def __init__(self, connection):
        self.connection = connection 
        self.pending_domains = set()

    def get_crawl_pages(self):
        result = self.connection.execute("SELECT domain from domains WHERE Status = ?", (DomainStatus.Crawl.value, ))
        return list(map(lambda r: r[0], result.fetchall()))

    def add_crawl_domain(self, domain):
        self.add_domain(domain, DomainStatus.Crawl.value)

    def add_domain(self, domain, status, doCommit=True):
        self.connection.execute("INSERT INTO domains VALUES (?, ?, ?);", (domain, status, ""))
        
        if doCommit == True:
            self.connection.commit()

    def should_download_url(self, url):
        domain = get_domain(url)
        result = self.connection.execute("SELECT Status FROM domains WHERE domain = ?", (domain,)).fetchall()

        if len(result) < 1:
            return False

        return result[0][0] == DomainStatus.Read.value

    def should_crawl_url(self, url):
        domain = get_domain(url)

        if domain in self.pending_domains:
            return (False, DomainStatus.NeedsStatus.value)

        result = self.connection.execute("SELECT Status FROM domains WHERE domain = ?", (domain,)).fetchall()
        
        if len(result) < 1:
            self.pending_domains.add(domain)
            return (False, DomainStatus.NeedsStatus.value)

        status = result[0][0]
        if result[0][0] == DomainStatus.Crawl.value:
            return (True, status)

        return (False, status)

    def flush_pending_domains(self):
        for domain in self.pending_domains:
            self.add_domain(domain, DomainStatus.NeedsStatus.value, False)

        self.connection.commit()
        self.pending_domains.clear()
