# caribou
Caribou is largely a prototype. This project is an attempt to better understand how to build an internet index and how to layer a primative search engine on top of that.

## Applications
This covers loosely the applications in this repository.

### Crawler API
This is a simple flask app that allows for the running of the crawler via scheduling jobs.

### Admin
The admin application is a general admin application that allows of the configuration of the crawler. This also houses some high level stats about the crawled content and allows you to invoke the crawler so long as the crawler server is running.

### Grepper
This is a search engine based on the results from the crawler. This has two modes a basic search engine look and an interactive star map for exploring the crawled content.

## Running
Currently this requires the management of a SQLite database and likely can only run on developer machines or in a setup where someone has the motivation to deploy the app and the database in a single container/instance.

### Running the crawler API
1. Change directories to `crawler`
2. Create a new python environment and install requirements
3. Run `flask --app app run`

### Running admin
1. Change directories to `admin`
2. Run `cargo run`

### Running grepper
1. Change directories to `grepper`
2. Run `cargo run`
