use std::collections::HashMap;

use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize)]
pub struct ResultData {
    pub url: String,
    pub description: String,
    pub summary: String,
    pub title: String,
}

#[derive(Debug, Serialize)]
pub struct ResultsResponse {
    pub results: Vec<ResultData>
}

#[derive(Debug, Serialize, Deserialize)]
pub struct QueryRequest {
    pub q: String,
}

#[derive(Debug, Serialize)]
pub struct GraphResult {
    pub url: String,
    pub title: String,
    pub summary: String,
    pub rank: f64,
    pub links: Vec<String>
}

#[derive(Debug, Serialize)]
pub struct GraphResultReponse {
    pub results: Vec<GraphResult>
}

#[derive(Debug, Serialize)]
pub struct AssetResult {
    pub url: String,
    pub bytes: u64,
    pub content_type: String,
}

#[derive(Debug, Serialize)]
pub struct PageAssets {
    pub assets: Vec<AssetResult>
}

#[derive(Debug, Serialize)]
pub struct DBAsset {
    pub url: String,
    pub path: String,
    pub content_type: String 
}

#[derive(Debug, Serialize)]
pub struct HtmlAssetDetails {
    pub external_links: Vec<String>,
    pub nodes: HashMap<String, usize>,
    pub attributes: HashMap<String, usize>,
    pub ids: Vec<String>,
    pub classes: Vec<String>
}