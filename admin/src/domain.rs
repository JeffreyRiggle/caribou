use rusqlite::Connection;
use super::models::DomainData;

pub fn get_domains() -> Vec<DomainData> {
    let conn = match Connection::open("../grepper.db") {
        Ok(c) => c,
        Err(e) => {
            println!("Failed to create connection {}", e);
            panic!("Failed to connect to database")
        }
    };
    let mut stmt = conn.prepare("SELECT * from domains").unwrap();
    let rows = stmt.query_map([], |row| {
        Ok(DomainData {
            domain: row.get(0)?,
            status: row.get(1)?,
            downloadAssets: row.get(2)?
        })
    }).unwrap();

    let mut result = Vec::new();
    for domain_result in rows {
        result.push(domain_result.unwrap());
    }

    result
}
