import sqlite3
import re
from bs4 import BeautifulSoup

tolerance = 0.001
damping = .85

page_references = dict()
rankings = dict()
conn = sqlite3.connect("../grepper.db")

pages = conn.cursor().execute("SELECT url, path FROM resources where status = 'Processed'").fetchall()

# Copied from crawler find a way to share code
def get_domain(url):
    return re.search(r'^https?:\/\/([^\/]+)|^[^.]+\.([^\/]+)', url).group(1)

def is_absolute_url(url):
        return re.match(r'^(https?://)|^([^./]+\.)', url) != None

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

# Build "graph"
for page in pages:
    with open(page[1]) as file_handle:
        content = BeautifulSoup(file_handle.read())
        links = list(filter(lambda x: x is not None, list(set(map(lambda el: get_link(el, page[0]), content.select('a'))))))
        page_references[page[0]] = links
        rankings[page[0]] = 1

# Do ranking
def update_rank(page):
    node_summation = 0
    for p in page_references:
        if page in page_references[p]:
            node_summation += rankings[p] / len(page_references[p])

    return ((1 - damping) / len(page_references)) + (damping * node_summation)

converged = False
iterations = 0
while converged != True:
    iterations += 1
    converged = True
    for page in page_references:
        # Do work to update value
        newValue = update_rank(page)
        if converged == True and abs(rankings[page] - newValue) > tolerance:
            converged = False

        rankings[page] = newValue

total_ranked = 0
for rank in rankings:
    print(f"Page {rank} has a rank of {rankings[rank]}")
    total_ranked += rankings[rank]

print(f"Cumulative rank {total_ranked} after {iterations} iterations")
