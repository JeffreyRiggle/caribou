from bs4 import BeautifulSoup
from helpers import get_domain, is_absolute_url
from dbaccess import DBAccess

class Ranker:
    def __init__(self, dbaccess: DBAccess):
        self.tolerance = 0.001
        self.damping = .85
        self.page_references = dict()
        self.rankings = dict()
        self.pages = []
        self.dbaccess = dbaccess

    def rank(self):
        self.build_graph()
        self.do_rank()

    def build_graph(self):
        self.pages = self.dbaccess.get_processed_pages()
        for page in self.pages:
            with open(page[1]) as file_handle:
                content = BeautifulSoup(file_handle.read(), features='html.parser')
                links = list(filter(lambda x: x is not None, list(set(map(lambda el: get_link(el, page[0]), content.select('a'))))))
                self.page_references[page[0]] = links
                self.rankings[page[0]] = 1
    
    def do_rank(self):
        converged = False
        iterations = 0
        while converged != True:
            iterations += 1
            converged = True
            for page in self.page_references:
                # Do work to update value
                newValue = self.update_rank(page)
                if converged == True and abs(self.rankings[page] - newValue) > self.tolerance:
                    converged = False

                self.rankings[page] = newValue

        with self.dbaccess.build_transaction() as transaction:
            for rank in self.rankings:
                self.dbaccess.add_page_rank(rank, self.rankings[rank], transaction)

        print(f"Completed ranking after {iterations} iterations")

    def update_rank(self, page):
        node_summation = 0
        for p in self.page_references:
            if page in self.page_references[p]:
                node_summation += self.rankings[p] / len(self.page_references[p])

        return ((1 - self.damping) / len(self.page_references)) + (self.damping * node_summation)

# TODO refactor page to not have basically the same logic
def get_link(el, sourceUrl):
    link = el.get('href')

    if link == None:
        return None

    if is_absolute_url(link):
        return link 

    # Do not include self references
    if link.startswith("#"):
        return None

    return f'https://{get_domain(sourceUrl)}{link}'

