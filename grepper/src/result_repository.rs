use std::fs;

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
            Ok(ResultData {
                url: row.get(0)?,
                title: row.get(1)?,
                description: row.get(2)?,
                summary: row.get(3)?
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
        let mut stmt = self.connection.prepare("WITH res as (SELECT * FROM resources JOIN rank ON rank.url = resources.url WHERE Status = 'Processed' AND contentType = 'html' AND (summary LIKE ?1 OR description LIKE ?1) ORDER BY pageRank DESC) SELECT url, title, summary, pageRank FROM res").unwrap();
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
            let metadata = fs::metadata(resulting_row.path).unwrap();
            let file_size = metadata.len();

            resulting_assets.push(AssetResult {
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
        todo!()
    }

    fn get_graph_result(&mut self, url: String) -> GraphResult {
        todo!()
    }

    fn get_graph_results(&mut self, query: String) -> GraphResultReponse {
        todo!()
    }

    fn get_assets(&mut self, url: String) -> PageAssets {
        todo!()
    }

    fn get_page_data(&mut self, url: String) -> DBAsset {
        todo!()
    }
}