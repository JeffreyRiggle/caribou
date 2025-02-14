import time
from uuid import uuid4

class Job:
    def __init__(self):
        self.id = uuid4()
        self.status = 'queued'
        self.total_time = 0

    def start(self):
        self.start_time = time.time()
        self.status = 'running'

    def complete(self):
        self.total_time = time.time() - self.start_time
        self.status = 'completed'

    def fail(self):
        self.total_time = time.time() - self.start_time
        self.status = 'failed'

    def to_dict(self):
        return { 'id': self.id, 'status': self.status, 'totalTime': self.total_time }