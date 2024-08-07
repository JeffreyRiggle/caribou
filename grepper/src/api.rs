use rusqlite::Connection;
use crate::models::{GraphResult, GraphResultReponse};

use super::models::{ResultsResponse, ResultData};

pub fn get_results(query: String) -> ResultsResponse {
    let conn = match Connection::open("../grepper.db") {
        Ok(c) => c,
        Err(e) => {
            println!("Failed to create connection {}", e);
            panic!("Failed to connect to database")
        }
    };
    
    let mut stmt = conn.prepare(format!("WITH res as (SELECT * FROM resources JOIN rank ON rank.url = resources.url WHERE Status = 'Processed' AND (summary LIKE '%{}%' OR description LIKE '%{}%') ORDER BY pageRank DESC) SELECT url, title, summary, description FROM res", query, query).as_str()).unwrap();
    let rows = stmt.query_map([], |row| {
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

pub fn get_graph_result(url: String) -> GraphResult {
    let conn = match Connection::open("../grepper.db") {
        Ok(c) => c,
        Err(e) => {
            println!("Failed to create connection {}", e);
            panic!("Failed to connect to database")
        }
    };

    let mut stmt = conn.prepare(format!("WITH res as (SELECT * FROM resources JOIN rank ON rank.url = resources.url WHERE resources.url='{}') SELECT url, title, summary, pageRank FROM res", url).as_str()).unwrap();
    let mut rows = stmt.query_map([], |row| {
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

    let mut stmt = conn.prepare(format!("SELECT sourceUrl, targetUrl FROM links WHERE sourceUrl='{}'", row.url).as_str()).unwrap();
    let mut link_rows = stmt.query([]).unwrap();
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

pub fn get_graph_results(query: String) -> GraphResultReponse {
    let conn = match Connection::open("../grepper.db") {
        Ok(c) => c,
        Err(e) => {
            println!("Failed to create connection {}", e);
            panic!("Failed to connect to database")
        }
    };
    
    let mut stmt = conn.prepare(format!("WITH res as (SELECT * FROM resources JOIN rank ON rank.url = resources.url WHERE Status = 'Processed' AND (summary LIKE '%{}%' OR description LIKE '%{}%') ORDER BY pageRank DESC) SELECT url, title, summary, pageRank FROM res", query, query).as_str()).unwrap();
    let rows = stmt.query_map([], |row| {
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
        let mut stmt = conn.prepare(format!("SELECT sourceUrl, targetUrl FROM links WHERE sourceUrl='{}'", dresult.url).as_str()).unwrap();
        let mut link_rows = stmt.query([]).unwrap();
        let mut target_links = Vec::new(); 
        while let Some(row) = link_rows.next().unwrap() {
            target_links.push(row.get(1).unwrap());
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

