# GrayArx Pricing Model — Detailed Breakdown and Competitive Advantages in the South African Market

This document expands on `GRAYARX_PRICING.md` and the `references/sa-pricing.md` reference inside the `sa-ai-agent-saas` skill. It is written for an investor, a design partner, or a banker who wants the full reasoning behind the numbers — not the founder one-pager.

## 1. The Headline Model in One Paragraph

GrayArx sells a per-tenant, flat-rate, ZAR-denominated subscription with three published tiers (**Starter R 1 499 / Pro R 3 499 / Enterprise from R 7 999** per month, ex-VAT until the company crosses the R 1 million VAT-registration threshold). The headline tier is Pro: it includes all four named AI agents, full multilingual coverage, and a generous calling-minute pool, and the pricing page is laid out so a visitor's eye lands there first. Annual prepayment receives a 15 % discount on Starter and Pro. A time-limited Founding-50 offer gives the first fifty paying tenants 50 % off Pro for six months, locked in for life if they refer two further paying tenants. Enterprise is sold by negotiation and is not discounted publicly.

## 2. Tier-by-Tier Detail

### 2.1 Starter — R 1 499 / month

Starter targets a single-location dealership, a one-branch estate agency, or a sole-trader broker. The buyer's mental anchor is "I am replacing the two hours a day I spend answering Gumtree / AutoTrader enquiries manually," so the tier is priced to clear that bar at roughly R 50 / working day. It includes one named AI agent (Mia, the Email Agent), inbound enquiry capture from the public site, the dealer dashboard with live KPIs, the public shareable showroom listing pages, and replies in two languages chosen at signup. It deliberately excludes outbound calling, the nightly Prospector, peer-Network access, and the additional five language packs — those are upgrade triggers, not omissions.

The internal goal for Starter is **not** to be a profit centre. It is to be the lowest-friction "yes" in a procurement conversation. A R 1 499 / month line item rarely needs CFO sign-off at an SA SMB, so a sales champion can self-approve and start using the product the same day. Starter exists to let Pro happen later.

### 2.2 Pro — R 3 499 / month (headline tier)

Pro targets the two-to-five-location SMB dealer group, the multi-agent estate agency, and the broker with one or two assistants. This is the tier that gets the loud yellow "Most Popular" ribbon on the pricing page. It includes the full agent roster (Mia for email, Themba for outbound calling, Lerato for booking confirmations, Sipho for the nightly Prospector), up to one thousand inbound enquiries per month, a 300-minute outbound calling pool (overage R 0.50 / minute), all seven SA languages with the multilingual self-check pass active on every reply, the Agents command-centre with the unified activity feed, public listings, and read-only peer-Network gallery access (photos only, by design).

Pro is the tier where the unit economics genuinely work. At R 3 499 against an honest direct cost of roughly R 410 – R 540 per tenant per month (Twilio voice, Twilio number rental, optional Resend overage, payment processing, amortised support), the gross margin sits at approximately 85 %. That cushion is what makes the Founding-50 discount survivable.

### 2.3 Enterprise — from R 7 999 / month, negotiated

Enterprise targets multi-branded dealer groups, franchised estate agencies (Pam Golding, RE/MAX area offices), and broker networks with an internal marketing team. Pricing is bespoke and starts at R 7 999. The buyer is acquiring not only the software but a procurement-friendly contract surface: SSO, custom domain, audit-logged admin roles, custom agent personas and Twilio voices, white-labelled email sender domains, dedicated onboarding, an actual SLA with service credits, and a quarterly business review. Because procurement teams in this segment expect to negotiate, the published "from" anchor protects the floor while leaving headroom for a 20 – 30 % uplift on the largest accounts.

## 3. The Anchor — Why R 1 499 / R 3 499 / R 7 999

The anchor is not borrowed from a US template and currency-converted. It is triangulated from three independent reference points already documented in `references/sa-pricing.md`.

| Reference point | Range (ZAR / month) | What it tells us |
|---|---|---|
| Local SA CRMs (Leadtrekker, BaseCloud) priced per user | R 220 – R 1 100 / user | SA SMB internal "normal" range for 3–5 seats is R 1 000 – R 4 000 / month |
| Local dealer suites (AutoTrader, Cars.co.za, Property24) priced per dealership | R 1 500 – R 6 000 / dealership | The flat-rate ceiling SA SMBs already pay without flinching |
| US dealer SaaS imported as reference (DealerSocket, etc.) | $ 88 – $ 238 / user (~R 1 600 – R 4 300) | The mental ceiling for "but it does AI" surcharge in ZAR |

