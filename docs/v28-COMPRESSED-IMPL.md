# v28 Items #4-13 — Compressed Implementation Plan

## #4 Lerato WhatsApp Inbound
- Add `whatsapp_inbound_keywords` table (dealershipId, keyword, route_to, created_at)
- Nala (WhatsApp agent) detects booking keywords ("book", "test drive", "when available") and routes to `publicBooking.submit` with channel="whatsapp"
- Reply sent back via WhatsApp in customer's language

## #5 Lerato Calendar Conflict Check
- Extend `bookingAgent.ts` slot suggester to query confirmed bookings for same dealership/vehicle
- Skip 60-min windows that overlap with confirmed slots
- Return "next available" if all slots conflict

## #6 Lerato Confirmation Reply
- `adminBookings.decide` with action="confirm" sends localized confirmation via original channel
- Web channel: generate ICS file + email with attachment
- WhatsApp channel: send text confirmation with slot details

## #7 Inventory Bulk CSV Importer
- Extend `/dealer/inventory/import` with dry-run preview
- Parse CSV, dedupe by vin/stockNumber against DB
- Show per-row success/failure before committing
- Idempotent: same VIN twice = update, not duplicate

## #8 Lead Pipeline Kanban
- New `/dealer/leads` page with Kanban board (New → Contacted → Qualified → Booked → Converted → Lost)
- Drag-to-stage updates lead status
- Per-stage count badges

## #9 Showroom SEO
- `/sitemap.xml` endpoint returns all public vehicles + dealerships
- Add JSON-LD `Vehicle` schema to VehicleDetail.tsx
- Include price, mileage, transmission, fuel type

## #10 Per-Dealership Branded Chrome
- Read dealership.brandKit.favicon + theme-color
- Inject into public showroom pages via meta tags + favicon link
- Fallback to GrayArx defaults if not set

## #11 Owner Ops Dashboard
- New `/admin/ops` page with KPIs:
  - Signups today/week/month
  - Leads today/week/month
  - Audits run (last 24h)
  - Autonomous status (last run, next due)
  - Lerato bookings (pending/confirmed)

## #12 Per-Agent Activity Feed
- `/dealer/dashboard` shows last-5 events per agent (Mia, Nala, Naledi, Lerato, Bongi)
- Reuse existing `agent.feed` query with per-agent filter
- Compact card layout

## #13 DealerShell Polish
- Sticky tabs on `/dealer/*` pages (tabs stay visible on scroll)
- Active tab underline in gold
- Language picker persisted to localStorage (not just sessionStorage)
