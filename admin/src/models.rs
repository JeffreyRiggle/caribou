use serde::{Serialize, Deserialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DomainData {
    pub domain: String,
    pub status: String
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DomainStatus {
    pub status: String
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ContentStatusUpdate {
    pub download: bool
}

#[derive(Serialize)]
pub struct DomainsResponse {
    pub domains: Vec<DomainData>
}

#[derive(Serialize, Deserialize)]
pub struct ContentStatus {
    #[serde(rename="contentType")]
    pub content_type: String,
    pub download: bool
}

