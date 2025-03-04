use std::collections::HashMap;

use actix_web::web::Redirect;
use actix_web::{get, post, put, web, HttpResponse, Responder};
use r2d2::Pool;
use tera::{Context, Tera};
use lazy_static::lazy_static;

use crate::performance_model::PerformancePageResult;
use crate::models::{ContentStatusUpdate, DomainData, DomainStatus, JobDisplay, JobResponse, ToJobDisplay};
use crate::apiclient::{proxy_get, proxy_post};
use crate::utils::bytes_to_display;
use crate::dbaccess::DbConfig;

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
async fn get_domain_management_page(pool: web::Data<Pool<DbConfig>>) -> HttpResponse {
    let context = web::block(move || {
        let mut context = Context::new();
        let mut repository = pool.get().expect("Couldn't get connection from pool");
        context.insert("domains", &repository.get_domains());
        context
    }).await.unwrap();

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
async fn get_performance_page(pool: web::Data<Pool<DbConfig>>) -> HttpResponse {
    let context = web::block(move || {
        let mut context = Context::new();
        let mut repository = pool.get().expect("Couldn't get connection from pool");
        context.insert("totalPages", &repository.get_total_pages().unwrap_or(0));
        context.insert("processedPages", &repository.get_total_processed_pages().unwrap_or(0));
        context.insert("lastRun", &repository.get_last_run_time().unwrap_or(String::from("")));
        context.insert("maxJs", &repository.get_max_js().unwrap_or(PerformancePageResult::default()));
        context.insert("averageJs", &bytes_to_display(repository.get_average_js().unwrap_or(0f64)));
        
        context.insert("maxCss", &repository.get_max_css().unwrap_or(PerformancePageResult::default()));
        context.insert("averageCss", &bytes_to_display(repository.get_average_css().unwrap_or(0f64)));

        context.insert("maxHtml", &repository.get_max_html().unwrap_or(PerformancePageResult::default()));
        context.insert("averageHtml", &bytes_to_display(repository.get_average_html().unwrap_or(0f64)));
        context
    }).await.unwrap();

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
async fn update_domain_status(pool: web::Data<Pool<DbConfig>>, domain: web::Path<String>, update: web::Form<DomainStatus>) -> HttpResponse {
    web::block(move || {
        let mut repository = pool.get().expect("Couldn't get connection from pool");
        repository.set_domain_status(domain.to_string(), update.clone());
    }).await.unwrap();

    HttpResponse::Ok()
        .content_type("text/html; chartset=utf-8")
        .body("✓")
}

#[post("view/domains")]
async fn add_domain(pool: web::Data<Pool<DbConfig>>, add: web::Form<DomainData>) -> impl Responder {
    web::block(move || {
        let mut repository = pool.get().expect("Couldn't get connection from pool");
        repository.add_domain(add.clone());
    }).await.unwrap();
    Redirect::to("../domain-management").see_other()
}

#[put("view/content/{content_type}/shouldDownload")]
async fn update_download_policy(pool: web::Data<Pool<DbConfig>>, content_type: web::Path<String>, update: web::Form<ContentStatusUpdate>) -> HttpResponse { 
    web::block(move || {
        let mut repository = pool.get().expect("Couldn't get connection from pool");
        repository.set_content_status(content_type.to_string(), update.clone());
    }).await.unwrap();
    
    HttpResponse::Ok()
        .content_type("text/html; chartset=utf-8")
        .body("✓")
}

#[get("/configure")]
async fn get_configuration_page(pool: web::Data<Pool<DbConfig>>) -> HttpResponse {
    let context = web::block(move || {
        let mut context = Context::new();
        let mut repository = pool.get().expect("Couldn't get connection from pool");
        context.insert("contentStatuses", &repository.get_content_statuses());
        context
    }).await.unwrap();

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
    let mut jobs_list = jobs.values().map(|j| JobResponse::convert_to_job_display(j.clone())).collect::<Vec<JobDisplay>>();
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

