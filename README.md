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
processes, direct AI questions, POPIA or customer-data concerns, demo booking,
not interested, do-not-call, and unknown questions.

The browser UI includes a simulator: enter what the dealership says or select a
common example to see the next approved response and action.
