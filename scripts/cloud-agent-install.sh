#!/usr/bin/env bash
# Cloud Agent `install` phase: idempotent, durable setup run after checkout.
#   - install system packages (MariaDB) if missing
#   - install JS dependencies from the lockfile
#   - provision a local dev MariaDB (TLS) and apply the schema
# No long-running process is started here; that belongs in start/terminals.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./cloud-agent-env.sh
source "${SCRIPT_DIR}/cloud-agent-env.sh"

cd "${WORKSPACE_ROOT}"

ensure_system_packages

log "installing JS dependencies (pnpm)…"
corepack enable
pnpm install --frozen-lockfile

ensure_database
ensure_env_file

log "syncing database schema (drizzle-kit push)…"
DATABASE_URL="${DEV_DATABASE_URL}" pnpm exec drizzle-kit push --force

log "applying raw pending migrations…"
DATABASE_URL="${DEV_DATABASE_URL}" node scripts/apply-pending-migrations.mjs

log "install complete."
