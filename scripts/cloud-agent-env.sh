#!/usr/bin/env bash
# Shared helpers for the Cloud Agent development environment.
#
# Provisions a local MariaDB instance for development so agents never touch the
# production TiDB database. The app's DB layer hardcodes TLS with
# `rejectUnauthorized: true`, so we generate a self-signed CA/server cert and
# make Node trust it through NODE_EXTRA_CA_CERTS.
#
# Every function here is idempotent and safe to re-run.
set -euo pipefail

# ---------------------------------------------------------------------------
# Configuration (dev-only; never used against production)
# ---------------------------------------------------------------------------
export CERT_DIR="/etc/mysql/dev-certs"
export CA_CERT="${CERT_DIR}/ca.pem"
export DB_NAME="grayarx"
export DB_USER="grayarx"
export DB_PASSWORD="grayarx_dev_pw"
export DB_HOST="127.0.0.1"
export DB_PORT="3306"
export DEV_DATABASE_URL="mysql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
# Node reads NODE_EXTRA_CA_CERTS once at startup (before dotenv runs), so it
# must be exported by the launching shell — it cannot live in .env.
export NODE_EXTRA_CA_CERTS="${CA_CERT}"

WORKSPACE_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
export WORKSPACE_ROOT

log() { echo "[cloud-agent] $*"; }

# ---------------------------------------------------------------------------
# System packages
# ---------------------------------------------------------------------------
ensure_system_packages() {
  if command -v mariadbd >/dev/null 2>&1 && command -v openssl >/dev/null 2>&1; then
    log "system packages already present (mariadb, openssl)"
    return 0
  fi
  log "installing system packages (mariadb-server, openssl)…"
  sudo apt-get update -y
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y mariadb-server openssl
}

# ---------------------------------------------------------------------------
# TLS certificates (self-signed CA + server cert with SAN for localhost)
# ---------------------------------------------------------------------------
ensure_certs() {
  if sudo test -f "${CERT_DIR}/server-cert.pem" && sudo test -f "${CA_CERT}"; then
    log "TLS certs already present"
    return 0
  fi
  log "generating TLS certs in ${CERT_DIR}…"
  sudo mkdir -p "${CERT_DIR}"
  sudo openssl req -x509 -nodes -newkey rsa:2048 \
    -keyout "${CERT_DIR}/ca-key.pem" -out "${CA_CERT}" \
    -days 3650 -subj "/CN=GrayArx Dev CA"
  sudo openssl req -nodes -newkey rsa:2048 \
    -keyout "${CERT_DIR}/server-key.pem" -out /tmp/server-req.pem \
    -subj "/CN=grayarx-dev-mariadb"
  printf 'subjectAltName=DNS:localhost,DNS:mariadb,IP:127.0.0.1\n' | sudo tee /tmp/san.cnf >/dev/null
  sudo openssl x509 -req -in /tmp/server-req.pem \
    -CA "${CA_CERT}" -CAkey "${CERT_DIR}/ca-key.pem" -CAcreateserial \
    -out "${CERT_DIR}/server-cert.pem" -days 3650 -extfile /tmp/san.cnf
  sudo chown -R mysql:mysql "${CERT_DIR}"
  sudo chmod 640 "${CERT_DIR}"/*-key.pem
  sudo chmod 644 "${CA_CERT}" "${CERT_DIR}/server-cert.pem"
  sudo rm -f /tmp/server-req.pem /tmp/san.cnf
}

ensure_mariadb_config() {
  local conf="/etc/mysql/mariadb.conf.d/99-dev-tls.cnf"
  if sudo test -f "${conf}"; then return 0; fi
  log "writing MariaDB TLS config…"
  sudo tee "${conf}" >/dev/null <<EOF
[mariadbd]
bind-address = 127.0.0.1
ssl-ca = ${CA_CERT}
ssl-cert = ${CERT_DIR}/server-cert.pem
ssl-key = ${CERT_DIR}/server-key.pem
EOF
}

# ---------------------------------------------------------------------------
# MariaDB lifecycle
# ---------------------------------------------------------------------------
ensure_datadir() {
  if sudo test -d /var/lib/mysql/mysql; then return 0; fi
  log "initializing MariaDB data directory…"
  sudo mariadb-install-db --user=mysql --datadir=/var/lib/mysql >/dev/null
}

ensure_mariadb_running() {
  if sudo mariadb -e "SELECT 1" >/dev/null 2>&1; then
    log "MariaDB already running"
    return 0
  fi
  log "starting MariaDB…"
  sudo mkdir -p /var/run/mysqld
  sudo chown mysql:mysql /var/run/mysqld
  sudo mysqld_safe --datadir=/var/lib/mysql >/tmp/mariadb-safe.log 2>&1 &
  for _ in $(seq 1 60); do
    if sudo mariadb -e "SELECT 1" >/dev/null 2>&1; then
      log "MariaDB is up"
      return 0
    fi
    sleep 1
  done
  log "ERROR: MariaDB failed to start; see /tmp/mariadb-safe.log"
  sudo tail -20 /tmp/mariadb-safe.log || true
  return 1
}

ensure_db_and_user() {
  log "ensuring database and user exist…"
  sudo mariadb <<SQL
CREATE DATABASE IF NOT EXISTS ${DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '${DB_USER}'@'127.0.0.1' IDENTIFIED BY '${DB_PASSWORD}';
CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASSWORD}';
GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO '${DB_USER}'@'127.0.0.1';
GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO '${DB_USER}'@'localhost';
FLUSH PRIVILEGES;
SQL
}

# Bring the whole local DB online (used by both install and start).
ensure_database() {
  ensure_certs
  ensure_mariadb_config
  ensure_datadir
  ensure_mariadb_running
  ensure_db_and_user
}

# ---------------------------------------------------------------------------
# Dev .env (git-ignored). Written only if absent so a developer's edits stick.
# ---------------------------------------------------------------------------
ensure_env_file() {
  local env_file="${WORKSPACE_ROOT}/.env"
  if [ -f "${env_file}" ]; then
    log ".env already present — leaving as-is"
    return 0
  fi
  log "writing dev .env…"
  cat > "${env_file}" <<EOF
# Local Cloud Agent dev environment (auto-generated). git-ignored.
NODE_ENV=development
PORT=3000
DATABASE_URL=${DEV_DATABASE_URL}
JWT_SECRET=dev-local-jwt-secret-not-for-production
APP_URL=http://localhost:3000
VITE_APP_ID=grayarx
WHATSAPP_DEALERSHIP_ID=1
EOF
}
