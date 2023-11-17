import urllib.request

class Page:
    def __init__(self, url):
        self.url = url

    def load(self):
        print("Loading " + self.url)
        req = urllib.request.Request(self.url)
        self.content = urllib.request.urlopen(req).read()
