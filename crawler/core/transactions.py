from sqlite3 import Connection

class DBTransaction:
    def __init__(self, connection: Connection):
        self.connection = connection

    def __enter__(self):
        # Starting transaction
        return self

    def __exit__(self, *args):
        self.connection.commit()

