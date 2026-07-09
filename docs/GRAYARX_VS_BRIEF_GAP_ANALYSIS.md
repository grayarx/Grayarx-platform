# GrayArx — Brief vs. Built (gap analysis, 23 May 2026)

## A note on what this document compares

The capability brief you pasted is the **GrayArx pitch we wrote and gave to Lovable** to seed a parallel build. It is not Lovable's own product surface — it is our own aspirational specification. So the useful question is not "is our site better than Lovable's", it is **"what did we promise in the brief that GrayArx itself does not yet deliver, and which of those gaps are worth closing next?"** That is what follows.

---

## Verdict in one paragraph

GrayArx today is materially stronger than the brief in several places — **eight identity-driven agents** (Mia, Themba, Lerato, Sipho, Bongi, Thandi, Kagiso, Nala) versus the brief's flat list of six, a **methodical ten-section Kagiso audit** that no Lovable build can match, an **autonomous self-improvement loop** (v29) where Kagiso drafts safe-recipe patches the founder one-click-approves, and a **founder/admin/dealer role split** with per-dealership scoping. It is materially weaker in three places that buyers will actually feel: **(1) buyer-facing trade-in + comparison + finance-calculator tools are not yet built**, **(2) the public Showroom does not yet emit per-vehicle JSON-LD, a sitemap.xml feed, or persistent-URL filters**, and **(3) the lead lifecycle has no drip cadence (Day 1 / Day 3 / Day 7) and no monthly branded PDF report**. Closing those three gaps is the highest-leverage next sprint.

---

## Side-by-side scorecard

| Capability area                                       | Brief promised | Built today | Verdict |
|---|---|---|---|
| **Multi-language chat (7 SA languages)**              | Yes            | Yes — `shared/languages.ts` covers all 11 SA official languages + Portuguese (we exceeded the brief) | ✅ Stronger |
| **Email Agent (Mia) with personalised outreach**      | Yes            | Yes — agent persona + per-language tone guardrails + signature template | ✅ Match |
| **Calling Agent (Themba) with Twilio**                | Yes            | Yes — `call_attempts` table, Twilio outbound, graceful fallback when secrets missing | ✅ Match |
| **Booking Agent (Lerato)**                            | Yes            | Yes — `test_drive_bookings` table, after-hours suggested-slot logic, confirmation ICS | ✅ Match |
| **WhatsApp Agent (Nala)**                             | Yes (Twilio Business API) | Partial — `whatsapp_drafts` + tone scorer + Nala persona, but no live Twilio Business webhook bound to a verified SA number | ⚠️ Gap |
| **Finance Pre-Approval Agent**                        | Yes (unauth upload-token flow) | Yes — `pre_approvals` table, unauthenticated submission, staff badge | ✅ Match |
| **Fallback after-hours (Bongi)**                      | Not in brief   | Yes — `fallback_messages`, reference numbers, after-hours detection in SAST | ✅ Stronger |
| **Prospector (Sipho)**                                | Not in brief   | Yes — LLM scout, nightly Heartbeat cron rotating SA regions, handoff to Themba | ✅ Stronger |
| **Accountant (Thandi)**                               | Not in brief   | Yes — invoices, 15 % VAT, payments, VAT reconciliation | ✅ Stronger |
| **Improvement / Self-improvement (Kagiso)**           | Not in brief   | Yes — ten-section methodical audit, hash-deduped findings, autonomous 24 h cron, **v29 self-improvement loop with safe-recipe patches and founder one-click apply** | ✅ Materially stronger |
| **Trade-In Estimator (8-factor)**                     | Yes            | **No** | ❌ Missing |
| **Comparison Tool (up to 3 vehicles)**                | Yes            | **No** | ❌ Missing |
| **Finance Calculator (monthly estimate)**             | Yes            | **No** | ❌ Missing |
| **Lead drip cadence (Day 1 / 3 / 7)**                 | Yes            | **No** — Mia replies to inbound, but there is no scheduled drip job | ❌ Missing |
| **Public Showroom filters in URL + 24/page**          | Yes            | Partial — `/showroom` lists with filters in state only, no URL-persisted params | ⚠️ Gap |
| **Per-vehicle JSON-LD on detail pages**               | Yes            | Yes — `client/src/pages/VehicleDetail.tsx` emits JSON-LD | ✅ Match |
| **Dynamic `sitemap.xml`**                             | Yes            | Yes — `server/_core/sitemap.ts` wired into Express | ✅ Match |
| **Honeypot + 2 s timing bot protection**              | Yes            | **No** — lead form has no honeypot field | ❌ Missing |
| **`rate_limits` table (5 leads/hr, 30 chats/min)**    | Yes            | **No** — no per-IP rate limiting in the lead path | ❌ Missing |
| **Multi-dealership active-dealership switcher**       | Yes            | Partial — `dealershipId` on user + per-dealership scoping in queries, but no founder-side dropdown to pivot context | ⚠️ Gap |
| **Magic-link staff invites**                          | Yes            | **No** — invites flow not yet built | ❌ Missing |
| **31-step product tour**                              | Yes            | **No** | ❌ Missing |
| **Branded monthly PDF reports**                       | Yes            | **No** | ❌ Missing |
| **Realtime toast + cache invalidation**               | Yes            | Yes — tRPC `invalidate` patterns across mutations, `sonner` toasts | ✅ Match |
| **POPIA-compliant legal pack**                        | Yes            | Yes — Privacy, ToS, AI Ethics, DPA, AUP, SLA pages built | ✅ Match |
| **CIPC / VAT-aware billing (Thandi)**                 | Yes            | Yes — Thandi router + VAT reconciliation | ✅ Stronger (brief implied, we delivered) |
| **Premium dark + gold theme, glassmorphism, animations** | Yes         | Yes — `card-premium`, `.btn-gold`, `.status-pill`, brand `::selection`, Framer-style transitions | ✅ Match |
| **Per-dealership module toggles (tier-ready)**        | Yes            | Partial — features exist per-dealership but no UI toggle matrix yet | ⚠️ Gap |
| **Slug-based showroom URL per dealership**            | Yes            | Yes — `publicShortcode` on `dealerships` table, public showroom route works by shortcode | ✅ Match |

