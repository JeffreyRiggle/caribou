from bs4 import BeautifulSoup
import urllib.request
import brotli
import time
from asset_repo import AssetRespositoy
import helpers
import concurrent.futures
from image import ImageAsset

class Page:
    def __init__(self, url: str, asset_respository: AssetRespositoy):
        self.url = url
        self.asset_respository = asset_respository
        self.failed = False
        self.js_bytes = 0
        self.network_time = 0
        self.css_bytes = 0
        self.title = url
        self.interactive_content: BeautifulSoup = None
        self.js_assets = []
        self.css_assets = []

    def load(self):
        result = self.get_content(self.url)
        if result == None:
            self.failed = True
            return 0

        self.content = result[0]
        self.html_bytes = result[1]
        self.compression = result[2]
        self.network_time += result[3]
        self.interactive_content = BeautifulSoup(self.content)
        self.text = self.interactive_content.text
        self.get_description()
        self.get_title()

        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
            js_futures: list[concurrent.futures.Future] = []
            css_futures: list[concurrent.futures.Future] = []
            self.get_js_bytes(executor, js_futures)
            self.get_css_bytes(executor, css_futures)

            for future in concurrent.futures.as_completed(js_futures):
                jsRes = future.result()
                self.js_bytes += jsRes[0]
                self.network_time += jsRes[1]

            for future in concurrent.futures.as_completed(css_futures):
                cssRes = future.result()
                self.css_bytes += cssRes[0]
                self.network_time += cssRes[1]

        return self.network_time
        
    def get_title(self):
        title_tag = self.interactive_content.select_one('title')
        if title_tag != None:
            self.title = title_tag.text
            return
        title_tag = self.interactive_content.select_one('h1')

        if title_tag != None:
            self.title = title_tag.text
            return

    def get_description(self):
        meta_tag = self.interactive_content.select_one("meta[name='description']")
        if meta_tag == None:
            self.description = ''
            return

        self.description = meta_tag.get('content')

    def get_js_bytes(self, executor: concurrent.futures.ThreadPoolExecutor, js_futures: list[concurrent.futures.Future]):
        scripts = self.interactive_content.select("script")

        for script in scripts:
            script_src = script.get('src')
            if script_src == None:
                inline_content = script.encode_contents()
                inlin_acript_size = len(inline_content)
                self.js_bytes += inlin_acript_size
                self.js_assets.append((None, inline_content))
                continue

            if helpers.is_absolute_url(script_src) == False:
                script_src = f"https://{helpers.get_domain(self.url)}{script_src}"

            js_futures.append(executor.submit(self.download_and_process_static_content, url=script_src, related_resource="javascript"))

    def get_css_bytes(self, executor: concurrent.futures.ThreadPoolExecutor, css_futures: list[concurrent.futures.Future]):
        styles = self.interactive_content.select('link[rel="stylesheet"]')

        for style in styles:
            style_src = style.get('href')
            if style_src == None:
                inline_content = style.encode_contents()
                inline_style_size = len(inline_content)
                self.css_bytes += inline_style_size
                self.css_assets.append((None, inline_content))
                continue

            if helpers.is_absolute_url(style_src) == False:
                style_src = f"https://{helpers.get_domain(self.url)}{style_src}"

            css_futures.append(executor.submit(self.download_and_process_static_content, url=style_src, related_resource="css"))

    def download_and_process_static_content(self, url: str, related_resource: str = None):
        cache_size = self.asset_respository.get_asset_size(url)

        if cache_size != None:
            return (cache_size, 0)

        result = self.get_content(url)
        if result == None:
            self.asset_respository.set_asset_bytes(url, 0)
            return (0, 0)

        if related_resource == "javascript":
            self.js_assets.append((url, result[0]))
        if related_resource == "css":
            self.css_assets.append((url, result[0]))

        self.asset_respository.set_asset_bytes(url, result[1])
        return (result[1], result[3])

    def get_content(self, url: str):
        try:
            start_time = time.time()
            req = urllib.request.Request(url)
            req.add_header('Accept-Encoding', 'gzip, deflate, br')
            with urllib.request.urlopen(req) as response:
                raw = response.read()
                compression = response.getheader('Content-Encoding')
                if compression == 'br':
                    content = brotli.decompress(raw)
                else:
                    content = response.read()

                total_time = time.time() - start_time
                return (content, len(raw), compression, total_time)
        except Exception as ex:
            print(f"Failed to load {url} {ex}")
            return None 

    def get_links(self):
        return list(set(map(self.process_link, self.interactive_content.select('a'))))

    def get_downloadable_assets(self):
        # TODO add support for other types
        if self.interactive_content == None:
            return { 'image': [], 'javascript': self.js_assets, 'css': self.css_assets }

        images = list(set(map(self.process_image, self.interactive_content.select('img'))))
        return { 'image': images, 'javascript': self.js_assets, 'css': self.css_assets }

    def process_link(self, el):
        link = el.get('href')

        if link == None:
            return None

        if helpers.is_absolute_url(link):
            return Page(link, self.asset_respository)

        # Do not include self references
        if link.startswith("#"):
            return None

        return Page(f"https://{helpers.get_domain(self.url)}{link}", self.asset_respository)

    def process_image(self, el):
        domain = helpers.get_domain(self.url)
        return ImageAsset(el, domain)

