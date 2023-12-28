class DBTransaction:
    def __init__(self, connection):
        self.connection = connection

    def __enter__(self):
        # Starting transaction
        return self

    def __exit__(self, *args):
        self.connection.commit()

