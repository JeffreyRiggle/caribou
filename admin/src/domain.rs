use crate::dbaccess::get_database_connection;

use super::models::DomainData;

pub fn get_domains() -> Vec<DomainData> {
    let conn = get_database_connection().unwrap();
    let mut stmt = conn.prepare("SELECT * from domains WHERE domain IS NOT NULL").unwrap();
    let rows = stmt.query_map([], |row| {
        Ok(DomainData {
            domain: row.get(0)?,
            status: row.get(1)?
        })
    }).unwrap();

    let mut result = Vec::new();
    for domain_result in rows {
        result.push(domain_result.unwrap());
    }

    result
}
