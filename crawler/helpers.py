import re
import os

def domain_to_full_url(domain: str):
    return f'https://{domain}'


def write_file(file_path: str, file_name: str, contents):
    if not os.path.exists(file_path):
        os.makedirs(file_path)

    file = f"{file_path}/{file_name}"
    with open(file, 'wb') as fHandle:
        if isinstance(contents, str):
            fHandle.write(contents.encode())
        else:
            fHandle.write(contents)

def get_domain(url: str):
    return re.search(r'^https?:\/\/([^\/]+)|^[^.]+\.([^\/]+)', url).group(1)

def is_absolute_url(url: str):
    return re.match(r'^(https?://)|^([^./]+\.)', url) != None

