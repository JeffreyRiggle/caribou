use crate::{dbaccess::{PostgresConnection, SQLiteConnection}, models::{ContentStatus, ContentStatusUpdate}};

pub trait ContentStatusRepository {
    fn get_content_statuses(&mut self) -> Vec<ContentStatus>;
    fn set_content_status(&mut self, content_type: String, update: ContentStatusUpdate);
}

impl ContentStatusRepository for SQLiteConnection {
    fn get_content_statuses(&mut self) -> Vec<ContentStatus> {
        let conn = &self.connection;

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

    fn set_content_status(&mut self, content_type: String, update: ContentStatusUpdate) {
        let conn = &self.connection;
        let mut stmt = conn.prepare("UPDATE downloadPolicy SET download = ?1 WHERE contentType = ?2").unwrap();
        stmt.execute((update.download.clone(), content_type.as_str())).unwrap();
    }
}

impl ContentStatusRepository for PostgresConnection {
    fn get_content_statuses(&mut self) -> Vec<ContentStatus> {
        // TODO handle failures better
        let mut result: Vec<ContentStatus> = Vec::new();
        for row in self.client.query("SELECT * from downloadPolicy", &[]).unwrap() {
            result.push(ContentStatus {
                content_type: row.get(0),
                download: row.get(1)
            });
        }
    
        result
    }
    
    fn set_content_status(&mut self, content_type: String, update: ContentStatusUpdate) {
        self.client.execute("UPDATE downloadPolicy SET download = ?1 WHERE contentType = ?2", &[&update.download.clone(), &content_type.as_str()]).unwrap();
    }
}