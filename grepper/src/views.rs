use std::env;

use actix_web::{get, web, HttpResponse};
use base64::prelude::*;
use r2d2::Pool;
use tera::{Context, Tera};
use lazy_static::lazy_static;

use crate::{asset_processor::process_asset, dbaccess::DbConfig, models::QueryRequest};

lazy_static! {
    pub static ref TEMPLATES: Tera = {
        let template_dir = match env::var("TEMPLATE_DIR") {
            Ok(dir) => dir,
            Err(_) => "templates/**/*".to_string()
        };
        let tera = match Tera::new(&template_dir) {
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

#[get("/page-details/{base64_url}")]
async fn get_page_details(pool: web::Data<Pool<DbConfig>>, base64_url: web::Path<String>) -> HttpResponse {
    let context= web::block(move || {
        let mut context = Context::new();
        let mut repository = pool.get().expect("Couldn't get connection from pool");
        let target_url = String::from_utf8(BASE64_STANDARD.decode(base64_url.as_str().replace("%2F", "/")).unwrap()).unwrap();
        let results = repository.get_assets(target_url.clone());
        context.insert("assets", &results.assets);
        context.insert("targetUrl", &target_url);
        context
    }).await.unwrap();

    let page = match TEMPLATES.render("page-details.html", &context) {
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

#[get("/asset-details/{base64_url}")]
async fn get_asset_details(pool: web::Data<Pool<DbConfig>>, base64_url: web::Path<String>) -> HttpResponse {
    let url = String::from_utf8(BASE64_STANDARD.decode(base64_url.as_str().replace("%2F", "/")).unwrap()).unwrap();
    let context = web::block(move || {
        let mut context = Context::new();
        let mut repository = pool.get().expect("Couldn't get connection from pool");
        let page_details = repository.get_page_data(url.clone());
        let asset_details = process_asset(page_details).unwrap();
        context.insert("assetDetails", &asset_details);
        context.insert("targetUrl", &url);
        context
    }).await.unwrap();

    let page = match TEMPLATES.render("asset-details.html", &context) {
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
