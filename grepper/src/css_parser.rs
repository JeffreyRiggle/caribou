use cssparser::{ParseError, Parser, ParserInput, Token};
use std::collections::HashSet;

use crate::models::CssAssetDetails;

pub fn get_css_details(css_string: &str) -> CssAssetDetails {
    let mut input = ParserInput::new(css_string);
    let mut parser = Parser::new(&mut input);
    let mut attrs = HashSet::new();
    let mut selected = HashSet::new();
    let mut functions = HashSet::new();
    let mut external_links = HashSet::new();

    while let Ok(token) = parser.next() {
        match token {
            Token::CurlyBracketBlock => {
                let result: Result<_, ParseError<()>> = parser.parse_nested_block(|sub_parser| {
                    while let Ok(sub_token) = sub_parser.next() {
                        match sub_token {
                            Token::Ident(name) => {
                                attrs.insert(name.to_string());
                            },
                            Token::Function(func) => {
                                functions.insert(func.to_string());
                                if func.starts_with("url") {
                                    let sub_result: Result<_, ParseError<()>> = sub_parser.parse_nested_block(|fn_parser| {
                                        while let Ok(fn_token) = fn_parser.next() {
                                            match fn_token {
                                                Token::UnquotedUrl(url) => {
                                                    if url.starts_with("http") {
                                                        external_links.insert(url.to_string());
                                                    }
                                                },
                                                Token::QuotedString(qs) => {
                                                    if qs.starts_with("http") {
                                                        external_links.insert(qs.to_string());
                                                    }
                                                }
                                                _ => {}
                                            }
                                        }
                                        Ok({})
                                    });
                                    sub_result.unwrap();
                                }
                            }
                            _ => {}
                        }
                    }
                    Ok(())
                });
                result.unwrap();
            },
            Token::Ident(name) => {
                selected.insert(name.to_string());
            },
            Token::Function(func) => {
                functions.insert(func.to_string());
            },
            _ => {}
        }
    }

    CssAssetDetails {
        external_links: external_links.into_iter().collect(),
        attributes: attrs.into_iter().collect(),
        selected: selected.into_iter().collect(),
        functions: functions.into_iter().collect()
    }
}