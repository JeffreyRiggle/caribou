use serde::{Serialize, Deserialize};

use crate::utils::{format_time, format_time_span};

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

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct JobDisplay {
    pub id: String,
    pub status: JobStatus,
    #[serde(rename="startTime")]
    pub start_time: String,
    #[serde(rename="totalTime")]
    pub total_time: String
}

pub trait ToJobDisplay {
    fn convert_to_job_display(job: JobResponse) -> JobDisplay;
}

impl ToJobDisplay for JobResponse {
    fn convert_to_job_display(job: JobResponse) -> JobDisplay {
        JobDisplay {
            id: job.id,
            status: job.status,
            start_time: format_time(job.start_time),
            total_time: format_time_span(job.total_time)
        }
    }
}