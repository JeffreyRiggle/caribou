use rusqlite::{Connection, Error};

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
