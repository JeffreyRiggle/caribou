from core.crawler import Crawler
from core.dbaccess import DBAccess
from core.policy import PolicyManager
from core.ranker import Ranker
from jobs.job import Job
from concurrent.futures import ThreadPoolExecutor
from flask import Flask, jsonify
import typing

executor = ThreadPoolExecutor(1)

jobs: typing.Dict[str, Job] = {}
db = DBAccess()
db.setup()

policy_manager = PolicyManager(db)

app = Flask(__name__)

@app.route("/execute")
def execute():
    job = Job()
    jobs[str(job.id)] = job
    executor.submit(run_job, job)
    return jsonify(job.to_dict()), 201

@app.route("/status/<job_id>")
def status(job_id):
    job = jobs.get(job_id)

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
