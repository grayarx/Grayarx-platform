# Live stock sync

**Audience:** Founder / dealer ops.
**What it does:** Keeps GrayArx inventory aligned with a dealer CSV feed (Cars.co.za export, DMS CSV, Google Sheet published as CSV). Matched by stock / VIN (`externalRef`). Sold units stay sold unless the feed explicitly says sold/reserved.

## Dealer setup

1. Open **Import Inventory** (`/dealer/inventory/import`).
2. Under **Live stock sync**, paste a public **HTTPS CSV feed URL**.
3. Optionally turn on **Missing from feed → sold** (only vehicles that already have a stock number).
4. Click **Save sync settings**, then **Sync now** to verify.
5. Turn on **Nightly sync**.

Manual CSV upload still works — same create/update rules, plus an optional “Missing from this file → sold” toggle on import.

## Platform cron (required for nightly)

Set `SCHEDULED_TASK_SECRET` on Railway, then schedule:

```bash
curl -sf -X POST https://www.grayarx.com/api/scheduled/inventory-sync \
  -H "X-Scheduled-Task-Secret: $SCHEDULED_TASK_SECRET"
```

Suggested: daily ~05:00 SAST (03:00 UTC). See `docs/SCHEDULED_TASKS.md`.

## Behaviour

| Case | Result |
|---|---|
| New stock # in feed | Create vehicle |
| Existing stock # | Update price / km / status (sold not resurrected as available) |
| Missing from feed + toggle on | Mark sold |
| No stock # on a row | Always insert (no dedup) |
| Price ≤ R1 in feed | Stored as R1 placeholder; fix in Inventory |

Migration: `0071_stock_sync.sql` (applied on boot via `apply-pending-migrations.mjs`).
