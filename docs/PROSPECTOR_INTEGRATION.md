# Prospector integration (Grayarx-Final)

This reference implementation wires `/admin/prospector` to the stage-aware sales
playbook. Copy these pieces into the main GrayArx app.

## Files to copy

| Path | Purpose |
| --- | --- |
| `lib/sales-templates.ts` | WhatsApp + call opener copy |
| `lib/call-agent-playbook.ts` | Intent matching + replies |
| `lib/call-stages.ts` | Funnel stage transitions |
| `lib/call-intel.ts` | Structured CRM/product intel |
| `lib/call-intents.ts` | Shared types |
| `lib/call-agent-api.ts` | Client helper for reply API |
| `lib/prospect-to-lead.ts` | Map dealership row → `LeadContext` |
| `lib/twilio-status.ts` | Env check for Twilio |
| `app/api/call-agent/reply/route.ts` | Turn-by-turn decision API |
| `components/prospector/*` | Modal + cards + copy blocks |

## Replace the old monologue modal

**Before:** one long spoken script listing Nala, Growth+, POPIA, tiers, etc.

**After:**

1. `buildWhatsAppFollowUp(prospectToLead(row))` — curiosity hook + CTA
2. `buildCallScript(lead)` — permission + qualify (turn 1 only)
3. Live loop calling `POST /api/call-agent/reply` with `{ message, lead, context: { stage, intel } }`

Persist `nextStage` and `intel` on the prospect row after each turn.

## Prospect row fields (recommended)

```sql
call_stage TEXT,
call_intel JSONB,
call_transcript JSONB,
last_call_at TIMESTAMPTZ,
status TEXT  -- queued_for_call | called | demo_booked | do_not_contact | ...
```

## Hand off to Themba flow

1. User clicks **Hand off to Themba** on a prospect card.
2. `POST /api/prospector/queue-call` — checks Twilio env; queues call if configured.
3. Open `ProspectorCallModal` with playbook texts + live funnel.
4. Each dealership utterance → `/api/call-agent/reply` → speak `response`, save `intel`.
5. On `suppressContact: true` → set `do_not_contact` on the row.
6. On `intel.outcome === "demo_booked"` → create demo task / calendar event.

## Twilio env (production)

```
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=   # or TWILIO_API_KEY
TWILIO_FROM_NUMBER=  # or TWILIO_PHONE_NUMBER
TWILIO_WEBHOOK_BASE_URL=https://grayarx.com   # public HTTPS — required
```

When all four are set, **Hand off to Themba** places a real outbound call. Twilio
webhooks run the playbook on the line (`/api/twilio/voice/outbound` + `/turn`).
See `docs/TWILIO_CALLING_TODAY.md` for step-by-step setup.

When missing, the modal still works for manual calling with the funnel UI.

## Lead mapping from your DB

```typescript
import { prospectToLead } from "@/lib/prospect-to-lead";

const lead = prospectToLead({
  id: row.id,
  name: row.dealership_name,
  location: `${row.city}, ${row.province}`,
  score: row.score,
  status: row.status,
  researchNote: row.research_note ?? "I had a look at your stock online…",
  callReason: row.call_reason ?? "I'm curious what happens when a buyer enquires after hours.",
});
```

## Voice agent (OpenAI Realtime + Twilio SIP)

Use `/api/call-agent/reply` as the **decision layer** after each final transcript
segment. Do not let the model freestyle pricing, legal, or product tiers — the
playbook is the source of truth. See `docs/VOICE_AGENT_IMPLEMENTATION.md`.
