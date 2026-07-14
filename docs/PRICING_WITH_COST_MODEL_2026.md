# GrayArx Pricing — Cost-Grounded Model (2026)

**Purpose:** What to charge dealerships after accounting for what GrayArx actually pays each month.  
**Currency:** ZAR (USD converted at ~R18.50 where noted)  
**Last updated:** July 2026  
**Team model:** Founder only — no contractors. Pay yourself via **salary** or **dividends** (both shown below).

---

## 1. What GrayArx pays for (your stack)

| Service                     | Used for                         | Billing model                         |
| --------------------------- | -------------------------------- | ------------------------------------- |
| **TiDB Cloud**              | MySQL database (`DATABASE_URL`)  | Free tier → pay-as-you-go RUs/storage |
| **Railway / hosting**       | Node app + API + showroom        | Monthly compute                       |
| **OpenAI**                  | Nala chat, agent replies, polish | Per token (`gpt-4o-mini` default)     |
| **Meta WhatsApp Cloud API** | Dealer WhatsApp / Nala           | Per conversation / message category   |
| **Resend**                  | Lead ack, booking emails         | Free 3k/mo → Pro                      |
| **Twilio SMS** (optional)   | Reminders, alerts (Growth+)      | Per SMS (~R0.50–1.00 SA)              |
| **S3 storage**              | Vehicle photos (when mirrored)   | Per GB stored + egress                |
| **Cloudflare**              | Tunnel / CDN (if used)           | Often free tier                       |
| **Domain + SSL**            | grayarx.com                      | Annual ÷ 12                           |
| **Stripe** (when live)      | Card billing                     | ~2.9% + fixed fee per charge          |
| **Legal / accounting**      | POPIA, books, company            | Monthly retainer / as-needed          |

**Removed from cost model:** Manus Forge LLM (chat is OpenAI → templates only). Forge may still appear as a *legacy photo-storage* path if `S3_*` is unset — not a chat line item.

**Note:** We convert inbound attention; we are not an ad-buy agency.

---

## 2. Fixed platform costs (founder-only)

### Phase A — Pilot / solo founder (no sales team, no contractors)

| Item                   | Low        | Realistic  | Notes                                      |
| ---------------------- | ---------- | ---------- | ------------------------------------------ |
| Hosting (Railway prod) | R600       | R1,200     | Scales with traffic                        |
| TiDB Cloud             | R0         | R500       | Free tier first; **set spend cap** (see §8)|
| Resend                 | R0         | R360       | Free 3k emails; Pro ~$20 at ~15–20 dealers |
| Domain + misc SaaS     | R200       | R400       |                                            |
| OpenAI baseline        | R200       | R500       | Idle agents, audits, dev testing           |
| WhatsApp (platform)    | R0         | R0         | No monthly platform fee to Meta            |
| Storage (S3)           | R100       | R300       | Keep mirroring optional to stay low        |
| Legal / accounting     | R1,000     | R2,000     |                                            |
| **Platform subtotal**  | **R2,100** | **R5,260** | Before founder draw                        |

### Founder draw (choose one path — do not double-count)

| Draw option                         | Low (pilot) | Realistic (living) | Stretch        |
| ----------------------------------- | ----------- | ------------------ | -------------- |
| **A. Salary** (PAYE / company cost) | R15,000     | **R25,000**        | **R40,000**    |
| **B. Dividends** (after profit)     | R0          | R20,000            | R35,000        |

> Dividends only make sense once the company is profitable after tax advice. Until then, model **salary** as the living draw. Tables below use salary R25k / R40k and a dividend alternative.

| Burn view                                      | Monthly        |
| ---------------------------------------------- | -------------- |
| Platform only                                  | R2,100–5,260   |
| Platform + salary R25k                         | **R27,100–30,260** |
| Platform + salary R40k                         | **R42,100–45,260** |
| Platform + dividend R20k (once profitable)     | R22,100–25,260 |

### Phase B — Still founder-only, more dealers (scaled infra, light marketing)

| Item                            | Monthly             |
| ------------------------------- | ------------------- |
| Platform (scaled — see ladder)  | R8,000–15,000       |
| Founder salary                  | R25,000–40,000      |
| Marketing (organic + light ads) | R5,000–15,000       |
| **Total OPEX**                  | **R38,000–70,000**  |

> Older `OPERATIONAL_COST_ANALYSIS.md` assumed a full contractor team + Manus — **superseded** for pilot. Use this doc.

