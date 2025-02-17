from core.dbaccess.postgres_access import PostgresDBAccess
from jobs.job import Job

class JobRepositoryPostgres:
    def __init__(self, db_access: PostgresDBAccess):
        self.db_access = db_access

    def get_job(self, id: str):
        cursor = self.db_access.connection.cursor()
        cursor.execute("SELECT * FROM jobs WHERE id = %(id)s", { 'id': id })
        result = list(map(lambda r: Job.from_dict(self.job_tuple_to_dict(r)), cursor.fetchall()))

        if len(result) < 1:
            return Job()

        return result[0]
        
    def get_jobs(self):
        cursor = self.db_access.connection.cursor()
        cursor.execute("SELECT * FROM jobs")
        return list(map(lambda r: Job.from_dict(self.job_tuple_to_dict(r)), cursor.fetchall()))
        
    def add_job(self, job: Job):
        cursor = self.db_access.connection.cursor()
        params = {
            'id': str(job.id),
            'status': job.status,
            'startTime': job.start_time,
            'totalTime': job.total_time
        }
        cursor.execute("INSERT INTO jobs VALUES (%(id)s, %(status)s, %(startTime)s, %(totalTime)s)", params)
        self.db_access.connection.commit()

    def update_job(self, job: Job):
        cursor = self.db_access.connection.cursor()
        params = {
            'status': job.status,
            'startTime': job.start_time,
            'totalTime': job.total_time,
            'id': str(job.id)
        }
        cursor.execute("UPDATE jobs SET status = %(status)s, startTime = %(startTime)s, totalTime = %(totalTime)s WHERE id = %(id)s", params)
        self.db_access.connection.commit()

    def job_tuple_to_dict(self, res):
        return { 'id': res[0], 'status': res[1], 'startTime': res[2], 'totalTime': res[3] }