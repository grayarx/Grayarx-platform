# GrayArx — agent notes

## Cursor Cloud specific instructions

### Services
- **App:** Express + tRPC API + Vite React client (`pnpm dev` / Railway).
- **DB:** MySQL/TiDB via `DATABASE_URL`. Pending SQL under `drizzle/migrations/` is applied on boot by `scripts/apply-pending-migrations.mjs`.

### Showroom / Inventory performance
- Public `showroom.list` returns `{ items, hasMore, nextOffset, nextCursor }` with server filters (`search`, `make`, `bodyType`, `fuel`, `transmission`, `maxPrice`) and `availableOnly`. Default page size is 48; Showroom uses `useInfiniteQuery`.
- Cards use `includeGallery: false` — primary URL only. If primary is blank, listVehicles borrows the first gallery photo for the response (and `healPrimaryFromGallery` can persist that).
- Inventory grid still paginates client-side (Load more, 24).

### Photos / S3
- Durable photo mirror needs `S3_BUCKET_NAME`, `S3_ENDPOINT`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_PUBLIC_URL` (optional `S3_REGION`).
- Without S3, CSV import keeps external image URLs. `inventoryImport.mirrorMissingPhotos` returns `needsS3: true` and still runs primary heal.
- Uploads set long-lived `Cache-Control` when S3 is configured.
- Wikimedia Commons only serves fixed thumb widths (`WIKIMEDIA_THUMB_WIDTHS` in `shared/imagePipeline.ts`). Arbitrary sizes like 768px return HTTP 400 — always snap via `optimizeImageUrl`.

### Leads follow-ups
- Mia Day 1 / 3 / 7 drip: cron `POST /api/scheduled/lead-followup-tick` (needs `SCHEDULED_TASK_SECRET`).
- Auto-sends via Resend when `RESEND_API_KEY` is set. Force draft-only with `LEAD_DRIP_AUTO_SEND=0`. Force send with `LEAD_DRIP_AUTO_SEND=1`.
- Dealer Leads: overdue banner, drafts, **Followed up**, **Email this draft** (`dealer.sendLeadFollowup`).

### WhatsApp (production)
- Callback URL must be `https://www.grayarx.com/api/webhooks/whatsapp` (not a trycloudflare tunnel; not SPA HTML).
- Health: `GET /api/webhooks/health` must return JSON. See `docs/PRODUCTION_WEBHOOK_SETUP.md`.
- Env: `WHATSAPP_WEBHOOK_VERIFY_TOKEN`, `WHATSAPP_APP_SECRET`, `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_DEALERSHIP_ID`, `APP_URL`.
- Meta: Subscribe webhooks ON for the live Phone Number ID; keep OpenAI billed so Nala is not stuck on templates.

### Tenant isolation
- Dealers (and founders linked to a dealership) only see their `dealershipId` stock on Showroom + Inventory.
- Anonymous `/showroom` is the marketplace (demo yard excluded).
