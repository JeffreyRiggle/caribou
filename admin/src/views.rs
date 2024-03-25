use actix_web::{get, HttpResponse, put, web};
use tera::{Context, Tera};
use lazy_static::lazy_static;
use rusqlite::Connection;

use crate::performance::{bytes_to_display, get_average_css, get_average_html, get_average_js, get_last_run_time, get_max_css, get_max_html, get_max_js, get_total_pages, get_total_processed_pages};
use crate::models::DomainStatus;

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
    let mut context = Context::new();
    context.insert("totalPages", &get_total_pages().unwrap());
    context.insert("processedPages", &get_total_processed_pages().unwrap());
    context.insert("lastRun", &get_last_run_time().unwrap());
    context.insert("maxJs", &get_max_js().unwrap());
    context.insert("averageJs", &bytes_to_display(get_average_js().unwrap()));
    
    context.insert("maxCss", &get_max_css().unwrap());
    context.insert("averageCss", &bytes_to_display(get_average_css().unwrap()));

    context.insert("maxHtml", &get_max_html().unwrap());
    context.insert("averageHtml", &bytes_to_display(get_average_html().unwrap()));

    let page = match TEMPLATES.render("performance.html", &context) {
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

#[put("view/domains/{domain}/status")]
async fn update_domain_status(domain: web::Path<String>, update: web::Form<DomainStatus>) -> HttpResponse { 
    let conn = Connection::open("../grepper.db").unwrap();
    let mut stmt = conn.prepare("UPDATE domains SET status = ?1 WHERE domain = ?2").unwrap();
    stmt.execute((update.status.clone(), domain.as_str())).unwrap();
    
    HttpResponse::Ok()
        .content_type("text/html; chartset=utf-8")
        .body("✓")
}

