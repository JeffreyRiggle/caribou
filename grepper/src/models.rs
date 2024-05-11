use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize)]
pub struct ResultData {
    pub url: String,
    pub description: String,
    pub summary: String,
}

#[derive(Debug, Serialize)]
pub struct ResultsResponse {
    pub results: Vec<ResultData>
}

#[derive(Debug, Serialize, Deserialize)]
pub struct QueryRequest {
    pub q: String,
}
