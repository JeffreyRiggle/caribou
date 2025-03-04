use std::fs;

use actix_web::{get, web::{self, Json}, Responder, Result};
use base64::prelude::*;
use r2d2::Pool;

use crate::{css_parser::get_css_details, dbaccess::DbConfig, errors::ApiError, html_parser::get_html_details, javascript_parser::get_js_details, models::{AssetDetail, ImageAssetDetails, QueryRequest}};

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

    if page_details.content_type == "css" {
        let css_string = fs::read_to_string(page_details.path.clone()).unwrap();
        return Ok(web::Json(AssetDetail::Css(get_css_details(css_string.as_str()))));
    }

    if page_details.content_type == "image" {
        let extension_parts = page_details.path.split(".");
        return Ok(web::Json(AssetDetail::Image(ImageAssetDetails { image_type: String::from(extension_parts.last().unwrap_or("")) })))
    }

    if page_details.content_type == "javascript" {
        let js_string = fs::read_to_string(page_details.path.clone()).unwrap();
        return Ok(web::Json(AssetDetail::Javascript(get_js_details(js_string.as_str()))));
    }

    if page_details.content_type != "html" {
        return Err(ApiError::InvalidContentType)
    }

    let html_string = fs::read_to_string(page_details.path.clone()).unwrap();

    Ok(web::Json(AssetDetail::Html(get_html_details(html_string))))
}
