# Compliance mailbox monitoring

GrayArx monitors **privacy@**, **legal@**, and **hello@** (plus Mia / pilot / prospector replies) through two channels.

## What works without MX

### Web form (live now)

- **Public:** [grayarx.com/legal](https://www.grayarx.com/legal) → “Contact compliance team”
- Every submission is saved to `compliance_inquiries` and emails the founder via Resend (`FOUNDER_ALERT_EMAIL`)
- Visible at **`/admin/compliance`**

## What needs DNS (inbound replies)

**Fact (verified 2026-08-11):** `grayarx.com` had **no public MX records**. Without MX, the internet cannot deliver mail to hello@ / privacy@ / legal@ / mia@ / prospector@ — so pilot/prospector **replies were not received**.

Outbound still works (SPF includes `resend.com`).

### Fix (one-time — Cloudflare + Resend)

1. Resend dashboard → **Domains** → `grayarx.com` → enable **Receiving**
2. Copy the **MX** record Resend shows
3. Cloudflare DNS → Add MX (priority as Resend shows; usually 10)
4. Confirm Receiving shows **verified**
5. Webhooks → `https://www.grayarx.com/api/webhooks/whatsapp` is WhatsApp; email webhook must be:
   - URL: `https://www.grayarx.com/api/webhooks/resend-inbound`
   - Events: `email.received`
6. Railway: `RESEND_INBOUND_WEBHOOK_SECRET` = Resend signing secret; `RESEND_API_KEY` (needed to fetch email **body** — webhooks are metadata-only); `FOUNDER_ALERT_EMAIL`

### Check anytime

```bash
curl -s https://www.grayarx.com/api/webhooks/health | jq .inboundEmail
```

Or open **`/admin/compliance`** — red banner if MX is still missing.

## Reply-To behaviour (code)

| Outbound | From | Reply-To |
|----------|------|----------|
| Pilot | pilot@grayarx.com | hello@grayarx.com |
| Mia drip | mia@grayarx.com | hello@grayarx.com |
| Prospector | prospector@grayarx.com | hello@grayarx.com |
| Lead ack | noreply@grayarx.com | hello@grayarx.com |

Inbound To: hello@ / mia@ / prospector@ / pilot@ → stored as mailbox `hello` and founder-alerted.

## POPIA Information Officer

See `docs/POPIA_INFORMATION_OFFICER.md`.

## Database

Migration `0064_compliance_inquiries.sql` applied on boot via `scripts/apply-pending-migrations.mjs`.
