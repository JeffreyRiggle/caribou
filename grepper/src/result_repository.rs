use std::env;
use std::fs;
use base64::prelude::*;
use rusqlite::params;
use crate::{dbaccess::{PostgresConnection, SQLiteConnection}, models::{AssetResult, DBAsset, GraphResult, GraphResultReponse, PageAssets}};

use super::models::{ResultsResponse, ResultData};

pub trait ResultRepository {
    fn get_results(&mut self, query: String) -> ResultsResponse;
    fn get_graph_result(&mut self, url: String) -> GraphResult;
    fn get_graph_results(&mut self, query: String) -> GraphResultReponse;
    fn get_assets(&mut self, url: String) -> PageAssets;
    fn get_page_data(&mut self, url: String) -> DBAsset;
}

impl ResultRepository for SQLiteConnection {
    fn get_results(&mut self, query: String) -> ResultsResponse {
        let mut stmt = self.connection.prepare("WITH res as (SELECT * FROM resources JOIN rank ON rank.url = resources.url WHERE Status = 'Processed' AND contentType = 'html' AND (summary LIKE ?1 OR description LIKE ?1) ORDER BY pageRank DESC) SELECT url, title, summary, description FROM res").unwrap();
        let rows = stmt.query_map(params![format!("%{}%", query)], |row| {
            let url: String = row.get(0)?;
            Ok(ResultData {
                id: BASE64_STANDARD.encode(url.as_str()).replace("/", "%2F"),
                url,
                title: row.get(1)?,
                description: row.get(2)?,
                summary: row.get(3)?,
                favicon: String::new()
            })
        }).unwrap();

        let mut result = Vec::new();
        for domain_result in rows {
            result.push(domain_result.unwrap());
        }

        ResultsResponse {
            results: result
        }
    }

    fn get_graph_result(&mut self, url: String) -> GraphResult {
        let mut stmt = self.connection.prepare("WITH res as (SELECT * FROM resources JOIN rank ON rank.url = resources.url WHERE resources.url=?1) SELECT url, title, summary, pageRank FROM res").unwrap();
        let mut rows = stmt.query_map(params![url.clone()], |row| {
            Ok(GraphResult {
                url: row.get(0)?,
                title: row.get(1)?,
                summary: row.get(2)?,
                rank: row.get(3)?,
                links: Vec::new()
            })

        }).unwrap();

        let row = match rows.next().unwrap() {
            Ok(r) => r,
            Err(e) => {
                println!("Failed to load row for {}", url);
                panic!("Failed to load row with error {}", e)
            }
        };

        let mut stmt = self.connection.prepare("SELECT sourceUrl, targetUrl FROM links WHERE sourceUrl=?1").unwrap();
        let mut link_rows = stmt.query(params![row.url.clone()]).unwrap();
        let mut target_links = Vec::new(); 
        while let Some(row) = link_rows.next().unwrap() {
            target_links.push(row.get(1).unwrap());
        }

        GraphResult {
            url: row.url,
            title: row.title,
            summary: row.summary,
            rank: row.rank,
            links: target_links
        }
    }

    fn get_graph_results(&mut self, query: String) -> GraphResultReponse {
        let mut stmt = self.connection.prepare("WITH res as (SELECT * FROM resources JOIN rank ON rank.url = resources.url WHERE Status = 'Processed' AND contentType = 'html' AND (summary LIKE ?1 OR description LIKE ?1) ORDER BY pageRank DESC) SELECT url, title, summary, pageRank FROM res limit 10").unwrap();
        let rows = stmt.query_map(params![format!("%{}%", query)], |row| {
            Ok(GraphResult {
                url: row.get(0)?,
                title: row.get(1)?,
                summary: row.get(2)?,
                rank: row.get(3)?,
                links: Vec::new()
            })
        }).unwrap();

        let mut result = Vec::new();
        for domain_result in rows {
            let dresult = domain_result.unwrap();
            let mut stmt = self.connection.prepare("SELECT sourceUrl, targetUrl FROM links WHERE sourceUrl=?1").unwrap();
            let mut link_rows = stmt.query(params![dresult.url.clone()]).unwrap();
            let mut target_links = Vec::new(); 
            while let Some(row) = link_rows.next().unwrap() {
                match row.get(1) {
                    Ok(link) => target_links.push(link),
                    _ => println!("Failed to process link row")
                };
            }
            result.push(GraphResult {
                url: dresult.url,
                title: dresult.title,
                summary: dresult.summary,
                rank: dresult.rank,
                links: target_links
            });
        }

        GraphResultReponse {
            results: result
        }
    }

    fn get_assets(&mut self, url: String) -> PageAssets {
        let root_path = env::var("CONTENT_PATH").unwrap_or("../contents".to_string());
        let mut stmt = self.connection.prepare("SELECT url, path, contentType from links JOIN resources ON links.targetUrl = resources.url WHERE links.sourceUrl = ?1  AND resources.contentType != 'html'").unwrap();
        let rows = stmt.query_map(params![url], |row| {
            Ok(DBAsset {
                url: row.get(0)?,
                path: row.get(1)?,
                content_type: row.get(2)?
            })

        }).unwrap();

        let mut resulting_assets = Vec::new();
        for row in rows {
            let resulting_row = row.unwrap();
            let target_path = format!("{root_path}/{}", resulting_row.path);
            let metadata = fs::metadata(target_path).unwrap();
            let file_size = metadata.len();

            resulting_assets.push(AssetResult {
                id: BASE64_STANDARD.encode(resulting_row.url.as_str()).replace("/", "%2F"),
                url: resulting_row.url,
                bytes: file_size,
                content_type: resulting_row.content_type
            })
        }

        PageAssets {
            assets: resulting_assets
        }
    }

