use std::env;

use actix_files as fs;
use actix_web::{web, App, HttpServer};
use dbaccess::{DbConfig, PostgresConfig};

mod asset_processor;
mod views;
mod models;
mod repository;
mod api;
mod errors;
mod html_parser;
mod css_parser;
mod javascript_parser;
mod dbaccess;
mod result_repository;

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
            .service(views::get_page)
            .service(views::query_data)
            .service(views::get_graph_page)
            .service(views::get_page_details)
            .service(views::get_asset_details)
            .service(api::query_graph_data)
            .service(api::query_url_data)
            .service(api::get_page_assets)
            .service(api::get_page_details)
    })
    .bind((address, 4080))?
    .run()
    .await
}