---

## 3. Variable cost per dealership

Estimates for a **typical independent dealer** (80–150 vehicles, moderate AI usage). Caps keep heavy users from blowing variable cost.

### Assumptions (moderate month)

| Activity                            | Volume                            | Unit cost                 | Monthly cost |
| ----------------------------------- | --------------------------------- | ------------------------- | ------------ |
| **Nala / OpenAI chat**              | 150 sessions × 6 turns            | ~R0.02/turn (gpt-4o-mini) | **R18**      |
| **OpenAI** (agents, polish, audits) | —                                 | —                         | **R40**      |
| **WhatsApp** (Growth+)              | 120 inbound + 80 outbound utility | R0–1.00/msg               | **R50–120**  |
| **Resend email**                    | 60 transactional emails           | ~R0.07/email (Pro plan)   | **R4**       |
| **SMS (Twilio)**                    | 40 SMS (Growth+ only)             | R0.75/SMS                 | **R30**      |
| **DB + compute share**              | —                                 | allocated                 | **R25**      |
| **Photo storage**                   | ~2 GB mirrored (if enabled)       | ~R0.15/GB                 | **R3**       |
| **Stripe fee** (on R7,999 sub)      | 1 invoice                         | 2.9%                      | **R232**     |

| Dealer profile                      | Variable cost (excl. Stripe) |
| ----------------------------------- | ---------------------------- |
| **Light** (Showroom, web chat only) | R80–120                      |
| **Moderate** (Growth, WhatsApp on)  | R170–280                     |
| **Heavy** (Growth, high chat + SMS) | R350–650                     |

**Caps (enforced in code):** Showroom 400 AI sessions/mo, no Cloud API WhatsApp bot; Growth 1,200 AI + 2,000 WA msgs; Multi-site 3,500 AI + 8,000 WA. Soft-block with a friendly message; overage logged for later billing.

---

## 4. Contribution margin & dealers to cover your living draw

**Contribution margin** = Subscription price − Variable cost − Payment processing

| Plan price | Variable (moderate) | Stripe (~3%) | Contribution margin |
| ---------- | ------------------- | ------------ | ------------------- |
| R3,999     | R150                | R116         | **~R3,733**         |
| R7,999     | R280                | R232         | **~R7,487**         |
| R11,999    | R450                | R348         | **~R11,201**        |

### Dealers needed to cover platform + founder draw

| Burn covered                         | Fixed OPEX | @ R3,999 CM | @ R7,999 CM | Blended ~R5,500 CM |
| ------------------------------------ | ---------- | ----------- | ----------- | ------------------ |
| **Platform only** (R5,260)           | R5,260     | 2 dealers   | 1 dealer    | 1 dealer           |
| **Platform + salary R25k** (~R30k)   | R30,260    | **9**       | **5**       | **~6**             |
| **Platform + salary R40k** (~R45k)   | R45,260    | **13**      | **7**       | **~9**             |
| **Platform + dividend R20k** (~R25k) | R25,260    | 7           | 4           | **~5**             |
| **Scaled solo + marketing** (~R55k)  | R55,000    | 15          | 8           | **~10**            |

**Rule of thumb (no contractors):** At **R7,999 Growth** with moderate usage and caps, you need about **5 paying Growth dealers** to cover platform + **R25k salary**, or **~7–9** at a blended ARPU if many are on Showroom. Aim for **~10–12 dealers** before treating R40k salary as reliable.

---

## 5. Upgrade ladder (when infra costs step up)

Build these into ROI — do not wait until something pages at 3am.

| Trigger (~dealers / volume)        | What to upgrade                         | Rough monthly step-up      |
| ---------------------------------- | --------------------------------------- | -------------------------- |
| **~15–20 dealers** or **~3k emails/mo platform-wide** | Resend Free → Pro (~$20)       | +R360                      |
| **~20 dealers** / heavier writes   | TiDB: confirm spend limit; leave free or small paid | +R500–2,000       |
| **~20–25 dealers** / traffic spikes| Railway: bump RAM/replicas              | +R500–1,500                |
| **~20 dealers** active WhatsApp    | OpenAI budget / auto top-up floor       | +R1,000–3,000              |
| **~25 dealers**                    | Meta WhatsApp quality + phone verification hygiene | — (time, not $) |
| **Stripe live** (any paying)       | Stripe fees already in CM; enable Checkout | ~3% of MRR              |
| **~60 dealers**                    | TiDB dedicated / higher RU; Railway pro; OpenAI reserved budget; consider CDN | +R5k–15k infra |

