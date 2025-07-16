import os

class FileAccess:
    def __init__(self, root_dir: str = '../contents'):
        self.root_dir = root_dir

    def write(self, file_path: str, file_name: str, contents):
        full_path = f"{self.root_dir}/{file_path}"
        if not os.path.exists(full_path):
            os.makedirs(full_path)
    
        file = f"{full_path}/{file_name}"
        with open(file, 'wb') as fHandle:
            if isinstance(contents, str):
                fHandle.write(contents.encode())
            else:
                fHandle.write(contents)

    def read(self, file_path: str):
        return open(f"{self.root_dir}/{file_path}")