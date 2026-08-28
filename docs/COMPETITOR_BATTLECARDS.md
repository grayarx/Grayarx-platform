# GrayArx competitor battlecards

Use this when a dealer says “we already have X.”
**Rule:** never trash them. Position GrayArx as the **conversion layer** that sits alongside AutoTrader / MotorX / CRM.

**Live desk:** [/admin/competitors](/admin/competitors) — pick a competitor or paste what the dealer said.
**API:** `GET /api/competitors`, `?id=motorx`, `?q=We+use+MotorX`
**Code:** `lib/competitors/` (wired into Themba’s `competitor-named` replies)

---

## Market map (who sells what)

| Competitor | Category | What they sell | Public pricing (ZAR / noted) | Same as GrayArx? |
| --- | --- | --- | --- | --- |
| **MotorX** | Full dealership platform | CRM, stock syndication (AutoTrader/Cars/FB), WhatsApp inbox + AI *drafts*, finance tools, e-sign, multi-branch, social auto-post | **Custom** Starter / Professional / Enterprise (month-to-month, 30-day cancel). No ZAR on site — demo first. | **No** — broad OS. AI assists humans; not Nala owning buyer→booking. |
| **CarLeads** | Dealer CRM | Leads + stock + AutoTrader/Cars sync + WhatsApp follow-ups | Quote only (not public) | **Partial** — CRM, not buyer AI showroom. |
| **lieKa Closer** | DMS-linked CRM | Web/FB/WhatsApp leads + follow-ups synced to lieKa DMS | Quote / debit-order stack | **No** |
| **Adas DMS** | Classic DMS | Stock costing, invoices, VAT, floorplan, feeds, SAPS | ~**R1.2–1.5k/mo** band + cloud/user; websites **R3.3–9.8k** (quoted) | **No** — back-office. |
| **Autosoft** | DMS | Commissions, VAT, invoices, floorplan, stock | Packages from ~**R9,500** (license) | **No** |
| **Jouver** | Lite DMS | Stock/DMS for small yards | Free ≤10 vehicles; from ~**R179/mo** | **No** |
| **VMG DMS** | Independent DMS | Lite/Pro/Accounting + lot tools | Quote only | **No** |
| **DealershipIQ** (moonIQ) | WhatsApp chatbot | FAQ, brochures, book test drive, CRM handoff | Not public (demo) | **Closest** WhatsApp cousin. |
| **Trinstel** | WhatsApp AI studio | 24/7 qualify + book sales/**service/parts**, CRM sync, 14-day live | Not public (audit/trial) | **Similar pitch** + parts angle. |
| **Conversio** (AmbitX) | Horizontal WhatsApp AI | Any-industry sales agent, POPIA, 11 languages | Custom ZAR, month-to-month | **Similar channel**, not stock-native. |
| **Raimond** | SEO + WhatsApp bot | Automotive bot + SEO | Bot **R5,000/mo** (1k chats) / **R10,000/mo** (5k) | **No** — horizontal bot + SEO. |
| **Visio BDC** | WhatsApp nurture | Signal→template WhatsApp for dealers | **R1,500 / R3,000 / R5,000**/mo | **No** — templates, not live-stock AI. |
| **Privyr** | Mobile CRM | Marketplace lead alerts → human WhatsApp templates | Free + Pro (~**$25–35/user/mo** USD) + lead fees | **No** — speeds humans. |
| **Leadtrekker** | General LMS | Lead management + WA/ads | From ~**R249/user/mo** | **No** |
| **auto-HUB** | Network lead hub | OEM/dealer lead distribution & reporting | Quote / OEM-driven | **No** |
| **AI Automated Solutions** | Agency automation | Custom WA + stock + missed-call builds | **R2.5–26k/mo** (typical ~**R14.9k**) | **Partial** — custom vs product. |
| **AutoTrader / Cars.co.za** | Marketplace | Buyer traffic + listings | Dealer packages (sales-quoted) | **No** — traffic. **Never compete.** |

**Typical SA price bands (2025–26 research):**
- WhatsApp nurture / BDC: **~R1,500–R5,000/mo**
- WhatsApp AI / bots: **~R4,000–R12,000/mo** (Raimond R5–10k public-ish)
- Full DMS/platform: **custom** (Adas entry ~R1.5k–2k stack; MotorX full suite demo-priced)
- Custom AI agency: **~R2,500–R26,000/mo** (typical ~R15k)

---

## “We already use MotorX” — what to say

### Do **not** say
“Cancel MotorX / we’re better at everything.”

### Do say
“Perfect — keep MotorX. GrayArx doesn’t replace your CRM or stock feeds. We sit **on top of the leads MotorX (and AutoTrader) already collect** and turn after-hours enquiries into **booked viewings** before your team opens.”

### Beat MotorX on these lanes only