**Resend monitoring:** Stay on free until approaching **3,000 emails/month** platform-wide. Alert at ~80% (~2,400). Upgrade before hard fail on lead/booking mail.

---

## 6. Recommended pricing (cost-safe)

### Launch pricing (post-pilot list price)

| Tier           | Internal ID  | Price             | Max included usage                                              |
| -------------- | ------------ | ----------------- | --------------------------------------------------------------- |
| **Showroom**   | starter      | **R3,999.99/mo**  | 150 vehicles, 400 AI chats, 300 emails, web chat only, **no SMS**, **no Cloud API WhatsApp bot** |
| **Growth**     | professional | **R7,999.99/mo**  | 500 vehicles, 1,200 AI chats, 2,000 WhatsApp msgs, 1,500 emails |
| **Multi-site** | enterprise   | **R11,999.99/mo** | Unlimited vehicles*, 3,500 chats, 8,000 WhatsApp, 5,000 emails  |

Fair-use policy in contract. Caps enforced in `shared/subscriptionTiers.ts` + `server/_core/usageCaps.ts`.

### Pilot programme (now)

| Terms                   | Detail                                                      |
| ----------------------- | ----------------------------------------------------------- |
| **Max dealers**         | 15–20                                                       |
| **Price**               | R3,999.99/mo (negotiable for first 10 with 12-month commit) |
| **Features**            | **Growth tier** — everything that works today               |
| **Public pricing page** | Hidden until post-pilot                                     |

### Overage (protects you from heavy users)

| Overage                                 | Rate        |
| --------------------------------------- | ----------- |
| AI chat sessions beyond bundle          | R12/session |
| WhatsApp utility messages beyond bundle | R1.20/msg   |
| Extra SMS                               | R0.85/SMS   |
| Extra storage (per 10 GB)               | R150/mo     |

**Do not** charge per car sold in Year 1 — variable bill + dealer distrust.

---

## 7. Monthly P&L scenarios (founder draw included)

### Scenario 1: Pilot — 8 dealers

|                             | Amount       |
| --------------------------- | ------------ |
| 5× Showroom R3,999          | R19,995      |
| 3× Growth R7,999            | R23,997      |
| **MRR**                     | **R43,992**  |
| Variable costs (~8 dealers) | (R2,200)     |
| Stripe (~3%)                | (R1,320)     |
| Platform fixed              | (R5,260)     |
| **Net before founder draw** | **R35,212**  |
| Option A: salary R25k       | **Net ~R10,212** |
| Option A: salary R40k       | **Net ~−R4,788** (tight — stay lean or add 2 Growth) |
| Option B: dividend R20k     | **Net ~R15,212** (only if taking dividends) |

### Scenario 2: Traction — 25 dealers

|                             | Amount        |
| --------------------------- | ------------- |
| 10× Showroom R3,999         | R39,990       |
| 12× Growth R7,999           | R95,988       |
| 3× Multi-site R11,999       | R35,997       |
| **MRR**                     | **R171,975**  |
| Variable + Stripe           | (~R18,000)    |
| Platform (scaled + ladder)  | (~R12,000)    |
| Marketing                   | (~R8,000)     |
| **Net before founder draw** | **~R133,975** |
| Salary R40k                 | **Net ~R94k** |
| Dividend R35k               | **Net ~R99k** (alternative to salary, not both) |

### Scenario 3: Scale — 60 dealers

|                                 | Amount            |
| ------------------------------- | ----------------- |
| Blended ARPU ~R6,500            | ~R390,000 MRR     |
| Variable + Stripe (~15% of MRR) | (~R58,500)        |
| OPEX (infra ladder + marketing) | (~R45,000)        |
| Founder salary R40k             | (R40,000)         |
| **Net before tax**              | **~R246,500/mo**  |

---

## 8. Cost control checklist — answers (do this now)

### 8.1 gpt-4o-mini for all tiers?

**Recommend: No — not GPT-4o for everyone.**  
- **Showroom + Growth:** default `gpt-4o-mini` (already wired in `shared/llmModelTiers.ts`).  
- **Multi-site:** may use a stronger model (`gpt-4o` via `OPENAI_MODEL_PREMIUM` or dealership `llmModel`).  
Full GPT-4o on every Nala turn is ~10× cost and unnecessary for stock Q&A.

