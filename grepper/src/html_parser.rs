use std::collections::{HashMap, HashSet};
use select::{document::Document, predicate::{Any, Name}};
use crate::{css_parser::get_css_details, javascript_parser::get_js_details, models::HtmlAssetDetails};

pub fn get_html_details(html_string: String) -> HtmlAssetDetails {
    let mut external_links = HashSet::new();
    let document = Document::from(html_string.as_str());
    document.find(Any)
        .filter_map(|n| n.attr("href"))
        .for_each(|x| {
            if x.starts_with("http") {
                external_links.insert(String::from(x));
            }
        });

    document.find(Any)
        .filter_map(|n| n.attr("src"))
        .for_each(|x| {
            if x.starts_with("http") {
                external_links.insert(String::from(x));
            }
        });

    let mut used_nodes: HashMap<String, usize> = HashMap::new();
    document
    .find(Any)
    .filter_map(|n| n.name())
    .for_each(|x| {
        let val = used_nodes.get(&String::from(x)).unwrap_or(&0);
        
        used_nodes.insert(String::from(x), val + 1);
    });
    
    let mut used_attrs: HashMap<String, usize> = HashMap::new();
    document
        .find(Any)
        .filter_map(|n| Some(n.attrs()))
        .for_each(|attrs| {
            for attr in attrs {
                let val = used_attrs.get(&String::from(attr.0)).unwrap_or(&0);
                used_attrs.insert(String::from(attr.0), val + 1);
            }
        });

     let mut ids = HashSet::new();
     document
         .find(Any)
         .filter_map(|n| n.attr("id"))
         .for_each(|x| {
            ids.insert(String::from(x));
         });

     let mut classes = HashSet::new();
     document
         .find(Any)
         .filter_map(|n| n.attr("class"))
         .for_each(|x| {
            for class in x.split(' ') {
                classes.insert(String::from(class));
            }
         });
     let mut js_details = Vec::new();

     document
        .find(Name("script"))
        .for_each(|node| {
            if node.attr("src").is_some() {
                return
            }

            if node.attr("type").is_some_and(|t| !t.contains("javascript")) {
                return
            }

            let text = node.text();
            js_details.push(get_js_details(text.as_str()));
        });

    let mut css_details = Vec::new();

    document
        .find(Name("style"))
        .for_each(|node| {
            let text = node.text();
            css_details.push(get_css_details(text.as_str()));
        });

     HtmlAssetDetails {
        external_links: external_links.into_iter().collect(),
        nodes: used_nodes.into_iter().collect(),
        attributes: used_attrs.into_iter().collect(),
        ids: ids.into_iter().collect(),
        classes: classes.into_iter().collect(),
        inline_javascript_details: js_details,
        inline_css_details: css_details
    }
}