# GrayArx Sales Scripts

Dealership outreach templates for GrayArx sales agents. Copy focuses on what yards care about — recovering after-hours enquiries, booking test drives, showcasing live stock, and delivering warm leads — without AI or product-tier jargon.

## Run locally

```bash
npm install
npm run dev -- --port 43123
```

Open [http://127.0.0.1:43123](http://127.0.0.1:43123).

## Templates

Template text lives in `lib/sales-templates.ts`:

- `buildWhatsAppFollowUp()` — short WhatsApp or email follow-up
- `buildCallScript()` — the first spoken turn only
- `getSmartReply()` — classifies the dealership's answer and selects the next
  short response

Edit lead fields in the UI or change `DEFAULT_LEAD` for your prospect.

## Example copy (Sandton Audi Prestige)

**WhatsApp / email**

> Hi Sandton Audi Prestige — Themba here from GrayArx. I've had a look at your yard and thought this was worth putting in front of you.
>
> We help dealerships turn after-hours enquiries into booked test drives. Your live stock is presented in a polished, branded showroom; buyers get an immediate response; and serious enquiries go straight to your sales team — while the interest is still hot.
>
> It works alongside your current website, AutoTrader and DMS, so there is nothing to replace. We can set up a free pilot using your own vehicles, with no credit card required.
>
> Worth a quick 15-minute look? Reply YES and I'll arrange it, or call me on 079 491 5187.

**Call script**

> Hi, it's Themba from GrayArx — how are you?
>
> [STOP AND LISTEN]
>
> I'm trying to reach the person who looks after sales or online enquiries for Sandton Audi Prestige. Would that be you?
>
> [STOP AND LISTEN — choose the matching smart reply]

## Call-agent behaviour

The call is a state machine, not a script recording:

1. Say one short turn.
2. Stop and wait for the dealership.
3. Classify the answer using `lib/call-agent-playbook.ts`.
4. Say the matching response and ask at most one question.
5. Stop and listen again.
6. Escalate unknown, legal, or technical questions to a human.
7. End immediately and record suppression when asked not to call.

The playbook includes branches for a receptionist, the decision-maker, a busy
contact, requests for information, pricing, existing tools, existing enquiry
processes, an existing service provider, "not now," direct AI questions, POPIA
or customer-data concerns, demo booking, not interested, do-not-call, and
unknown questions. The existing-provider branch offers a free parallel pilot;
the "not now" branch leaves the website and callback number, and only sends a
WhatsApp summary with permission.

The browser UI includes a simulator: enter what the dealership says or select a
common example to see the next approved response and action.

## Voice-agent integration

Send each **final** dealership utterance to `POST /api/call-agent/reply`:

```json
{
  "message": "I'm just the receptionist.",
  "lead": {
    "dealershipName": "Sandton Audi Prestige",
    "agentName": "Themba"
  }
}
```

The endpoint returns one response and one action:

```json
{
  "intent": "gatekeeper",
  "response": "Thanks for letting me know. Who would be the best person to speak to about online enquiries and test-drive bookings? If they're available, would you mind putting me through?",
  "action": "speak_then_listen",
  "nextStep": "Ask for the contact's name and best time to call if they cannot transfer you.",
  "suppressContact": false
}
```

The calling integration must wait for a final speech transcript, call this
endpoint once, speak only `response`, perform `action`, and wait for the next
utterance. A `do-not-call` intent returns `suppressContact: true`; the telephony
or CRM layer must persist that suppression before ending the call. An ending
action is `speak_farewell_then_end`: it must finish playing the complete goodbye
before disconnecting.

This repository currently provides the decision layer and browser simulator. It
does not contain a telephony provider, speech-to-text service, text-to-speech
voice, outbound dialler, or persistent CRM/do-not-contact integration. Those
services must be connected before this can place a real call. The current
matcher is an approved, deterministic playbook for common situations; it is not
a general-purpose model with complete knowledge of GrayArx.

See `docs/VOICE_AGENT_IMPLEMENTATION.md` for the recommended Twilio/OpenAI SIP
architecture, GrayArx knowledge and tool integration, compliance gate, data
model, voice criteria, and rollout sequence.
