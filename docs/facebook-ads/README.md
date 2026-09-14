# GrayArx Facebook ad — upload pack

Pixel-ready creatives + paste fields for Meta Ads Manager. Pitch matches `shared/cashvertising.ts`: after-hours WhatsApp leakage → 14-day Pilot on the dealer’s stock. No competitor brands. No invented testimonials.

## Files to upload

| Placement | File | Size |
|---|---|---|
| Feed (upload this first) | `uploads/grayarx-fb-feed-1080.jpg` | 1080×1080 |
| Link / landscape | `uploads/grayarx-fb-landscape-1200x628.jpg` | 1200×628 |
| Stories / Reels | `uploads/grayarx-fb-story-1080x1920.jpg` | 1080×1920 |

Matching PNGs are generated during render then discarded. JPG, sRGB, under the 30 MB cap. Re-render with `node docs/facebook-ads/render.mjs`.

## Ads Manager paste

**Objective:** Leads or Traffic (not Engagement).

**Destination:** https://www.grayarx.com/onboarding?utm_source=facebook&utm_medium=cpc&utm_campaign=afterhours_pilot

**CTA button:** Sign Up (or Get Started)

**Primary text**

```
Your after-hours WhatsApp is feeding the dealer who replies.

That 9pm “is this still available?” already paid for a listing. Silence hands the test drive to the next yard.

Drop your CSV. Nala answers tonight from your live stock and books the drive. 14-day Pilot. R0. No card.
```

**Headline** (≤40 characters)

```
Stop losing 9pm WhatsApp deals
```

**Description** (optional)

```
14-day Pilot · R0 · No card
```

**Display link:** grayarx.com

## Audience (starting point)

- Location: South Africa (then AU / GB / AE / US / NZ as separate ad sets)
- Age: 28–65
- People who run dealerships / used-car yards — job titles: Dealer Principal, Owner, Sales Manager, General Manager
- Interests: used cars, motor trade, WhatsApp Business (keep interest stacks tight; job title + geography first)

## Do not

- Invent conversion % or testimonials
- Name other listing sites or software brands
- Send traffic to `/admin` or `/dealer`
- Promise a chatbot widget — this is Nala on their stock, then this week’s numbers
