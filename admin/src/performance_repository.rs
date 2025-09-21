
use rusqlite::Error;

use crate::dbaccess::{PostgresConnection, SQLiteConnection};
use crate::performance_model::PerformancePageResult;
use crate::utils::{bytes_to_display, format_time};

pub trait PerformanceRepository {
    fn get_total_pages(&mut self) -> Result<i64, Error>;
    fn get_total_processed_pages(&mut self) -> Result<i64, Error>;
    fn get_last_run_time(&mut self) -> Result<String, Error>;
    fn get_max_js(&mut self) -> Result<PerformancePageResult, Error>;
    fn get_average_js(&mut self) -> Result<f64, Error>;
    fn get_max_css(&mut self) -> Result<PerformancePageResult, Error>;
    fn get_average_css(&mut self) -> Result<f64, Error>;
    fn get_max_html(&mut self) -> Result<PerformancePageResult, Error>;
    fn get_average_html(&mut self) -> Result<f64, Error>;
}

impl PerformanceRepository for SQLiteConnection {
    fn get_total_pages(&mut self) -> Result<i64, Error> {
        let conn = &self.connection;
        let mut stmt = conn.prepare("SELECT COUNT(*) FROM resources").unwrap();
        stmt.query_row([], |row| row.get(0))
    }

    fn get_total_processed_pages(&mut self) -> Result<i64, Error> {
        let conn = &self.connection;
        let mut stmt = conn.prepare("SELECT COUNT(*) FROM resources WHERE status = 'Processed'").unwrap();
        stmt.query_row([], |row| row.get(0))
    }

    fn get_last_run_time(&mut self) -> Result<String, Error> {
        let conn = &self.connection;
        let mut stmt = conn.prepare("SELECT MIN(lastIndex) from resources").unwrap();
    
        stmt.query_row([], |row| {
            match row.get(0) {
                Ok(v) => Ok(format_time(v)),
                Err(e) => Err(e)
            }
        })
    }

    fn get_max_js(&mut self) -> Result<PerformancePageResult, Error> {
        get_max_resource_sqlite(self,"jsBytes")
    }

    fn get_average_js(&mut self) -> Result<f64, Error> {
        let conn = &self.connection;
        let mut stmt = conn.prepare("SELECT AVG(jsBytes) from metadata").unwrap();
        stmt.query_row([], |row| row.get(0))
    }

    fn get_max_css(&mut self) -> Result<PerformancePageResult, Error> {
        get_max_resource_sqlite(self, "cssBytes")
    }

    fn get_average_css(&mut self) -> Result<f64, Error> {
        let conn = &self.connection;
        let mut stmt = conn.prepare("SELECT AVG(cssBytes) from metadata").unwrap();
        stmt.query_row([], |row| row.get(0))
    }

    fn get_max_html(&mut self) -> Result<PerformancePageResult, Error> {
        get_max_resource_sqlite(self, "htmlBytes")
    }

    fn get_average_html(&mut self) -> Result<f64, Error> {
        let conn = &self.connection;
        let mut stmt = conn.prepare("SELECT AVG(htmlBytes) from metadata").unwrap();
        stmt.query_row([], |row| row.get(0))
    }
}

impl PerformanceRepository for PostgresConnection {
    fn get_total_pages(&mut self) -> Result<i64, Error> {
        Ok(self.client.query_one("SELECT COUNT(*) FROM resources", &[]).unwrap().get(0))
    }

    fn get_total_processed_pages(&mut self) -> Result<i64, Error> {
        Ok(self.client.query_one("SELECT COUNT(*) FROM resources WHERE status = 'Processed'", &[]).unwrap().get(0))
    }

    fn get_last_run_time(&mut self) -> Result<String, Error> {
        let run_time = self.client.query_one("SELECT MIN(lastIndex) from resources", &[]).unwrap().get(0);
        Ok(format_time(run_time))
    }

    fn get_max_js(&mut self) -> Result<PerformancePageResult, Error> {
        get_max_resource_postgres(self, "jsBytes")
    }

    fn get_average_js(&mut self) -> Result<f64, Error> {
        Ok(self.client.query_one("SELECT AVG(jsBytes) from metadata", &[]).unwrap().get(0))
    }

    fn get_max_css(&mut self) -> Result<PerformancePageResult, Error> {
        get_max_resource_postgres(self, "cssBytes")
    }

    fn get_average_css(&mut self) -> Result<f64, Error> {
        Ok(self.client.query_one("SELECT AVG(cssBytes) from metadata", &[]).unwrap().get(0))
    }

    fn get_max_html(&mut self) -> Result<PerformancePageResult, Error> {
        get_max_resource_postgres(self, "htmlBytes")
    }

    fn get_average_html(&mut self) -> Result<f64, Error> {
        Ok(self.client.query_one("SELECT AVG(htmlBytes) from metadata", &[]).unwrap().get(0))
    }
}

fn get_max_resource_sqlite(connection: &mut SQLiteConnection, resource: &str) -> Result<PerformancePageResult, Error> {
    let conn = &connection.connection;
    let mut stmt = conn.prepare(format!("SELECT max({}), url from metadata", resource).as_str()).unwrap();
    stmt.query_row([], |row| {
        match (row.get::<usize, f64>(0), row.get(1)) {
            (Ok(bytes_value), Ok(url_value)) => {
                Ok(PerformancePageResult { bytes: bytes_value.clone(), url: url_value, display_bytes: bytes_to_display(bytes_value) })
            },
            _ => Err(Error::InvalidQuery)
        }
    })
}

fn get_max_resource_postgres(connection: &mut PostgresConnection, resource: &str) -> Result<PerformancePageResult, Error> {
    let row = connection.client.query_one(format!("SELECT max({}) as maxBytes, url from metadata group by url order by maxBytes desc limit 1", resource).as_str(), &[]).unwrap();
    let bytes_value: f64 = row.get(0);
    Ok(PerformancePageResult {
        bytes: bytes_value.clone(),
        url: row.get(1),
        display_bytes: bytes_to_display(bytes_value)
    })
}
