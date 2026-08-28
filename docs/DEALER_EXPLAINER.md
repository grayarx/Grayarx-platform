# How GrayArx works for a dealership (detailed, still simple)

This is the talk track you use with a dealer — and the honest technical truth behind it.

---

## 1. What GrayArx is

GrayArx is the **dealership operating system** that runs the customer conversation:

- Selling cars
- Parts counter on WhatsApp (**only if they sell parts**)
- Service bookings
- Trade-ins
- Finance pre-qual (partner link)
- Missed-call recovery
- Monday proof report

**Nala** is the AI voice on WhatsApp. She does not replace the sales team. She answers first, books what she can, then hands a warm lead to humans.

---

## 2. Parts — how it *really* works (dealer talk track)

### Do they need parts?

**No.** Parts is a **switch**.

- Sandton demo: parts **ON**
- Pretoria demo: parts **OFF** (sales/service only)

If they don’t sell parts, turn the module off. Nala then says:

> “This yard doesn’t run a parts counter on WhatsApp — I can help with a car, viewing, or service.”

You never pitch parts to a sales-only used-car yard.

### If they DO sell parts — where do numbers and prices come from?

**GrayArx does not invent OEM prices.**  
We quote **their** catalog.

Every part row needs:

| Field | Meaning |
| --- | --- |
| `sku` | **Their** counter / DMS code |
| `oemNumber` | Optional manufacturer number (e.g. `03C115561H`) |
| `name` | What Nala says (“Front brake pads — Hilux”) |
| `fits` / make / model / years | Which cars it fits |
| `retailPrice` | **What they charge the customer** |
| `costPrice` | Optional — what they paid |
| `qty` | How many on the shelf |

### How pricing gets into GrayArx

Three ways (same engine):

1. **CSV import** (most independents)  
   Dealer exports from Excel/DMS → upload → we import.  
   Template:  
   `sku,oemNumber,name,fits,make,model,yearFrom,yearTo,costPrice,retailPrice,qty,supplier`

2. **JSON / DMS feed**  
   Nightly push from Adas / their stock system into `POST /api/parts` (`import_json`).  
   Same fields.

3. **Cost-only + markup**  
   If they only give `costPrice`, we apply **their** markup % (default 35%, configurable) to set retail.  
   If they give **neither** cost nor retail → **row skipped**. We never guess.

### What the customer experiences

1. “Do you have brake pads for a Hilux?”
2. Nala matches SKU/OEM/fitment in **their** catalog.
3. Replies with **their retail price** + stock qty + dealer SKU.
4. Optional **hold** (qty −1 for a few hours) for collection.
5. Or “book fitment with service.”
6. WhatsApp sent; CRM webhook fired (`parts.quoted`).

### Integration sentence for the dealer

> “You keep owning your part numbers and your prices. GrayArx is just the WhatsApp counter that reads your catalog. Export CSV once a week, or we plug into your DMS feed. If you don’t sell parts, we switch that desk off — you still get sales, service, and recovery.”

---

## 3. Why some things were “later” — and what we did now

| Item | Why it wasn’t “live Meta” yesterday | What is true now |
| --- | --- | --- |
| AutoTrader/Cars | Need **their** dealer API/webhook credentials | Fixture poll **and** real webhook mapper (`/api/marketplace/webhook?provider=autotrader\|cars`) work end-to-end |
| Meta WhatsApp | Need Meta token + phone number ID | Mock outbox always works; Meta send when env set |
| Resend email | Need API key | Mock outbox; Resend when env set |
| Showroom | Could build without keys | **Built:** `/showroom/demo-yard` |
| Trade-in photos | Could build without keys | **Built:** photo attach API |
| Service calendar | Could build without keys | **Built:** `/api/service/calendar` |
| Parts pricing/import | Needed a real model | **Built:** CSV/JSON import, module off, markup rules |

**We cannot fake another company’s secret keys.** We can (and did) build every path so that when the dealer/Meta/Twilio credentials exist, the same code path goes live.

---

## 4. Full walkthrough (like you’re ten)

### Opening the shop
The yard turns on GrayArx. They load **car stock**. If they sell parts, they import the **parts CSV**. They choose which desks are on (sales / parts / service / trade-in / finance).

### Someone wants a car
AutoTrader sends a lead (webhook) → Nala checks live cars → WhatsApps the buyer → books a viewing → CRM is told.

### Someone wants a part
Only if parts is ON. Nala looks up **their** SKU and **their** price → quotes → maybe holds → collect at counter.

### Someone wants a service
Nala books a day/time on the **service calendar**. Workshop sees it.

### Someone wants to trade in
Nala saves the car + price band → asks for 4 photos → photos attach to the file → appraiser confirms.

### Someone wants finance
Nala sends a **partner link** + checklist (ID, payslip, bank, address). GrayArx is not the bank.

### Someone calls and nobody answers
Missed-call recovery → WhatsApp in seconds.

### Two branches
Sandton cars vs Pretoria cars. Message mentions Pretoria → PTA stock.

### Monday
GM gets an email: how many leads recovered, viewings, parts quotes, services, trade-ins.

---

## 5. Desks to click

- OS: `/admin/os`
- Showroom: `/showroom/demo-yard` (parts on) · `/showroom/yard-pta` (parts off)
- Parts API: `GET/POST /api/parts`
- Settings: `POST /api/dealership/settings` `{ dealershipId, modules: { parts: false } }`

---

## 6. Still needs dealer / Meta credentials (not code)

1. Paste Meta WhatsApp token → real WhatsApp instead of outbox  
2. Point AutoTrader/Cars dealer portal webhook to `/api/marketplace/webhook`  
3. Resend API key → real Monday email  
4. Twilio inbound missed-call URL → `/api/twilio/voice/missed`
