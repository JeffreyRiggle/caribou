use actix_web::{get, web, HttpResponse};
use r2d2::Pool;
use tera::{Context, Tera};
use lazy_static::lazy_static;

use crate::{dbaccess::DbConfig, models::QueryRequest};

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
    let page = match TEMPLATES.render("index.html", &Context::new()) {
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

#[get("/graph")]
async fn get_graph_page() -> HttpResponse {
    let page = match TEMPLATES.render("graph.html", &Context::new()) {
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

#[get("/query")]
async fn query_data(pool: web::Data<Pool<DbConfig>>, q: web::Query<QueryRequest>) -> HttpResponse {
    let context= web::block(move || {
        let mut context = Context::new();
        let mut repository = pool.get().expect("Couldn't get connection from pool");
        let results = repository.get_results(q.into_inner().q);
        context.insert("results", &results.results);
        context
    }).await.unwrap();

    let page = match TEMPLATES.render("result-list.html", &context) {
        Ok(p) => p.to_string(),
        Err(e) => {
            println!("Failed to load result list {}", e);
            "Failed to load".to_string()
        }
    };

    HttpResponse::Ok()
       .content_type("text/html; charset=utf-8")
       .body(page)
}