The intersection of these three is the R 1 500 – R 4 000 band, and the GrayArx headline tier sits inside it at R 3 499. The Starter is intentionally **below** the lower bound of dealer-suite pricing so it competes with "I'll just keep doing this manually" rather than with AutoTrader. The Enterprise floor at R 7 999 is intentionally **above** the upper bound of dealer-suite pricing so the buyer mentally categorises it as a strategic platform purchase, not a tool.

## 4. Unit Economics on Pro

The table below shows an honest steady-state monthly cost stack for a single Pro tenant who uses roughly half of the 300-minute calling pool and stays within the Resend free tier on email volume. It excludes founder time and fixed overheads.

| Cost line | Estimate (ZAR / tenant / month) | Notes |
|---|---|---|
| Twilio outbound voice (~ 150 min × R 0.65) | 98 | SA mobile rate; landline cheaper |
| Twilio inbound forwarding | 22 | Used only when buyer calls the published number |
| Twilio phone-number rental | 30 | One DID per tenant |
| Resend (or SendGrid) email | 0 | Within free tier on Pro inbound volume |
| LLM inference (Manus-bundled) | 0 | Included in platform cost |
| Hosting + database (Manus webdev) | 0 | Included in platform cost |
| Payment-processor fee (Yoco / Paystack at ~ 2.7 %) | 94 | On R 3 499 ZAR |
| Customer support amortised | 100 | One support hour / 35 tenants |
| **Total direct cost** | **~ 344** | |
| **Gross profit at R 3 499** | **~ 3 155** | |
| **Gross margin** | **~ 90 %** | Before fixed costs |

The margin is high enough to absorb the Founding-50 50 %-off-for-six-months promotion (margin drops to roughly 80 % during the promo window) without leaving the company underwater. It also leaves room for the annual-billing 15 % discount without renegotiating the underlying model.

## 5. Discount Architecture

The discount structure is deliberate, narrow, and time-limited. Sprawling discount menus train buyers to wait, which is the last thing a new SA SaaS needs.

**Founding-50** is the headline acquisition lever: 50 % off Pro (R 1 749 / month) for the first six months, capped at the first fifty paying tenants, and locked in for life if the tenant refers two further paying tenants. The public homepage carries a live "27 / 50 founder slots claimed" counter. The offer terminates at exactly fifty even if demand is still strong, because the lock-in-for-life economics only work on a finite cohort and visible scarcity converts faster than a perpetual promotion.

**Annual prepayment** earns a flat 15 % discount on Starter and Pro, paid upfront in ZAR. It is not offered on Enterprise — enterprise procurement teams expect bespoke discounting and a published 15 % both undersells the tier and removes negotiation room. Annual prepayment is invoiced through the founder's payment processor and recognised as deferred revenue.

**Referral credits** outside the Founding-50 cohort are kept simple: one month free on Pro for each tenant the referrer brings in, capped at twelve months per year. This is structurally identical to a 1/12 ≈ 8 % effective discount but is psychologically priced as a "free month," which converts better.

## 6. Competitive Advantages in the South African Market

The pricing model is one half of the moat. The structural design of the product is the other half, and the two reinforce each other. Below are the seven competitive advantages a GrayArx-shaped SaaS holds against the alternatives a SA dealership or estate agency would otherwise evaluate.

### 6.1 Localisation depth that imports cannot replicate cheaply

A US dealer SaaS can translate its UI into English-SA in an afternoon. It cannot, in the same afternoon, write tone rules for isiZulu honorifics, run a self-check pass that detects "I hope this email finds you well" as a forbidden American opener, or fail-fast on Afrikaans replies that use "jy" instead of "u" in a first reply to an adult buyer. The seven-language self-check pass documented in `references/multilingual-guardrails.md` is roughly four weeks of work for an SA-native team and a six-month project for a US team that has to hire SA linguists. The price premium GrayArx commands over Leadtrekker is the visible artefact of that gap; the gap itself is the moat.

### 6.2 POPIA compliance baked into the product surface, not bolted on

The six-document legal pack (Privacy, Terms, AI Ethics, DPA, AUP, SLA), the AI Transparency Badge on every persona surface and email signature, the POPIA disclosure footer in every Mia draft, and the s.69 / s.71 / s.72 citations in the policies form an enterprise-procurement-ready surface. A US competitor passes a security questionnaire by adding a GDPR addendum; a SA enterprise buyer's procurement team will reject that because POPIA is not GDPR, and POPIA section numbers are what their lawyer is checking against. GrayArx ships those references; the alternatives do not. This is what unlocks the Enterprise tier as a category, not just as a higher Pro plan.

### 6.3 SA payment-processor optionality

The architecture supports Yoco, Paystack, and Stripe-SA interchangeably, picked per founder. Local CRMs that depend on overseas card-acquiring force their tenants through 3DS flows that fail at roughly 12 – 18 % on SA cards and quietly sink revenue. By staying processor-agnostic and defaulting to Yoco or Paystack (both of which authorise SA cards at materially better rates), GrayArx tenants collect more of the money their AI agents earn them. Pricing this in at the platform level — rather than charging a "payment add-on" the way some US tools do — is a quiet but real cost advantage.

