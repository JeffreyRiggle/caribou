CREATE TABLE IF NOT EXISTS jobs(
    id TEXT PRIMARY KEY,
    status TEXT,
    startTime NUMERIC,
    totalTime NUMERIC
);