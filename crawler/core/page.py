from core.asset_repo import AssetRespositoy
from core.favicon import Favicon
from core.helpers import is_absolute_url, get_domain
from core.image import ImageAsset
from core.storage.file_access import FileAccess
from core.storage.s3_access import S3Access
from core.logger import Logger
import concurrent.futures
import urllib.request
from urllib.error import HTTPError
import brotli
from bs4 import BeautifulSoup, Tag
import gzip
import time
from typing import List


class Page:
    def __init__(self, url: str, asset_respository: AssetRespositoy, storage: FileAccess | S3Access, logger: Logger):
        self.url = url
        self.asset_respository = asset_respository
        self.failed = False
        self.rate_limited = False
        self.js_bytes = 0
        self.network_time = 0
        self.css_bytes = 0
        self.title = url
        self.interactive_content: BeautifulSoup = None
        self.js_assets = []
        self.css_assets = []
        self.headers = ''
        self.favicons: List[Favicon] = []
        self.storage = storage
        self.logger = logger

    def load(self):
        return self.intialize_from_result(self.get_content(self.url))
    
    def intialize_from_result(self, result):
        if result == None:
            self.failed = True
            return 0

        self.content = result[0]
        self.html_bytes = result[1]
        self.compression = result[2]
        self.network_time += result[3]
        self.headers = result[4]
        self.interactive_content = BeautifulSoup(self.content, features='html.parser')
        self.text = self.interactive_content.text
        self.get_description()
        self.get_title()
        self.get_favicons()

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

        self.description = meta_tag.get('content') or ''

    def get_favicons(self):
        favicons = self.interactive_content.select('link[rel="icon"]')
        for favicon in favicons:
            icon_ref = favicon.get('href')
            if icon_ref == None:
                continue

            if is_absolute_url(icon_ref) == False:
                icon_ref = f"https://{get_domain(self.url)}{icon_ref}"

            icon_details = Favicon(icon_ref, self.url, favicon.get('media'), favicon.get('type'), favicon.get('sizes'))
            self.favicons.append(icon_details)

    def get_js_bytes(self, executor: concurrent.futures.ThreadPoolExecutor, js_futures: list[concurrent.futures.Future]):
        scripts = self.interactive_content.select("script")

        for script in scripts:
            script_src = script.get('src')
            if script_src == None:
                inline_content = script.encode_contents()
                inline_script_size = len(inline_content)
                self.js_bytes += inline_script_size
                continue

            if is_absolute_url(script_src) == False:
                script_src = f"https://{get_domain(self.url)}{script_src}"

            js_futures.append(executor.submit(self.download_and_process_static_content, url=script_src, related_resource="javascript"))

        links = self.interactive_content.select('link')
        for link in links:
            link_ref = link.get('href')
            if link_ref == None or link_ref.endswith('.js') != True:
                continue

            if is_absolute_url(link_ref) == False:
                link_ref = f"https://{get_domain(self.url)}{link_ref}"

            js_futures.append(executor.submit(self.download_and_process_static_content, url=link_ref, related_resource="javascript"))

    def get_css_bytes(self, executor: concurrent.futures.ThreadPoolExecutor, css_futures: list[concurrent.futures.Future]):
        styles = self.interactive_content.select('style')
        for style in styles:
            inline_content = style.encode_contents()
            self.css_bytes += len(inline_content)

        style_links = self.interactive_content.select('link[rel="stylesheet"]')

        for style in style_links:
            style_src = style.get('href')
            if style_src == None:
                inline_content = style.encode_contents()
                inline_style_size = len(inline_content)
                self.css_bytes += inline_style_size
                continue

            if is_absolute_url(style_src) == False:
                style_src = f"https://{get_domain(self.url)}{style_src}"

            css_futures.append(executor.submit(self.download_and_process_static_content, url=style_src, related_resource="css"))

    def download_and_process_static_content(self, url: str, related_resource: str = None):
        cached_asset = self.asset_respository.get_asset(url)

        if cached_asset != None:
            if related_resource == "javascript":
                self.js_assets.append((url, cached_asset))
            if related_resource == "css":
                self.css_assets.append((url, cached_asset))
            return (len(cached_asset), 0)

        result = self.get_content(url)
        if result == None:
            self.asset_respository.set_asset(url, '')
            return (0, 0)

        asset = result[0]
        self.asset_respository.set_asset(url, asset)
        if related_resource == "javascript":
            self.js_assets.append((url, asset))
        if related_resource == "css":
            self.css_assets.append((url, asset))
        return (result[1], result[3])

    def get_content(self, url: str):
        try:
            start_time = time.time()
            req = urllib.request.Request(url, headers={ 'Accept-Encoding': 'gzip, deflate, br', 'User-Agent': 'CaribouCrawler' })
            with urllib.request.urlopen(req) as response:
                raw = response.read()
                compression = response.getheader('Content-Encoding')
                if compression == 'br':
                    content = brotli.decompress(raw)
                elif compression == 'gzip':
                    content = gzip.decompress(raw)
                else:
                    content = raw

                total_time = time.time() - start_time
                return (content, len(raw), compression, total_time, response.headers.as_string())
        except HTTPError as httpEx:
            if httpEx.code == 429:
                self.rate_limited = True

            self.logger.debug(f"Failed to load {url}, with status code {httpEx.code} and error {httpEx}")
            self.failed = True
            return None
        except Exception as ex:
            self.logger.debug(f"Failed to load {url} {ex}")
            return None 

    def get_downloadable_assets(self):
        if self.interactive_content == None:
            return { 'image': [], 'javascript': self.js_assets, 'css': self.css_assets }

        images = list(set(map(self.process_image, self.interactive_content.select('img'))))
        return { 'image': images, 'javascript': self.js_assets, 'css': self.css_assets }

    def process_image(self, el: Tag):
        domain = get_domain(self.url)
        return ImageAsset(self.storage, domain, el.get('src'), el.get('alt'), el.get('title'), self.logger)

