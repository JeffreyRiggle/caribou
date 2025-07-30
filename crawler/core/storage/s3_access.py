import boto3

class S3Access:
    def __init__(self, bucket: str):
        self.s3_client = boto3.client('s3')
        self.bucket = bucket

    def write(self, file_path: str, file_name: str, contents):
        self.s3_client.put_object(Body=contents, Bucket=self.bucket, Key=f"{file_path}/{file_name}")

    def read(self, file_path: str):
        obj = self.s3_client.get_object(Bucket=self.bucket, Key=file_path)
        return obj["Body"]