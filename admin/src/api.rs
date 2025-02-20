use actix_web::{get, put, web, Responder, Result};

use crate::{dbaccess::get_sqlite_database_connection, domain_repository::DomainRepository};

use super::models::{DomainStatus, DomainsResponse};

#[get("/domains")]
async fn handle_get_domains() -> Result<impl Responder> {
   let result = get_sqlite_database_connection().unwrap().get_domains();

    Ok(web::Json(DomainsResponse {
        domains: result
    }))
}

#[put("/domains/{domain}/status")]
async fn update_domain_status(domain: web::Path<String>, update: web::Json<DomainStatus>) -> Result<impl Responder> {
    Ok(web::Json(get_sqlite_database_connection().unwrap().set_domain_status(domain.to_string(), update.clone())))
}

