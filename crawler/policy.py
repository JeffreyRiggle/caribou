from status import DomainStatus
from helpers import get_domain
from dbaccess import DBAccess
from transactions import DBTransaction

class PolicyManager:
    def __init__(self, dbaccess: DBAccess):
        self.pending_domains = set()
        self.dbaccess = dbaccess

    def get_crawl_pages(self):
        return self.dbaccess.get_pages_by_status(DomainStatus.Crawl.value)

    def add_crawl_domain(self, domain: str):
        self.add_domain(domain, DomainStatus.Crawl.value)

    def add_domain(self, domain: str, status: str, transaction: DBTransaction | None=None):
        self.dbaccess.add_domain(domain, status, transaction)

    def enable_content_download(self, contentType: str, transaction: DBTransaction | None=None):
        self.dbaccess.add_download_policy(contentType, True, transaction)

    def should_download_url(self, url: str):
        domain = get_domain(url)
        result = self.dbaccess.get_domain_status(domain)

        if len(result) < 1:
            return False

        domain_status = result[0][0]
        return domain_status == DomainStatus.Read.value or domain_status == DomainStatus.Crawl.value

    def should_download_asset(self, contentType: str):
        result = self.dbaccess.get_download_policy(contentType)

        if len(result) < 1:
            return False

        return result[0][0] == 1

    def should_crawl_url(self, url: str):
        domain = get_domain(url)

        if domain in self.pending_domains:
            return (False, DomainStatus.NeedsStatus.value)


        result = self.dbaccess.get_domain_status(domain)
        
        if len(result) < 1:
            self.pending_domains.add(domain)
            return (False, DomainStatus.NeedsStatus.value)

        status = result[0][0]
        if result[0][0] == DomainStatus.Crawl.value:
            return (True, status)

        return (False, status)

    def flush_pending_domains(self):
        with self.dbaccess.build_transaction() as transaction:
            for domain in self.pending_domains:
                self.add_domain(domain, DomainStatus.NeedsStatus.value, transaction)

        self.pending_domains.clear()
