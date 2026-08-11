# GrayArx — agent notes

## Cursor Cloud specific instructions

### Services
- **App:** Express + tRPC API + Vite React client (`pnpm dev` / Railway).
- **DB:** MySQL/TiDB via `DATABASE_URL`. Pending SQL under `drizzle/migrations/` is applied on boot by `scripts/apply-pending-migrations.mjs`.

### Showroom / Inventory performance
- Public `showroom.list` returns `{ items, hasMore, nextOffset, nextCursor }` with server filters (`search`, `make`, `bodyType`, `fuel`, `transmission`, `maxPrice`) and `availableOnly`. Default page size is 48; Showroom accumulates pages via offset Load more.
- Cards use `includeGallery: false` — primary URL only. If primary is blank, listVehicles borrows the first gallery photo for the response (and `healPrimaryFromGallery` can persist that).
- Inventory grid paginates client-side (Load more, 24). Showroom status strip can be Minimized (localStorage).

### Photos / S3
- Durable photo mirror needs `S3_BUCKET_NAME`, `S3_ENDPOINT`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_PUBLIC_URL` (optional `S3_REGION`) — set on **Railway** (production). Cloud agent pods do not need copies unless testing mirror locally.
- Without S3, CSV import keeps external image URLs. `inventoryImport.mirrorMissingPhotos` returns `needsS3: true` and still runs primary heal.
- Uploads set long-lived `Cache-Control` when S3 is configured.
- Wikimedia Commons only serves fixed thumb widths (`WIKIMEDIA_THUMB_WIDTHS` in `shared/imagePipeline.ts`). Arbitrary sizes like 768px return HTTP 400 — always snap via `optimizeImageUrl`.

### Leads follow-ups
- Mia Day 1 / 3 / 7 drip: cron `POST /api/scheduled/lead-followup-tick` (needs `SCHEDULED_TASK_SECRET` on Railway).
- Auto-sends via Resend when `RESEND_API_KEY` is set. Force draft-only with `LEAD_DRIP_AUTO_SEND=0`.
- Dealer Leads: overdue banner, drafts, **Followed up**, **Email this draft** (`dealer.sendLeadFollowup`).

### Inbound email
- Outbound (pilot/prospector/Mia) uses Resend + SPF.
- Inbound MX for `grayarx.com` → `inbound-smtp.us-east-1.amazonaws.com` (Resend Receiving). Probe: `curl -s https://www.grayarx.com/api/webhooks/health | jq .inboundEmail` — expect `hasMx: true`.
- Webhook `/api/webhooks/resend-inbound` fetches bodies via Receiving API. Reply-To on outreach is `hello@grayarx.com`.
- If Resend UI still shows Receiving MX “Pending”, wait/refresh until Verified; DNS can already be live.
- Secrets live on **Railway**, not required in the Cursor agent lockbox for production.

### Outbound prospect email
- Prefer **dealer principal / named** inboxes. Generic `info@` / `sales@` bounce on Resend — `mailableProspects` skips them by default.
- Sipho scout prompts must not invent `info@dealership-slug.co.za`. Empty email + `needs_principal_enrichment` + LinkedIn search in `sourceNotes` when unknown.
- Kagiso audit flags high generic-mailbox share and lists LinkedIn Dealer Principal search links on the roadmap.
- Quality helpers: `shared/prospectEmailQuality.ts`, enrichment list via `prospectsNeedingPrincipalEnrichment()`.

### WhatsApp (production)
- Callback: `https://www.grayarx.com/api/webhooks/whatsapp`. Health JSON via `/api/webhooks/health`.
- Secrets on Railway. See `docs/PRODUCTION_WEBHOOK_SETUP.md`.

### Tenant isolation
- Dealers (and founders linked to a dealership) only see their `dealershipId` stock on Showroom + Inventory.
- Anonymous `/showroom` is the marketplace (demo yard excluded).

### Cloud agent bootstrap
- Repo `.cursor/environment.json`: `install` = `pnpm install`, `start` = brand assets script.
- Update script for sessions: `pnpm install` only (no service start in update script).
- `pnpm dev` for local app; production is Railway.