use rusqlite::{Connection, Error};

pub struct PerformancePageResult {
    pub bytes: u64,
    pub url: String,
}

pub fn get_total_pages() -> Result<u32, Error> {
    let conn = match Connection::open("../grepper.db") {
        Ok(c) => c,
        Err(e) => {
            println!("Failed to create connection {}", e);
            panic!("Failed to connect to database")
        }
    };
    let mut stmt = conn.prepare("SELECT COUNT(*) FROM resources").unwrap();
    stmt.query_row([], |row| row.get(0))
}

pub fn get_total_processed_pages() -> Result<u32, Error> {
    let conn = match Connection::open("../grepper.db") {
        Ok(c) => c,
        Err(e) => {
            println!("Failed to create connection {}", e);
            panic!("Failed to connect to database")
        }
    };
    let mut stmt = conn.prepare("SELECT COUNT(*) FROM resources WHERE status = 'Processed'").unwrap();
    stmt.query_row([], |row| row.get(0))
}

pub fn get_last_run_time() -> Result<f64, Error> {
    let conn = match Connection::open("../grepper.db") {
        Ok(c) => c,
        Err(e) => {
            println!("Failed to create connection {}", e);
            panic!("Failed to connect to database")
        }
    };
    let mut stmt = conn.prepare("SELECT MIN(lastIndex) from resources").unwrap();
    stmt.query_row([], |row| row.get(0))
}

pub fn get_max_js() -> Result<PerformancePageResult, Error> {
    let conn = match Connection::open("../grepper.db") {
        Ok(c) => c,
        Err(e) => {
            println!("Failed to create connection {}", e);
            panic!("Failed to connect to database")
        }
    };
    let mut stmt = conn.prepare("SELECT max(jsBytes), url from metadata").unwrap();
    stmt.query_row([], |row| Ok(PerformancePageResult { bytes: row.get(0).unwrap(), url: row.get(1).unwrap() }))
}

pub fn get_average_js() -> Result<f64, Error> {
    let conn = match Connection::open("../grepper.db") {
        Ok(c) => c,
        Err(e) => {
            println!("Failed to create connection {}", e);
            panic!("Failed to connect to database")
        }
    };
    let mut stmt = conn.prepare("SELECT AVG(jsBytes) from metadata").unwrap();
    stmt.query_row([], |row| row.get(0))
}

pub fn get_max_css() -> Result<PerformancePageResult, Error> {
    let conn = match Connection::open("../grepper.db") {
        Ok(c) => c,
        Err(e) => {
            println!("Failed to create connection {}", e);
            panic!("Failed to connect to database")
        }
    };
    let mut stmt = conn.prepare("SELECT max(cssBytes), url from metadata").unwrap();
    stmt.query_row([], |row| Ok(PerformancePageResult { bytes: row.get(0).unwrap(), url: row.get(1).unwrap() }))
}

pub fn get_average_css() -> Result<f64, Error> {
    let conn = match Connection::open("../grepper.db") {
        Ok(c) => c,
        Err(e) => {
            println!("Failed to create connection {}", e);
            panic!("Failed to connect to database")
        }
    };
    let mut stmt = conn.prepare("SELECT AVG(cssBytes) from metadata").unwrap();
    stmt.query_row([], |row| row.get(0))
}

pub fn get_max_html() -> Result<PerformancePageResult, Error> {
    let conn = match Connection::open("../grepper.db") {
        Ok(c) => c,
        Err(e) => {
            println!("Failed to create connection {}", e);
            panic!("Failed to connect to database")
        }
    };
    let mut stmt = conn.prepare("SELECT max(htmlBytes), url from metadata").unwrap();
    stmt.query_row([], |row| Ok(PerformancePageResult { bytes: row.get(0).unwrap(), url: row.get(1).unwrap() }))
}

pub fn get_average_html() -> Result<f64, Error> {
    let conn = match Connection::open("../grepper.db") {
        Ok(c) => c,
        Err(e) => {
            println!("Failed to create connection {}", e);
            panic!("Failed to connect to database")
        }
    };
    let mut stmt = conn.prepare("SELECT AVG(htmlBytes) from metadata").unwrap();
    stmt.query_row([], |row| row.get(0))
}

