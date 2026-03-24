# syntax=docker/dockerfile:1
FROM rust:bookworm AS builder
WORKDIR /app
COPY Cargo.toml Cargo.lock rust-toolchain.toml ./
COPY .sqlx ./.sqlx
COPY src ./src
ENV SQLX_OFFLINE=true
RUN cargo build --release

FROM debian:bookworm-slim
RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates libssl3 \
  && rm -rf /var/lib/apt/lists/*
COPY --from=builder /app/target/release/backend /usr/local/bin/backend
ENV PORT=3000
EXPOSE 3000
ENTRYPOINT ["/usr/local/bin/backend"]
