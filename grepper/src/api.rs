use rusqlite::Connection;
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
