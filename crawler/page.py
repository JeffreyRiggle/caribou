from bs4 import BeautifulSoup
import urllib.request
import brotli
import re
import time
import helpers
import concurrent.futures
from image import ImageAsset

class Page:
    def __init__(self, url, asset_respository):
        self.url = url
        self.asset_respository = asset_respository
        self.failed = False
        self.jsBytes = 0
        self.networkTime = 0
        self.cssBytes = 0
        self.title = url
        self.interactiveContent = None

    def load(self):
        result = self.get_content(self.url)
        if result == None:
            self.failed = True
            return 0

        self.content = result[0]
        self.htmlBytes = result[1]
        self.compression = result[2]
        self.networkTime += result[3]
        self.interactiveContent = BeautifulSoup(self.content)
        self.text = self.interactiveContent.text
        self.get_description()
        self.get_title()

        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
            jsFutures = []
            cssFutures = []
            self.get_js_bytes(executor, jsFutures)
            self.get_css_bytes(executor, cssFutures)

            for future in concurrent.futures.as_completed(jsFutures):
                jsRes = future.result()
                self.jsBytes += jsRes[0]
                self.networkTime += jsRes[1]

            for future in concurrent.futures.as_completed(cssFutures):
                cssRes = future.result()
                self.cssBytes += cssRes[0]
                self.networkTime += cssRes[1]

        return self.networkTime
        
    def get_title(self):
        titleTag = self.interactiveContent.select_one('title')
        if titleTag != None:
            self.title = titleTag.text
            return
        titleTag = self.interactiveContent.select_one('h1')

        if titleTag != None:
            self.title = titleTag.text
            return

    def get_description(self):
        metaTag = self.interactiveContent.select_one("meta[name='description']")
        if metaTag == None:
            self.description = ''
            return

        self.description = metaTag.get('content')

    def get_js_bytes(self, executor, jsFutures):
        scripts = self.interactiveContent.select("script")

        for script in scripts:
            scriptSrc = script.get('src')
            if scriptSrc == None:
                inlineScriptSize = len(script.encode_contents())
                self.jsBytes += inlineScriptSize
                continue

            if helpers.is_absolute_url(scriptSrc) == False:
                scriptSrc = f"https://{helpers.get_domain(self.url)}{scriptSrc}"

            jsFutures.append(executor.submit(self.download_and_process_static_content, url=scriptSrc))

    def get_css_bytes(self, executor, cssFutures):
        styles = self.interactiveContent.select('link[rel="stylesheet"]')

        for style in styles:
            styleSrc = style.get('href')
            if styleSrc == None:
                inlineStyleSize = len(style.encode_contents())
                self.cssBytes += inlineStyleSize
                continue

            if helpers.is_absolute_url(styleSrc) == False:
                styleSrc = f"https://{helpers.get_domain(self.url)}{styleSrc}"

            cssFutures.append(executor.submit(self.download_and_process_static_content, url=styleSrc))

    def download_and_process_static_content(self, url):
        cache_size = self.asset_respository.get_asset_size(url)

        if cache_size != None:
            return (cache_size, 0)

        result = self.get_content(url)
        if result == None:
            self.asset_respository.set_asset_bytes(url, 0)
            return (0, 0)

        self.asset_respository.set_asset_bytes(url, result[1])
        return (result[1], result[3])

    def get_content(self, url):
        try:
            startTime = time.time()
            req = urllib.request.Request(url)
            req.add_header('Accept-Encoding', 'gzip, deflate, br')
            with urllib.request.urlopen(req) as response:
                raw = response.read()
                compression = response.getheader('Content-Encoding')
                if compression == 'br':
                    content = brotli.decompress(raw)
                else:
                    content = response.read()

                totalTime = time.time() - startTime
                return (content, len(raw), compression, totalTime)
        except Exception as ex:
            print(f"Failed to load {url} {ex}")
            return None 

    def get_links(self):
        return list(set(map(self.process_link, self.interactiveContent.select('a'))))

    def get_downloadable_assets(self):
        # TODO add support for other types
        if self.interactiveContent == None:
            return { 'image': [] }

        images = list(set(map(self.process_image, self.interactiveContent.select('img'))))
        return { 'image': images }

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

