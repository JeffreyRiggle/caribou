from typing import Dict

class AssetRespositoy:
    def __init__(self):
        self.cache: Dict[str, str] = {}

    def get_asset(self, asset: str) -> str:
        return self.cache.get(asset)

    def set_asset(self, asset: str, content: str):
        self.cache[asset] = content