| Lane | MotorX | GrayArx wedge |
| --- | --- | --- |
| After-hours buyer chat | WhatsApp inbox + AI *suggestions* for staff | **Nala answers alone** from live stock |
| Marketplace lead at 21:00 | Lead sits in CRM until morning | Instant reply → book viewing |
| Missed call | Often logged / missed | WhatsApp recovery in &lt;60s |
| Proof | Platform features | **Monday ROI:** recovered leads + viewings booked |
| Risk | Full platform commit | **Free parallel pilot** — no cancel of MotorX |
| Price | Full suite (custom, multi-module) | Cheaper **conversion-only** tier |

**One-liner:**  
*“MotorX runs the dealership. GrayArx never lets an AutoTrader lead go cold overnight.”*

**Founder cheat (we use this / this / that):**
1. **Live-stock Nala** — answers alone after hours (their AI drafts for humans).
2. **Marketplace recovery** — AutoTrader/Cars lead at 21:00 → reply → booking.
3. **Missed-call → WhatsApp** in under a minute.
4. **Monday ROI report** — recovered leads + viewings, not a module tour.
5. **Price** — Convert **R2.5–4k/mo** + free pilot vs full MotorX suite + vs Raimond R5–10k chat bots.

---

## Battle lines vs each category

### vs WhatsApp bots (DealershipIQ / Trinstel / Conversio / Raimond)
**They:** chat on WhatsApp.  
**You:** live stock truth + branded showroom path + marketplace ingest + missed-call recovery + Monday proof.  
**Price angle:** Raimond R5–10k for generic bot; you sell **viewings booked**, undercut on Convert while looking premium on ROI.  
**Product gap to close:** Trinstel already pitches **parts + service** — Professional OS ships both live (dealer catalog + service calendar).

### vs Privyr / Visio
**They:** alert humans / send templates (Visio R1.5–5k).  
**You:** AI closes the first mile (qualify + book) then hands warm lead to human.

### vs CarLeads / lieKa / Adas / Autosoft / DMS
**They:** back-office + pipeline.  
**You:** buyer-facing conversion. Integrate later — don’t rebuild invoices day one.

### vs AutoTrader / Cars.co.za
**Never compete.** Sell: “You already pay for traffic. We convert it.”

### vs custom AI agencies (~R15k typical)
**Productised Convert + free pilot** beats scope-creep retainers.

---

## Recommended GrayArx packaging (to beat on price *and* clarity)

| Package | Target | Price band (suggested) | Includes |
| --- | --- | --- | --- |
| **Pilot** | Any yard | **R0 / 14 days** | Nala on their stock, web + 1 channel, Monday report |
| **Convert** | MotorX/Adas users | **R2,490–R3,990/mo** | Web + WhatsApp, marketplace lead recovery, missed-call, ROI |
| **Starter / Professional OS** | Chatbot R5–10k | **R7,990 / R14,990/mo** | Full AI dealership OS — sales + parts + service + recovery + Monday ROI |
| **Group** | Multi-yard | Custom | Multi-branch + SSO + SLA + CRM webhooks |

Undercuts Raimond Pro (R10k) and agency typical (~R15k); sits **below** a full MotorX commitment while staying **above** toy template tools — price for **ROI**, not feature count.

---

## Feature roadmap to “best in every lane” (order matters)

### Already shipping / in this repo
- Discovery sales funnel (Themba) + competitor battlecards in replies
- Conversion engine: lead → Nala → booking → ROI → pilot
- Competitor desk at `/admin/competitors`

### Next (must-have to win MotorX conversations)
1. Live AutoTrader + Cars.co.za lead ingest  
2. Production WhatsApp send (Meta)  
3. Missed-call → WhatsApp recovery (Twilio)  
4. Dealer Monday email report (auto)  
5. CRM webhook into MotorX / CarLeads (friend the platform)

### Then (expand categories without becoming MotorX)
6. **Parts / service WhatsApp** (close Trinstel gap) — fitment Q&A + book service  
7. Trade-in capture → handoff to appraiser  
8. Finance pre-qual link (partner, don’t build a bank)  
9. Multi-branch stock + routing  

### Don’t build first
- Full DMS (Adas already owns this cheaply)  
- “Cancel AutoTrader” features  
- Social Shorts factory (MotorX marketing module) until conversion is proven  
- E-sign + full finance OS (MotorX lane)

---

## Objection cheat-sheet

| They say | You say |
| --- | --- |
| “We have MotorX.” | “Keep it. We only own after-hours → booked viewing. Free pilot beside MotorX.” |
| “We have a WhatsApp bot.” | “Does it answer from **live** stock and book viewings from AutoTrader at 9pm? Show Monday numbers.” |
| “Too expensive.” | “One recovered weekend sale pays for months. Pilot is free. Convert is under Raimond/agency.” |
| “We’re fine — we answer fast.” | “What’s first response after 6pm and Sundays?” (discovery script) |
| “Come back when you have parts/service.” | “Parts + service are live on Professional — import their catalog and we quote their prices.” |
| “We already pay AutoTrader.” | “Good — we convert that traffic overnight. We never replace AutoTrader.” |
