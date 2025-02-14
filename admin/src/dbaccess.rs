use std::{fs, io::{Error, ErrorKind}};

use rusqlite::{Connection, OpenFlags};

pub fn get_database_connection() -> std::io::Result<Connection> {
    let conn: Result<Connection, Error> = match Connection::open_with_flags("../grepper.db", OpenFlags::SQLITE_OPEN_READ_WRITE) {
        Ok(c) => Ok(c),
        Err(_) => {
            match Connection::open("../grepper.db") {
                Ok(c) => {
                    let sql = fs::read_to_string("../db/seed_db.sql").expect("Unable to read initialization file");
                    match c.execute_batch(&sql) {
                        Ok(_) => Ok(c),
                        Err(_) => Err(Error::new(ErrorKind::Other, "failed to initialize database"))
                    }
                },
                Err(_) => {
                    Err(Error::new(ErrorKind::Other, "failed to create connection"))
                }
            }
        }
    };

   conn
}