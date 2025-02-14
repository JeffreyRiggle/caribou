from core.crawler import Crawler
from core.dbaccess import DBAccess
from core.policy import PolicyManager
from core.ranker import Ranker
from jobs.job import Job
from concurrent.futures import ThreadPoolExecutor
from flask import Flask, jsonify
import typing

executor = ThreadPoolExecutor(1)

known_jobs: typing.Dict[str, Job] = {}

db = DBAccess()
db.setup()

policy_manager = PolicyManager(db)

app = Flask(__name__)

@app.get("/jobs")
def get_jobs():
    result: typing.Dict[str, str] = {}
    for key, value in known_jobs.items():
        result[key] = value.to_dict()

    return jsonify(result), 200

@app.post("/execute")
def execute_job():
    job = Job()
    known_jobs[str(job.id)] = job
    executor.submit(run_job, job)
    return jsonify(job.to_dict()), 201

@app.get("/status/<job_id>")
def get_job_status(job_id):
    job = known_jobs.get(job_id)

    if job == None:
        return jsonify({ "jobId": job_id }), 404

    return jsonify(job.to_dict()), 200

def run_job(job: Job):
    job.start()
    try:
        crawl = Crawler(db, policy_manager, job.start_time)
        crawl.load()
        crawl.crawl()

        ranker = Ranker(db)
        ranker.rank()
    except:
        job.fail()

    job.complete()
