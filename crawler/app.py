from core.crawler import Crawler
from core.dbaccess.postgres_access import PostgresDBAccess
from core.dbaccess.sqlite_access import SQLiteDBAccess
from core.policy import PolicyManager
from core.ranker import Ranker
from core.storage.file_access import FileAccess
from core.storage.s3_access import S3Access
from jobs.job import Job
from jobs.job_respository_sqlite import JobRepositorySQLite
from jobs.job_repository_postgres import JobRepositoryPostgres
from concurrent.futures import ThreadPoolExecutor
from flask import Flask, jsonify
import os
import typing

executor = ThreadPoolExecutor(1)

is_postgres = 'USE_POSTGRES' in os.environ
db = None
if is_postgres:
    db = PostgresDBAccess()
else:
    has_file_set = 'SQLITE_FILE' in os.environ
    db = SQLiteDBAccess(os.environ['SQLITE_FILE'] if has_file_set else "../grepper.db")

storage = None
s3_bucket = os.environ["S3_BUCKET"] if "S3_BUCKET" in os.environ else None
if s3_bucket:
    storage = S3Access(s3_bucket)
else:
    contents_path = os.environ['CONTENT_PATH'] if 'CONTENT_PATH' in os.environ else "../contents"
    storage = FileAccess(contents_path)

db.setup()
db.run_migrations()

policy_manager = PolicyManager(db)

job_repo = None
if is_postgres:
    job_repo = JobRepositoryPostgres(db)
else:
    job_repo = JobRepositorySQLite(db)

app = Flask(__name__)

@app.get("/jobs")
def get_jobs():
    result: typing.Dict[str, str] = {}

    for job in job_repo.get_jobs():
        result[str(job.id)] = job.to_dict()

    return jsonify(result), 200

@app.post("/execute")
def execute_job():
    job = Job()
    job_repo.add_job(job)
    executor.submit(run_job, job)
    return jsonify(job.to_dict()), 201

@app.get("/status/<job_id>")
def get_job_status(job_id):
    job = job_repo.get_job(job_id)

    if job == None:
        return jsonify({ "jobId": job_id }), 404

    return jsonify(job.to_dict()), 200

def run_job(job: Job):
    try:
        job.start()
        job_repo.update_job(job)
        crawl = Crawler(db, policy_manager, storage, job.start_time)
        crawl.load()
        crawl.crawl()

        ranker = Ranker(db, storage)
        ranker.rank()
    except Exception as e:
        app.logger.exception("Failed to run job:", e)
        job.fail()
        job_repo.update_job(job)
        return

    job.complete()
    job_repo.update_job(job)

if __name__ == "__main__":
   app.run(host='0.0.0.0',port=5001) 