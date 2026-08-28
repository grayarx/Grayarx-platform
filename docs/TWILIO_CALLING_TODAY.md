# Twilio live calling — get Themba dialling today

Themba uses **Twilio Voice** for the phone line and **Twilio speech recognition**
for listening. The **playbook API** decides what to say (not the model freelancing).
OpenAI Realtime can replace Twilio TTS/listening later for a more natural voice.

## 1. Twilio setup (≈15 min)

1. Create a [Twilio account](https://www.twilio.com/try-twilio).
2. Buy or use a **Voice-capable number** (SA local or mobile — check [ZA voice guidelines](https://www.twilio.com/en-us/guidelines/za/south-africa--voice-guidelines---twilio)).
3. **Trial accounts** can only call [verified caller IDs](https://www.twilio.com/docs/usage/tutorials/how-to-use-your-free-trial-account) — verify your mobile first.
4. Copy **Account SID** and **Auth Token** from the Twilio console.

## 2. Public webhook URL (required)

Twilio must reach your server over **HTTPS**. Pick one:

| Option | Example |
| --- | --- |
| Production | `https://grayarx.com` |
| Cloudflare tunnel | `https://something.trycloudflare.com` |
| ngrok | `https://abc123.ngrok-free.app` |

Set in `.env`:

```bash
TWILIO_WEBHOOK_BASE_URL=https://grayarx.com
```

Your dev server must be reachable at that URL, or deploy to production first.

## 3. Environment variables

Create `.env.local`:

```bash
TWILIO_ACCOUNT_SID=ACxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_FROM_NUMBER=+27xxxxxxxx   # your Twilio number, E.164
TWILIO_WEBHOOK_BASE_URL=https://grayarx.com

# Optional
TWILIO_VOICE=Polly.Amy
TWILIO_SPEECH_LANGUAGE=en-GB
```

Restart the app after saving.

## 4. Twilio console — voice webhooks

When placing calls via the API, webhooks are set automatically:

- `POST /api/twilio/voice/outbound?sessionId=…` — Themba’s opener + start listening
- `POST /api/twilio/voice/turn?sessionId=…` — each dealership reply → playbook → next line
- `POST /api/twilio/voice/status?sessionId=…` — call completed / failed

No manual TwiML bin setup needed if you use **Hand off to Themba** in the app.

## 5. Place a call

1. Open `/admin/prospector`.
2. Ensure the prospect has a **real phone** (edit mock data or use a verified number on trial).
3. Click **Hand off to Themba**.
4. Twilio dials the yard; on answer, Themba asks for sixty seconds and runs the funnel.

## 6. Call flow

```
Twilio dials dealership
  → outbound webhook: speak opener, gather speech
  → turn webhook: SpeechResult → getSmartReply() → speak response → gather again
  → repeat until book-demo / not-interested / do-not-call / hangup
  → status webhook: mark session completed
```

Intel and transcript are stored in the live session (`GET /api/prospector/call-session?sessionId=…`).

## 7. POPIA reminder

Automated cold outbound in South Africa requires consent and suppression rules.
Use verified test numbers until legal/compliance gates are in place. See
`docs/VOICE_AGENT_IMPLEMENTATION.md`.

## 8. OpenAI (later upgrade)

For a more natural voice, connect **OpenAI Realtime over SIP** instead of Twilio
`<Say>` + `<Gather>`. Keep `/api/call-agent/reply` as the decision layer — swap
only the audio transport.

Fix OpenAI billing if you previously saw `insufficient_quota`.

## Troubleshooting

| Issue | Fix |
| --- | --- |
| “Twilio not ready” | Set all four env vars including `TWILIO_WEBHOOK_BASE_URL` |
| Call never connects | Trial: verify destination number in Twilio console |
| Twilio 11200 HTTP retrieval failure | Webhook URL not public or app not running |
| Agent doesn’t hear dealer | Check speech language; speak clearly after the beep |
| 403 Invalid signature | Ensure webhook URL in Twilio matches `TWILIO_WEBHOOK_BASE_URL` exactly |
