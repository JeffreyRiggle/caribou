use serde::Serialize;
use rusqlite::{Connection, Error};

#[derive(Debug, Serialize)]
pub struct PerformancePageResult {
    pub bytes: u64,
    pub url: String,
    pub display_bytes: String,
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
    get_max_resource("jsBytes")
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
    get_max_resource("cssBytes")
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
    get_max_resource("htmlBytes")
}

fn get_max_resource(resource: &str) -> Result<PerformancePageResult, Error> {
    let conn = match Connection::open("../grepper.db") {
        Ok(c) => c,
        Err(e) => {
            println!("Failed to create connection {}", e);
            panic!("Failed to connect to database")
        }
    };
    let mut stmt = conn.prepare(format!("SELECT max({}), url from metadata", resource).as_str()).unwrap();
    stmt.query_row([], |row| Ok(PerformancePageResult { bytes: row.get(0).unwrap(), url: row.get(1).unwrap(), display_bytes: bytes_to_display(row.get(0).unwrap()) }))
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

pub fn bytes_to_display(bytes: f64) -> String {
    if bytes < 1000f64 {
        return bytes.to_string() + "B";
    }

    if bytes < 1000000f64 {
        return (bytes / 1000f64).to_string() + "Kb";
    }

    if bytes < 1000000000f64 {
        return (bytes / 1000000f64).to_string() + "Mb";
    }

    (bytes / 1000000000f64).to_string() + "Gb"
}
