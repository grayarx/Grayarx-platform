# Scheduled Tasks on Railway (external cron setup)

**Audience:** Founder / ops.
**Why this doc exists:** GrayArx was built on the Manus platform, which had its own
cron scheduler (Heartbeat) that called `/api/scheduled/*` routes with a special
session cookie, checked server-side via `sdk.authenticateRequest().isCron`.
Railway has no such scheduler and never sends that cookie. Result: **every
`/api/scheduled/*` route below was completely dead in production** — either
throwing `ForbiddenError` → 500 (routes using `sdk.authenticateRequest`), or
returning `403 { error: "cron-only" }` (routes checking the legacy
`x-manus-heartbeat` header). The in-app "Enable Nightly Schedule" / "Enable
Market Guide Schedule" buttons in the dashboard are in the same boat — they call
`createHeartbeatJob()`, which talks to the Manus Forge backend and does nothing
useful on Railway.

## The fix: shared-secret header

`server/_core/scheduledAuth.ts` adds a platform-agnostic check: if the request
carries an `X-Scheduled-Task-Secret` header matching the `SCHEDULED_TASK_SECRET`
environment variable, it's authorized — no Manus session needed. The old
Manus-cookie/heartbeat-header checks are kept as a fallback (harmless, and
free if Manus ever comes back), so this is purely additive.

### 1. Set the secret on Railway

Add an environment variable:

```
SCHEDULED_TASK_SECRET=<a long random string, e.g. `openssl rand -hex 32`>
```

Redeploy so the new env var is picked up.

### 2. Point an external cron at each endpoint

Any scheduler that can do an HTTPS POST with a custom header works. Two easy
options:

- **[cron-job.org](https://cron-job.org)** (free, simplest): create a job per
  endpoint, method `POST`, URL `https://www.grayarx.com/api/scheduled/<name>`,
  header `X-Scheduled-Task-Secret: <the value from step 1>`.
- **GitHub Actions** (`.github/workflows/scheduled-tasks.yml` in this repo, or
  a separate ops repo) using `schedule:` cron triggers + `curl`, with the
  secret stored as a GitHub Actions secret, e.g.:

  ```yaml
  - name: Trigger whatsapp-queue
    run: |
      curl -sf -X POST https://www.grayarx.com/api/scheduled/whatsapp-queue \
        -H "X-Scheduled-Task-Secret: ${{ secrets.SCHEDULED_TASK_SECRET }}"
  ```

### 3. Schedule table

| Endpoint | Frequency | Purpose |
|---|---|---|
| `POST /api/scheduled/whatsapp-queue` | every 5 minutes | Drains the WhatsApp outbound message queue with retry/backoff. Without this, queued WhatsApp replies never send. |
| `POST /api/scheduled/lead-followup-tick` | every hour (or daily, minimum) | Sends Day 1/3/7 lead follow-ups whose `dueAt` has passed. |
| `POST /api/scheduled/prospect-nightly` | daily (e.g. 03:00 UTC / 05:00 SAST) | Generates fresh dealership prospects, then runs Sipho principal-email enrichment. |
| `POST /api/scheduled/prospect-enrich-tick` | optional external cron (e.g. hourly) | Sipho deep-fetches dealer websites and stores **named/principal** emails only. **Also always-on in-process:** every ~8 min imports ready pool emails then digs 4 dealers (no cron required). |
| `POST /api/scheduled/market-guide-weekly` | weekly, Monday (e.g. 04:00 UTC / 06:00 SAST) | Refreshes the live SA market guide used by Tumi valuations. |
| `POST /api/scheduled/db-backup` | daily (e.g. 02:00 UTC / 04:00 SAST) | **New** — exports core tables to gzip'd JSON and uploads to S3/R2 (see `docs/BACKUP_RESTORE.md`). |
| `POST /api/scheduled/inventory-sync` | daily (e.g. 03:00 UTC / 05:00 SAST) | **Live stock sync** — for each dealership with sync enabled, fetches their CSV feed URL and create/update/sold-marks inventory. Configure per dealer under Import Inventory → Live stock sync. |
| `POST /api/scheduled/kagiso-audit` | optional, nightly | Runs the autonomous Kagiso audit against a DB snapshot. |
| `POST /api/scheduled/sendReport` | per dealer's report frequency setting | Sends scheduled analytics reports. Needs a JSON body (`reportTemplateId`, `recipientEmails`, `frequency`, `timezone`) — wire this up per-dealer if/when scheduled reports go live; the cron trigger alone isn't enough for this one. |

All of the above return JSON (`{ ok: true, ... }` on success) and are safe to
call more often than scheduled (idempotent) if you want tighter monitoring.

### 4. Confirm it's working

After setting `SCHEDULED_TASK_SECRET` and wiring at least one cron, check the
Railway logs for lines like `[Scheduled] whatsapp-queue processed: ...` or hit
the endpoint manually once:

```bash
curl -X POST https://www.grayarx.com/api/scheduled/db-backup \
  -H "X-Scheduled-Task-Secret: <secret>"
```

A `403 { "error": "cron-only" }` means the header is missing/wrong or
`SCHEDULED_TASK_SECRET` isn't set on Railway yet.

## Confirmed dead-before-fix behavior (from the P1 audit)

- `whatsapp-queue` and `kagiso-audit` used `sdk.authenticateRequest()` +
  `isCron`. With no Manus cookie, `authenticateRequest` throws
  `ForbiddenError` before the `isCron` check even runs, which the route's
  outer `try/catch` turns into a generic `500`. **Confirmed unreachable.**
- `lead-followup-tick` and `market-guide-weekly` checked
  `x-manus-heartbeat: true`. No caller on Railway ever sends this header, so
  both always hit the `403 cron-only` branch in production. **Confirmed
  unreachable.**
- `prospect-nightly` had **no auth check at all** — worse than dead, it was
  open to any anonymous POST (now fixed to require the same
  `isAuthorizedScheduledTask` check).
- The in-app "Enable Nightly Schedule" / "Enable Market Guide Schedule"
  buttons call the legacy Manus Heartbeat/Forge API and do not create any
  working schedule on Railway. Use the external cron setup above instead;
  consider hiding or relabeling those buttons in a follow-up.
