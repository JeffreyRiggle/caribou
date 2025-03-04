use crate::{dbaccess::{PostgresConnection, SQLiteConnection}, models::{DomainData, DomainStatus}};

pub trait DomainRepository {
    fn get_domains(&mut self) -> Vec<DomainData>;
    fn set_domain_status(&mut self, domain: String, update: DomainStatus) -> DomainData;
    fn add_domain(&mut self, domain: DomainData);
}

impl DomainRepository for SQLiteConnection {
    fn get_domains(&mut self) -> Vec<DomainData> {
        let conn = &self.connection;
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

    fn set_domain_status(&mut self, domain: String, update: DomainStatus) -> DomainData {
        let conn = &self.connection;
        let mut stmt = conn.prepare("UPDATE domains SET status = ?1 WHERE domain = ?2").unwrap();
        stmt.execute((update.status.clone(), domain.as_str())).unwrap();
        DomainData {
            domain: String::from(domain.as_str()),
            status: String::from(&update.status)
        }
    }

    fn add_domain(&mut self, domain: DomainData) {
        let conn = &self.connection;
        let mut stmt = conn.prepare("INSERT INTO domains values(?1, ?2)").unwrap();
        stmt.execute((domain.domain, domain.status)).unwrap();
    }
}


impl DomainRepository for PostgresConnection {
    fn get_domains(&mut self) -> Vec<DomainData> {
        let mut result: Vec<DomainData> = Vec::new();
        for row in self.client.query("SELECT * from domains WHERE domain IS NOT NULL", &[]).unwrap() {
            result.push(DomainData {
                domain: row.get(0),
                status: row.get(1)
            });
        }
    
        result
    }
    
    fn set_domain_status(&mut self, domain: String, update: DomainStatus) -> DomainData {
        self.client.execute("UPDATE domains SET status = $1 WHERE domain = $2", &[&update.status.clone(), &domain.as_str()]).unwrap();
        DomainData {
            domain: String::from(domain.as_str()),
            status: String::from(&update.status)
        }
    }
    
    fn add_domain(&mut self, domain: DomainData) {
        self.client.execute("INSERT INTO domains values($1, $2)", &[&domain.domain.clone(), &domain.status.as_str()]).unwrap();
    }
}