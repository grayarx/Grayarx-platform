#!/usr/bin/env bash
# Writes .env.local from environment variables (e.g. Cursor Cloud secrets).
set -euo pipefail

ENV_FILE="${1:-.env.local}"
lines=()

append_if_set() {
  local key="$1"
  local val="${!key:-}"
  if [[ -n "$val" ]]; then
    lines+=("${key}=${val}")
  fi
}

append_if_set TWILIO_ACCOUNT_SID
append_if_set TWILIO_AUTH_TOKEN
append_if_set TWILIO_FROM_NUMBER
append_if_set TWILIO_WEBHOOK_BASE_URL
append_if_set TWILIO_VOICE
append_if_set TWILIO_SPEECH_LANGUAGE

if [[ ${#lines[@]} -eq 0 ]]; then
  echo "No Twilio env vars found — nothing written."
  exit 0
fi

{
  echo "# Auto-generated from Cursor secrets / environment variables"
  printf '%s\n' "${lines[@]}"
} > "$ENV_FILE"

echo "Wrote ${#lines[@]} variables to ${ENV_FILE}"
