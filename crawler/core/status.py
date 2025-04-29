from enum import Enum

class DomainStatus(Enum):
    Crawl = "Crawl"
    Block = "Block"
    Read = "Read"
    Prompt = "Prompt"
    NeedsStatus = "NeedsStatus"

class ResourceStatus(Enum):
    Processed = "Processed"
    Failed = "Failed"
    Pending = "Pending",
    RateLimited = "RateLimited"

