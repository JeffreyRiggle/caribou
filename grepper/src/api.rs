use actix_web::{get, web, Result, Responder};
use base64::prelude::*;

use crate::{repository::{get_assets, get_graph_results, get_graph_result}, models::QueryRequest};

#[get("/api/v1/graph")]
async fn query_graph_data(q: web::Query<QueryRequest>) -> Result<impl Responder> {
    let results = get_graph_results(q.into_inner().q);

    Ok(web::Json(results))
}

#[get("/api/v1/graph/{base64_url}")]
async fn query_url_data(base64_url: web::Path<String>) -> Result<impl Responder> {
    let url = BASE64_STANDARD.decode(base64_url.as_str()).unwrap();
    let result = get_graph_result(String::from_utf8(url).unwrap());
    Ok(web::Json(result))
}

#[get("/api/v1/{base64_url}/assets")]
async fn get_page_assets(base64_url: web::Path<String>) -> Result<impl Responder> {
    let url = BASE64_STANDARD.decode(base64_url.as_str()).unwrap();
    let result = get_assets(String::from_utf8(url).unwrap());
    Ok(web::Json(result))
}