use actix_web::{get, put, web, Responder, Result};
use r2d2::Pool;

use super::models::{DomainStatus, DomainsResponse};
use super::dbaccess::DbConfig;

#[get("/domains")]
async fn handle_get_domains(pool: web::Data<Pool<DbConfig>>) -> Result<impl Responder> {
    let result = web::block(move || {
        let mut conn = pool.get().expect("Couldn't get connection from pool");
        conn.get_domains()
    }).await.unwrap();

    Ok(web::Json(DomainsResponse {
        domains: result
    }))
}

#[put("/domains/{domain}/status")]
async fn update_domain_status(pool: web::Data<Pool<DbConfig>>, domain: web::Path<String>, update: web::Json<DomainStatus>) -> Result<impl Responder> {
    let result = web::block(move || {
        let mut conn = pool.get().expect("Couldn't get connection from pool");
        conn.set_domain_status(domain.to_string(), update.clone())
    }).await.unwrap();
    
    Ok(web::Json(result))
}

