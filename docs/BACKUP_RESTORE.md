# Database Backup & Restore

**Audience:** Founder / ops.
**Status before this doc existed:** `server/_core/backupService.ts` was a
complete mock — `createFullBackup()` did `setTimeout(100ms)`, invented a
random size, and generated a checksum string from the backup ID and current
time (`checksum_${backupId}_${Date.now()}`). Nothing was ever written to disk,
S3, or anywhere else. `restoreFromBackup()` was the same: a 200ms sleep and a
`console.log`. **There was no real backup mechanism in production at all.**

## What backup does now (real)

`runDatabaseBackup()` in `server/_core/backupService.ts`:

1. Connects to the live DB (`server/db.ts` → `getDb()`, TiDB via `DATABASE_URL`).
2. Runs `SELECT *` against ~26 core business tables (see `BACKUP_TABLES` in
   that file — users, dealerships, dealer groups/users, vehicles + photos,
   leads, bookings, test drive bookings, conversations, chatbot conversations,
   WhatsApp conversations/messages/queue, invoices, payments, subscriptions,
   trade-in quotes/invites, prospects, onboarding submissions, POPIA consent
   signatures, API keys, webhooks, documents, document signatures). If a
   single table errors (e.g. schema drift), it's skipped and recorded in
   `tableErrors` — the rest of the backup still completes.
3. Serializes everything into one JSON object and gzips it
   (`zlib.gzipSync`), and computes a real SHA-256 checksum of the compressed
   bytes (`crypto.createHash("sha256")`) — not a mock string.
4. Uploads the gzip via `storagePutRaw()` (`server/storage.ts`):
   - **If S3/R2 is configured** (`S3_BUCKET_NAME`, `S3_ACCESS_KEY_ID`,
     `S3_SECRET_ACCESS_KEY`, `S3_ENDPOINT`, `S3_REGION`, optionally
     `S3_PUBLIC_URL`): uploaded there. This is durable — survives Railway
     redeploys/restarts.
   - **If not configured**: written to the OS temp dir on the running
     container (`os.tmpdir()/grayarx-backups/`). This is **NOT durable** —
     Railway wipes the filesystem on every redeploy/restart. The founder is
     alerted by email (`alertFounder`) every time this fallback path is used,
     with an explicit "configure S3/R2" call to action.
5. Triggered via `POST /api/scheduled/db-backup`, gated by
   `server/_core/scheduledAuth.ts` (see `docs/SCHEDULED_TASKS.md` for the
   external cron setup — recommended: daily).

### Setting up durable backups (do this)

Add these Railway env vars (any S3-compatible provider works — Cloudflare R2,
Backblaze B2, AWS S3):

```
S3_BUCKET_NAME=grayarx-backups
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
S3_ENDPOINT=https://<account>.r2.cloudflarestorage.com   # or S3 endpoint
S3_REGION=auto                                            # or e.g. eu-west-1
S3_PUBLIC_URL=                                            # leave blank unless the bucket is public
```

Until these are set, backups still run (via `/api/scheduled/db-backup`) but
land on ephemeral disk and you'll get a "NOT durable" email alert every time.

## What restore does now — and why it's manual

**Restore is intentionally NOT automated.** `restoreBackup(backupId)` in
`backupService.ts` validates that a backup exists and completed successfully,
then returns step-by-step manual instructions — it does not write anything
back to the database.

This is a deliberate, honest scoping decision, not a shortcut:

- Automated restore across ~26 tables requires strict foreign-key ordering
  (dealerships/users before vehicles/leads/bookings, etc.) to avoid constraint
  failures or silent orphaned rows.
- A partial automated restore that fails halfway through leaves the DB in a
  worse, inconsistent state than before — with no transaction spanning that
  many inserts/updates on a live production database, "safe automated
  restore" is not something to claim without real safeguards.
- Restore is a rare, high-stakes operation. A human deciding *which* rows to
  bring back (not "wipe everything and reload yesterday's snapshot") is safer
  than a script guessing.

### Manual restore runbook

1. **Locate the backup.**
   - Durable (S3/R2): browse the bucket, key `backups/db-backup-<timestamp>.json.gz`.
   - Local fallback: only useful if the container hasn't restarted since —
     check via Railway's shell/exec, path logged in the founder alert email.
2. **Download and decompress:**
   ```bash
   gunzip db-backup-2026-07-15T02-00-00-000Z.json.gz
   ```
3. **Inspect the JSON.** Shape:
   ```json
   {
     "schemaVersion": 1,
     "backupId": "db-backup-...",
     "generatedAt": "...",
     "tableCount": 26,
     "totalRows": 12345,
     "tableErrors": [],
     "tables": { "users": [...], "vehicles": [...], "leads": [...], "...": [...] }
   }
   ```
   Identify exactly which table(s)/row(s) you actually need — don't restore
   everything unless you're intentionally rolling back the whole DB.
4. **Restore via TiDB Cloud console** (production DB is TiDB —
   `DATABASE_URL` connects over MySQL protocol, port 4000, TLS):
   - Use the TiDB Cloud SQL console, or `mysql` CLI against `DATABASE_URL`, to
     manually `INSERT`/`REPLACE INTO` the specific rows you need, in
     dependency order (parents before children).
   - For a small number of rows, hand-write the SQL from the JSON. For a
     larger restore, write a one-off script that reads the JSON and does
     targeted `INSERT ... ON DUPLICATE KEY UPDATE` — run it locally against
     `DATABASE_URL`, reviewed before executing, never as an automatic HTTP
     endpoint.
5. **Verify.** Spot-check row counts and a handful of records after restoring
   before considering the incident closed.

If a future engineer wants to build real automated restore, it should be a
separate, carefully reviewed project: transactional per-table batches, a dry
run mode, explicit table allow-listing per invocation, and probably restoring
into a staging DB first — not a quick addition to this service.
