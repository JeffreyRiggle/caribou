from core.asset_repo import AssetRespositoy
from core.audio_asset import AudioAsset
from core.font import FontAsset
from core.helpers import get_domain, is_absolute_url
from core.image import ImageAsset
from core.json_asset import JsonAsset
from core.page import Page
from core.policy import PolicyManager
from core.status import ResourceStatus
from core.storage.file_access import FileAccess
from core.xml_asset import XmlAsset
import urllib.request
from urllib.error import HTTPError
import brotli
from bs4 import Tag
import gzip
import mimetypes
import time
from uuid import uuid4


class Link:
    def __init__(self, storage: FileAccess, url: str, asset_respository: AssetRespositoy, policy_manager: PolicyManager):
        self.url = url
        self.asset_respository = asset_respository
        self.policy_manager = policy_manager
        self.loaded = False
        self.failed = False
        self.rate_limited = False
        self.content_type = ''
        self.result = None
        self.content = None
        self.headers = ''
        self.total_time = 0
        self.storage = storage

    def load(self):
        self.loaded = True
        res = self.get_content(self.url)
        if self.is_page():
            page = Page(self.url, self.asset_respository, self.storage)
            page.intialize_from_result(res)
            self.result = page
        elif self.is_image():
            self.result = ImageAsset(self.storage, get_domain(self.url), self.url, '', '')
        elif self.is_xml():
            self.result = XmlAsset(self.url, self.content)
        elif self.is_json():
            self.result = JsonAsset(self.url, self.content)
        elif self.is_audio():
            self.result = AudioAsset(self.url, self.content)
        elif self.is_font():
            self.result = FontAsset(self.url, self.content)
        elif self.failed != True:
            print(f"Unable to process link for content type {self.content_type}")
        
        return self.total_time

    def download(self):
        if self.should_download() == False:
            return None

        dir_path = f"{get_domain(self.url)}/{self.get_dowload_folder()}"
        file_id = str(uuid4())
        file_name = f"{file_id}{self.get_extension()}"
        self.storage.write(dir_path, file_name, self.content)
        text = ''
        description = ''
        title = ''

        if self.is_page():
            text = self.result.text
            description = self.result.description
            title = self.result.title

        return { 'url': self.url, 'file': f"{dir_path}/{file_name}", 'status': ResourceStatus.Processed.value, 'text': text, 'description': description, 'title': title, 'contentType': self.get_content_type(), 'headers': self.headers }

    def should_download(self):
        if self.is_page():
            return True
        elif self.is_image():
            return self.policy_manager.should_download_asset('image')
        elif self.is_xml() or self.is_json():
            return self.policy_manager.should_download_asset('data')
        elif self.is_audio():
            return self.policy_manager.should_download_asset('audio')
        elif self.is_font():
            return self.policy_manager.should_download_asset('font')
        
        print("Not downloading ", self.url)
        return False

    def get_dowload_folder(self):
        if self.is_page():
            return ''
        
        if self.is_xml():
            return 'data/'
        
        if self.is_font():
            return 'font/'
        
        return self.get_content_type() + '/'

    def get_extension(self):
        if self.is_page():
            return '.html'
        
        if self.is_xml():
            return '.xml'
        
        if self.is_json():
            return '.json'
        
        if self.is_audio() or self.is_font():
            return mimetypes.guess_extension(self.content_type)

        return ''

    def is_page(self):
        if self.loaded == False:
            self.load()
        return 'text/html' in self.content_type
    
    def is_image(self):
        if self.loaded == False:
            self.load()
        return self.content_type.startswith('image')
    
    def is_xml(self):
        if self.loaded == False:
            self.load()
        return self.content_type.startswith('application/xml') or self.url.endswith('.xml')
    
    def is_json(self):
        if self.loaded == False:
            self.load()
        return self.content_type.startswith('application/json') or self.url.endswith('.json')
    
    def is_audio(self):
        if self.loaded == False:
            self.load()
        return self.content_type.startswith('audio/')
    
    def is_font(self):
        if self.loaded == False:
            self.load()
        return self.content_type.startswith('font')
    
    def get_content_type(self):
        if self.loaded == False:
            self.load()

        if self.is_page():
            return 'html'
        
        if self.is_image():
            return 'image'
        
        if self.is_xml():
            return 'xml'
        
        if self.is_json():
            return 'json'
        
        if self.is_audio():
            return 'audio'
        
        if self.is_font():
            return 'font'
        
        return ''

    def get_content(self, url: str):
        start_time = time.time()

        if self.policy_manager.is_rate_limited(url) == True:
            self.failed = True
            self.rate_limited = True
            return None

        if self.policy_manager.should_download_url(url) == False:
            self.failed = True
            return None

        try:
            req = urllib.request.Request(url, headers={ 'Accept-Encoding': 'gzip, deflate, br', 'User-Agent': 'CaribouCrawler' })
            with urllib.request.urlopen(req) as response:
                raw = response.read()
                compression = response.getheader('Content-Encoding')
                if compression == 'br':
                    self.content = brotli.decompress(raw)
                elif compression == 'gzip':
                    self.content = gzip.decompress(raw)
                else:
                    self.content = raw

                self.total_time = time.time() - start_time
                self.content_type = response.getheader('Content-Type')
                self.headers = response.headers.as_string()
                return (self.content, len(raw), compression, self.total_time, self.headers)
        except HTTPError as httpEx:
            if httpEx.code == 429:
                self.rate_limited = True

            print(f"Failed to load {url}, with status code {httpEx.code} and error {httpEx}")
            self.failed = True
            return None
        except Exception as ex:
            print(f"Failed to load {url} {ex}")
            self.failed = True
            return None
        
    def get_links(self):
        if self.is_page():
            anchors = self.result.interactive_content.select('a')
            links = self.result.interactive_content.select('link')
            all_links = anchors + links
            return list(set(map(self.process_link, all_links)))
        
        return []
    
    def process_link(self, el: Tag):
        link = el.get('href')

        if link == None:
            return None

        if is_absolute_url(link):
            return Link(self.storage, link, self.asset_respository, self.policy_manager)

        # Do not include self references
        if link.startswith("#"):
            return None

        return Link(self.storage, f"https://{get_domain(self.url)}{link}", self.asset_respository, self.policy_manager)