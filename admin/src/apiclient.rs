use std::fmt::Debug;

use serde::de::DeserializeOwned;

pub async fn proxy_get<TResponse>(url: &str) -> Result<TResponse, Box<dyn std::error::Error>> where TResponse: DeserializeOwned + Debug {
    let res = reqwest::get(url)
        .await?
        .json::<TResponse>()
        .await?;
    println!("{res:#?}");
    Ok(res)
}

pub async fn proxy_post<TResponse>(url: &str) -> Result<TResponse, Box<dyn std::error::Error>> where TResponse: DeserializeOwned + Debug {
    let client = reqwest::Client::new();
    let res = client.post(url)
        .send()
        .await?
        .json::<TResponse>()
        .await?;
    println!("{res:#?}");
    Ok(res)
}