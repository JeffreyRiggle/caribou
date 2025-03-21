use actix_web::{get, web::{self, Json}, Responder, Result};
use base64::prelude::*;
use r2d2::Pool;

use crate::{asset_processor::process_asset, dbaccess::DbConfig, errors::ApiError, models::{AssetDetail, QueryRequest}};

#[get("/api/v1/graph")]
async fn query_graph_data(pool: web::Data<Pool<DbConfig>>, q: web::Query<QueryRequest>) -> Result<impl Responder> {
    let results = web::block(move || {
        let mut repository = pool.get().expect("Couldn't get connection from pool");
        repository.get_graph_results(q.into_inner().q)
    }).await.unwrap();

    Ok(web::Json(results))
}

#[get("/api/v1/graph/{base64_url}")]
async fn query_url_data(pool: web::Data<Pool<DbConfig>>, base64_url: web::Path<String>) -> Result<impl Responder> {
    let url = BASE64_STANDARD.decode(base64_url.as_str()).unwrap();
    let result = web::block(move || {
        let mut repository = pool.get().expect("Couldn't get connection from pool");
        repository.get_graph_result(String::from_utf8(url).unwrap())
    }).await.unwrap();
    Ok(web::Json(result))
}

#[get("/api/v1/{base64_url}/assets")]
async fn get_page_assets(pool: web::Data<Pool<DbConfig>>, base64_url: web::Path<String>) -> Result<impl Responder> {
    let url = BASE64_STANDARD.decode(base64_url.as_str()).unwrap();
    let result = web::block(move || {
        let mut repository = pool.get().expect("Couldn't get connection from pool");
        repository.get_assets(String::from_utf8(url).unwrap())
    }).await.unwrap();
    Ok(web::Json(result))
}

#[get("/api/v1/{base64_url}/details")]
async fn get_page_details(pool: web::Data<Pool<DbConfig>>, base64_url: web::Path<String>) -> Result<Json<AssetDetail>, ApiError> {
    let url = BASE64_STANDARD.decode(base64_url.as_str()).unwrap();
    let page_details = web::block(move || {
        let mut repository = pool.get().expect("Couldn't get connection from pool");
        repository.get_page_data(String::from_utf8(url).unwrap())
    }).await.unwrap();

    Ok(web::Json(process_asset(page_details).unwrap()))
}
