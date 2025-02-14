use std::time::{Duration , UNIX_EPOCH};
use chrono::prelude::DateTime;
use chrono::Utc;

pub fn format_time(time: f64) -> String {
    let date = UNIX_EPOCH + Duration::from_secs_f64(time);
    let date_time = DateTime::<Utc>::from(date);
    date_time.format("%m-%d-%Y %H:%M:%S").to_string()
}

pub fn format_time_span(time: f64) -> String {
    let duration = Duration::from_secs_f64(time);
    let seconds = duration.as_secs() % 60;
    let minutes = (duration.as_secs() / 60) % 60;
    let hours = (duration.as_secs() / 60) / 60;
    format!("{}:{}:{}", hours, minutes, seconds)
}