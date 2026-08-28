# Global expansion — think through every category

GrayArx / Greyhawks stays **one product**. Regions change **currency, compliance, marketplaces, and channels** — not the OS core.

Live config: `lib/regions/config.ts` · `GET /api/regions?region=US`

---

## 1. Product (same everywhere)

| Module | Global rule |
| --- | --- |
| Sales (Nala) | Live stock → book viewing |
| Parts | Optional; dealer catalog only |
| Service | Calendar + WhatsApp |
| Trade-in | Intake + photos → appraiser |
| Finance | **Partner link** — never become the lender |
| Missed call | Local Twilio number |
| Monday ROI | Proof email in local language later |
| CRM | Webhooks into local DMS/CRM |

---

## 2. Pricing (margin first)

| Region | Currency | Professional (list) | Notes |
| --- | --- | --- | --- |
| ZA | ZAR | R14,990 | Hero market |
| AU | AUD | from FX table | Carsales ingest next |
| GB | GBP | from FX table | UK GDPR + PECR |
| AE | AED | from FX table | WA-native |
| US | USD | from FX table | TCPA for outbound |
| NZ | NZD | from FX table | Trade Me |

Rules:

1. Keep **~45%+ gross** after local Meta/OpenAI/Twilio/support.  
2. Recalculate FX **quarterly**.  
3. Pilot always free + **hard WA cap**.  
4. Paid plans: overage + template fallback when polish exhausted.

---

## 3. Compliance by category

| Category | Must handle |
| --- | --- |
| Privacy | POPIA / UK GDPR / APPs / PDPL / CCPA — collection notice + retention |
| Marketing outreach | Opt-out, DNC/TPS scrub, TCPA consent (US) |
| WhatsApp | Meta commerce policy; 24h session vs template messages |
| Voice | Local telecom rules; Gray Ox only blocks **SA** CLI today |
| Consumer auto | Don’t invent prices/finance approvals |
| Data residency | Prefer region deploy when enterprise asks |

---

## 4. Acquisition (prospector)

ICP = **can pay Professional+** AND **bleeds after-hours leads**:

- Premium independents (high GP/unit)  
- Franchise used desks (keep DMS)  
- Volume used with big AutoTrader/Carsales footprint  
- Multi-branch groups → Enterprise  

Seeded **50+** yards across ZA/AU/GB/AE/US/NZ. Phones blank on purpose — paste from public listings. CSV import: `POST /api/prospector/prospects`.

---

## 5. Channels per region

| Region | Buyer chat | Sales dial | Marketplace |
| --- | --- | --- | --- |
| ZA | Meta WA | Twilio +27 (Gray Ox) | AutoTrader / Cars.co.za |
| AU | WA + SMS | Twilio AU | Carsales |
| GB | WA + email | Twilio UK | AutoTrader UK |
| AE | Meta WA | Twilio AE/intl | dubizzle |
| US | SMS/RCS (+ WA niche) | Twilio US + TCPA | Cars.com / CarGurus |
| NZ | WA + SMS | Twilio NZ | Trade Me |

---

## 6. What “best dealership OS” requires (checklist)

- [x] Live stock truth + book viewing  
- [x] Parts/service/trade-in/finance desks  
- [x] Missed-call + marketplace paths  
- [x] Monday ROI + money-left-on-table  
- [x] Unit economics + plan metering + template fallback  
- [x] Multi-currency region table  
- [x] Large ICP prospector + CSV  
- [ ] Merge into Final where secrets already live  
- [ ] Production Meta WA on grayarx.com  
- [ ] SA Twilio from-number (Gray Ox)  
- [ ] Real marketplace dealer webhooks per country  
- [ ] Overage invoicing (PayFast / Stripe)  
- [ ] Local-language packs (AR for UAE, etc.)  

---

## 7. Smart sequencing

1. **Merge → Final** (reuse OpenAI/Meta/Resend).  
2. **Close 3–5 ZA pilots** on Professional.  
3. **AU or UAE next** (English + WhatsApp-strong).  
4. **UK** with PECR-safe outreach.  
5. **US** only with TCPA-safe motion (SMS consent heavy).  

Do not open six countries before ZA Monday proof exists.
