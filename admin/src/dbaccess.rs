use std::{fs, io::{Error, ErrorKind}};

use rusqlite::{Connection, OpenFlags};
use postgres::{Client, NoTls};
use r2d2::ManageConnection;

use crate::{repository::{Repository, RepositoryStatus}};

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

pub struct PostgresConfig {
    pub connection_string: String
}

pub enum DbConfig {
    Postgres(PostgresConfig),
    Sqlite()
}

impl RepositoryStatus for PostgresConnection {
    fn valid(&mut self) -> Result<(), Error> {
        match self.client.simple_query("").map(|_| ()) {
            Ok(_) => Ok(()),
            Err(_) => Err(Error::new(ErrorKind::Other, "connection is no longer valid"))
        }
    }

    fn broken(&mut self) -> bool {
        self.client.is_closed()
    }
}

impl Repository for PostgresConnection {}

impl RepositoryStatus for SQLiteConnection {
    fn valid(&mut self) -> Result<(), Error>{
        match self.connection.execute_batch("") {
            Ok(_) => Ok(()),
            Err(_) => Err(Error::new(ErrorKind::Other, "connection is no longer valid"))
        }
    }

    fn broken(&mut self) -> bool {
        false
    }
}

impl Repository for SQLiteConnection {}


impl ManageConnection for DbConfig
{
    type Connection = Box<dyn Repository>;

    type Error = Error;

    fn connect(&self) -> Result<Box<dyn Repository>, Self::Error> {
        match self {
            Self::Postgres(config) => {
                // TODO this could probably be better
                let connection = Client::connect(&config.connection_string, NoTls).unwrap();
                Ok(Box::new(PostgresConnection {
                    client: connection
                }))
            },
            Self::Sqlite() => {
                match get_sqlite_database_connection() {
                    Ok(conn) => {
                        Ok(Box::new(conn))
                    },
                    Err(err) => {
                        Err(err)
                    }
                }
            }
        }
    }

    fn is_valid(&self, conn: &mut Box<dyn Repository>) -> Result<(), Self::Error> {
        conn.valid()
    }

    fn has_broken(&self, conn: &mut Box<dyn Repository>) -> bool {
        conn.broken()
    }
}