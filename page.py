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
            print(f"Processing script {script.get('src')}")
            result = self.get_content(script.get('src'))
            jsBytes += result[1]

        return jsBytes

    def get_css_bytes(self):
        styles = self.interactiveContent.select('link[rel="stylesheet"]')
        styleBytes = 0

        for style in styles:
            print(f"Processing script {style.get('href')}")
            result = self.get_content(style.get('href'))
            styleBytes += result[1]

        return styleBytes

    def get_content(self, url):
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

    def get_links(self):
        return list(set(map(self.process_link, self.interactiveContent.select('a'))))

    def process_link(self, el):
        link = el.get('href')

        if link == None:
            return None

        if re.match(r'^https?://', link) != None:
            return Page(link)

        return Page(self.url + link)
