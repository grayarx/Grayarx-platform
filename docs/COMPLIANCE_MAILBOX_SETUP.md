# Compliance mailbox monitoring

GrayArx monitors **privacy@**, **legal@**, and **hello@** through two channels:

## 1. Web form (live now)

- **Public:** [grayarx.com/legal](https://www.grayarx.com/legal) → “Contact compliance team”
- **Dealer console:** `/dealer/legal`
- Every submission:
  - Saved to `compliance_inquiries` table
  - **Instant email to founder** via Resend (`alerts@grayarx.com` → your Gmail)
  - Visible at **`/admin/compliance`**

## 2. Real inbound email (Resend — recommended)

When someone emails `privacy@grayarx.com` or `legal@grayarx.com` directly:

### Resend setup

1. Resend dashboard → **Domains** → `grayarx.com` → enable **Receiving**
2. Add MX records Resend provides (if not already)
3. **Webhooks** → Add endpoint:
   - URL: `https://www.grayarx.com/api/webhooks/resend-inbound`
   - Events: `email.received`
4. Optional: set `RESEND_INBOUND_WEBHOOK_SECRET` in Railway env and match Resend signing secret

### Founder alert email

Set in Railway / `.env`:

```env
FOUNDER_ALERT_EMAIL=grayarx@gmail.com
```

All compliance + lead + onboarding alerts land here via Resend (works even when Manus Forge notifications are down).

## Admin console

- **`/admin/compliance`** — full inbox, mark as read
- **`/admin/ops`** — platform KPIs

## POPIA Information Officer

See `docs/POPIA_INFORMATION_OFFICER.md` for registration steps with the Information Regulator.

## Database migration

Applied automatically on server boot via `scripts/apply-pending-migrations.mjs` (includes `0064_compliance_inquiries.sql`).

Manual run:

```bash
pnpm db:migrate-pending
```
