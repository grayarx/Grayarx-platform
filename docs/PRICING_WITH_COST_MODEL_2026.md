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

### 8.1 Model tiers — gpt-4o-mini, not GPT-5 / not GPT-4o for everyone

**User ask (“8.1 and not 5?”):** Do we need GPT-5 / expensive frontier models?

**Answer: No for Nala stock Q&A.** Do **not** default everyone to GPT-5 (or even GPT-4o).

| Tier | Default model | Why |
| ---- | ------------- | --- |
| **Showroom + Growth** | `gpt-4o-mini` | Stock Q&A + template polish; cost-safe |
| **Multi-site** | `gpt-4o` (via `OPENAI_MODEL_PREMIUM` or dealership `llmModel`) | Stronger when needed |
| **GPT-5 / frontier** | Opt-in override only | ~10–30× token cost vs mini; unnecessary for inventory facts |

Wired in `shared/llmModelTiers.ts`. Cost/risk of GPT-5 platform-wide: one chatty yard can burn the OpenAI budget that should cover 20+ dealers on mini.

### 8.2 Template-first WhatsApp — ELI5

**Plain English:** Most WhatsApp answers are written from **ready-made message templates** (price, colour, booking, greeting) that already know the car facts. We only call OpenAI when we want the wording to sound more natural. If OpenAI is down or the dealer hit their AI cap, the customer still gets a correct template reply — like using a script first, and AI only to polish the script.

### 8.3 Cap AI sessions?

**Yes — implemented.** `TIER_USAGE_CAPS` + `usageCaps.ts` soft-block before OpenAI polish; overage logged for later billing.

### 8.4 TiDB spend limit — free tier, dashboard, API, max R

**Can GrayArx set this automatically via our app?** No — TiDB spending limits are **not** controlled through our Node API. They are set in **TiDB Cloud**:

