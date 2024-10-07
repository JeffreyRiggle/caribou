use actix_files as fs;
use actix_web::{App, HttpServer};

mod views;
mod models;
mod repository;
mod api;
mod errors;
mod html_parser;
mod css_parser;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    HttpServer::new(|| {
        App::new()
            .service(fs::Files::new("/static", "./static").show_files_listing())
            .service(views::get_page)
            .service(views::query_data)
            .service(views::get_graph_page)
            .service(api::query_graph_data)
            .service(api::query_url_data)
            .service(api::get_page_assets)
            .service(api::get_page_details)
    })
    .bind(("127.0.0.1", 4080))?
    .run()
    .await
}