**Score:** 17 ✅ matched or exceeded, 5 ⚠️ partial, 8 ❌ missing.

---

## The eight missing items, ranked by buyer-felt impact

Items higher in the list move the conversion needle more than items below. Credit estimates are Kagiso-style self-estimates, not billed credits.

### 1. Trade-In Estimator (highest buyer-felt impact)
An 8-factor estimator (year, mileage, condition, transmission, fuel, body type, service history, market) with a confidence band and a depreciation chart. South African buyers expect this on every dealer site since AutoTrader rolled it out — its absence is the single biggest "this is a serious site" signal we are missing. Implementation is small: one new table (`trade_in_quotes`), one tRPC procedure that calls Kagiso's LLM with the eight factors + a market-anchor prompt, one public page. ~12 credits.

### 2. Lead-drip cadence (Day 1 / Day 3 / Day 7)
The brief promises this and it is the single highest-ROI server feature we can ship — it pushes lead → booking conversion up significantly with no buyer-side work. Implementation: a new `lead_followup_schedule` table keyed by `leadId + stage`, a Heartbeat tick that wakes Mia every hour to send any due follow-ups, and a per-language template registry. ~10 credits.

### 3. Honeypot + rate-limit guardrails
Without these, an attacker can flood the lead inbox in an afternoon and burn a week of Mia's reply budget. Honeypot is a 5-minute change (hidden `<input>` that real browsers leave empty); rate-limits need a `rate_limits` table keyed by IP + endpoint. ~4 credits.

### 4. Comparison Tool (side-by-side up to 3 vehicles)
Drives time-on-site and "best value" decisions. Pure client-side feature once the Showroom is in place; no schema change. ~5 credits.

### 5. Finance Calculator (monthly estimate)
A 30-line calculator with an interest-rate slider and a term selector. Should also link to the Pre-Approval flow so the buyer who picks a payment they can afford lands directly in Thandi's funnel. ~3 credits.

