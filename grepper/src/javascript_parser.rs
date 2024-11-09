use swc_ecma_ast::*;
use swc_ecma_parser::{lexer::Lexer, EsSyntax, Parser, StringInput, Syntax};
use swc_ecma_visit::{Visit, VisitWith};

use crate::models::JavascriptAssetDetails;

struct PropertyFinder {
    window_properties: Vec<String>,
    window_functions: Vec<String>,
    document_properties: Vec<String>,
    strings: Vec<String>,
    window_aliases: Vec<String>,
    document_aliases: Vec<String>
}

impl Visit for PropertyFinder {
    fn visit_member_expr(&mut self, node: &MemberExpr) {
        if let Expr::Ident(Ident { sym, .. }) = &*node.obj {
            if sym == "window" || self.window_aliases.contains(&sym.to_string()) {
                if let MemberProp::Ident(ident) = &node.prop {
                    self.window_properties.push(ident.sym.to_string());
                }
            }

            if sym == "document" || self.document_aliases.contains(&sym.to_string()) {
                if let MemberProp::Ident(ident) = &node.prop {
                    self.document_properties.push(ident.sym.to_string());
                }
            }
        }
        node.visit_children_with(self); // Continue visiting child nodes
    }

    fn visit_call_expr(&mut self, node: &CallExpr) {
        match &node.callee {
            Callee::Expr(expression) => {
                match &*expression.clone() {
                    Expr::Member(mem) => {
                        match &*mem.obj {
                            Expr::Ident(obj_ident) => {
                                if obj_ident.sym == "window" || self.window_aliases.contains(&obj_ident.sym.to_string()) {
                                    match &mem.prop {
                                        MemberProp::Ident(prop_ident) => {
                                            self.window_functions.push(prop_ident.sym.to_string())
                                        },
                                        _ => {}
                                    }
                                }
                            },
                            _ => {}
                        }
                    },
                    _ => {}
                }
            },
            _ => {}
        };
        node.visit_children_with(self);
    }

    fn visit_str(&mut self, node: &Str) {
        self.strings.push(node.value.to_string());
        node.visit_children_with(self);
    }

    fn visit_var_decl(&mut self, node: &VarDecl) {
        for decl in node.decls.clone() {
            match decl.init.clone() {
                Some(expr) => {
                    match &*expr.clone() {
                        Expr::Member(mem) => {
                            match &*mem.obj {
                                Expr::Ident(obj_ident) => {
                                    if obj_ident.sym == "window" {
                                        match decl.name {
                                            Pat::Ident(name_binding_ident) => {
                                                self.window_aliases.push(name_binding_ident.id.sym.to_string());
                                            },
                                            _ => {}
                                        }
                                    } else if obj_ident.sym == "document" {
                                        match decl.name {
                                            Pat::Ident(name_binding_ident) => {
                                                self.document_aliases.push(name_binding_ident.id.sym.to_string());
                                            },
                                            _ => {}
                                        }
                                    }
                                },
                                _ => {}
                            }
                        }
                        _ => {}
                    }
                },
                _ => {}
            }
        }
        node.visit_children_with(self);
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
    let mut finder = PropertyFinder { 
        window_properties: Vec::new(),
        document_properties: Vec::new(),
        window_functions: Vec::new(),
        strings: Vec::new(),
        window_aliases: Vec::new(),
        document_aliases: Vec::new()
    };
    module.visit_with(&mut finder);

    JavascriptAssetDetails {
        window_props: finder.window_properties,
        document_props: finder.document_properties,
        window_functions: finder.window_functions,
        strings: finder.strings
    }
}