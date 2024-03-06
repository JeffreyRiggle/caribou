use actix_web::{get, put, web, Responder, Result};
use rusqlite::Connection;
use super::models::{DomainData, DomainStatus, DomainsResponse};

#[get("/domains")]
async fn get_domains() -> Result<impl Responder> {
    let conn = Connection::open("../grepper.db").unwrap();
    let mut stmt = conn.prepare("SELECT * from domains").unwrap();
    let rows = stmt.query_map([], |row| {
        Ok(DomainData {
            domain: row.get(0)?,
            status: row.get(1)?,
            downloadAssets: row.get(2)?
        })
    }).unwrap();

    let mut result = Vec::new();
    for domain_result in rows {
        result.push(domain_result.unwrap());
    }

    Ok(web::Json(DomainsResponse {
        domains: result
    }))
}

#[put("/domains/{domain}/status")]
async fn update_domain_status(domain: web::Path<String>, update: web::Json<DomainStatus>) -> Result<impl Responder> { 
    let conn = Connection::open("../grepper.db").unwrap();
    let mut stmt = conn.prepare("UPDATE domains SET status = ?1 WHERE domain = ?2").unwrap();
    stmt.execute((update.status.clone(), domain.as_str())).unwrap();
    Ok(web::Json(DomainData {
        domain: String::from(domain.as_str()),
        status: String::from(&update.status),
        downloadAssets: String::from("")
    }))
}


