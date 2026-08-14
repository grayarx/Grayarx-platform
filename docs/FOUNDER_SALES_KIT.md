# Founder sales kit — pre-call, money ask, objections

**Audience:** Founder / admin only — **not** shown to dealerships.  
**In-app:** `/admin/sales-kit` (structured twin of this file via `shared/founderSalesKit.ts`)  
**Contact:** Henrique Marx · 079 491 5187 · hello@grayarx.com

Keep `shared/founderSalesKit.ts` in sync when you edit money lines.

---

## Pre-call (5 minutes)

1. Open Prospector card: name, city, brands, Sipho rationale, named principal email.
2. Check their WhatsApp / website — stock live? After-hours reply?
3. Demo yard ready with recognisable CSV stock.
4. Legal pack: [grayarx.com/legal](https://www.grayarx.com/legal) — never paste full bank details in chat.
5. Decide money ask: **Pilot Partner floor** vs full Growth list. Default = floor.

**Paste (WhatsApp):**

> Hi [Name] — Henrique from GrayArx. Sipho flagged [Yard]. We catch after-hours WhatsApp on your live stock and book drives. Free pilot, no card. 15 min on your cars? 079 491 5187

---

## Opener (30 seconds)

GrayArx gives your yard a 24/7 assistant on webchat and WhatsApp that answers from your **live inventory**, books viewings, and drops warm leads in your inbox. We sit **beside** AutoTrader / DMS / Meta — no cancel needed. Free pilot on your stock; pricing confirmed **in writing** before any billing.

---

## Money ask (say this)

**Default close:**

> Pilot Partner — you get **Growth** features (showroom, CSV, WhatsApp Nala, Mia drip, leads). Free until we confirm terms. Then **R 3,999/mo** — same as Showroom list — not the R 7,999 Growth list. Month-to-month with 30 days’ notice, or 12-month founder lock.

**ROI bridge:**

> One recovered close at ~R 12,000 gross pays for R 3,999/mo several times over. We’re not asking you to believe a dashboard — prove it on your yard.

- Card or EFT when billing starts. **No credit card for the free pilot.**
- Exceptions below the floor = founder only, written.
- Soft public page: `/pricing` (pilot terms + ROI). Full list table stays soft in upgrade UI (`PILOT_PRICING_HIDDEN`).

**Paste:**

> Pilot = Growth features. Free until written confirm. Then R 3,999/mo (Showroom list) · month-to-month · cancel with 30 days.  
> One recovered lead at ~R 12k GP covers R 3,999/mo.

---

## Objections (short)

| They say | You say |
|----------|---------|
| Still in a contract | Perfect — no cancel. Second layer for after-hours + stock-aware chat. |
| Why not just Cars.co.za? | Keep classifieds. We convert once they message you / hit your showroom. |
| AI wrong? | Answers from your inventory DB. Fix stale rows. Dicey → human queue. |
| New WhatsApp number? | Prefer existing WA Business on Meta. Until linked: Growth webchat + click-to-chat. |
| Too expensive / send pricing | Soft floor from R 3,999 after pilot. Send `/pricing` + ROI. Confirm in writing. |
| Replace my team? | Replaces silence after hours — not closers. |

Full answers: `docs/DEALER_QA_PLAYBOOK.md`. Contract sequence: `docs/STILL_IN_CONTRACT_FOLLOWUP.md`.

---

## Close + next steps

1. Book 15-min demo on **their** stock.
2. Apply: `#lead-capture` or `/onboarding` (`?ref=` for peer referral).
3. Same day: provision, Growth pilot, shortcode, ≥10 units CSV.
4. Legal: Dealer Agreement + POPIA before go-live.
5. Week 1 proof: ≥1 after-hours path + ≥1 booking/lead they recognise.

**Paste:**

> Next step: 15-min on your stock → free pilot live → we confirm R 3,999/mo in writing before billing. Deal?

---

## Related

- `docs/FOUNDER_SALES_AGENTS.md` — Sipho → Themba
- `docs/PILOT_SLA.md` — honest response targets
- `docs/DEALER_CRM_PITCH_EMAIL.md` — email scripts
- `docs/PILOT_ONBOARDING_CHECKLIST.md` — 48h go-live
- `shared/dealerRoiMath.ts` — site ROI proof math
