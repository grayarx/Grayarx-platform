# How GrayArx works (simple + complete)

GrayArx is the **dealership operating system**. Nala is the AI that talks to buyers on WhatsApp. Everything important is saved, and a copy is pushed to CRM (MotorX/CarLeads/Adas webhooks) and to outboxes (WhatsApp / email) so you can prove it worked.

---

## The big picture (like a shop)

1. A customer wants a **car**, a **part**, a **service**, a **trade-in**, or **finance**.
2. They message (or AutoTrader sends a lead, or they call and nobody answers).
3. **Nala** reads the message and picks the right desk.
4. Nala answers from **real stock / parts**, books what it can, and **WhatsApps** the answer.
5. GrayArx tells the **CRM** what happened.
6. On Monday the GM gets a **ROI email** with the numbers.

---

## Sales (buy a car)

1. Lead arrives (AutoTrader / Cars.co.za / website / WhatsApp).  
   → `POST /api/marketplace/ingest` or poll fixtures.
2. Nala matches live stock (e.g. Polo still available).
3. WhatsApp goes out: “Still available — want a viewing?”
4. Dealer (or demo) books a viewing → `POST /api/conversion/book`.
5. Buyer gets confirmation WhatsApp; CRM gets `viewing.booked`.

## Parts (buy a spare)

1. Buyer: “Do you have brake pads for a Hilux?”
2. Nala finds the part, price, and qty on the counter.
3. Optional **hold** reduces stock qty and reserves it for a few hours.
4. WhatsApp quote + CRM `parts.quoted`.

## Service (fix the car)

1. Buyer: “Book a minor service for my Polo.”
2. Nala books a workshop slot.
3. WhatsApp confirmation + CRM `service.booked`.

## Trade-in

1. Buyer: “Trade-in my 2019 Polo, 78,000 km.”
2. Nala captures details + indicative price band.
3. Flags appraiser; asks for photos.
4. WhatsApp + CRM `tradein.captured`.

## Finance

1. Buyer: “Can I finance the Hilux?”
2. Nala starts a **partner pre-qual link** + document checklist (ID, payslip, bank, address).
3. When all docs marked done → status `submitted`.
4. WhatsApp with the link (we don’t build a bank).

## Missed call

1. Buyer rings the yard; nobody answers.
2. `POST /api/recovery/missed-call` (or Twilio `/api/twilio/voice/missed`).
3. Nala WhatsApps in seconds: “Sorry we missed you…”
4. CRM `missed_call.recovered`.

## Multi-branch

- Sandton (`demo-yard`) and Pretoria (`yard-pta`) each have stock.
- Messages mentioning Pretoria route to PTA stock.

## Monday ROI

- `POST /api/reports/monday` emails (or mock-outboxes) recovered leads, viewings, parts, service, trade-ins.

## Credentials

| Channel | Without secrets | With secrets |
| --- | --- | --- |
| WhatsApp | Mock outbox `data/whatsapp-outbox.json` | Meta Cloud API |
| Email | Mock outbox `data/email-outbox.json` | Resend |
| CRM | `mock://` deliveries | Real HTTP webhooks |
| Twilio missed call | JSON POST works | Signed Twilio form POST |
| LLM polish | Templates only (always works) | `OPENAI_API_KEY` optional rewrite |

---

## Plans, WhatsApp caps, and OpenAI polish (how metering works)

1. **Dealer chooses a plan** (Pilot / Starter / Professional / Enterprise)  
   → `POST /api/billing/usage` `{ "action":"set_plan", "dealershipId":"demo-yard", "planId":"professional" }`  
   → Caps load automatically from that package (no manual credit config).

2. **WhatsApp conversation meter**  
   - 1 unique buyer phone messaged in the calendar month = 1 conversation.  
   - Pilot: hard stop at 150 (we don’t bleed free forever).  
   - Paid: keep sending; overage accrues (e.g. Professional R0.75/conv).

3. **LLM polish meter (separate from WhatsApp)**  
   - Nala **always** builds a locked **template** first (real stock/prices — never invented).  
   - If polish credits remain **and** `OPENAI_API_KEY` works → optional tone rewrite.  
   - If polish credits are used up, OpenAI returns `insufficient_quota`, or there is no key → **auto-swap to templates**. Buyer still gets answered; we stop burning margin.

4. **Check usage anytime** → `GET /api/billing/usage?dealershipId=demo-yard`

| Plan | WA included | Polish credits | Overage |
| --- | --- | --- | --- |
| Pilot | 150 (hard stop) | 150 | — |
| Starter | 1,000 | 1,000 | R0.85 |
| Professional | 3,500 | 3,500 | R0.75 |
| Enterprise | 12,000 | 12,000 | R0.55 |

This is the Growth-Plus-style “X replies included” model — except we meter **conversations** (unique buyers/month) plus **polish credits**, and templates keep the OS alive when AI budget is gone.

---

## Still upgrade next

- Live AutoTrader/Cars **dealer webhook secrets** (fixture poll + webhook shape work today)
- Meta WhatsApp **token** + Twilio SA **Gray Ox** number for live voice
- Dealer website showroom embed snippet
- Stripe/PayFast invoice for overage lines