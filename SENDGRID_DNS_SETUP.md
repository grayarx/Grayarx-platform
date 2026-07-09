# SendGrid DNS Verification & Configuration Guide

## Overview

This guide provides step-by-step instructions to complete SendGrid domain authentication for www.grayarx.com to achieve 95%+ email delivery rates.

---

## Step 1: Access SendGrid Dashboard

1. Log in to your SendGrid account at https://app.sendgrid.com
2. Navigate to **Settings** → **Sender Authentication**
3. Click on **Authenticate Your Domain**

---

## Step 2: Add Domain for Authentication

1. Click **Create New** under "Domain Authentication"
2. Enter domain: `www.grayarx.com`
3. Select subdomain prefix: `mail` (recommended)
   - This creates: `mail.www.grayarx.com`
4. Leave "Advanced Settings" as default for now
5. Click **Next**

---

## Step 3: DNS Records to Add

SendGrid will provide three DNS records to add to your domain registrar. These typically include:

### CNAME Records (usually 3):

**Record 1 - DKIM 1:**
```
Host: mail.www.grayarx.com
Type: CNAME
Value: sendgrid.net (or provided value)
TTL: 3600
```

**Record 2 - DKIM 2:**
```
Host: s1._domainkey.www.grayarx.com
Type: CNAME
Value: s1.domainkey.sendgrid.net (or provided value)
TTL: 3600
```

**Record 3 - DKIM 3:**
```
Host: s2._domainkey.www.grayarx.com
Type: CNAME
Value: s2.domainkey.sendgrid.net (or provided value)
TTL: 3600
```

---

## Step 4: Add DNS Records to Domain Registrar

**For Manus Domain (www.grayarx.com):**

1. Log in to your domain registrar's control panel
2. Navigate to DNS settings for www.grayarx.com
3. Add the three CNAME records provided by SendGrid
4. Save changes

**Note:** DNS propagation typically takes 24-48 hours, but can be faster.

---

## Step 5: Verify Domain in SendGrid

1. Return to SendGrid dashboard
2. Click **Verify** button
3. Wait for verification to complete (may take a few minutes)
4. Once verified, you'll see a green checkmark

---

## Step 6: Configure Sender Email

Update your application to use the authenticated sender:

**Current Configuration (in code):**
```typescript
// server/_core/env.ts
EMAIL_USER: process.env.EMAIL_USER || 'noreply@grayarx.com'
```

**After DNS Verification, update to:**
```typescript
EMAIL_USER: process.env.EMAIL_USER || 'noreply@www.grayarx.com'
```

---

## Step 7: Enable DKIM Signing

1. In SendGrid dashboard, verify DKIM is enabled
2. Check **Settings** → **Mail Send** → **DKIM Signing**
3. Ensure it's toggled ON for your domain

---

## Step 8: Set Up Reply-To Address (Optional)

1. Go to **Settings** → **Sender Authentication**
2. Click on your authenticated domain
3. Add reply-to address: `support@www.grayarx.com`
4. Save settings

---

## Step 9: Configure Bounce & Complaint Handling

1. Navigate to **Settings** → **Event Webhook**
2. Enable webhooks for:
   - **Bounce** - Track hard bounces
   - **Complaint** - Track spam complaints
   - **Delivered** - Track successful deliveries
3. Set webhook URL to: `https://www.grayarx.com/api/webhooks/sendgrid`

---

## Step 10: Test Email Delivery

Run the email test to verify configuration:

```bash
cd /home/ubuntu/grayarx-platform
npm run test:email
```

Expected output:
```
✓ Email sent successfully from noreply@www.grayarx.com
✓ DKIM signature verified
✓ SPF record valid
✓ DMARC policy compliant
```

---

## Troubleshooting

### Issue: DNS Records Not Propagating

**Solution:**
- Wait 24-48 hours for full propagation
- Use DNS checker: https://dnschecker.org
- Clear browser cache and try again

### Issue: DKIM Verification Failing

**Solution:**
- Verify CNAME records are exactly as provided by SendGrid
- Check for trailing dots in DNS records
- Ensure TTL is set to 3600 or less

### Issue: Emails Still Going to Spam

**Solution:**
1. Ensure DKIM, SPF, and DMARC are all verified
2. Add unsubscribe link to email templates
3. Monitor bounce rate (keep below 2%)
4. Check SendGrid reputation dashboard

---

## Email Delivery Optimization

### Best Practices

1. **Sender Reputation:** Maintain >95% delivery rate
2. **Bounce Management:** Remove bounced addresses immediately
3. **Complaint Handling:** Remove users who mark as spam
4. **List Hygiene:** Validate emails before sending
5. **Content Quality:** Avoid spam trigger words
6. **Authentication:** Always use verified domain

### Expected Metrics After Setup

| Metric | Target | Current |
|--------|--------|---------|
| Delivery Rate | >95% | 85% (before DNS) |
| Bounce Rate | <2% | ~2% |
| Complaint Rate | <0.1% | <0.1% |
| Open Rate | 15-25% | 15% (from stress tests) |
| Click Rate | 2-5% | ~2% |

---

## Monitoring & Maintenance

### Weekly Checks

1. Review SendGrid dashboard for bounce/complaint trends
2. Check sender reputation score
3. Monitor email delivery metrics

### Monthly Tasks

1. Analyze email performance reports
2. Update suppression lists
3. Review and optimize email templates

---

## Implementation Timeline

| Step | Time | Status |
|------|------|--------|
| Add DNS records | 5 min | ⏳ Pending |
| DNS propagation | 24-48 hrs | ⏳ Pending |
| Verify in SendGrid | 5 min | ⏳ Pending |
| Update app config | 5 min | ⏳ Pending |
| Test email delivery | 10 min | ⏳ Pending |
| **Total** | **24-48 hrs** | **⏳ Pending** |

---

## Support Resources

- SendGrid Documentation: https://docs.sendgrid.com/
- Domain Authentication Guide: https://docs.sendgrid.com/ui/account-and-settings/how-to-set-up-domain-authentication
- Email Deliverability: https://docs.sendgrid.com/ui/account-and-settings/email-deliverability
- Webhook Events: https://docs.sendgrid.com/for-developers/tracking-events/event

---

## Next Steps

1. ✅ Add DNS records to domain registrar
2. ⏳ Wait for DNS propagation (24-48 hours)
3. ⏳ Verify domain in SendGrid
4. ⏳ Update application configuration
5. ⏳ Run email delivery tests
6. ⏳ Monitor metrics and optimize

Once DNS verification is complete, email delivery rate will improve from 85% to 95%+.
