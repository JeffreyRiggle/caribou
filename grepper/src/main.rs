use actix_web::{App, HttpServer};

mod views;
mod models;
mod api;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    HttpServer::new(|| {
        App::new()
            .service(views::get_page)
            .service(views::query_data)
            .service(views::get_graph_page)
            .service(views::query_graph_data)
    })
    .bind(("127.0.0.1", 4080))?
    .run()
    .await
}
