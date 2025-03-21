use std::collections::HashMap;

use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize)]
pub struct ResultData {
    pub id: String,
    pub url: String,
    pub description: String,
    pub summary: String,
    pub title: String,
    pub favicon: String
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
    pub id: String,
    pub url: String,
    pub bytes: u64,
    #[serde(rename="contentType")]
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
    #[serde(rename="contentType")]
    pub content_type: String 
}

#[derive(Debug, Serialize)]
pub struct CssAssetDetails {
    #[serde(rename="externalLinks")]
    pub external_links: Vec<String>,
    pub attributes: Vec<String>,
    pub selected: Vec<String>,
    #[serde(rename="selectedIds")]
    pub selected_ids: Vec<String>,
    #[serde(rename="selectedClasses")]
    pub selected_classes: Vec<String>,
    pub functions: Vec<String>
}

#[derive(Debug, Serialize)]
pub struct HtmlAssetDetails {
    #[serde(rename="externalLinks")]
    pub external_links: Vec<String>,
    pub nodes: HashMap<String, usize>,
    pub attributes: HashMap<String, usize>,
    pub ids: Vec<String>,
    pub classes: Vec<String>,
    #[serde(rename="inlineJavascriptDetails")]
    pub inline_javascript_details: Vec<JavascriptAssetDetails>
}

#[derive(Debug, Serialize)]
pub struct ImageAssetDetails {
    #[serde(rename="imageType")]
    pub image_type: String
}

#[derive(Debug, Serialize)]
pub struct JavascriptAssetDetails {
    #[serde(rename="windowProps")]
    pub window_props: Vec<String>,
    #[serde(rename="windowFunctions")]
    pub window_functions: Vec<String>,
    #[serde(rename="documentProps")]
    pub document_props: Vec<String>,
    #[serde(rename="documentFunctions")]
    pub document_functions: Vec<String>,
    pub strings: Vec<String>
}

#[derive(Debug, Serialize)]
pub enum AssetDetail {
    #[serde(rename="html")]
    Html(HtmlAssetDetails),
    #[serde(rename="css")]
    Css(CssAssetDetails),
    #[serde(rename="image")]
    Image(ImageAssetDetails),
    #[serde(rename="javascript")]
    Javascript(JavascriptAssetDetails)
}