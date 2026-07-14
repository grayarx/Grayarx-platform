# GrayArx Pricing — Cost-Grounded Model (2026)

**Purpose:** What to charge dealerships after accounting for what GrayArx actually pays each month.  
**Currency:** ZAR (USD converted at ~R18.50 where noted)  
**Last updated:** July 2026

---

## 1. What GrayArx pays for (your stack)

| Service | Used for | Billing model |
|---------|----------|---------------|
| **TiDB Cloud** | MySQL database (`DATABASE_URL`) | Free tier → pay-as-you-go RUs/storage |
| **Railway / hosting** | Node app + API + showroom | Monthly compute |
| **OpenAI** (`gpt-4o-mini`) | Nala chat, agent replies, polish | Per token |
| **Meta WhatsApp Cloud API** | Dealer WhatsApp / Nala | Per conversation / message category |
| **Resend** | Lead ack, booking emails | Per email |
| **Twilio SMS** (optional) | Reminders, alerts | Per SMS (~R0.50–1.00 SA) |
| **S3 / Forge storage** | Vehicle photos, mirrored imports | Per GB stored + egress |
| **Cloudflare** | Tunnel / CDN (if used) | Often free tier |
| **Domain + SSL** | grayarx.com | Annual ÷ 12 |
| **Stripe** (when live) | Card billing | ~2.9% + fixed fee per charge |

**Not currently a per-dealer line item:** Manus/Forge dev platform (absorb in R&D until scaled).

---

## 2. Fixed platform costs (what you pay every month)

### Phase A — Founder / pilot (you + contractors, no sales team)

| Item | Low | Realistic | Notes |
|------|-----|-----------|-------|
| Hosting (Railway prod) | R600 | R1,200 | Scales with traffic |
| TiDB Cloud | R0 | R500 | Free tier first; set spend cap |
| Resend | R0 | R360 | Free 3k emails; Pro ~$20 at ~15 dealers |
| Domain + misc SaaS | R200 | R400 | |
| OpenAI baseline | R200 | R500 | Idle agents, audits, dev testing |
| WhatsApp (platform) | R0 | R0 | No monthly platform fee to Meta |
| Storage (S3/Forge) | R100 | R300 | Grows with photo mirroring |
| Legal / accounting | R1,000 | R2,000 | |
| **Platform subtotal** | **R2,100** | **R5,260** | Before contractor pay |

| Personnel (optional) | Low | Realistic |
|----------------------|-----|-----------|
| Contractors (part-time dev) | R0 | R25,000 |
| **Total monthly burn (pilot)** | **R2,100** | **R30,260** |

### Phase B — Small team (2–3 contractors + light marketing)

| Item | Monthly |
|------|---------|
| Platform (above, scaled) | R8,000–12,000 |
| Contractors | R60,000–85,000 |
| Marketing (organic + light ads) | R8,000–15,000 |
| **Total OPEX** | **R76,000–112,000** |

> Your `OPERATIONAL_COST_ANALYSIS.md` assumes R153k–219k/month with full team + heavy SaaS — valid for **growth mode**, not **pilot**.

---

## 3. Variable cost per dealership (what each dealer costs you)

Estimates for a **typical independent dealer** (80–150 vehicles, moderate AI usage).

### Assumptions (moderate month)

| Activity | Volume | Unit cost | Monthly cost |
|----------|--------|-----------|--------------|
| **Nala / OpenAI chat** | 150 sessions × 6 turns | ~R0.02/turn (gpt-4o-mini) | **R18** |
| **OpenAI** (agents, polish, audits) | — | — | **R40** |
| **WhatsApp** | 120 inbound + 80 outbound utility | R0–1.00/msg | **R50–120** |
| **Resend email** | 60 transactional emails | ~R0.07/email (Pro plan) | **R4** |
| **SMS (Twilio)** | 40 SMS (if enabled) | R0.75/SMS | **R30** |
| **DB + compute share** | — | allocated | **R25** |
| **Photo storage** | ~2 GB mirrored | ~R0.15/GB | **R3** |
| **Stripe fee** (on R4,999 sub) | 1 invoice | 2.9% | **R145** |

| Dealer profile | Variable cost (excl. Stripe) | With Stripe on R4,999 plan |
|----------------|------------------------------|----------------------------|
| **Light** (Starter, web chat only) | R80–120 | — |
| **Moderate** (Pro, WhatsApp active) | R170–280 | — |
| **Heavy** (Pro, high chat + SMS) | R350–650 | — |

**Important:** One dealer sending 500+ WhatsApp AI replies/month or mirroring 500×8 photos can cost **R400–800** alone. Cap usage in lower tiers.

---

## 4. Contribution margin math

**Contribution margin** = Subscription price − Variable cost − Payment processing

| Plan price | Variable (moderate) | Stripe (~3%) | Contribution margin |
|------------|---------------------|--------------|---------------------|
| R2,499 | R200 | R75 | **R2,224** |
| R4,999 | R280 | R145 | **R4,574** |
| R6,999 | R350 | R205 | **R6,444** |
| R8,999 | R450 | R265 | **R8,284** |

### Dealers needed to cover fixed costs

| Phase | Fixed OPEX | @ R2,499 CM | @ R4,999 CM | @ R6,999 CM |
|-------|------------|-------------|-------------|-------------|
| **Pilot** (R5,260 platform only) | R5,260 | 3 dealers | 2 dealers | 1 dealer |
| **Pilot + contractors** (R30,260) | R30,260 | 14 dealers | 7 dealers | 5 dealers |
| **Small team** (R90,000) | R90,000 | 41 dealers | 20 dealers | 14 dealers |

