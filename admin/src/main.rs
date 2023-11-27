use actix_web::{get, App, HttpResponse, HttpServer, Responder};
use rusqlite::{Connection};

#[derive(Debug)]
struct DomainData {
    domain: String,
    status: String,
    downloadAssets: String,
}

#[get("/domains")]
async fn get_domains() -> impl Responder {
    let conn = Connection::open("../grepper.db").unwrap();
    let mut stmt = conn.prepare("SELECT * from domains").unwrap();
    let result = stmt.query_map([], |row| {
        Ok(DomainData {
            domain: row.get(0)?,
            status: row.get(1)?,
            downloadAssets: row.get(2)?
        })
    }).unwrap();

    let mut result_str: String = "".to_owned();
    for domain in result {
        result_str.push_str(format!("{:?}", domain.unwrap()).as_str())
    }
    HttpResponse::Ok().body(result_str)
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
