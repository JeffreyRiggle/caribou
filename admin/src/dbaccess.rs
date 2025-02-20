use std::{fs, io::{Error, ErrorKind}};

use rusqlite::{Connection, OpenFlags};
use postgres::{Client, NoTls};

pub struct SQLiteConnection {
    pub connection: Connection
}

pub struct PostgresConnection {
    pub client: Client
}

pub fn get_sqlite_database_connection() -> std::io::Result<SQLiteConnection> {
    let conn: Result<SQLiteConnection, Error> = match Connection::open_with_flags("../grepper.db", OpenFlags::SQLITE_OPEN_READ_WRITE) {
        Ok(c) => Ok(SQLiteConnection{ connection: c }),
        Err(_) => {
            match Connection::open("../grepper.db") {
                Ok(c) => {
                    let sql = fs::read_to_string("../db/sqlite/seed_db.sql").expect("Unable to read initialization file");
                    match c.execute_batch(&sql) {
                        Ok(_) => Ok(SQLiteConnection { connection: c }),
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

pub fn get_postgres_database_connection() -> Result<PostgresConnection, ()> {
    // TODO read from environmental variable
    let mut result = match Client::connect("host=localhost user=postgres", NoTls) {
        Ok(mut client) => {
            let sql = fs::read_to_string("../db/postgres/seed_db.sql").expect("Unable to read initialization file");
            match client.batch_execute(&sql) {
                Ok(_) => Ok(PostgresConnection { client: client }),
                Err(_) => Err(())
            }
        },
        Err(_) => Err(())
    };
    
    result
}