# Start here — connect Twilio (simple)

You did the hard part (Twilio account + Gray Ox bundle). Here's what's left.

## What YOU do (2 minutes)

Create a file called **`.env.local`** in the project root and paste:

```
TWILIO_ACCOUNT_SID=ACxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_WEBHOOK_BASE_URL=https://grayarx.com
```

Replace `ACxxxxxxxx` and `your_auth_token_here` with your real values from the Twilio dashboard.

**Do not paste tokens in chat** — only in `.env.local`.

Restart the app, then open: **`/admin/setup`** and click **Test my Twilio connection**.

## What happens while you wait for Gray Ox

| Step | Who | Status |
|------|-----|--------|
| Twilio account (paid) | You | Done ✓ |
| Gray Ox regulatory bundle | Twilio reviewing | Wait 1–3 days |
| Paste SID + Token in .env.local | You | Do now |
| Webhook URL on grayarx.com | Deploy app | See below |
| Buy +27 mobile number | You | After bundle approved |
| Add TWILIO_FROM_NUMBER | You | After number bought |
| Hand off to Themba | You | Last step |

## After Gray Ox is approved

1. Twilio Console → buy **+27 60… mobile** number
2. Assign **Gray Ox** bundle when asked
3. Add to `.env.local`:
   ```
   TWILIO_FROM_NUMBER=+27600767971
   ```
4. Restart app
5. Go to **`/admin/prospector`** → enter dealership phone → **Hand off to Themba**

## Webhook (important)

Twilio needs to talk to your server at:

- `https://grayarx.com/api/twilio/voice/outbound`
- `https://grayarx.com/api/twilio/voice/turn`

So **grayarx.com must run this GrayArx app** (or merge these API routes into Grayarx-Final).

Until that's deployed, calls won't connect even with correct tokens.

## Pages

- Setup checklist: `/admin/setup`
- Call dealerships: `/admin/prospector`
- Script lab: `/`
