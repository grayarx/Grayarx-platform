# GrayArx conversion engine (beat the category)

Working product slice — every action persists and is covered by tests.

## What works (no stubs)

| Capability | Where |
| --- | --- |
| Marketplace / missed-call lead → Nala reply from **live stock** | `/admin/conversion` + `POST /api/conversion/leads` |
| Book viewing | `POST /api/conversion/book` |
| Mark sold → removed from Nala answers | `POST /api/conversion/stock` |
| Monday ROI proof report | `GET /api/conversion/roi` |
| 14-day parallel pilot checklist | `/api/conversion/pilot` |
| Themba sales funnel practice | `/admin/prospector` |
| Twilio connected (await SA number) | `/admin/setup` |

## Reliability

```bash
npm test    # conversion engine tests
npm run build
```

## Competitive wedge

Not another MotorX clone. Proof loop:

**AutoTrader/Cars/website/missed-call → Nala (&lt;60s) → viewing booked → Monday ROI.**

## Not yet (needs Grayarx-Final / credentials)

- Live AutoTrader API poll (needs dealer API credentials)
- Production WhatsApp Cloud send (Meta phone + webhook on grayarx.com)
- Twilio auto-dial (waiting Gray Ox bundle + SA number)
