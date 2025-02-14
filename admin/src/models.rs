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

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct JobResponse {
    pub id: String,
    pub status: JobStatus,
    #[serde(rename="startTime")]
    pub start_time: f64,
    #[serde(rename="totalTime")]
    pub total_time: f64
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub enum JobStatus {
    Unknown,
    Queued,
    Running,
    Completed,
    Failed
}

impl Default for JobResponse {
    fn default() -> JobResponse {
        JobResponse {
            id: "".to_string(),
            status: JobStatus::Unknown,
            start_time: 0_f64,
            total_time: 0_f64
        }
    }
}