### 6.4 Per-tenant flat pricing instead of per-seat

Every SA CRM in the benchmark table charges per user. SA dealerships and estate agencies grow by adding salespeople in small bursts (one or two at a time), and per-seat pricing introduces a small but visible friction at every hire. Flat per-tenant pricing removes that friction entirely — when the third salesperson starts on Monday, no procurement conversation is required. Sales cycles get shorter because the expansion question is removed from the sale.

### 6.5 Outbound calling included, not bolted on

Twilio-powered outbound calling sits inside the Pro tier rather than as a paid add-on. Local competitors generally route calling through manual click-to-dial integrations with the dealership's existing phone line, which leaves the call data outside the CRM and forces the salesperson to log notes manually. Themba, the Calling Agent, places the call, records the disposition into the same `agent_activity` table the Email and Booking agents read from, and triggers Lerato to confirm any appointment that comes out of the conversation. The handoff is automatic. A US competitor can match this on paper, but their SA per-minute Twilio cost is the same as ours and their headline price is two to four times higher.

### 6.6 Shared agent activity log enables genuine multi-agent coordination

The `agent_activity` table — and the fact that all four agents read from and write to it — is the single architectural choice that makes the agents feel like a team rather than four chatbots that happen to share a logo. Sipho qualifies a prospect overnight; Themba dials them in the morning with the qualification rationale in front of him; if Themba books a viewing, Lerato sends the confirmation; if the prospect emails back, Mia replies with full visibility of what the other three already said. A competitor with per-agent state stores cannot match this without a fundamental refactor, and the user-visible effect ("the AI remembers what we already discussed") is what most reliably converts a free trial into a paid Pro subscription.

### 6.7 Photos-only peer Network instead of an open marketplace

The Network page is photos-only, with no tenant contact details, prices, or full tenant names exposed to peers. This sounds like a feature limitation; in practice it is a competitive positioning advantage. SA dealerships are intensely protective of their lead funnel and unwilling to share inventory with a competitor who can poach buyers. A photos-only Network reassures the dealer that GrayArx is on **their** side, not a Trojan horse for a marketplace play. It also keeps GrayArx structurally outside the AutoTrader / Cars.co.za competitive set, which means the dealer's existing AutoTrader spend is unthreatened and the GrayArx purchase is incremental rather than substitutive. Incremental purchases close measurably faster than substitutive ones.

## 7. Where the Model Will Be Pressure-Tested

Two pressure points are worth flagging openly because they will surface in any serious investor conversation.

The first is Twilio variable cost on Pro. The current 300-minute allocation comfortably covers the median tenant but underprices the top decile. The mitigation is the published R 0.50 / minute overage, which sits roughly 25 % below Twilio's underlying SA mobile rate to a Twilio number — the tenant always perceives overage as cheap, while the platform never loses money. The risk to monitor is sustained high-volume calling tenants whose net margin slides toward 60 %; the response is a soft upgrade conversation to Enterprise once a tenant exceeds 600 minutes for three consecutive months.

The second is the Founding-50 lock-in-for-life clause. Fifty tenants at R 1 749 / month indefinitely is approximately R 1 049 400 / year of permanently-discounted ARR. If the company ever raises a priced round, a sophisticated investor will discount the gross-revenue ARR by that lock-in liability. The mitigation is to draft the lock-in clause so it survives an acquisition but not a fundamental product replatform — i.e. a "v1 Pro at R 1 749 forever" tenant migrating to a future "v2 Pro" pricing tier is a normal commercial conversation, not a contractual obligation. This is a single sentence in the Founding-50 terms and should be written in before tenant fifty is closed.

## 8. Summary Table for an Investor

| Dimension | GrayArx Pro | Local SA dealer suite | US AI-CRM equivalent |
|---|---|---|---|
| Headline price (ZAR / month) | 3 499 | 2 200 – 5 800 | 4 500 – 10 800 |
| Pricing unit | Per tenant flat | Per dealership | Per user |
| Outbound AI calling | Included (300 min) | Add-on or absent | Add-on |
| Languages with tone self-check | 7 SA languages | English only | English only |
| POPIA-cited legal pack | 6 documents, statute-referenced | Generic privacy page | GDPR template, no POPIA |
| Multi-agent coordination | Shared activity log | None | Per-agent silos |
| Peer Network | Photos only, non-competitive | None | None |
| Gross margin at headline tier | ~ 90 % | ~ 70 % (per-seat squeezes margin) | ~ 75 % |
| Founding-50 acquisition lever | 50 % off, lifetime for referrers | None published | None |
