import re

def domain_to_full_url(domain: str):
    return f'https://{domain}'

def get_domain(url: str):
    return re.search(r'^https?:\/\/([^\/]+)|^[^.]+\.([^\/]+)', url).group(1)

def is_absolute_url(url: str):
    return re.match(r'^(https?://)|^([^./]+\.)', url) != None

