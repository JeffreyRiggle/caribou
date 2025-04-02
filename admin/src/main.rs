use std::env;

use actix_web::{web, App, HttpServer};
use dbaccess::{DbConfig, PostgresConfig};
use actix_files as fs;

mod views;
mod api;
mod models;
mod performance_repository;
mod content_repository;
mod dbaccess;
mod apiclient;
mod utils;
mod domain_repository;
mod performance_model;
mod repository;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    let config = match env::var("USE_POSTGRES") {
        Ok(_) => {
            DbConfig::Postgres(PostgresConfig { connection_string: env::var("DB_CONNECTION_STRING").expect("Failed to get postgres connection string") })
        },
        Err(_) => {
            DbConfig::Sqlite()
        }
    };

    let pool = r2d2::Pool::builder()
        .build(config)
        .expect("database URL should be valid path to SQLite DB file");

    let address = match env::var("PROD_BUILD") {
        Ok(_) => "0.0.0.0",
        Err(_) => "127.0.0.1"
    };

    println!("Starting app on address {:?}", address);

    let static_dir = match env::var("STATIC_DIR") {
        Ok(dir) => dir,
        Err(_) => "/static".to_string()
    };

    println!("Loading static assets from {:?}", static_dir);

    HttpServer::new(move || {
        App::new()
            .app_data(web::Data::new(pool.clone()))
            .service(fs::Files::new("/static", static_dir.as_str()).show_files_listing())
            .service(api::handle_get_domains)
            .service(api::update_domain_status)
            .service(views::get_page)
            .service(views::get_domain_management_page)
            .service(views::get_performance_page)
            .service(views::update_domain_status)
            .service(views::get_configuration_page)
            .service(views::update_download_policy)
            .service(views::add_domain)
            .service(views::get_jobs_page)
            .service(views::start_job)
    })
    .bind((address, 8080))?
    .run()
    .await
}