from core.dbaccess.postgres_access import PostgresDBAccess
from core.dbaccess.sqlite_access import SQLiteDBAccess
from core.helpers import get_domain, is_absolute_url
from core.storage.file_access import FileAccess
from core.storage.s3_access import S3Access
from core.logger import Logger
from bs4 import BeautifulSoup
import time

class Ranker:
    def __init__(self, dbaccess: SQLiteDBAccess | PostgresDBAccess, storage: FileAccess | S3Access, logger: Logger):
        self.tolerance = 1.0e-6
        self.damping = .85
        self.max_iterations = 50
        self.page_references = dict()
        # Create 2d matrix with rows being outbound edges and columns being nodes (A)
        self.edge_matrix = []
        self.pages = []
        self.dbaccess = dbaccess
        self.storage = storage
        self.logger = logger

    def rank(self):
        self.build_graph()
        self.do_rank()

    def build_graph(self):
        start_time = time.perf_counter()
        processed_pages = self.dbaccess.get_processed_pages()
        forward_link_map = dict()
        # Populate a dictionary of back references
        for page in processed_pages:
            page_url = page[0]
            page_file = page[1]
            
            with self.storage.read(page_file) as file_handle:
                # Do I still need to do this? I think I have an edge graph now
                content = BeautifulSoup(file_handle.read(), features='html.parser')
                links = list(filter(lambda x: x is not None, list(set(map(lambda el: get_link(el, page_url), content.select('a'))))))
                forward_link_map[page_url] = links
                
                if page_url not in self.pages:
                    self.pages.append(page_url)

                # We need to make sure that we add in dangling references
                for forward_link in links:
                    if forward_link not in self.pages:
                        self.pages.append(forward_link)
        
        # Initialize edge matrix
        total_nodes = len(self.pages)
        for i in range(total_nodes):
            self.edge_matrix.append([0] * total_nodes)
        
        for page, forward_links in forward_link_map.items():
            row = self.pages.index(page)
            for forward_link in forward_links:
                col = self.pages.index(forward_link)
                self.edge_matrix[row][col] = 1

        end_time = time.perf_counter()
        self.logger.log(f"Building graph took: {(end_time-start_time):.6f} seconds")
    
    # Very simple Page rank algorithm that does not
    # consider dangling references and makes minimal use
    # Of the personalization vector
    def do_rank(self):
        start_time = time.perf_counter()
        node_size = len(self.edge_matrix)
        # Distribute all outbound links with equal weight
        edge_distribution = []
        for i in range(node_size):
            row = self.edge_matrix[i]
            total_links = sum(row)
            edge_distribution.append(1 / total_links if total_links > 0 else 1)

        # Matrix used to multiply to create
        # A normalized distribution of weights in edge matrix
        normalization_matrix = []
        for i in range(node_size):
            normalization_matrix.append([0] * node_size)
            normalization_matrix[i][i] = edge_distribution[i]

        self.edge_matrix = self.matrix_multiply(normalization_matrix, self.edge_matrix)

        # Build some random vector over all pages. This is the S value in
        # The page rank paper.
        end_rank = []
        # While we do not use it to much effect add in the personalization vector
        personalization_vector = []
        for _ in range(node_size):
            end_rank.append(1 / node_size)
            personalization_vector.append(1 / node_size)

        for _ in range(self.max_iterations):
            # Get new state
            new_rank = self.vector_add(
                self.multiply_vector_by_scalar(
                    self.vector_by_matrix_multiply(end_rank, self.edge_matrix),
                    self.damping
                ),
                self.multiply_vector_by_scalar(
                    personalization_vector,
                    1 - self.damping
                )
            )

            # check delta
            delta = 0
            for i in range(node_size):
                delta += new_rank[i] - end_rank[i]
            end_rank = new_rank
            
            # Check for convergence
            if delta <= self.tolerance:
                break
        
        end_time = time.perf_counter()
        self.logger.log(f"Computing page rank took: {(end_time-start_time):.6f} seconds")
        self.logger.log("Final Result")
        self.logger.log(end_rank)
        
        with self.dbaccess.build_transaction() as transaction:
            for i in range(node_size):
                rank = end_rank[i]
                page_url = self.pages[i]
                self.dbaccess.add_page_rank(page_url, rank, transaction)

    def matrix_multiply(self, matrix_a, matrix_b):
        matrix_a_rows = len(matrix_a)
        matrix_a_Columns = len(matrix_a[0])
        matrix_b_Columns = len(matrix_b[0])

        result = []
        for i in range(matrix_a_rows):
            result.append([0] * matrix_b_Columns)
            for j in range(matrix_b_Columns):
                for k in range(matrix_a_Columns):
                    result[i][j] += matrix_a[i][k] * matrix_b[k][j]

        return result
    
    def vector_by_matrix_multiply(self, vector, matrix):
        num_rows = len(matrix)
        num_cols = len(matrix[0])

        result = []
        for j in range(num_cols):
            result.append(0)
            for i in range(num_rows):
                result[j] += vector[i] * matrix[i][j]
        
        return result
    
    def multiply_vector_by_scalar(self, vector, scalar):
        result = []
        for v in vector:
            result.append(v * scalar)

        return result
    
    def vector_add(self, vector_a, vector_b):
        result = []
        for i in range(len(vector_a)):
            result.append(vector_a[i] + vector_b[i])

        return result

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

