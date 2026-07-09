# Production webhook setup (grayarx.com)

Meta WhatsApp webhooks **must hit the Node server**, not the static SPA. If `GET /api/webhooks/health` returns HTML instead of JSON, Meta verification will fail.

## Quick check

```bash
curl -s https://www.grayarx.com/api/webhooks/health | head
```

**Expected:** `{"status":"ok","webhooks":{...}}`  
**Broken:** `<!DOCTYPE html>` (SPA index)

## Root cause

Cloudflare / static hosting often serves `index.html` for all paths. The Express app registers webhooks **before** the SPA fallback, but that only helps when traffic reaches Node.

## Fix (pick your host)

### A) Cloudflare — proxy `/api/*` to your Node backend

1. Cloudflare Dashboard → **Rules** → **Origin Rules** or **Workers**
2. Route `www.grayarx.com/api/*` → your Cloud Run / VPS origin (port 3000)
3. Keep `/*` static for the React build **except** `/api/*`

Or use **`client/public/_routes.json`** (already in repo):

```json
{ "version": 1, "include": ["/*"], "exclude": ["/api/*"] }
```

Deploy with Pages **Functions** / Worker that forwards excluded paths to Node.

### B) Single Node process (recommended for GrayArx)

Run one Express server (`server/_core/index.ts`) that serves:

1. `/api/webhooks/*` — Meta WhatsApp  
2. `/api/trpc/*` — app API  
3. Static `dist/public` — SPA (with API-safe fallback)

Webhook routes are registered at line 60 **before** static files.

### C) Meta webhook URL

| Field | Value |
|-------|--------|
| Callback URL | `https://www.grayarx.com/api/webhooks/whatsapp` |
| Verify token | `WHATSAPP_WEBHOOK_VERIFY_TOKEN` from `.env` |
| Subscribe | `messages` |

Phone Number ID: `1245737138612982` (+27 82 053 2685)

### D) Env vars required on production

```
WHATSAPP_WEBHOOK_VERIFY_TOKEN=
WHATSAPP_APP_SECRET=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=1245737138612982
WHATSAPP_DEALERSHIP_ID=1
APP_URL=https://www.grayarx.com
```

## Local simulate (no Meta)

```bash
curl -X POST http://localhost:3000/api/webhooks/whatsapp/simulate \
  -H "Content-Type: application/json" \
  -d '{"phone":"27820532685","message":"test drive please","dealershipId":"1"}'
```

Blocked in production unless `ALLOW_WHATSAPP_SIMULATE=1`.