### 8.2 Template-first WhatsApp — ELI5

**Plain English:** Most WhatsApp answers are written from **ready-made message templates** (price, colour, booking, greeting) that already know the car facts. We only call OpenAI when we want the wording to sound more natural. If OpenAI is down or the dealer hit their AI cap, the customer still gets a correct template reply — like using a script first, and AI only to polish the script.

### 8.3 Cap AI sessions?

**Yes — implemented.** `TIER_USAGE_CAPS` + `usageCaps.ts` soft-block before OpenAI polish; overage logged for later billing.

### 8.4 TiDB spend limit — how to set (dashboard)

1. Log in to [TiDB Cloud](https://tidbcloud.pingcap.com/) with the GrayArx project.  
2. Open your **cluster** → **Settings** (or **Billing / Cost control**, depending on UI version).  
3. Find **Spending limit** / **Monthly budget** / **Cost alert**.  
4. Set a monthly cap you’re comfortable with for pilot (e.g. **USD $30–50** ≈ R550–R900) so runaway RUs cannot surprise you.  
5. Enable **email alerts** at 50% / 80% / 100% of the limit.  
6. If you hit the cap, TiDB may throttle or stop billable overage depending on plan — treat that as a feature during pilot, then raise the limit when you have 20+ paying dealers.  
7. Revisit after any big import/migration (bulk vehicle writes spike RUs).

### 8.5 Resend free until 3k — monitoring

Stay on Resend free until platform-wide volume approaches **3,000 emails/month** (~15–20 dealers on moderate transactional mail).  
- Watch Resend dashboard weekly during pilot.  
- Alert threshold: **~2,400 (80%)** → upgrade to Pro before lead/booking mail fails.  
- Included in the upgrade ladder (§5).

### 8.6 Skip SMS on Starter

**Agreed and documented.** Showroom (`smsEnabled: false`) — Twilio is R30–80/dealer fast. SMS only Growth+.

### 8.7 Photo mirroring optional — why it’s good

Import can keep **external image URLs** instead of downloading every photo into S3.  
**Why good:** mirrored photos cost storage + egress every month; optional mirroring means light dealers cost you almost nothing in storage while listings still show images from the source. Turn mirroring on only when you need durable CDN control or the source URLs are unreliable.

### 8.8 OpenAI auto top-up

**Founder control:** Auto top-up is **enabled** on the OpenAI billing account so `insufficient_quota` does not silently kill Nala polish (templates still work, but quality drops). Keep a sensible monthly budget alert; revisit at ~20 dealers.

### 8.10 Align UI with subscriptionTiers + caps

**Done:** `UpgradeModal` shows AI / WhatsApp / email caps from `TIER_LIMITS`; `TIER_USAGE_CAPS` is the numeric enforcement source of truth; WhatsApp Cloud API + SMS gated to Growth+.

---

## 9. One-line pricing recommendation

| Stage                                      | Charge                                                                 |
| ------------------------------------------ | ---------------------------------------------------------------------- |
| **Now (pilot)**                            | Growth features @ ~R3,999; public prices hidden                        |
| **Minimum to cover platform + R25k salary**| **~5 Growth dealers** or **~9 blended Showroom/Growth**                |
| **Minimum to cover platform + R40k salary**| **~7 Growth** or **~12–13 blended**                                    |
| **Minimum gross margin target**            | **85%+** on variable (achievable at R3,999+ with caps)                 |
| **Do not launch at**                       | R1,499 flat unlimited AI WhatsApp — you lose money on active dealers   |

---

## 10. Align product UI

- `shared/subscriptionTiers.ts` — single source of truth (Showroom / Growth / Multi-site; `TIER_USAGE_CAPS` for enforcement)
- `server/_core/usageCaps.ts` — soft-block AI sessions + WhatsApp before heavy paths
- `UpgradeModal.tsx` — dark theme, pilot messaging, caps in comparison table, no public prices while `PILOT_PRICING_HIDDEN`
- Public `/pricing` route redirects home — no price anchoring during pilot
- Chat LLM: **OpenAI only → templates** (no Forge chat fallback)

---

*Internal reference: stack from* `.env` *(TiDB, OpenAI, Resend, WhatsApp, Twilio, S3). Revisit when Stripe billing goes live or OpenAI usage exceeds R5,000/month platform-wide.*
