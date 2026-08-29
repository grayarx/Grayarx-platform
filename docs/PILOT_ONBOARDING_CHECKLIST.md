# Pilot dealer #1 — onboarding checklist

Use this when the first paying / pilot dealership signs. Target: **live in 48 hours**.

## Before kickoff call (founder)

- [ ] Signed pilot agreement — send dealer to **https://www.grayarx.com/legal/dealer-agreement** (print/sign, return to legal@grayarx.com)
- [ ] POPIA consent captured — **https://www.grayarx.com/legal/popia-consent-form**
- [ ] PayFast / billing method on file (if applicable)
- [ ] Dealership legal name, company reg, VAT number
- [ ] Primary contact: name, cell, email
- [ ] Physical address + Google Maps pin
- [ ] Business hours (Mon–Sat) for Bongi after-hours routing

## Day 0 — Provision (30 min)

- [ ] Create dealership row in admin
- [ ] Assign **Professional OS** features for the 14-day Pilot (R0 — do not invoice). After Monday proof, usual close is Professional OS R14,990/mo.
- [ ] Generate shortcode for public showroom URL
- [ ] Set `WHATSAPP_DEALERSHIP_ID` if using shared Meta number initially
- [ ] Upload brand kit: logo, accent colour, email signature

## Day 0 — Inventory (1–2 hours)

- [ ] Import stock (CSV or manual) — minimum **10 vehicles** for credible showroom
- [ ] **Live stock sync** — paste CSV feed URL on Import Inventory, Sync now, enable nightly (see `docs/STOCK_SYNC.md`)
- [ ] Every unit: photo, price, km, year, make, model, colour
- [ ] Fix R1 placeholder prices (Kagiso CSV repair or manual)
- [ ] Mark sold units unavailable — don't leave ghost listings

## Day 0 — Channels

- [ ] **Web showroom** — share `grayarx.com/showroom/{shortcode}` or dealer subdomain
- [ ] **WhatsApp** — Meta number verified; webhooks subscribed (see `PRODUCTION_WEBHOOK_SETUP.md`)
- [ ] Test messages:
  - [ ] "What colour is the Polo?" → **Nala**
  - [ ] "Test drive tomorrow" → **Lerato**
  - [ ] "Trade in my car" → **Tumi**
  - [ ] After hours "Hello" → **Bongi**
- [ ] **Email** — `hello@grayarx.com` or dealer inbox for lead notifications

## Day 1 — Staff walkthrough (15 min)

- [ ] Show dealer dashboard: leads, bookings, fallback queue
- [ ] Explain reference numbers on WhatsApp replies
- [ ] Who gets SMS/email when Lerato books a test drive
- [ ] How to confirm / decline bookings

## Day 1 — Go-live checks

- [ ] `GET /api/webhooks/health` returns JSON on production
- [ ] OpenAI quota active (optional — templates work without it)
- [ ] Send test lead from personal phone
- [ ] Dealer receives notification within 60 seconds

## Week 1 — Success metrics

| Metric | Target |
|--------|--------|
| Inbound WhatsApp / chat sessions | ≥ 10 |
| Test drive requests | ≥ 2 |
| After-hours replies (Bongi) | ≥ 1 |
| Dealer login to dashboard | ≥ 3 times |

## Week 2 — Expand or fix

- [ ] Review Kagiso audit findings for this dealer
- [ ] Add missing photos / descriptions
- [ ] Connect dealer's own WhatsApp Business number (if not done Day 0)
- [ ] Ask for Google review / referral to another dealer

## Escalation contacts

- Founder cell: 079 491 5187
- Support: hello@grayarx.com
- Meta / WhatsApp issues: check webhook health first

---

**Pilot promise to dealer:** "We set up your AI showroom and WhatsApp agents. You keep selling the way you do — we add a layer that never sleeps."
