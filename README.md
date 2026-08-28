# GrayArx Sales Scripts

Discovery-first dealership outreach for GrayArx calling agents. The funnel is: **permission → qualify → diagnose pain → quantify cost of inaction → offer a free pilot**. No feature dumps, product names, or tier talk unless the dealership asks.

## Run locally

```bash
npm install
npm run dev -- --port 43123
```

Open [http://127.0.0.1:43123](http://127.0.0.1:43123).

## Sales funnel

| Stage | Goal | Agent behaviour |
| --- | --- | --- |
| 1. Open | Get permission + decision-maker | Sixty-second ask; no pitch |
| 2. Discover | Learn their process | One question: after-hours / response time |
| 3. Quantify | Tie pain to lost deals | Mirror their answer; cost of inaction |
| 4. Prescribe | One outcome line | Booked test drives, not features |
| 5. Close | Micro-commitment | Free 15-min pilot on their stock |
| 6. Intel | Improve GrayArx + CRM | Log tools, volume, pain, decision-maker |

Pricing and plan tiers only appear when they ask. Product names (Nala, Growth+, etc.) stay out of cold outreach.

## Templates

Template text lives in `lib/sales-templates.ts`:

- `buildWhatsAppFollowUp()` — curiosity hook + one outcome + CTA
- `buildCallScript()` — permission + qualify (first turn only)
- `getSmartReply()` — classifies the dealership's answer and selects the next short response

Edit lead fields in the UI or change `DEFAULT_LEAD` for your prospect.

## Example copy (Sandton Audi Prestige)

**WhatsApp / email**

> Hi Sandton Audi Prestige — Themba from GrayArx. I had a look at your stock online and had one question about after-hours enquiries.
>
> When a buyer messages on a Sunday evening, does someone get back to them that night — or does it wait until Monday?
>
> We help yards turn those enquiries into booked test drives before the buyer moves on. Runs alongside what you already use — nothing to cancel.
>
> Worth a 15-minute look on your own stock? Reply YES or call 079 491 5187.

**Call script**

> Hi, it's Themba from GrayArx — did I catch you at a bad time, or do you have sixty seconds?
>
> [STOP AND LISTEN]
>
> I'm trying to reach whoever handles online enquiries for Sandton Audi Prestige. Would that be you?
>
> [STOP AND LISTEN — use smart reply; diagnose before prescribing]

**Decision-maker discovery (next turn)**

> Perfect — I'll keep this short. I noticed strong stock on your site — I'm curious what happens when a buyer enquires after your team has gone home. When that happens, does someone respond the same evening, or does it usually wait until the next morning?

## Call-agent behaviour

The call is a state machine, not a script recording:

1. Say one short turn.
2. Stop and wait for the dealership.
3. Classify the answer using `lib/call-agent-playbook.ts`.
4. Say the matching response and ask at most one question.
5. Log `intelNote` to CRM for product and pipeline intel.
6. Escalate unknown, legal, or technical questions to a human.
7. End immediately and record suppression when asked not to call.

Playbook branches include gatekeeper, decision-maker discovery, pain confirmed (`discovery-gap`), strong process (`discovery-strong`), what-is-GrayArx, send info, pricing, pricing tiers (only when asked), existing tools, current process, not now, AI question, POPIA, demo booking, not interested, do-not-call, and unknown.

The browser UI includes a simulator: enter what the dealership says or select a common example to see the next approved response, CRM intel note, and action.

## Voice-agent integration

Send each **final** dealership utterance to `POST /api/call-agent/reply`:

```json
{
  "message": "It usually waits until the next morning.",
  "lead": {
    "dealershipName": "Sandton Audi Prestige",
    "agentName": "Themba"
  }
}
```

The endpoint returns one response and one action:

```json
{
  "intent": "discovery-gap",
  "response": "That's what we hear from a lot of yards — and the buyer usually books with whoever answers first. We help dealerships turn those enquiries into booked test drives while the interest is still hot. Would you be opposed to a free fifteen-minute look on your own stock — no card, nothing to replace?",
  "action": "speak_then_listen",
  "nextStep": "If yes → book demo and capture intel. If hesitant → one more diagnostic question, not a pitch.",
  "intelNote": "Pain confirmed: slow/after-hours response. Log channels, volume, and current tools.",
  "suppressContact": false
}
```

The calling integration must wait for a final speech transcript, call this endpoint once, speak only `response`, perform `action`, persist `intelNote`, and wait for the next utterance.

See `docs/VOICE_AGENT_IMPLEMENTATION.md` for Twilio/OpenAI SIP architecture and rollout.
