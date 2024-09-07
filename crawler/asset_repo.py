from typing import Dict

class AssetRespositoy:
    def __init__(self):
        self.cache: Dict[str, int] = {}

    def get_asset_size(self, asset: str) -> int:
        return self.cache.get(asset)

    def set_asset_bytes(self, asset: str, size: int):
        self.cache[asset] = size
