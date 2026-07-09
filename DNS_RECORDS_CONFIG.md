# DNS Records Configuration for www.grayarx.com

## SendGrid DKIM Authentication Records

Add the following CNAME records to your domain registrar for www.grayarx.com:

### Record 1: Mail Server CNAME
```
Host/Name: mail.www.grayarx.com
Type: CNAME
Value: sendgrid.net
TTL: 3600
Priority: (leave blank)
```

### Record 2: DKIM Key 1
```
Host/Name: s1._domainkey.www.grayarx.com
Type: CNAME
Value: s1.domainkey.sendgrid.net
TTL: 3600
Priority: (leave blank)
```

### Record 3: DKIM Key 2
```
Host/Name: s2._domainkey.www.grayarx.com
Type: CNAME
Value: s2.domainkey.sendgrid.net
TTL: 3600
Priority: (leave blank)
```

---

## Implementation Instructions

### For Manus Domain Manager

1. Log in to Manus dashboard
2. Go to **Settings** → **Domains** → **www.grayarx.com**
3. Click **DNS Records**
4. Add the three CNAME records above
5. Save changes

### For External Domain Registrar (if applicable)

1. Log in to your domain registrar (GoDaddy, Namecheap, etc.)
2. Find DNS management section
3. Add the three CNAME records
4. Save and wait for propagation (24-48 hours)

---

## Verification Steps

### Step 1: Check DNS Propagation
Use online DNS checker: https://dnschecker.org

Search for: `mail.www.grayarx.com`
Expected result: CNAME pointing to `sendgrid.net`

### Step 2: Verify in SendGrid Dashboard
1. Log in to SendGrid: https://app.sendgrid.com
2. Go to **Settings** → **Sender Authentication**
3. Find domain: `www.grayarx.com`
4. Click **Verify** button
5. Wait for verification (usually 5-10 minutes after DNS propagation)

### Step 3: Confirm DKIM Signing
1. In SendGrid dashboard
2. Go to **Settings** → **Mail Send** → **DKIM Signing**
3. Verify toggle is ON for `www.grayarx.com`

---

## Expected Timeline

| Step | Time | Status |
|------|------|--------|
| Add DNS records | 5 min | ⏳ Pending |
| DNS propagation | 24-48 hrs | ⏳ Pending |
| SendGrid verification | 5-10 min | ⏳ Pending |
| Email delivery improvement | Immediate | ⏳ Pending |

---

## Success Indicators

Once DNS is verified:
- ✅ DKIM signing enabled
- ✅ SPF records valid
- ✅ DMARC compliant
- ✅ Email delivery rate: 85% → 95%+
- ✅ Reduced spam folder placement

---

## Troubleshooting

### DNS Records Not Propagating
- Wait 24-48 hours
- Check with multiple DNS checkers
- Verify records are exactly as specified
- Check for trailing dots in DNS records

### SendGrid Verification Failing
- Ensure DNS records are fully propagated
- Check CNAME values are exact
- Verify TTL is set correctly
- Try verification again after 1 hour

### Emails Still Going to Spam
- Verify all three CNAME records are added
- Check DKIM signing is enabled
- Monitor SendGrid reputation dashboard
- Review email content for spam triggers

---

## Next Steps

1. ✅ Add DNS records to domain registrar
2. ⏳ Wait for DNS propagation (24-48 hours)
3. ⏳ Verify domain in SendGrid
4. ⏳ Run automated dealership onboarding
5. ⏳ Deploy to production

---

## Support

For issues with DNS configuration:
- SendGrid Support: https://support.sendgrid.com
- Domain Registrar Support: Contact your registrar
- GrayArx Support: support@grayarx.com
