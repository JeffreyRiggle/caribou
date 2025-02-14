
use serde::Serialize;
use rusqlite::Error;

use crate::dbaccess::get_database_connection;
use crate::utils::format_time;

#[derive(Debug, Serialize)]
pub struct PerformancePageResult {
    pub bytes: u64,
    pub url: String,
    pub display_bytes: String,
}

impl PerformancePageResult {
    pub fn default() -> PerformancePageResult {
        PerformancePageResult {
            bytes: 0,
            url: String::from(""),
            display_bytes: String::from("N/A")
        }
    }
}

pub fn get_total_pages() -> Result<u32, Error> {
    let conn = get_database_connection().unwrap();
    let mut stmt = conn.prepare("SELECT COUNT(*) FROM resources").unwrap();
    stmt.query_row([], |row| row.get(0))
}

pub fn get_total_processed_pages() -> Result<u32, Error> {
    let conn = get_database_connection().unwrap();
    let mut stmt = conn.prepare("SELECT COUNT(*) FROM resources WHERE status = 'Processed'").unwrap();
    stmt.query_row([], |row| row.get(0))
}

pub fn get_last_run_time() -> Result<String, Error> {
    let conn = get_database_connection().unwrap();
    let mut stmt = conn.prepare("SELECT MIN(lastIndex) from resources").unwrap();

    stmt.query_row([], |row| {
        match row.get(0) {
            Ok(v) => Ok(format_time(v)),
            Err(e) => Err(e)
        }
    })
}

pub fn get_max_js() -> Result<PerformancePageResult, Error> {
    get_max_resource("jsBytes")
}

pub fn get_average_js() -> Result<u64, Error> {
    let conn = get_database_connection().unwrap();
    let mut stmt = conn.prepare("SELECT AVG(jsBytes) from metadata").unwrap();
    stmt.query_row([], |row| row.get(0))
}

pub fn get_max_css() -> Result<PerformancePageResult, Error> {
    get_max_resource("cssBytes")
}

pub fn get_average_css() -> Result<u64, Error> {
    let conn = get_database_connection().unwrap();
    let mut stmt = conn.prepare("SELECT AVG(cssBytes) from metadata").unwrap();
    stmt.query_row([], |row| row.get(0))
}

pub fn get_max_html() -> Result<PerformancePageResult, Error> {
    get_max_resource("htmlBytes")
}

fn get_max_resource(resource: &str) -> Result<PerformancePageResult, Error> {
    let conn = get_database_connection().unwrap();
    let mut stmt = conn.prepare(format!("SELECT max({}), url from metadata", resource).as_str()).unwrap();
    stmt.query_row([], |row| {
        match (row.get::<usize, u64>(0), row.get(1)) {
            (Ok(bytes_value), Ok(url_value)) => {
                Ok(PerformancePageResult { bytes: bytes_value.clone(), url: url_value, display_bytes: bytes_to_display(bytes_value) })
            },
            _ => Err(Error::InvalidQuery)
        }
    })
}

pub fn get_average_html() -> Result<u64, Error> {
    let conn = get_database_connection().unwrap();
    let mut stmt = conn.prepare("SELECT AVG(htmlBytes) from metadata").unwrap();
    stmt.query_row([], |row| row.get(0))
}

pub fn bytes_to_display(bytes: u64) -> String {
    if bytes < 1000u64 {
        return bytes.to_string() + "B";
    }

    if bytes < 1000000u64 {
        return (bytes as f64 / 1000f64).to_string() + "Kb";
    }

    if bytes < 1000000000u64 {
        return (bytes as f64 / 1000000f64).to_string() + "Mb";
    }

    (bytes / 1000000000u64).to_string() + "Gb"
}
