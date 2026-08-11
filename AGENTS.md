# GrayArx — agent notes

## Cursor Cloud specific instructions

### Services
- **App:** Express + tRPC API + Vite React client (`pnpm dev` / Railway).
- **DB:** MySQL/TiDB via `DATABASE_URL`. Pending SQL under `drizzle/migrations/` is applied on boot by `scripts/apply-pending-migrations.mjs`.

### Showroom / Inventory performance
- Public `showroom.list` and dealer `listVehicles` use `includeGallery: false` so list payloads skip photo galleries. Cards use `primaryPhotoUrl` / `imageUrl` only; full 8-angle sets load on vehicle detail / photo editor.
- Showroom and Inventory grids paginate client-side (**Load more**, 24 at a time). `showroom.list` also accepts optional `limit` / `offset` (defaults preserve prior full-list behaviour).

### Photos / S3
- Durable photo mirror needs `S3_BUCKET_NAME`, `S3_ENDPOINT`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_PUBLIC_URL` (optional `S3_REGION`).
- Without S3, CSV import keeps external image URLs (no timeout). Demo tip: keep **Save photos to GrayArx OFF** for large CSVs.
- Uploads set long-lived `Cache-Control` when S3 is configured. Remirror skips already-hosted GrayArx URLs.
- Wikimedia Commons only serves fixed thumb widths (`WIKIMEDIA_THUMB_WIDTHS` in `shared/imagePipeline.ts`). Arbitrary sizes like 768px return HTTP 400 — always snap via `optimizeImageUrl`.

### Leads follow-ups
- Mia schedules Day 1 / 3 / 7 drip rows in `lead_followups`. Cron: `POST /api/scheduled/lead-followup-tick`.
- Dealer **Leads** page shows overdue/scheduled follow-ups, Mia drafts, and **Followed up** (sets contacted + cancels remaining drip).
- Auto-send via Resend is not wired yet — drafts are for human review.

### Tenant isolation
- Dealers (and founders linked to a dealership) only see their `dealershipId` stock on Showroom + Inventory.
- Anonymous `/showroom` is the marketplace (demo yard excluded).
