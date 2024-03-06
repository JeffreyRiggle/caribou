use actix_web::{App, HttpServer};

mod views;
mod api;
mod models;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    HttpServer::new(|| {
        App::new()
            .service(api::get_domains)
            .service(api::update_domain_status)
            .service(views::get_page)
            .service(views::get_domain_management_page)
            .service(views::get_performance_page)
    })
    .bind(("127.0.0.1", 8080))?
    .run()
    .await
}
