use rusqlite::Connection;

use crate::models::ContentStatus;

pub fn get_content_statuses() -> Vec<ContentStatus> {
    let conn = match Connection::open("../grepper.db") {
        Ok(c) => c,
        Err(e) => {
            // TODO in this case return default value
            println!("Failed to create connection {}", e);
            panic!("Failed to connect to database")
        }
    };

    // TODO handle failures better
    let mut stmt = conn.prepare("SELECT * from downloadPolicy").unwrap();
    let rows = stmt.query_map([], |row| {
        Ok(ContentStatus {
            content_type: row.get(0)?,
            download: row.get(1)?
        })
    }).unwrap();

    let mut result = Vec::new();
    for content_result in rows {
        result.push(content_result.unwrap());
    }

    result
}