| Method | How |
| ------ | --- |
| **Console (usual)** | [TiDB Cloud](https://tidbcloud.pingcap.com/) → open cluster → **Capacity used this month** → **Set Spending Limit** / **Edit** → enter monthly USD → **Update Spending Limit** (add card if prompted) |
| **CLI** | `ticloud serverless spending-limit -c <cluster-id> --monthly <USD cents>` |
| **API / Terraform** | TiDB Cloud API v1beta1 / `tidbcloud_serverless_cluster.spending_limit` — ops tooling, not our product |

**Still on free tier?** Free Starter instances get a **hard product quota** (typically ~5 GiB row storage + ~50M RUs/mo per free instance). Hitting the quota usually **throttles / denies new connections** — you do **not** get a surprise invoice while spend limit stays **$0** and you never add billable overage. A spending limit matters when you **leave free**, add a card, or raise quota above free.

**Recommendation:**
- **Pure free (pilot):** Stay at **R0** billed. Still open TiDB billing alerts if available; watch RU % in the console weekly.
- **When leaving free / adding a card:** Set spend cap **immediately** — pilot max **USD $30–50 ≈ R550–R900** (at ~R18.50). Raise only after ~20 paying dealers.
- Email alerts at **50% / 80% / 100%** of the limit.
- Revisit after bulk imports (vehicle writes spike RUs).

### 8.5 Upgrade ladder reminders — Kagiso ownership

**Owner: Kagiso** surfaces upgrade milestones on `/admin/kagiso-roadmap` during the commercial audit when dealership count crosses triggers (see §5). Founder must still click the vendor dashboards — Kagiso cannot change Resend/TiDB/Railway/OpenAI billing.

| Trigger | Reminder Kagiso raises |
| ------- | ---------------------- |
| **~15–20 dealers** or **~2,400 emails** (80% of 3k) | Resend Free → Pro |
| **~20 dealers** / RU pressure / leaving free | TiDB spend limit + paid path |
| **~20–25 dealers** / traffic | Railway RAM/replicas |
| **~20 dealers** WhatsApp-active | OpenAI budget / auto top-up floor |
| **~60 dealers** | Larger infra (TiDB dedicated, Railway pro, reserved OpenAI, CDN) |

Until dealer count is high enough, founder checklist: Resend dashboard weekly; TiDB RU % weekly; OpenAI usage monthly.

### 8.6 Skip SMS on Starter

**Agreed and documented.** Showroom (`smsEnabled: false`) — Twilio is R30–80/dealer fast. SMS only Growth+.

### 8.7 Photo mirroring — “R3 not much, massive upgrade?”

**~R3/dealer/mo** (≈ light mirrored storage) is small for moderate yards. That is **not** a massive product upgrade — optional mirroring is **cost-control hygiene** (keep external URLs; mirror when you need durable CDN or unreliable source hosts).

**When it gets “massive”:** hundreds of cars × many photos × many dealers → storage + egress scales hard.

| Scale | Rough storage cost |
| ----- | ------------------ |
| 60 dealers × ~R3 | **~R180/mo** — still fine |
| Heavy yard: 500 cars × 8 photos mirrored | **R400–800/mo alone** for that dealer |
| Platform-wide forced mirroring | Cost control choice, **not** a feature leap |

Keep import mirroring **optional** by default.

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

## 10. Align product UI (source of truth)

| Area | Status |
| ---- | ------ |
| `shared/subscriptionTiers.ts` | Showroom / Growth / Multi-site; `TIER_LIMITS` + `TIER_USAGE_CAPS` |
| `shared/llmModelTiers.ts` | Showroom+Growth → `gpt-4o-mini`; Multi-site → `gpt-4o` (not GPT-5 default) |
| `server/_core/usageCaps.ts` | Soft-block AI + WhatsApp |
| `UpgradeModal.tsx` | Caps from `TIER_LIMITS`; pilot prices hidden |
| Public `/pricing` | Redirects home during pilot |
| Chat LLM | **OpenAI only → templates** (no Forge chat fallback) |
| Kagiso commercial audit | Infra upgrade milestones (§8.5) on roadmap |
| Older P&L docs | `OPERATIONAL_COST_ANALYSIS.md` + `PRICING_AND_PLnL_ANALYSIS.md` superseded |

---

## 11. How many dealerships to make a “mil”?

SA founders often mean **R1M/year**; investors sometimes mean **R1M/month**. Both below. FX/tax ignored; use contribution margins from §4 and OPEX from §2–§3 / scenarios §7.

**Assumptions:** blended ARPU **~R6,500**; Growth list **R7,999**; blended CM **~R5,500**; Growth CM **~R7,487**; variable+Stripe ≈ **~15% of MRR** at scale; solo founder salary **R25k or R40k**.

### A) R1,000,000 **MRR** (top-line subscription)

| Mix | Dealers for R1M MRR |
| --- | ------------------- |
| Blended ARPU ~R6,500 | **~154 dealers** |
| All Growth @ R7,999 | **~125 dealers** |
| All Showroom @ R3,999 | **~250 dealers** |
| All Multi-site @ R11,999 | **~83 dealers** |

### B) R1,000,000 **per month net** (after variable + Stripe + OPEX + founder salary)

Rough scale from §7 scenario 3 (~60 dealers → ~R246k/mo net after R40k salary ≈ **~63% net / MRR**):

| Target | Approx MRR needed | Dealers @ R6,500 ARPU | Dealers @ R7,999 Growth |
| ------ | ----------------- | --------------------- | ----------------------- |
| **R1M/mo net** (salary R40k) | ~R1.55–1.65M | **~240–250** | **~195–205** |
| **R1M/mo net** (salary R25k) | ~R1.50–1.60M | **~230–245** | **~190–200** |

This is a stretch goal — requires scaled infra ladder (§5) and is not pilot maths.

### C) R1,000,000 **per year net** (≈ R83k/mo net) — usual SA “make a mil”

| Burn / mix | Dealers (approx) |
| ---------- | ---------------- |
| §7 Scenario 2 — 25 dealers, salary R40k | **~R94k/mo net ≈ R1.1M/year** |
| Platform + R40k salary, mostly Growth CM | **~18–22 Growth** |
| Blended ARPU / CM ~R5,500, salary R40k + scaled light OPEX | **~22–28** |
| Platform + R25k salary, mostly Growth | **~15–18 Growth** |

**Rule of thumb:** **~20–25 paying dealers** (Growth-heavy) gets you near **R1M/year net** as a solo founder; **R1M/month net** needs **~200+ dealers**; **R1M MRR** needs **~125 Growth or ~154 blended**.

---

*Internal reference: stack from* `.env` *(TiDB, OpenAI, Resend, WhatsApp, Twilio, S3). Revisit when Stripe billing goes live or OpenAI usage exceeds R5,000/month platform-wide.*
