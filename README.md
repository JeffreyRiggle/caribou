# caribou
Caribou is largely a prototype. This project is an attempt to better understand how to build an internet index and how to layer a primative search engine on top of that.

## In the wild
If you want to see the end result of this project see [caribou](http://caribou.ilusr.com)

## Applications
This covers loosely the applications in this repository.

### Crawler API
This is a simple flask app that allows for the running of the crawler via scheduling jobs.

### Admin
The admin application is a general admin application that allows of the configuration of the crawler. This also houses some high level stats about the crawled content and allows you to invoke the crawler so long as the crawler server is running.

### Grepper
This is a search engine based on the results from the crawler. This has two modes a basic search engine look and an interactive star map for exploring the crawled content.

## Running

### Using docker
You can run the full application in docker using docker compose. This assumes that you have a folder called `db_test` in the source directory. Depending on profile this will either use sqlite or postgres as the backing store.

#### Backed by sqlite
```sh
$ docker compose --profile sqlite-backed up --build
```

#### Backed by postgres
```sh
$ docker compose --profile postgres-backed up --build
```

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
