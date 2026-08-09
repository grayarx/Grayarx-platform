#!/usr/bin/env bash
# Cloud Agent `start` phase: per-boot reconciliation. Brings the local MariaDB
# online (starting it if needed) and returns. The dev server itself runs as a
# named terminal, not here.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./cloud-agent-env.sh
source "${SCRIPT_DIR}/cloud-agent-env.sh"

cd "${WORKSPACE_ROOT}"

# Self-healing: if the base image lacks MariaDB (e.g. booting without the tested
# snapshot), install and provision it so the environment still comes up.
ensure_system_packages
ensure_database
ensure_env_file

log "start complete — MariaDB ready on ${DB_HOST}:${DB_PORT}."
