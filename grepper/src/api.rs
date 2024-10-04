use std::{collections::HashSet, fs};

use actix_web::{get, web::{self, Json}, Responder, Result};
use base64::prelude::*;
use select::{document::Document, predicate::{Any, Name}};

use crate::{errors::ApiError, models::{HtmlAssetDetails, QueryRequest}, repository::{get_assets, get_graph_result, get_graph_results, get_page_data}};

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

#[get("/api/v1/{base64_url}/details")]
async fn get_page_details(base64_url: web::Path<String>) -> Result<Json<HtmlAssetDetails>, ApiError> {
    let url = BASE64_STANDARD.decode(base64_url.as_str()).unwrap();
    let page_details = get_page_data(String::from_utf8(url).unwrap());

    if page_details.content_type != "html" {
        return Err(ApiError::InvalidContentType)
    }

    let html_string = fs::read_to_string(page_details.path.clone()).unwrap();
    let mut links = HashSet::new();
    Document::from(html_string.as_str())
        .find(Name("a"))
        .filter_map(|n| n.attr("href"))
        .for_each(|x| {
            links.insert(String::from(x));
        });

    let mut used_nodes = HashSet::new();
    Document::from(html_string.as_str())
        .find(Any)
        .filter_map(|n| n.name())
        .for_each(|x| {
            used_nodes.insert(String::from(x));
        });

     let mut ids = HashSet::new();
     Document::from(html_string.as_str())
         .find(Any)
         .filter_map(|n| n.attr("id"))
         .for_each(|x| {
            ids.insert(String::from(x));
         });

     let mut classes = HashSet::new();
     Document::from(html_string.as_str())
         .find(Any)
         .filter_map(|n| n.attr("class"))
         .for_each(|x| {
            for class in x.split(' ') {
                classes.insert(String::from(class));
            }
         });

    Ok(web::Json(HtmlAssetDetails {
        links: links.into_iter().collect(),
        nodes: used_nodes.into_iter().collect(),
        ids: ids.into_iter().collect(),
        classes: classes.into_iter().collect()
    }))
}
