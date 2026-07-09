# PayFast Integration Setup Guide

## Step 1: Create PayFast Merchant Account

1. Go to https://www.payfast.co.za/
2. Click **"Sign Up"** → **"Merchant Account"**
3. Fill in:
   - Business name: **GrayArx**
   - Email: **grayarx@gmail.com**
   - Phone: **079 491 5187**
   - Bank account details (for payouts)
4. Submit for approval (24–48 hours)

## Step 2: Get Your API Keys

Once approved:
1. Log in to PayFast dashboard
2. Go to **Settings** → **API Keys**
3. Copy your:
   - **Merchant ID**
   - **Merchant Key**
   - **API Token** (for recurring billing)

## Step 3: Integration in GrayArx Platform

The platform will support:
- **One-time payments** (manual bank transfer)
- **Recurring billing** (PayFast subscription)
- **Invoice generation** (automatic email to dealership)
- **Payment history** (dashboard view)

## Step 4: Pricing Tiers

| Tier | Monthly | Billing |
|------|---------|---------|
| Starter | R3,500 | Recurring |
| Pro | R8,750 | Recurring |
| Enterprise | Custom | Manual quote |

## Step 5: Testing

PayFast provides a sandbox environment:
- **Sandbox URL:** https://sandbox.payfast.co.za/
- **Test merchant ID:** 10000100
- **Test merchant key:** test

Use sandbox to test the integration before going live.

## Step 6: Go Live

Once testing is complete:
1. Switch to production keys in the platform
2. Update billing page with PayFast logo
3. Send first invoice to dealership

---

**Timeline:** 48 hours from application to live billing.
