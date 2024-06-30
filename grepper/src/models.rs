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
    pub rank: f64
}

#[derive(Debug, Serialize)]
pub struct GraphResultReponse {
    pub results: Vec<GraphResult>
}
