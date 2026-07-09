# Pilot outreach research — Gauteng dealerships (March 2026)

Segmented list for bulk email + manual follow-up. **Only `emailVerified: true` rows are included in automated Resend sends.**

## Segments

| Segment | Who gets this email | Count (mailable) |
|---------|---------------------|------------------|
| `no_website_social_only` | Facebook/WhatsApp dealers with no proper site | 1* |
| `basic_website_no_showroom` | Has website, no AI chat / booking | 3 |
| `after_hours_leak` | Closes 5pm, loses evening/weekend leads | 1* |
| `whatsapp_manual` | Uses WhatsApp manually, no automation | 1 |

\*Same dealer may appear in multiple segments — sends dedupe by email address.

## Segment A — Facebook / social only

**Email subject:** *Turn your Facebook stock into a 24/7 showroom — GrayArx pilot (5 spots)*

| Dealership | City | Phone | Email | Verified |
|------------|------|-------|-------|----------|
| Koos and Mike Cars | Pretoria Gardens | — | — | No — Facebook outreach |
| H A Sales Cars | Kempton Park | 068 063 8788 | — | No — WhatsApp first |
| CJ Auto Spares & Cars | Edenvale | 011 452 9696 | — | No — Facebook first |
| Gauteng Motor Centre | Pretoria | 012 321 0033 | info@gautengmotors.co.za | Yes |

**Manual action:** Message Koos & Mike, H A Sales, CJ Auto on Facebook with shortened pilot pitch + link to `grayarx.com/onboarding/form`.

## Segment B — Basic website, no AI showroom

**Email subject:** *Add an AI showroom to your website — no rebuild required (pilot invite)*

| Dealership | City | Email | Website |
|------------|------|-------|---------|
| Jubilee Motors | Springs | darius@jubileemotors.co.za | jubileemotors.co.za |
| I&S Motors | De Deur | info@iandsmotors.co.za | iandsmotors.co.za |
| OMC Motors | Lyndhurst | info@omcmotors.co.za | omcmotors.co.za |

**Bulk send:** Ready — use `pilotEmail.sendSegment` with `basic_website_no_showroom`.

## Segment C — After-hours lead leak

**Email subject:** *Stop losing after-hours buyers — GrayArx pilot for Gauteng dealers*

| Dealership | City | Email | Notes |
|------------|------|-------|-------|
| Jooste Motors | Montana, Pretoria | info@joostemotors.co.za (unverified) | WhatsApp 082 448 7569, 4.7★ Google |
| Gauteng Motor Centre | Pretoria | info@gautengmotors.co.za | Weekend Facebook activity |

## Segment D — Manual WhatsApp

**Email subject:** *Your WhatsApp can book test drives automatically — pilot invite*

| Dealership | City | Email | Notes |
|------------|------|-------|-------|
| Jooste Motors | Montana | unverified | Click-to-WhatsApp on site |
| OMC Motors | Lyndhurst | info@omcmotors.co.za | Live chat offline after hours |

## How to send

### 1. Test logo + template (founder only)

```typescript
// tRPC: pilotEmail.sendTest
{ "to": "your@email.com", "segment": "basic_website_no_showroom" }
```

### 2. Dry-run a segment

```typescript
// pilotEmail.sendSegment
{ "segment": "basic_website_no_showroom", "dryRun": true }
```

### 3. Live send (after dry-run)

```typescript
{ "segment": "basic_website_no_showroom", "dryRun": false }
```

### 4. All segments

```typescript
// pilotEmail.sendBulk
{ "dryRun": true }
```

## Resend requirements

- `RESEND_API_KEY` in `.env`
- Domain `grayarx.com` verified in Resend
- From address: `pilot@grayarx.com` (or set `PILOT_FROM_EMAIL`)
- Logo loads from CloudFront gold-glow PNG (`email-logo-grayarx-*.png`) — Gmail-safe, not SVG

## POPIA note

B2B outreach to business emails found on public websites is standard for SaaS pilots. Include opt-out in footer; don't re-email bounces. For consumers use lead consent flows only.

## Next research tranche

Expand to: East Rand (Boksburg, Benoni), West Rand (Roodepoort), Tshwane north. Run Sipho prospector at `/admin/sipho` to auto-score and merge into `shared/pilotProspectSegments.ts`.
