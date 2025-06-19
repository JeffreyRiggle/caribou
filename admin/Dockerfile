FROM --platform=linux/amd64 rust:latest AS builder

WORKDIR /usr/src/caribou-admin
COPY ./admin /usr/src/caribou-admin
COPY ./db /usr/src/db

RUN cargo install --path .

FROM --platform=linux/amd64 debian:bookworm-slim

RUN apt-get update && apt install -y openssl && rm -rf /var/lib/apt/lists/*

COPY --from=builder /usr/local/cargo/bin/admin /usr/local/bin/caribou-admin
COPY --from=builder /usr/src /usr/src

ENV DB_FILES="/usr/src/db"
ENV PROD_BUILD="true"
ENV SQLITE_FILE="/usr/src/grepper.db"
ENV TEMPLATE_DIR="/usr/src/caribou-admin/templates/**/*"
ENV STATIC_DIR="/usr/src/caribou-admin/static"
EXPOSE 8080
CMD [ "caribou-admin" ]
