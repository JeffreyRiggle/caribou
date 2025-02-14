from enum import Enum

class JobStatus(str, Enum):
    Unknown = 'Unknown'
    Queued = 'Queued'
    Running = 'Running'
    Completed = 'Completed'
    Failed = 'Failed'
