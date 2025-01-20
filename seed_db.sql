CREATE TABLE IF NOT EXISTS resources(
    url TEXT PRIMARY KEY,
    path TEXT,
    contentType TEXT,
    lastIndex NUM,
    title TEXT,
    summary TEXT,
    description TEXT,
    status TEXT,
    headers TEXT,
    expires NUM
);

CREATE TABLE IF NOT EXISTS domains(
    domain TEXT PRIMARY KEY,
    status TEXT
);

CREATE TABLE IF NOT EXISTS metadata(
    url TEXT PRIMARY KEY,
    jsBytes NUM,
    htmlBytes NUM,
    cssBytes NUM,
    compressed TEXT
);

CREATE TABLE IF NOT EXISTS perf(
    url TEXT,
    appTime NUM,
    networkTime NUM
);

CREATE TABLE IF NOT EXISTS rank(
    url TEXT PRIMARY KEY,
    pageRank NUM
);

CREATE TABLE IF NOT EXISTS links(
    sourceUrl TEXT,
    targetUrl TEXT,
    PRIMARY KEY (sourceUrl, targetUrl)
);

CREATE TABLE IF NOT EXISTS downloadPolicy(
    contentType TEXT PRIMARY KEY,
    download INTEGER
);

CREATE TABLE IF NOT EXISTS favicon(
    url TEXT,
    documentUrl TEXT,
    sizes TEXT,
    media TEXT,
    type TEXT,
    PRIMARY KEY(url, documentUrl)
);