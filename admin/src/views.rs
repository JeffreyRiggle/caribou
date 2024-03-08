use actix_web::{get, HttpResponse};
use tera::{Context, Tera};
use lazy_static::lazy_static;
use super::domain::get_domains;

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

#[get("/domain-management")]
async fn get_domain_management_page() -> HttpResponse {
    let mut context = Context::new();
    context.insert("domains", &get_domains());

    let page = match TEMPLATES.render("domains.html", &context) {
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

#[get("/performance")]
async fn get_performance_page() -> HttpResponse {
    let page = match TEMPLATES.render("performance.html", &Context::new()) {
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

