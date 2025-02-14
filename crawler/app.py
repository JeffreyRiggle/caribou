from core.crawler import Crawler
from core.dbaccess import DBAccess
from core.policy import PolicyManager
from core.ranker import Ranker
from jobs.job import Job
from jobs.job_respository import JobRepository
from concurrent.futures import ThreadPoolExecutor
from flask import Flask, jsonify
import typing

executor = ThreadPoolExecutor(1)

db = DBAccess()
db.setup()
db.run_migrations()

policy_manager = PolicyManager(db)
job_repo = JobRepository(db)

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
    job.start()
    job_repo.update_job(job)
    try:
        crawl = Crawler(db, policy_manager, job.start_time)
        crawl.load()
        crawl.crawl()

        ranker = Ranker(db)
        ranker.rank()
    except:
        job.fail()
        job_repo.update_job(job)
        return

    job.complete()
    job_repo.update_job(job)
