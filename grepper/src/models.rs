use serde::Serialize;

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
