use actix_web::{get, App, web, Result, HttpServer, Responder};
use rusqlite::Connection;
use serde::Serialize;

#[derive(Debug, Serialize)]
struct DomainData {
    domain: String,
    status: String,
    download_assets: String,
}

#[derive(Serialize)]
struct DomainsResponse {
    domains: Vec<DomainData>
}

#[get("/domains")]
async fn get_domains() -> Result<impl Responder> {
    let conn = Connection::open("../grepper.db").unwrap();
    let mut stmt = conn.prepare("SELECT * from domains").unwrap();
    let rows = stmt.query_map([], |row| {
        Ok(DomainData {
            domain: row.get(0)?,
            status: row.get(1)?,
            download_assets: row.get(2)?
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

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    HttpServer::new(|| {
        App::new()
            .service(get_domains)
    })
    .bind(("127.0.0.1", 8080))?
    .run()
    .await
}
