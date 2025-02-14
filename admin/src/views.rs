use std::collections::HashMap;

use actix_web::web::Redirect;
use actix_web::{get, post, put, web, HttpResponse, Responder};
use tera::{Context, Tera};
use lazy_static::lazy_static;

use crate::content::get_content_statuses;
use crate::dbaccess::get_database_connection;
use crate::performance::{bytes_to_display, get_average_css, get_average_html, get_average_js, get_last_run_time, get_max_css, get_max_html, get_max_js, get_total_pages, get_total_processed_pages, PerformancePageResult};
use crate::models::{ContentStatusUpdate, DomainData, DomainStatus, JobResponse};
use crate::apiclient::{proxy_get, proxy_post};

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
    context.insert("totalPages", &get_total_pages().unwrap_or(0));
    context.insert("processedPages", &get_total_processed_pages().unwrap_or(0));
    context.insert("lastRun", &get_last_run_time().unwrap_or(String::from("")));
    context.insert("maxJs", &get_max_js().unwrap_or(PerformancePageResult::default()));
    context.insert("averageJs", &bytes_to_display(get_average_js().unwrap_or(0)));
    
    context.insert("maxCss", &get_max_css().unwrap_or(PerformancePageResult::default()));
    context.insert("averageCss", &bytes_to_display(get_average_css().unwrap_or(0)));

    context.insert("maxHtml", &get_max_html().unwrap_or(PerformancePageResult::default()));
    context.insert("averageHtml", &bytes_to_display(get_average_html().unwrap_or(0)));

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
    let conn = get_database_connection().unwrap();
    let mut stmt = conn.prepare("UPDATE domains SET status = ?1 WHERE domain = ?2").unwrap();
    stmt.execute((update.status.clone(), domain.as_str())).unwrap();
    
    HttpResponse::Ok()
        .content_type("text/html; chartset=utf-8")
        .body("✓")
}

#[post("view/domains")]
async fn add_domain(add: web::Form<DomainData>) -> impl Responder { 
    let conn = get_database_connection().unwrap();
    let mut stmt = conn.prepare("INSERT INTO domains values(?1, ?2)").unwrap();
    stmt.execute((add.domain.clone(), add.status.clone())).unwrap();
    
    Redirect::to("../domain-management").see_other()
}

#[put("view/content/{content_type}/shouldDownload")]
async fn update_download_policy(content_type: web::Path<String>, update: web::Form<ContentStatusUpdate>) -> HttpResponse { 
    let conn = get_database_connection().unwrap();
    let mut stmt = conn.prepare("UPDATE downloadPolicy SET download = ?1 WHERE contentType = ?2").unwrap();
    stmt.execute((update.download.clone(), content_type.as_str())).unwrap();
    
    HttpResponse::Ok()
        .content_type("text/html; chartset=utf-8")
        .body("✓")
}

#[get("/configure")]
async fn get_configuration_page() -> HttpResponse {
    let mut context = Context::new();
    context.insert("contentStatuses", &get_content_statuses());

    let page = match TEMPLATES.render("settings.html", &context) {
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

#[get("/jobs")]
async fn get_jobs_page() -> HttpResponse {
    let mut context = Context::new();
    let jobs = match proxy_get::<HashMap<String, JobResponse>>("http://127.0.0.1:5000/jobs").await {
        Ok(jobs) => jobs,
        Err(e) => {
            println!("Failed to get jobs {}", e);
            HashMap::<String, JobResponse>::new()
        }
    };
    let mut jobs_list = jobs.values().cloned().collect::<Vec<JobResponse>>();
    jobs_list.sort_by(|a, b| a.start_time.partial_cmp(&b.start_time).unwrap());
    context.insert("jobs", &jobs_list);

    let page = match TEMPLATES.render("jobs.html", &context) {
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

#[post("view/execute-job")]
async fn start_job() -> impl Responder { 
    match proxy_post::<JobResponse>("http://127.0.0.1:5000/execute").await {
        Ok(job) => {
            println!("Created job: {job:#?}")
        },
        Err(e) => {
            println!("Failed to create job: {}", e)
        }
    }
    Redirect::to("../jobs").see_other()
}

