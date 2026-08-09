# Twilio setup for Themba (GrayArx sales calling)

**Purpose:** Let Themba dial dealerships Sipho scouts.  
**Founder-only.** Dealerships never see this.

---

## 1. Twilio console (you do this)

1. Open [console.twilio.com](https://console.twilio.com) (sign up if needed).
2. From the home dashboard copy:
   - **Account SID** → `TWILIO_ACCOUNT_SID`
   - **Auth Token** → `TWILIO_AUTH_TOKEN`
3. **Phone Numbers → Buy a number** (or use a trial number).
   - Needs **Voice** capability.
   - SA `+27` is ideal; US trial works only to **Verified Caller IDs**.
4. Copy that number in E.164 → `TWILIO_FROM_NUMBER` (example: `+27821234567`).
5. **Trial accounts:** Verified Caller IDs → add `+27794915187` and any test dealer numbers before Themba can dial them.

---

## 2. Where to put secrets

| Where | How |
|---|---|
| **Cursor Cloud Agent** | Secrets panel / environment secrets (requested by the agent) |
| **Railway (production)** | Project → Variables — same names |
| **Local** | `.env` (never commit) |

```bash
TWILIO_ACCOUNT_SID=ACxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxx
TWILIO_FROM_NUMBER=+27xxxxxxxx
ENABLE_OUTBOUND_SALES_CALLS=true
```

Legacy names still work: `TWILIO_API_KEY` (= auth token), `TWILIO_PHONE_NUMBER` (= from number).

---

## 3. How to test

1. Founder console → Prospector → pick a prospect with a phone.
2. Click **Hand off**.
3. Expect either:
   - `called: true` + Twilio Call SID, or
   - `queued: true` + `followUpText` if secrets/trial block the dial.
4. Check agent activity for Themba `outbound_call` / `call_queued`.

Force queue-only without removing secrets:

```bash
ENABLE_OUTBOUND_SALES_CALLS=false
```

---

## 4. Cost / safety notes

- Trial: free credit; only verified destinations.
- Paid: per-minute voice rates apply — start with hand-picked prospects.
- Themba’s call is an **opener + press-1 demo CTA**, not a full live negotiation. You close the contract.
