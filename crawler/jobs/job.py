from jobs.job_status import JobStatus
import time
import typing
from uuid import uuid4, UUID

class Job:
    def __init__(self):
        self.id: UUID = uuid4()
        self.status: JobStatus = JobStatus.Queued
        self.total_time = 0
        self.start_time = 0

    def start(self):
        self.start_time = time.time()
        self.status = JobStatus.Running

    def complete(self):
        self.total_time = time.time() - self.start_time
        self.status = JobStatus.Completed

    def fail(self):
        self.total_time = time.time() - self.start_time
        self.status = JobStatus.Failed

    def to_dict(self):
        return { 'id': str(self.id), 'status': self.status, 'startTime': self.start_time, 'totalTime': self.total_time }
    
    @staticmethod
    def from_dict(dict: typing.Dict):
        res = Job()
        res.id = UUID(str(dict["id"]))
        res.status = dict["status"]
        res.total_time = dict["totalTime"]
        res.start_time = dict["startTime"]

        return res