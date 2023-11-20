from bs4 import BeautifulSoup
import urllib.request
import brotli
import re

class Page:
    def __init__(self, url):
        self.url = url

    def load(self):
        print("Loading " + self.url)
        result = self.get_content(self.url)
        self.content = result[0]
        self.htmlBytes = result[1]
        self.compression = result[2]
        self.interactiveContent = BeautifulSoup(self.content)
        self.jsBytes = self.get_js_bytes()
        self.cssBytes = self.get_css_bytes()
        
    def get_js_bytes(self):
        scripts = self.interactiveContent.select("script")
        jsBytes = 0

        for script in scripts:
            scriptSrc = script.get('src')
            if scriptSrc == None:
                print(f"Not processing script {script}")
                continue

            result = self.get_content(scriptSrc)
            jsBytes += result[1]

        return jsBytes

    def get_css_bytes(self):
        styles = self.interactiveContent.select('link[rel="stylesheet"]')
        styleBytes = 0

        for style in styles:
            styleSrc = style.get('href')
            if styleSrc == None:
                print(f"Not processing style {style}")
                continue

            result = self.get_content(styleSrc)
            styleBytes += result[1]

        return styleBytes

    def get_content(self, url):
        try:
            req = urllib.request.Request(url)
            req.add_header('Accept-Encoding', 'gzip, deflate, br')
            response = urllib.request.urlopen(req)
            raw = response.read()
            compression = response.getheader('Content-Encoding')
            if compression == 'br':
                content = brotli.decompress(raw)
            else:
                content = response.read()

            return (content, len(raw), compression)
        except Exception as ex:
            print(f"Failed to load {url} {ex}")

    def get_links(self):
        return list(set(map(self.process_link, self.interactiveContent.select('a'))))

    def process_link(self, el):
        link = el.get('href')

        if link == None:
            return None

        if re.match(r'^https?://', link) != None:
            return Page(link)

        return Page(self.url + link)
