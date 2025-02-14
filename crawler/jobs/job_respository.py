from core.dbaccess import DBAccess
from jobs.job import Job

class JobRepository:
    def __init__(self, db_access: DBAccess):
        self.db_access = db_access

    def get_job(self, id: str):
        with self.db_access.lock:
            cursor = self.db_access.connection.cursor()
            cursor.execute("SELECT * FROM jobs WHERE id = ?", (id,))
            result = list(map(lambda r: Job.from_dict(self.job_tuple_to_dict(r)), cursor.fetchall()))

            if len(result) < 1:
                return Job()

            return result[0]
        
    def get_jobs(self):
        with self.db_access.lock:
            cursor = self.db_access.connection.cursor()
            cursor.execute("SELECT * FROM jobs")
            return list(map(lambda r: Job.from_dict(self.job_tuple_to_dict(r)), cursor.fetchall()))
        
    def add_job(self, job: Job):
        with self.db_access.lock:
            cursor = self.db_access.connection.cursor()
            cursor.execute("INSERT INTO jobs VALUES (?, ?, ?, ?)", (str(job.id), job.status, job.start_time, job.total_time))
            self.db_access.connection.commit()

    def update_job(self, job: Job):
        with self.db_access.lock:
            cursor = self.db_access.connection.cursor()
            cursor.execute("UPDATE jobs SET status = ?, startTime = ?, totalTime = ? WHERE id = ?", (job.status, job.start_time, job.total_time, str(job.id)))
            self.db_access.connection.commit()

    def job_tuple_to_dict(self, res):
        return { 'id': res[0], 'status': res[1], 'startTime': res[2], 'totalTime': res[3] }