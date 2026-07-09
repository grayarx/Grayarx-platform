# Edward Sturm Gmail avatar — animated logo beside pilot@grayarx.com

The **inbox circle avatar** is NOT set by HTML or Resend. It comes from the **Google Account profile photo** on `pilot@grayarx.com`.

## Two separate fixes

| What | Fix |
|------|-----|
| **Logo inside email body** | Square circuit-board GA icon (`client/public/logo-icon.png`) — attached inline on send. Regenerate with `npx tsx scripts/build-brand-assets.ts` |
| **Gmail inbox avatar (pfp)** | Animated GIF on Google profile + send via **Gmail SMTP** (not Resend) |

---

## Step 1 — Regenerate the correct body logo

The body must use the **circuit-board GA emblem** cropped from `logo.png`, NOT the placeholder "GA" text icon.

```bash
npx tsx scripts/build-brand-assets.ts
```

This writes `client/public/logo-icon.png`. **Deploy** so `https://www.grayarx.com/logo-icon.png` is live.

---

## Step 2 — Create the animated Gmail avatar GIF

1. Open `client/public/grayarx-logo-animated.webp` (gold animated logo)
2. Convert to GIF: [ezgif.com/webp-to-gif](https://ezgif.com/webp-to-gif) — **256×256**, loop, under 2 MB
3. Save as `client/public/grayarx-gmail-avatar.gif`

---

## Step 3 — Upload GIF to pilot@ Google profile

1. Sign in to **Google Workspace** as `pilot@grayarx.com`
2. [myaccount.google.com](https://myaccount.google.com) → **Personal info** → **Photo**
3. Upload `grayarx-gmail-avatar.gif`

Repeat for `hello@`, `noreply@`, `mia@` if those addresses send mail.

---

## Step 4 — Send pilot mail via Gmail SMTP (required for animated avatar)

Resend API sends **do not** show your Google profile GIF in Gmail. Use Workspace SMTP:

```env
PILOT_GMAIL_USER=pilot@grayarx.com
PILOT_GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
PILOT_SEND_VIA=gmail
```

Create an **App Password** in Google Account → Security → 2-Step Verification → App passwords.

Test send (shows avatar if Step 2–3 done):

```bash
npx tsx scripts/send-pilot-test-email.ts grayarx@gmail.com gmail
```

---

## Resend (transactional only)

Resend is fine for automated mail; body logo uses inline PNG attachment. Inbox avatar will stay generic unless you also complete Steps 2–4.
