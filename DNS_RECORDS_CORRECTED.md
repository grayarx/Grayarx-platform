# Corrected DNS Records Configuration for www.grayarx.com

## Issue Analysis

SendGrid verification is failing because the DNS records don't match the expected values. Based on the SendGrid dashboard, here are the **CORRECT** DNS records to add:

---

## ✅ Corrected CNAME Records

### Record 1: Mail Server CNAME (Primary)
```
Host/Name: em2578.grayarx.com
Type: CNAME
Value: u108075724.wl225.sendgrid.net
TTL: 3600
```

**Why:** SendGrid expects `em2578.grayarx.com` to point to `u108075724.wl225.sendgrid.net`

### Record 2: DKIM Key 1
```
Host/Name: s1._domainkey.grayarx.com
Type: CNAME
Value: s1.domainkey.u108075724.wl225.sendgrid.net
TTL: 3600
```

**Why:** DKIM signing requires this specific subdomain structure

### Record 3: DKIM Key 2
```
Host/Name: s2._domainkey.grayarx.com
Type: CNAME
Value: s2.domainkey.u108075724.wl225.sendgrid.net
TTL: 3600
```

**Why:** SendGrid uses two DKIM keys for redundancy

### Record 4: DMARC Policy (Optional but Recommended)
```
Host/Name: _dmarc.grayarx.com
Type: TXT
Value: v=DMARC1; p=none;
TTL: 3600
```

**Why:** DMARC helps prevent email spoofing (optional for initial setup)

---

## Critical Differences from Previous Configuration

| Previous | Corrected | Reason |
|----------|-----------|--------|
| `mail.www.grayarx.com` | `em2578.grayarx.com` | SendGrid specific subdomain |
| `sendgrid.net` | `u108075724.wl225.sendgrid.net` | Account-specific endpoint |
| `s1._domainkey.www.grayarx.com` | `s1._domainkey.grayarx.com` | Remove www prefix |
| `s1.domainkey.sendgrid.net` | `s1.domainkey.u108075724.wl225.sendgrid.net` | Account-specific DKIM |

---

## Implementation Steps

### Step 1: Delete Old Records (if already added)

If you added the previous incorrect records, delete these:
- `mail.www.grayarx.com` CNAME
- `s1._domainkey.www.grayarx.com` CNAME
- `s2._domainkey.www.grayarx.com` CNAME

### Step 2: Add Corrected Records

Log in to your domain registrar and add these 3 records:

1. **em2578.grayarx.com** → `u108075724.wl225.sendgrid.net`
2. **s1._domainkey.grayarx.com** → `s1.domainkey.u108075724.wl225.sendgrid.net`
3. **s2._domainkey.grayarx.com** → `s2.domainkey.u108075724.wl225.sendgrid.net`

### Step 3: Verify DNS Propagation

Use DNS checker: https://dnschecker.org

Search for: `em2578.grayarx.com`
Expected result: CNAME pointing to `u108075724.wl225.sendgrid.net`

### Step 4: Verify in SendGrid

1. Log in to SendGrid: https://app.sendgrid.com
2. Go to **Settings** → **Sender Authentication**
3. Click **Verify** for each domain
4. Wait for verification (5-10 minutes after DNS propagation)

---

## Verification Checklist

After adding the corrected DNS records:

- [ ] DNS records added to domain registrar
- [ ] DNS propagation verified (24-48 hours)
- [ ] SendGrid verification successful
- [ ] DKIM signing enabled
- [ ] SPF records valid
- [ ] DMARC policy compliant
- [ ] Test email delivered successfully

---

## Expected SendGrid Status After Verification

| Domain | Status | Notes |
|--------|--------|-------|
| em2578.grayarx.com | ✅ Verified | CNAME verified |
| s1._domainkey.grayarx.com | ✅ Verified | DKIM key 1 verified |
| s2._domainkey.grayarx.com | ✅ Verified | DKIM key 2 verified |
| _dmarc.grayarx.com | ✅ Verified | DMARC policy verified |

---

## Troubleshooting

### Issue: DNS Records Still Not Verifying

**Solution:**
1. Clear browser cache
2. Wait full 48 hours for DNS propagation
3. Check DNS records are EXACTLY as specified (no extra spaces or characters)
4. Verify TTL is set to 3600 or lower
5. Try verification again in SendGrid

### Issue: "Expected CNAME for 'em2578.grayarx.com' to match 'u108075724.wl225.sendgrid.net'"

**Solution:**
- This error means the DNS record is not pointing to the correct value
- Delete the record and re-add it with EXACT value: `u108075724.wl225.sendgrid.net`
- No trailing dots or extra characters

### Issue: Emails Still Going to Spam After Verification

**Solution:**
1. Verify all 3 CNAME records are verified in SendGrid
2. Check DKIM signing is enabled
3. Monitor SendGrid reputation dashboard
4. Ensure sender email is `noreply@grayarx.com` (not www.grayarx.com)

---

## Next Steps

1. ✅ Delete incorrect DNS records (if added)
2. ⏳ Add corrected DNS records to domain registrar
3. ⏳ Wait for DNS propagation (24-48 hours)
4. ⏳ Verify in SendGrid dashboard
5. ⏳ Test email delivery

---

## Important Notes

- **Domain:** Use `grayarx.com` (NOT `www.grayarx.com`)
- **Subdomain:** Use `em2578.grayarx.com` (NOT `mail.www.grayarx.com`)
- **DKIM:** Use `s1._domainkey.grayarx.com` (NOT `s1._domainkey.www.grayarx.com`)
- **Values:** Must match SendGrid account-specific values exactly

---

## Support

For additional help:
- SendGrid Documentation: https://docs.sendgrid.com/ui/account-and-settings/how-to-set-up-domain-authentication
- SendGrid Support: https://support.sendgrid.com
- GrayArx Support: support@grayarx.com

---

**Last Updated:** 2026-05-24  
**Status:** ✅ CORRECTED - Ready for implementation
