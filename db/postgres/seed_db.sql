CREATE TABLE IF NOT EXISTS resources(
    url TEXT PRIMARY KEY,
    path TEXT,
    contentType TEXT,
    lastIndex NUMERIC,
    title TEXT,
    summary TEXT,
    description TEXT,
    status TEXT,
    headers TEXT,
    expires NUMERIC
);

CREATE TABLE IF NOT EXISTS domains(
    domain TEXT PRIMARY KEY,
    status TEXT
);

CREATE TABLE IF NOT EXISTS metadata(
    url TEXT PRIMARY KEY,
    jsBytes NUMERIC,
    htmlBytes NUMERIC,
    cssBytes NUMERIC,
    compressed TEXT
);

CREATE TABLE IF NOT EXISTS perf(
    url TEXT,
    appTime NUMERIC,
    networkTime NUMERIC
);

CREATE TABLE IF NOT EXISTS rank(
    url TEXT PRIMARY KEY,
    pageRank NUMERIC
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

INSERT INTO downloadPolicy values('image', 1);
INSERT INTO downloadPolicy values('javascript', 1);
INSERT INTO downloadPolicy values('css', 1);
INSERT INTO downloadPolicy values('data', 1);
INSERT INTO downloadPolicy values('audio', 1);
INSERT INTO downloadPolicy values('font', 1);