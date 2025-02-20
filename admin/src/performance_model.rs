use serde::Serialize;

#[derive(Debug, Serialize)]
pub struct PerformancePageResult {
    pub bytes: i64,
    pub url: String,
    pub display_bytes: String,
}

impl PerformancePageResult {
    pub fn default() -> PerformancePageResult {
        PerformancePageResult {
            bytes: 0,
            url: String::from(""),
            display_bytes: String::from("N/A")
        }
    }
}