**Rule of thumb:** At **R4,999** with moderate usage, you need **~7 paying dealers** to cover founder + contractors, **~20** to cover a small team.

---

## 5. Recommended pricing (cost-safe)

### Launch pricing (post-pilot list price)

| Tier | Internal ID | Price | Max included usage |
|------|-------------|-------|-------------------|
| **Showroom** | starter | **R3,999.99/mo** | 150 vehicles, 400 AI chats, 300 emails, web chat only |
| **Growth** | professional | **R7,999.99/mo** | 500 vehicles, 1,200 AI chats, 2,000 WhatsApp msgs, 1,500 emails |
| **Group** | enterprise | **R11,999.99/mo** | Unlimited vehicles*, 3,500 chats, 8,000 WhatsApp, 5,000 emails |

\*Fair-use policy in contract.

### Pilot programme (now)

| Terms | Detail |
|-------|--------|
| **Max dealers** | 15–20 |
| **Price** | R3,999.99/mo (negotiable for first 10 with 12-month commit) |
| **Features** | **Growth tier** — everything that works today |
| **Public pricing page** | Hidden until post-pilot |

**Founder rate (first 15 dealers, 12-month commit):** locked pilot price for life on Growth features.

### Steady-state (12+ months, product mature)

| Tier | Price |
|------|-------|
| Starter | R3,499 |
| Pro | **R6,999** (anchor) |
| Group | R11,999 |

### Overage (protects you from heavy users)

| Overage | Rate |
|---------|------|
| AI chat sessions beyond bundle | R12/session |
| WhatsApp utility messages beyond bundle | R1.20/msg |
| Extra SMS | R0.85/SMS |
| Extra storage (per 10 GB) | R150/mo |

**Do not** charge per car sold in Year 1 — variable bill + dealer distrust.

---

## 6. Why not lower than R2,999 Starter?

| Price | Problem |
|-------|---------|
| R1,499 | One heavy WhatsApp dealer can cost R400–600; need 3+ light dealers to break even on variable alone |
| R1,999 | Works only at pilot scale with **you** unpaid; no room for support or API spikes |
| R2,999 | Covers variable + small contribution to fixed with ~5–10 dealers |
| R5,499 Pro | **Sweet spot** — 2× Starter price, ~3× value story, ~R4,574 contribution each |

BluWave charges **R480–620/user/month**. A 5-person shop pays **R2,400–3,100** for CRM only. GrayArx Pro at **R5,499 all-in** (showroom + stock + AI + leads) is still defensible.

---

## 7. Monthly P&L scenarios (realistic)

### Scenario 1: Pilot — 8 dealers (mix)

| | |
|--|--|
| 5× Starter R2,999 | R14,995 |
| 3× Pro R5,499 | R16,497 |
| **MRR** | **R31,492** |
| Variable costs (~8 dealers) | (R2,000) |
| Stripe | (R900) |
| Platform fixed | (R5,260) |
| Contractors | (R15,000) |
| **Net before tax** | **R8,332** |

### Scenario 2: Traction — 25 dealers

| | |
|--|--|
| 10× Starter R3,499 | R34,990 |
| 12× Pro R5,499 | R65,988 |
| 3× Group R9,499 | R28,497 |
| **MRR** | **R129,475** |
| Variable + Stripe | (R12,000) |
| Platform + team | (R45,000) |
| **Net before tax** | **R72,475** |

### Scenario 3: Scale — 60 dealers

| | |
|--|--|
| Blended ARPU R5,800 | R348,000 MRR |
| Variable + Stripe (~18% of MRR) | (R62,000) |
| OPEX (team + infra) | (R95,000) |
| **Net before tax** | **~R191,000/mo** |

---

## 8. Cost control checklist (do this now)

1. **Keep `gpt-4o-mini`** — do not default to GPT-4o for Nala (10× cost).
2. **Template-first WhatsApp** — use LLM only when needed; stay in 24h service window (cheaper).
3. **Cap AI sessions per tier** — enforce in code before OpenAI call.
4. **TiDB spend limit** — set monthly cap on TiDB Cloud dashboard.
5. **Resend free tier** until >3,000 emails/month platform-wide.
6. **Skip SMS on Starter** — Twilio is R30–80/dealer fast.
7. **Photo mirroring optional** on import — external URLs cost you nothing in storage.
8. **Top up OpenAI** — insufficient_quota breaks Nala silently (templates only).

---

## 9. One-line pricing recommendation

| Stage | Charge |
|-------|--------|
| **Now (pilot)** | **R2,999 / R5,499 / R9,499** + R2,500 setup + overage caps |
| **Minimum to survive with contractors** | **7+ dealers on Pro** or **14+ blended** |
| **Minimum gross margin target** | **85%+** on variable (achievable at R2,999+ with caps) |
| **Do not launch at** | R1,499 flat unlimited AI WhatsApp — you will lose money on active dealers |

---

## 10. Align product UI

- `shared/subscriptionTiers.ts` — single source of truth (Showroom / Growth / Multi-site; future Group SKU deferred)
- `UpgradeModal.tsx` — dark theme, pilot messaging, no public prices while `PILOT_PRICING_HIDDEN`
- Public `/pricing` route redirects home — no price anchoring during pilot

---

*Internal reference: stack from `.env` (TiDB, OpenAI, Resend, WhatsApp, Twilio). Revisit when Stripe billing goes live or OpenAI usage exceeds R5,000/month platform-wide.*
