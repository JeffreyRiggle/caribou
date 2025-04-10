FROM amazon/aws-lambda-nodejs:14

WORKDIR ${LAMBDA_TASK_ROOT}

COPY ./deploy/initializers/postgres-initializer/package.json ./
RUN npm install --only=production
COPY ./deploy/initializers/postgres-initializer/index.js ./
COPY ./db/postgres/seed_db_rds.sql ./

CMD [ "index.handler" ]