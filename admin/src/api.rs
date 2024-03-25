use actix_web::{get, put, web, Responder, Result};
use rusqlite::Connection;
use super::domain::get_domains;
use super::models::{DomainData, DomainStatus, DomainsResponse};

#[get("/domains")]
async fn handle_get_domains() -> Result<impl Responder> {
   let result = get_domains();

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

