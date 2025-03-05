use std::io::Error;

use crate::result_repository::ResultRepository;

pub trait RepositoryStatus {
    fn valid(&mut self) -> Result<(), Error>;
    fn broken(& mut self) -> bool;
}

pub trait Repository: ResultRepository + RepositoryStatus + Send {}