import time
from uuid import uuid4

class Job:
    def __init__(self):
        self.id = uuid4()
        self.status = 'queued'

    def start(self):
        self.start_time = time.time()
        self.status = 'running'

    def complete(self):
        self.total_time = time.time() - self.start_time
        self.status = 'completed'

    def fail(self):
        self.total_time = time.time() - self.start_time
        self.status = 'failed'