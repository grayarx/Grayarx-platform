# GrayArx demo inventory CSVs

Photos are **make/model-matched** (Wikimedia Commons) and ordered to match the
GrayArx 8-angle checklist in `shared/photoAngles.ts`:

1. Front 3/4 · 2. Rear 3/4 · 3. Side · 4. Front · 5. Rear · 6. Front seats · 7. Dashboard · 8. Wheels  

When Commons lacks a true interior/wheel shot for that model, the slot falls back
to another exterior of the **same** model (never a random different car).

| File | Cars | Use |
|------|------|-----|
| `grayarx-demo-mainstream-8photos.csv` | 8 SA mainstream | Client demos |
| `grayarx-demo-premium-8photos.csv` | 6 premium | Premium yard demos |
| `grayarx-demo-1000-cars-8photos.csv` | 1000 | Scale / stress test (same 8-angle sets, rotated) |

Regenerate anytime:

```bash
node scripts/generate-demo-csvs.mjs
```

## Import on grayarx.com

1. Open **CSV Import**
2. Prefer **Save photos to GrayArx OFF** for demos (instant; Wikimedia links still work)
3. Upload → **Preview** → **Import**
4. Same stock numbers update existing cars (including photos when the primary URL changes)

## Clear stock before a fresh demo

On **Inventory**:
- Tick cars → **Delete selected**, or
- **Delete all** (wipes your dealership’s inventory)

Then re-import this CSV.

### Making “Save photos to GrayArx” work

Photo save copies each URL into durable object storage. On Railway set:

- `S3_BUCKET_NAME`
- `S3_ENDPOINT` (e.g. Cloudflare R2 / AWS)
- `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY`
- `S3_PUBLIC_URL` (public base URL for objects)
- optional `S3_REGION` (default `auto`)

Without those, import still succeeds and **keeps the original image links** (no timeout).
With S3 set, import mirrors in parallel with a soft deadline so proxies do not HTML-timeout.

For a live dealership, replace demo Commons images with your own yard 8-angle photography via **Photos**.
