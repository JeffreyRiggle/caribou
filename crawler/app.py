from flask import Flask

app = Flask(__name__)

# TODO import crawler and add crawl endpoint
@app.route("/")
def hello_world():
    return "<p>Hello, World!</p>"