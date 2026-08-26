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
- `buildCallScript()` — spoken call opener

Edit lead fields in the UI or change `DEFAULT_LEAD` for your prospect.

## Example copy (Sandton Audi Prestige)

**WhatsApp / email**

> Hi Sandton Audi Prestige — Themba here from GrayArx. Sipho had a look at your yard and thought this was worth putting in front of you.
>
> We help dealerships turn after-hours enquiries into booked test drives. Your live stock is presented in a polished, branded showroom; buyers get an immediate response; and serious enquiries go straight to your sales team — while the interest is still hot.
>
> It works alongside your current website, AutoTrader and DMS, so there is nothing to replace. We can set up a free pilot using your own vehicles, with no credit card required.
>
> Worth a quick 15-minute look? Reply YES and I'll arrange it, or call me on 079 491 5187.

**Call script**

> Hi, it's Themba from GrayArx — how are you?
>
> I'll be brief. Sipho had a look at your yard and thought you were exactly the kind of dealership we built this for.
>
> Here's the problem we solve: a buyer finds the right car at eight o'clock, sends an enquiry and, by the time someone gets back to them the next morning, they've already messaged three other dealerships.
>
> GrayArx closes that gap. We put your live stock into a polished, branded showroom, respond to buyers after hours, qualify the serious ones and help get the test drive booked. The opportunity goes straight to your team, so they start the day with warm customers — not a list of cold follow-ups.
>
> And we don't replace your website, AutoTrader or DMS. GrayArx works alongside them. We can prove it with a free pilot on your own stock, with no credit card required.
>
> Out of interest, what normally happens when a WhatsApp enquiry comes in after hours?
>
> [Listen to their answer]
>
> That makes sense — and that's exactly the gap we'd like to help you close. Rather than talk you through a long pitch, let me show you what it looks like using your own vehicles. Would a quick 15-minute walk-through suit you better on Tuesday or Wednesday?
>
> If neither works: No problem — what day suits you? You can also reach me directly on 079 491 5187.
