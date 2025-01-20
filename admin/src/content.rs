use crate::{dbaccess::get_database_connection, models::ContentStatus};

pub fn get_content_statuses() -> Vec<ContentStatus> {
    let conn = get_database_connection().unwrap();

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