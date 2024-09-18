import helpers
from uuid import uuid4
import urllib.request
import brotli
import mimetypes

class ImageAsset:
    def __init__(self, el, domain):
        self.domain = domain
        self.url = el.get('src')
        self.description = el.get('alt')
        self.title = el.get('title')
    
    def download(self):
        dir_path = f"../contents/{self.domain}/image"
        file_id = str(uuid4())
        res = self.get_content()

        if res == None:
            return None

        file_name = f"{file_id}.{res[1]}"
        helpers.write_file(dir_path, file_name, res[0])
        return f"{dir_path}/{file_name}"

    def get_content(self):
        target_url = self.url

        if helpers.is_absolute_url(target_url) == False:
            target_url = f"https://{self.domain}/{self.url}"

        try:
            req = urllib.request.Request(target_url)
            req.add_header('Accept-Encoding', 'gzip, deflate, br')
            with urllib.request.urlopen(req) as response:
                raw = response.read()
                extension = mimetypes.guess_extension(response.headers['content-type'])
                compression = response.getheader('Content-Encoding')
                if compression == 'br':
                    return (brotli.decompress(raw), extension)
                
                return (response.read(), extension)
        except Exception as ex:
            print(f"Failed to load {target_url} {ex}")
            return None 