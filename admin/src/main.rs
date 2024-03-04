use actix_web::{get, put, web, App, HttpResponse, HttpServer, Responder, Result};
use rusqlite::{Connection};
use serde::{Serialize, Deserialize};
use tera::{Context, Tera};
use lazy_static::lazy_static;

#[derive(Debug, Serialize)]
struct DomainData {
    domain: String,
    status: String,
    downloadAssets: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct DomainStatus {
    status: String
}

#[derive(Serialize)]
struct DomainsResponse {
    domains: Vec<DomainData>
}

lazy_static! {
    pub static ref TEMPLATES: Tera = {
         let tera = match Tera::new("templates/**/*") {
            Ok(t) => t,
            Err(e) => {
                println!("Parsing error {}!", e);
                ::std::process::exit(1);
            }
        };
        tera
    };
}

#[get("/")]
async fn get_page() -> HttpResponse {
    let mut context = Context::new();
    context.insert("test", "value");

    let page = match TEMPLATES.render("index.html", &context) {
        Ok(p) => p.to_string(),
        Err(e) => {
            println!("Failed to load page {}", e);
            "<html><body><h1>Internal Server Error</h1></body></html>".to_string()
        }
    };

    HttpResponse::Ok()
       .content_type("text/html; charset=utf-8")
       .body(page)
}

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

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    HttpServer::new(|| {
        App::new()
            .service(get_domains)
            .service(update_domain_status)
            .service(get_page)
    })
    .bind(("127.0.0.1", 8080))?
    .run()
    .await
}
