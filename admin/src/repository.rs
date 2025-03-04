use std::io::Error;

use crate::{content_repository::ContentStatusRepository, domain_repository::DomainRepository, performance_repository::PerformanceRepository};

pub trait RepositoryStatus {
    fn valid(&mut self) -> Result<(), Error>;
    fn broken(& mut self) -> bool;
}

pub trait Repository: ContentStatusRepository + DomainRepository + PerformanceRepository + RepositoryStatus + Send {}