use actix_web::{get, web, HttpResponse};
use tera::{Context, Tera};
use lazy_static::lazy_static;

use crate::{api::get_results, models::QueryRequest};

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

#[get("/query")]
async fn query_data(q: web::Query<QueryRequest>) -> HttpResponse {
    let results = get_results(q.into_inner().q);
    let mut context = Context::new();
    context.insert("results", &results.results);
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
