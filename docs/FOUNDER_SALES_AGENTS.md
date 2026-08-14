# Founder sales agents — Sipho → Themba → contract

**Audience:** Founder / admin only  
**Not shown to dealerships.**

---

## Flow

1. **Sipho** scouts dealerships nightly → Prospects list (`/admin/prospector`)
2. You click **Hand off** on a hot prospect
3. **Themba** dials with a playbook-based GrayArx sales opener (Twilio)
4. If Twilio is missing / disabled → prospect stays `queued_for_call` and Themba logs a **WhatsApp/SMS follow-up** text you can paste
5. Demo interest → **you** close the pilot / contract (Themba books interest; founder signs the deal)

## Playbook (answers dealers ask)

**Close kit (pre-call / money ask / objections):** `docs/FOUNDER_SALES_KIT.md` · in-app `/admin/sales-kit`

Canonical product Q&A:
- `docs/DEALER_QA_PLAYBOOK.md`
- `shared/dealerQaPlaybook.ts` (injected into Sipho, Themba, Kagiso system prompts)

Covers price, WhatsApp/Meta, POPIA, contract (month-to-month vs 12-month), SLA, CSV stock, pre-approvals honesty, objections (“still in a contract”), etc.

## What Themba can / can’t do today

| Can | Can’t (yet) |
|---|---|
| Place outbound sales call with playbook elevator + demo CTA | Fully interactive live Q&A on the phone (needs Twilio ConversationRelay / voice LLM webhook) |
| Press-1 / “yes” gather for demo callback intent | Auto-sign contracts |
| Return paste-ready WhatsApp follow-up on every handoff | Replace founder close on pricing exceptions |
| Use dealer Q&A in founder **Agent Chat** | Appear in the dealership console |

## Env

Full steps: **`docs/TWILIO_THEMBA_SETUP.md`**

```
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM_NUMBER=+27...
# Optional hard off-switch:
ENABLE_OUTBOUND_SALES_CALLS=false
```

## Compliance inbox

`/admin/compliance` is **founder-only**. Public `/legal` can still *send* messages into that inbox. Dealership Legal page has documents + mailto only — no compliance inbox UI.