    fn get_page_data(&mut self, url: String) -> DBAsset {
        let mut stmt = self.connection.prepare("select url, path, contentType from resources where url = ?1").unwrap();
        let mut rows = stmt.query_map(params![url], |row| {
            Ok(DBAsset {
                url: row.get(0)?,
                path: row.get(1)?,
                content_type: row.get(2)?
            })

        }).unwrap();

        rows.next().unwrap().unwrap_or(DBAsset { url: String::from(""), path: String::from(""), content_type: String::from("Error")})
    }
}

impl ResultRepository for PostgresConnection {
    fn get_results(&mut self, query: String) -> ResultsResponse {
        let mut result = Vec::new();
        let query_string = "
WITH res as (
	SELECT resources.url as url, resources.title, resources.summary, resources.description, favicon.url as favicon 
	FROM resources
	inner JOIN rank 
	ON rank.url = resources.url
	left join favicon
	on resources.url = favicon.documenturl
	WHERE Status = 'Processed'
	AND contentType = 'html' 
	AND (summary LIKE $1 OR description LIKE $1)
	ORDER BY pageRank desc
)
SELECT url, title, summary, description, favicon FROM res";

        for domain_result in self.client.query(query_string, &[&format!("%{}%", query)]).unwrap() {
            let optional_icon: Option<String> = domain_result.get(4);
            let favicon = match optional_icon {
                Some(v) => v,
                None => String::new()
            };
            let url: String = domain_result.get(0);
            result.push(ResultData {
                id: BASE64_STANDARD.encode(url.as_str()).replace("/", "%2F"),
                url,
                title: domain_result.get(1),
                description: domain_result.get(2),
                summary: domain_result.get(3),
                favicon: favicon
            });
        }

        ResultsResponse {
            results: result
        }
    }

    fn get_graph_result(&mut self, url: String) -> GraphResult {
        let query_string = "
WITH res as (
	SELECT resources.url, resources.title, resources.summary, rank.pagerank  
	FROM resources 
	JOIN rank 
	ON rank.url = resources.url 
	WHERE resources.url=$1
) SELECT url, title, summary, pageRank FROM res";

        let row = self.client.query_one(query_string, &[&url]).unwrap();
        let graph_result = GraphResult {
            url: row.get(0),
            title: row.get(1),
            summary: row.get(2),
            rank: row.get(3),
            links: Vec::new()
        };

        let mut target_links = Vec::new(); 
        for link_result in self.client.query("SELECT targetUrl FROM links WHERE sourceUrl=$1", &[&graph_result.url]).unwrap() {
            target_links.push(link_result.get(0));
        }

        GraphResult {
            url: graph_result.url,
            title: graph_result.title,
            summary: graph_result.summary,
            rank: graph_result.rank,
            links: target_links
        }
    }

    fn get_graph_results(&mut self, query: String) -> GraphResultReponse {
        let mut result = Vec::new();
        let query_string = "
WITH res as (
	SELECT resources.url, resources.title, resources.summary , rank.pagerank 
	FROM resources 
	JOIN rank 
	ON rank.url = resources.url 
	WHERE Status = 'Processed' 
	AND contentType = 'html' 
	AND (summary LIKE $1 OR description LIKE $1)
	ORDER BY pageRank desc
) 
SELECT url, title, summary, pageRank FROM res limit 10";

        for domain_result in self.client.query(query_string, &[&format!("%{}%", query)]).unwrap() {
            let dresult = GraphResult {
                url: domain_result.get(0),
                title: domain_result.get(1),
                summary: domain_result.get(2),
                rank: domain_result.get(3),
                links: Vec::new()
            };

            let mut target_links = Vec::new();
            for link in self.client.query("SELECT targetUrl FROM links WHERE sourceUrl=$1", &[&dresult.url]).unwrap() {
                target_links.push(link.get(0));
            }
            result.push(GraphResult {
                url: dresult.url,
                title: dresult.title,
                summary: dresult.summary,
                rank: dresult.rank,
                links: target_links
            });
        }

        GraphResultReponse {
            results: result
        }
    }

    fn get_assets(&mut self, url: String) -> PageAssets {
        let root_path = env::var("CONTENT_PATH").unwrap_or("../contents".to_string());
        let mut resulting_assets = Vec::new();
        for row in self.client.query("SELECT url, path, contentType from links JOIN resources ON links.targetUrl = resources.url WHERE links.sourceUrl = $1  AND resources.contentType != 'html'", &[&url]).unwrap() {
            let resulting_row = DBAsset {
                url: row.get(0),
                path: row.get(1),
                content_type: row.get(2)
            };
            let target_path = format!("{root_path}/{}", resulting_row.path);
            let metadata = fs::metadata(target_path).unwrap();
            let file_size = metadata.len();

            resulting_assets.push(AssetResult {
                id: BASE64_STANDARD.encode(resulting_row.url.as_str()).replace("/", "%2F"),
                url: resulting_row.url,
                bytes: file_size,
                content_type: resulting_row.content_type
            })
        }

        PageAssets {
            assets: resulting_assets
        }
    }

    fn get_page_data(&mut self, url: String) -> DBAsset {
        let result= self.client.query_one("select url, path, contentType from resources where url = $1", &[&url]).unwrap();

        DBAsset {
            url: result.get(0),
            path: result.get(1),
            content_type: result.get(2)
        }
    }
}