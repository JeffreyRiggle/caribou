CREATE TABLE IF NOT EXISTS jobs(
    id TEXT PRIMARY KEY,
    status TEXT,
    startTime DOUBLE PRECISION,
    totalTime DOUBLE PRECISION
);