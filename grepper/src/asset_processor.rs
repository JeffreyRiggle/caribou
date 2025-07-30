use crate::file_access::{FileAccess, FileAccessProvider};
use crate::{css_parser::get_css_details, errors::ApiError, html_parser::get_html_details, javascript_parser::get_js_details, models::{AssetDetail, DBAsset, ImageAssetDetails}};

pub async fn process_asset(page_details: DBAsset,  mut file_access: FileAccessProvider) -> Result<AssetDetail, ApiError> {
    if page_details.content_type == "css" {
        let css_string = file_access.read(page_details.path).await.unwrap();
        return Ok(AssetDetail::Css(get_css_details(css_string.as_str())));
    }

    if page_details.content_type == "image" {
        let extension_parts = page_details.path.split(".");
        return Ok(AssetDetail::Image(ImageAssetDetails { image_type: String::from(extension_parts.last().unwrap_or("")) }));
    }

    if page_details.content_type == "javascript" {
        let js_string = file_access.read(page_details.path).await.unwrap();
        return Ok(AssetDetail::Javascript(get_js_details(js_string.as_str())));
    }

    if page_details.content_type != "html" {
        return Err(ApiError::InvalidContentType)
    }

    let html_string = file_access.read(page_details.path).await.unwrap();
    Ok(AssetDetail::Html(get_html_details(html_string)))
}