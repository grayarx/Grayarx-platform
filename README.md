# GrayArx Sales Scripts

Stage-aware, discovery-first dealership outreach for GrayArx calling agents. The funnel is: **permission → qualify → diagnose → quantify → offer pilot → book or nurture**. No feature dumps; pricing and tiers only when they ask. Every turn returns structured intel for CRM and product improvement.

## Run locally

```bash
npm install
npm run dev -- --port 43123
```

Open [http://127.0.0.1:43123](http://127.0.0.1:43123).

**Prospector admin:** [http://127.0.0.1:43123/admin/prospector](http://127.0.0.1:43123/admin/prospector)

**Competitor battlecards:** [http://127.0.0.1:43123/admin/competitors](http://127.0.0.1:43123/admin/competitors) — MotorX, WhatsApp bots, DMS pricing, talk tracks, and beat roadmap. See [`docs/COMPETITOR_BATTLECARDS.md`](docs/COMPETITOR_BATTLECARDS.md).

**Dealership OS:** [http://127.0.0.1:43123/admin/os](http://127.0.0.1:43123/admin/os) — sales + parts + service + trade-in + finance + marketplace poll + missed call + Monday email. Walkthrough: [`docs/HOW_GRAYARX_WORKS.md`](docs/HOW_GRAYARX_WORKS.md). Strategy: [`docs/OS_STRATEGY.md`](docs/OS_STRATEGY.md).

**Pricing matrix:** [http://127.0.0.1:43123/admin/pricing](http://127.0.0.1:43123/admin/pricing) — every competitor price we can document. [`docs/COMPETITOR_PRICING.md`](docs/COMPETITOR_PRICING.md).

**Conversion engine:** [http://127.0.0.1:43123/admin/conversion](http://127.0.0.1:43123/admin/conversion)

**Live calling today:** see [`docs/TWILIO_CALLING_TODAY.md`](docs/TWILIO_CALLING_TODAY.md) — Twilio dials the yard; Themba runs the playbook on the call.

To port into Grayarx-Final, see `docs/PROSPECTOR_INTEGRATION.md`.

## Sales funnel

| Stage | Goal |
| --- | --- |
| **opening** | Permission — sixty seconds, no pitch |
| **qualifying** | Reach decision-maker |
| **discovering** | Diagnose after-hours process and response time |
| **presenting** | Quantify cost of inaction → offer free pilot |
| **closing** | Book demo, schedule callback, or nurture |

## Architecture

| Module | Purpose |
| --- | --- |
| `lib/sales-templates.ts` | WhatsApp + call opener copy |
| `lib/call-agent-playbook.ts` | Intent matching, replies, scenario library |
| `lib/call-stages.ts` | Stage transitions |
| `lib/call-intel.ts` | Structured CRM/product intel schema |
| `lib/call-intents.ts` | Shared types |
| `lib/competitors/` | Competitor catalog, pricing bands, battlecard talk tracks |

## Playbook coverage

**Discovery:** gap vs strong process, weekend gap, high/low volume, current process

**Objections:** trust, contract lock-in, budget, no need, hesitation, bad AI experience, existing tools, named competitors, needs owner approval

**Close paths:** book demo, callback, send info, think about it, not now

**Compliance / exit:** POPIA questions (escalate), do-not-call, hostile, wrong dealership, already a customer, not interested

**Pricing:** pilot-first; tiers only when they ask about plans

## Voice-agent API

Send each **final** dealership utterance with conversation context:

```json
{
  "message": "It usually waits until the next morning.",
  "lead": { "dealershipName": "Sandton Audi Prestige", "agentName": "Themba" },
  "context": {
    "stage": "discovering",
    "intel": {}
  }
}
```

Response includes the next reply, stage, and accumulated intel:

```json
{
  "intent": "discovery-gap",
  "response": "That's what we hear from a lot of yards...",
  "action": "speak_then_listen",
  "nextStage": "presenting",
  "intel": {
    "mainPain": "after_hours",
    "afterHoursProcess": "It usually waits until the next morning.",
    "pilotInterest": "maybe"
  },
  "intelNote": "Pain: after hours | Process: It usually waits until the next morning. · slow / next-day",
  "nextStep": "Yes → book demo. Hesitation → one diagnostic question, not a feature list.",
  "suppressContact": false
}
```

Persist `intel` across turns and pass it back in the next request. Store `nextStage` as the current stage for the following turn.

## Call-agent rules

1. One short turn, then silence.
2. At most one question per reply.
3. Diagnose before prescribing — no product names unless they ask.
4. Log structured intel every turn (`tools`, `volume`, `pain`, `objections`, `productFeedback`).
5. Close on the free parallel pilot, not a brochure.
6. Escalate unknown, legal, and existing-customer cases to a human.
7. Full goodbye before ending on not-interested, do-not-call, or hostile.

See `docs/VOICE_AGENT_IMPLEMENTATION.md` for Twilio/OpenAI SIP rollout.
