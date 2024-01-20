class AssetRespositoy:
    def __init__(self):
        self.cache = {}

    def get_asset_size(self, asset):
        return self.cache.get(asset)

    def set_asset_bytes(self, asset, size):
        self.cache[asset] = size
