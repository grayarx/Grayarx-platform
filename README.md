# GrayArx Sales Scripts

Dealership outreach templates for GrayArx sales agents. Copy focuses on what yards care about — CRM updates, booking viewings, branded showroom, live stock, and warm leads — without AI or product-tier jargon.

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

> Hi Sandton Audi Prestige — Themba from GrayArx. Sipho flagged your yard as a strong fit for what we do.
>
> GrayArx helps yards capture every enquiry — leads update your CRM straight away, viewings get booked without the back-and-forth, and buyers browse your live stock on a branded showroom. Warm leads land in your inbox, even after close.
>
> Stock uploads via CSV, shortcodes for campaigns, and simple invoicing — pay by card or EFT. Runs alongside what you already use — no need to cancel anything. Free pilot.
>
> 15-min demo? Reply YES or call 079 491 5187.

**Call script**

> Hello, this is Themba from GrayArx. I'm reaching out to Sandton Audi Prestige in Sandton, Gauteng.
>
> Quick version — GrayArx is built for car yards. When someone enquires — on your site, on WhatsApp, or from a missed call — we capture it, update your CRM, help book the viewing, and send them through your branded showroom with live stock. Warm leads hit your inbox; you're not chasing voicemails at nine at night.
>
> The reason I'm calling you specifically: Sipho flagged you from our dealer research — your yard looked like a strong fit.
>
> GrayArx runs alongside your current tools — nothing to cancel. Pilot agreement and POPIA consent before go-live — dealer agreement and consent form on grayarx.com/legal. Month-to-month with 30 days' notice; we also offer a 12-month commit with founder rate lock if you want that locked in.
>
> Would you have 15 minutes this week for a quick walk-through?