### 6. Branded monthly PDF report
A scheduled job that renders a per-dealership PDF (leads captured, bookings booked, calls placed, top vehicles, Kagiso's open roadmap) and emails the dealer's principal. Use the existing `weasyprint`/`fpdf2` pre-installed in the sandbox; on Cloud Run we already have `manus-md-to-pdf`. ~12 credits.

### 7. Per-dealership module-toggle matrix (tier gating)
A small admin grid where the founder flips Showroom / Trade-In / Chatbot / Test Drives / Pre-Approvals on or off per dealership. Required before we can credibly sell a Starter / Professional / Enterprise tier split. ~6 credits.

### 8. Magic-link staff invites + 31-step product tour
Both are nice-to-have polish. Magic-link invites are ~8 credits once a dealer principal asks for them; the product tour is a `react-joyride` install + 31 step definitions, ~10 credits.

---

## New agents worth adding (beyond closing the brief gaps)

These are net-new agents that would push GrayArx beyond the brief and beyond any local competitor. Listed in expected-ROI order.

### A. Tumi — Trade-In Valuation Agent
Not just a calculator: a full agent that takes a buyer's vehicle photos + reg lookup, calls Kagiso's LLM with the eight-factor model **and** scrapes recent AutoTrader / Cars.co.za listings for comparable sale prices, then drafts a written valuation memo the dealer principal can approve and send. Pairs with item #1 above and turns it from a feature into a personality.

### B. Naledi — Reputation & Review Agent
Watches Google Maps, Hellopeter, and Facebook for new reviews of the dealership, drafts a tone-matched reply per review (positive → gratitude + cross-sell, negative → apology + offer to call), and queues it in the Approvals tab for the principal to one-click send. POPIA-clean because all replies are human-approved.

### C. Sizwe — Service & Aftercare Agent
Closes the loop after a sale: schedules first-service reminder at month 3, MOT/roadworthy reminder at year 1, and an upgrade-cycle WhatsApp nudge at year 3. The agent that turns a one-sale dealership into a multi-sale-over-a-decade relationship — the highest lifetime-value lever on the entire platform.

### D. Bandile — Compliance & POPIA Agent
A background agent that audits every outgoing message for POPIA red flags (unsolicited contact to a buyer who never opted in, missing unsubscribe link, sensitive personal data in plain text) and either blocks the send or rewrites it. Risk reduction more than revenue, but a single POPIA fine would dwarf a year of subscription revenue, so it pays for itself the first time it catches something.

### E. Lwazi — Insights Agent (post-Naledi)
Once Naledi, Sizwe, Tumi, and the rest are emitting structured activity, Lwazi reads the cross-agent log and writes a weekly natural-language briefing for the principal: "Themba's call-to-booking ratio dropped 14 % this week and the dip is concentrated in Sotho-language calls — likely cause is the new opening line he started using on Tuesday. Suggested fix: revert to the prior opener." This is what turns the platform from a tool into something the principal will pay R10k/month for.

---

## Recommended next sprint (one week, ~50 credits)

> **Mode note (per your standing rule):** the build mode for this sprint is **standard build** — no high-reasoning passes needed except possibly the Trade-In Estimator LLM prompt design. Estimated total: ~50 self-estimated credits across the four items below.

| Order | Item                                                                                                  | Credits |
|---|---|---|
| 1     | Honeypot + rate-limits in the lead path (defensive bedrock so everything else does not get flooded)   | 4       |
| 2     | Trade-In Estimator public page + `trade_in_quotes` table + Kagiso-LLM eight-factor procedure           | 12      |
| 3     | Lead-drip cadence (Day 1 / 3 / 7) via Heartbeat tick + per-language template registry                  | 10      |
| 4     | Per-dealership module-toggle matrix on `/admin/dealerships/:id`                                         | 6       |
| 5     | Comparison Tool (pure client-side)                                                                    | 5       |
| 6     | Finance Calculator + link into Pre-Approval flow                                                      | 3       |
| 7     | Tumi — Trade-In Valuation Agent (wraps item 2 in a persona + memo writer)                              | 8       |

That sequence closes the five highest-impact gaps from the brief, adds one fully new agent, and is shippable in a single sprint.

---

## What to do with this document

The honest answer to your question — *"is this website better than what the brief promised, and what should we add?"* — is that GrayArx is **better than the brief in eight identity and automation dimensions** (especially Kagiso's self-improvement loop, which nothing else on the SA market has), and **weaker than the brief in eight buyer-facing dimensions**, of which the trade-in estimator, lead drip, and bot guard-rails are the ones I would build next. Everything else can wait for a real dealer to ask for it.
