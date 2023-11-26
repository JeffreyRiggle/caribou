from bs4 import BeautifulSoup
import urllib.request
import brotli
import re
import time
import helpers

class Page:
    def __init__(self, url):
        self.url = url
        self.failed = False

    def load(self):
        result = self.get_content(self.url)
        if result == None:
            self.failed = True
            return 0

        self.content = result[0]
        self.htmlBytes = result[1]
        self.compression = result[2]
        self.interactiveContent = BeautifulSoup(self.content)
        jsResult = self.get_js_bytes()
        self.jsBytes = jsResult[0] 
        cssResult = self.get_css_bytes()
        self.cssBytes = cssResult[0]
        return result[3] + jsResult[1] + cssResult[1]
        
    def get_js_bytes(self):
        scripts = self.interactiveContent.select("script")
        networkTime = 0
        jsBytes = 0

        for script in scripts:
            scriptSrc = script.get('src')
            if scriptSrc == None:
                print(f"Not processing script {script}")
                continue

            result = self.get_content(scriptSrc)
            
            if result == None:
                continue
            
            jsBytes += result[1]
            networkTime += result[3]

        return (jsBytes, networkTime)

    def get_css_bytes(self):
        styles = self.interactiveContent.select('link[rel="stylesheet"]')
        networkTime = 0
        styleBytes = 0

        for style in styles:
            styleSrc = style.get('href')
            if styleSrc == None:
                print(f"Not processing style {style}")
                continue

            result = self.get_content(styleSrc)
            
            if result == None:
                continue

            styleBytes += result[1]
            networkTime += result[3]

        return (styleBytes, networkTime)

    def get_content(self, url):
        try:
            startTime = time.time()
            req = urllib.request.Request(url)
            req.add_header('Accept-Encoding', 'gzip, deflate, br')
            response = urllib.request.urlopen(req)
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

    def process_link(self, el):
        link = el.get('href')

        if link == None:
            return None

        if re.match(r'^https?://', link) != None:
            return Page(link)

        # Do not include self references
        if link.startswith("#"):
            return None

        return Page(f"https://{helpers.get_domain(self.url)}{link}")
