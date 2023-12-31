import re
import os

def domain_to_full_url(domain):
    return f'https://{domain}'


def write_file(file_path, file_name, contents):
    if not os.path.exists(file_path):
        os.makedirs(file_path)

    file = f"{file_path}/{file_name}"
    with open(file, 'wb') as fHandle:
        fHandle.write(contents)

def get_domain(url):
    return re.search(r'^https?:\/\/([^\/]+)', url).group(1)
