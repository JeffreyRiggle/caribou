FROM --platform=linux/amd64 rust:latest AS builder

WORKDIR /usr/src/grepper
COPY ./grepper /usr/src/grepper
COPY ./db /usr/src/db

RUN cargo install --path .

FROM --platform=linux/amd64 debian:bookworm-slim

RUN apt-get update && apt install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

COPY --from=builder /usr/local/cargo/bin/grepper /usr/local/bin/grepper
COPY --from=builder /usr/src /usr/src

ENV DB_FILES="/usr/src/db"
ENV PROD_BUILD="true"
ENV SQLITE_FILE="/usr/src/grepper.db"
ENV TEMPLATE_DIR="/usr/src/grepper/templates/**/*"
ENV STATIC_DIR="/usr/src/grepper/static"
EXPOSE 4080
CMD [ "grepper" ]
