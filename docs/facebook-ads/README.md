# GrayArx Facebook ad — upload pack

Pixel-ready creatives + paste fields for Meta Ads Manager. The **image** explains the desk and carries contact details (a picture cannot be clicked). Meta’s own CTA button sits under the image in Ads Manager.

Pitch matches `shared/cashvertising.ts`. Contact matches `client/src/lib/contact.ts`. No competitor brands. No invented testimonials. No fake buttons on the creative.

## Files to upload

| Placement | File | Size |
|---|---|---|
| Feed (upload this first) | `uploads/grayarx-fb-feed-1080.jpg` | 1080×1080 |
| Link / landscape | `uploads/grayarx-fb-landscape-1200x628.jpg` | 1200×628 |
| Stories / Reels | `uploads/grayarx-fb-story-1080x1920.jpg` | 1080×1920 |

Re-render with `node docs/facebook-ads/render.mjs`.

## Ads Manager paste

**Objective:** Leads, Traffic, or Messages.

**Destination:** https://www.grayarx.com/?utm_source=facebook&utm_medium=cpc&utm_campaign=dealership_os

**CTA button:** Contact Us (Call Now or WhatsApp if the campaign is messages)

**Primary text**

```
GrayArx is the dealership operating system: Nala answers after-hours WhatsApp from your live stock, your CSV showroom stays true, and parts, service, trade-in, missed calls, and this week’s numbers sit on one desk.

WhatsApp 082 053 2685
hello@grayarx.com
www.grayarx.com
```

**Headline** (≤40 characters)

```
Dealership OS on one desk
```

**Description**

```
082 053 2685 · hello@grayarx.com
```

**Display link:** grayarx.com

## On the image

- What it is: dealership operating system
- What it runs: after-hours WhatsApp, live CSV showroom, parts + service, trade-in, missed-call recovery, this week’s numbers
- How to reach: WhatsApp 082 053 2685 · hello@grayarx.com · www.grayarx.com

## Do not

- Invent conversion % or testimonials
- Name other listing sites or software brands
- Put a fake “click here” / Pilot button on the JPG — it will not be clickable
- Send traffic to `/admin` or `/dealer`
