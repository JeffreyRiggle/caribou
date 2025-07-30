use std::fs;

use aws_sdk_s3::Client;

pub trait FileAccess {
    async fn read(&mut self, file: String) -> Result<String, ()>;
    async fn get_file_size(&mut self, file: String) -> u64;
}

#[derive(Clone)]
pub enum FileAccessProvider {
    Local(LocalFileAccess),
    S3(S3Access)
}

impl FileAccess for FileAccessProvider {
    async fn read(&mut self, file: String) -> Result<String, ()> {
        match self {
            Self::Local(local) => local.read(file).await,
            Self::S3(s3) => s3.read(file).await
        }
    }

    async fn get_file_size(& mut self, file: String) -> u64 {
        match self {
            Self::Local(local) => local.get_file_size(file).await,
            Self::S3(s3) => s3.get_file_size(file).await
        }
    }
}

pub struct LocalFileAccess {
    pub root_path: String
}

impl FileAccess for LocalFileAccess {
    async fn read(&mut self, file: String) -> Result<String, ()> {
        let target_path = format!("{}/{}", self.root_path, file);
        match fs::read_to_string(target_path) {
            Ok(file_text) => Ok(file_text),
            Err(_) => Err(())
        }
    }

    async fn get_file_size(& mut self, file: String) -> u64 {
        let target_path = format!("{}/{}", self.root_path, file);
        let metadata = fs::metadata(target_path).unwrap();
        metadata.len()
    }
}

impl Clone for LocalFileAccess {
    fn clone(&self) -> Self {
        Self { root_path: self.root_path.clone() }
    }
}

pub struct S3Access {
    pub bucket: String,
    pub client: Client
}

impl FileAccess for S3Access {
    async fn read(&mut self, file: String) -> Result<String, ()> {
        match self.client.get_object().bucket(&self.bucket).key(&file).send().await {
            Ok(res) => {
                println!("Successfully load file {:?} from bucket {:?}", &file, &self.bucket);
                let bytes = res.body.collect().await.unwrap().into_bytes(); 
                Ok(str::from_utf8(&bytes).unwrap().to_string())
            },
            Err(err) => {
                println!("Failed to read s3 file {:?} from bucket {:?}, with error: {:?}", &file, &self.bucket, err);
                Err(())
            }
        }
    }

    async fn get_file_size(& mut self, file: String) -> u64 {
        match self.client.head_object().bucket(&self.bucket).key(&file).send().await {
            Ok(res) => {
                println!("Successfully got head of file {:?} from bucket {:?}", &file, &self.bucket);
                return u64::try_from(res.content_length().unwrap()).unwrap();
            },
            Err(err) => {
                println!("Failed to get read of file {:?} from bucket {:?}, with error {:?}", &file, &self.bucket, err);
                return 0
            }
        }
    }
}

impl Clone for S3Access {
    fn clone(&self) -> Self {
        Self { bucket: self.bucket.clone(), client: self.client.clone() }
    }
}