use serde::{Serialize, Deserialize};

#[derive(Debug, Serialize)]
pub struct DomainData {
    pub domain: String,
    pub status: String,
    pub downloadAssets: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DomainStatus {
    pub status: String
}

#[derive(Serialize)]
pub struct DomainsResponse {
    pub domains: Vec<DomainData>
}


