class Logger:
    def __init__(self, logger):
        self.logger = logger

    def log(self, message):
        if self.logger != None:
            self.logger.info(message)
        else:
            print(message)

    def error(self, message):
        if self.logger != None:
            self.logger.error(message)
        else:
            print(message)

    def debug(self, message):
        if self.logger != None:
            self.logger.debug(message)
        else:
            print(message)