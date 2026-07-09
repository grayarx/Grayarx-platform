# Email sending — what `pilot@grayarx.com` actually is

## Important: there is no pilot@ login in this repo

**Nobody created a Google mailbox for you.** `pilot@grayarx.com` is only the **From:** address on emails sent through **Resend**, after your domain `grayarx.com` is verified in the Resend dashboard.

| Method | Login needed? | Inbox avatar (Gmail circle) | Body logo |
|--------|---------------|-----------------------------|-----------|
| **Resend** (`pilot@grayarx.com`) | No — uses `RESEND_API_KEY` only | Generic letter / domain default | ✅ `https://www.grayarx.com/logo-icon.png` |
| **Gmail SMTP** (`grayarx@gmail.com`) | Yes — your Google account + App Password | ✅ Your Google profile photo (GIF works) | ✅ Same HTML header |

You already have **Resend** in `.env`. Pilot test emails work without any `@grayarx.com` mailbox.

---

## What works today (no pilot@ account)

```bash
npx tsx scripts/send-pilot-test-email.ts grayarx@gmail.com resend
```

Recipients see **From: pilot@grayarx.com** (via Resend). The **body** should show the circuit-board GA icon + GrayArx wordmark.

---

## Animated inbox avatar (Edward Sturm) — use your Gmail

Because you **don't** have `pilot@grayarx.com` on Google Workspace, use **`grayarx@gmail.com`** (the account you already use):

1. Set animated GIF as profile photo on **grayarx@gmail.com**  
   [myaccount.google.com](https://myaccount.google.com) → Personal info → Photo  
   Source: convert `client/public/grayarx-logo-animated.webp` → GIF at [ezgif.com/webp-to-gif](https://ezgif.com/webp-to-gif)

2. Create a Google **App Password** (Google Account → Security → 2-Step Verification → App passwords)

3. Add to `.env`:
   ```
   EMAIL_USER=grayarx@gmail.com
   EMAIL_PASSWORD=your-16-char-app-password
   PILOT_SEND_VIA=gmail
   ```

4. Send test (shows your Gmail avatar in inbox):
   ```bash
   npx tsx scripts/send-pilot-test-email.ts grayarx@gmail.com gmail
   ```
   From will be **grayarx@gmail.com**, not pilot@ — but the animated avatar will show.

---

## If you want real `pilot@grayarx.com` mailboxes later

1. Buy / set up **Google Workspace** for `grayarx.com` (admin.google.com)
2. Create user `pilot@grayarx.com` with a password you choose
3. Upload the animated GIF to that user's profile
4. Add `PILOT_GMAIL_USER` + `PILOT_GMAIL_APP_PASSWORD` to `.env`

Until then, **Resend for pilot@ sends** + **grayarx@gmail.com for avatar tests** is the correct setup.
