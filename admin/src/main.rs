use actix_web::{App, HttpServer};

mod views;
mod api;
mod models;
mod domain;
mod performance;
mod content;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    HttpServer::new(|| {
        App::new()
            .service(api::handle_get_domains)
            .service(api::update_domain_status)
            .service(views::get_page)
            .service(views::get_domain_management_page)
            .service(views::get_performance_page)
            .service(views::update_domain_status)
            .service(views::get_configuration_page)
            .service(views::update_download_policy)
    })
    .bind(("127.0.0.1", 8080))?
    .run()
    .await
}
