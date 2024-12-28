import helpers
from uuid import uuid4
import urllib.request
import brotli
import mimetypes

class ImageAsset:
    def __init__(self, domain: str, url: str, description: str, title: str):
        self.domain = domain
        self.url = url
        self.description = description
        self.title = title
        self.headers = ''
    
    def download(self):
        dir_path = f"../contents/{self.domain}/image"
        file_id = str(uuid4())
        res = self.get_content()

        if res == None:
            return None

        file_name = f"{file_id}{res[1]}"
        helpers.write_file(dir_path, file_name, res[0])
        return f"{dir_path}/{file_name}"

    def get_content(self):
        target_url = self.url

        if target_url == None:
            return None

        if helpers.is_absolute_url(target_url) == False:
            target_url = f"https://{self.domain}/{self.url}"

        try:
            req = urllib.request.Request(target_url, headers={ 'Accept-Encoding': 'gzip, deflate, br', 'User-Agent': 'CaribouCrawler' })
            with urllib.request.urlopen(req) as response:
                raw = response.read()
                self.headers = response.headers.as_string()
                extension = mimetypes.guess_extension(response.headers['content-type'])
                compression = response.getheader('Content-Encoding')
                if compression == 'br':
                    return (brotli.decompress(raw), extension)
                
                return (response.read(), extension)
        except Exception as ex:
            print(f"Failed to load {target_url} {ex}")
            return None 
