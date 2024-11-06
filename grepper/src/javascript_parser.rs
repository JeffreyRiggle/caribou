use swc_ecma_ast::*;
use swc_ecma_parser::{lexer::Lexer, EsSyntax, Parser, StringInput, Syntax};
use swc_ecma_visit::{Visit, VisitWith};

use crate::models::JavascriptAssetDetails;

struct PropertyFinder {
    window_properties: Vec<String>,
    document_properties: Vec<String>
}

impl Visit for PropertyFinder {
    fn visit_member_expr(&mut self, node: &MemberExpr) {
        if let Expr::Ident(Ident { sym, .. }) = &*node.obj {
            if sym == "window" {
                if let MemberProp::Ident(ident) = &node.prop {
                    self.window_properties.push(ident.sym.to_string());
                }
            }

            if sym == "document" {
                if let MemberProp::Ident(ident) = &node.prop {
                    self.document_properties.push(ident.sym.to_string());
                }
            }
        }
        node.visit_children_with(self); // Continue visiting child nodes
    }
}

pub fn get_js_details(js_string: &str) -> JavascriptAssetDetails {
    let lexer = Lexer::new(
        Syntax::Es(EsSyntax::default()),
        Default::default(),
        StringInput::new(js_string, swc_common::BytePos(0), swc_common::BytePos(0)),
        None,
    );

    let mut parser = Parser::new_from(lexer);

    let module = parser.parse_module().expect("Parsing failed");
    let mut finder = PropertyFinder { window_properties: Vec::new(), document_properties: Vec::new() };
    module.visit_with(&mut finder);

    JavascriptAssetDetails {
        window_props: finder.window_properties,
        document_props: finder.document_properties
    }
}