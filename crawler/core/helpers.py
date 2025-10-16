import re

def domain_to_full_url(domain: str):
    return f'https://{domain}'

def get_domain(url: str):
    search_result = re.search(r'^https?:\/\/([^\/]+)|^[^.]+\.([^\/]+)', url)
    if search_result == None:
        return ""

    return search_result.group(1)

def is_absolute_url(url: str):
    return re.match(r'^(https?://)|^([^./]+\.)', url) != None

