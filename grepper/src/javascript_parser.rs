use std::collections::HashSet;

use swc_ecma_ast::*;
use swc_ecma_parser::{lexer::Lexer, EsSyntax, Parser, StringInput, Syntax};
use swc_ecma_visit::{Visit, VisitWith};

use crate::models::JavascriptAssetDetails;

struct PropertyFinder {
    window_properties: HashSet<String>,
    window_functions: HashSet<String>,
    document_properties: HashSet<String>,
    document_functions: HashSet<String>,
    strings: HashSet<String>,
    window_aliases: Vec<String>,
    document_aliases: Vec<String>
}

impl Visit for PropertyFinder {
    fn visit_member_expr(&mut self, node: &MemberExpr) {
        if let Expr::Ident(Ident { sym, .. }) = &*node.obj {
            if let MemberProp::Ident(ident) = &node.prop {
                if sym == "window" || self.window_aliases.contains(&sym.to_string()) {
                    self.window_properties.insert(ident.sym.to_string());
                }

                if sym == "document" || self.document_aliases.contains(&sym.to_string()) {
                    self.document_properties.insert(ident.sym.to_string());
                }
            }
        }
        node.visit_children_with(self);
    }

    fn visit_call_expr(&mut self, node: &CallExpr) {
        match &node.callee {
            Callee::Expr(expression) => {
                match &*expression.clone() {
                    Expr::Member(mem) => {
                        match &*mem.obj {
                            Expr::Ident(obj_ident) => {
                                match &mem.prop {
                                    MemberProp::Ident(prop_ident) => {
                                        if obj_ident.sym == "window" || self.window_aliases.contains(&obj_ident.sym.to_string()) {
                                            self.window_functions.insert(prop_ident.sym.to_string());
                                        }

                                        if obj_ident.sym == "document" || self.document_aliases.contains(&obj_ident.sym.to_string()) {
                                            self.document_functions.insert(prop_ident.sym.to_string());
                                        }
                                    },
                                    _ => {}
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
        self.strings.insert(node.value.to_string());
        node.visit_children_with(self);
    }

    fn visit_var_decl(&mut self, node: &VarDecl) {
        for decl in node.decls.clone() {
            match decl.init.clone() {
                Some(expr) => {
                    match &*expr.clone() {
                        Expr::Member(mem) => {
                            let is_document_property = match &mem.prop {
                                MemberProp::Ident(prop_ident) => {
                                    prop_ident.sym == "document"
                                },
                                _ => false
                            };

                            match &*mem.obj {
                                Expr::Ident(obj_ident) => {
                                    match decl.name {
                                        Pat::Ident(name_binding_ident) => {
                                            if obj_ident.sym == "window" && !is_document_property {
                                                self.window_aliases.push(name_binding_ident.id.sym.to_string());
                                            }

                                            if obj_ident.sym == "document" || is_document_property {
                                                self.document_aliases.push(name_binding_ident.id.sym.to_string());
                                            }
                                        },
                                        _ => {}
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

    match parser.parse_module() {
        Ok(module) => {
            let mut finder = PropertyFinder { 
                window_properties: HashSet::new(),
                document_properties: HashSet::new(),
                window_functions: HashSet::new(),
                document_functions: HashSet::new(),
                strings: HashSet::new(),
                window_aliases: Vec::new(),
                document_aliases: Vec::new()
            };
            module.visit_with(&mut finder);
        
            JavascriptAssetDetails {
                window_props: finder.window_properties.into_iter().collect(),
                document_props: finder.document_properties.into_iter().collect(),
                document_functions: finder.document_functions.into_iter().collect(),
                window_functions: finder.window_functions.into_iter().collect(),
                strings: finder.strings.into_iter().collect()
            }
        },
        Err(err) => {
            println!("Failed to parse model error {:?}. Origin javascript {:?}", err, js_string);
            JavascriptAssetDetails {
                window_props: Vec::new(),
                document_props: Vec::new(),
                document_functions: Vec::new(),
                window_functions: Vec::new(),
                strings: Vec::new()
            }
        }
    }
}