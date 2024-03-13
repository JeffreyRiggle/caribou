use actix_web::{get, HttpResponse};
use tera::{Context, Tera};
use lazy_static::lazy_static;
use crate::performance::{get_average_css, get_average_html, get_average_js, get_last_run_time, get_max_css, get_max_html, get_max_js, get_total_pages, get_total_processed_pages};

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
    let max_js_result = get_max_js().unwrap();
    context.insert("maxJsSize", &bytes_to_display(max_js_result.bytes as f64));
    context.insert("maxJsResource", &max_js_result.url);
    context.insert("averageJs", &bytes_to_display(get_average_js().unwrap()));
    
    let max_css_result = get_max_css().unwrap();
    context.insert("maxCssSize", &bytes_to_display(max_css_result.bytes as f64));
    context.insert("maxCssResource", &max_css_result.url);
    context.insert("averageCss", &bytes_to_display(get_average_css().unwrap()));

    let max_html_result = get_max_html().unwrap();
    context.insert("maxHtmlSize", &bytes_to_display(max_html_result.bytes as f64));
    context.insert("maxHtmlResource", &max_html_result.url);
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

fn bytes_to_display(bytes: f64) -> String {
    if bytes < 1000f64 {
        return bytes.to_string() + "B";
    }

    if bytes < 1000000f64 {
        return (bytes / 1000f64).to_string() + "Kb";
    }

    if bytes < 1000000000f64 {
        return (bytes / 1000000f64).to_string() + "Mb";
    }

    (bytes / 1000000000f64).to_string() + "Gb"
}
