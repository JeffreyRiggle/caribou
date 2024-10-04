use actix_web::{error, http::{header::ContentType, StatusCode}, HttpResponse};
use derive_more::derive::{Display, Error};

#[derive(Debug, Display, Error)]
pub enum ApiError {
    #[display("Invalid content type used")]
    InvalidContentType,
}


impl error::ResponseError for ApiError {
    fn error_response(&self) -> HttpResponse {
        HttpResponse::build(self.status_code())
            .insert_header(ContentType::html())
            .body(self.to_string())
    }

    fn status_code(&self) -> StatusCode {
        match *self {
            ApiError::InvalidContentType => StatusCode::BAD_REQUEST,
        }
    }
}