# End-to-End Payment Flow Verification

## Overview

This document outlines the complete payment flow for GrayArx dealership subscriptions using manual bank transfer billing.

## Payment Flow Steps

### 1. Dealership Signup (Public)
- **URL:** https://www.grayarx.com/onboarding
- **Action:** Dealership fills out onboarding form
- **Data Captured:** Name, contact, region, monthly volume, vehicle types, CSV upload
- **Database:** `onboardingSubmissions` table
- **Status:** `new` → awaiting founder review

### 2. Founder Review & Approval (Admin)
- **URL:** https://www.grayarx.com/admin/onboarding
- **Action:** Founder reviews submission and clicks "Approve"
- **Auto-Provisioning:** Creates dealership + user account + initial subscription
- **Database:** `dealerships` table created, `subscriptions` table created
- **Status:** `onboarding_submissions.status` → `provisioned`

### 3. Subscription Created
- **Plan:** Starter (R3,500), Professional (R8,750), or Enterprise (custom)
- **Billing Cycle:** Monthly, starting on approval date
- **Auto-Renew:** Enabled by default
- **Database:** `subscriptions` table with active status

### 4. Invoice Generation (Admin)
- **URL:** https://www.grayarx.com/admin/billing
- **Action:** Founder clicks "Generate Invoice" for dealership
- **Invoice Details:**
  - Invoice Number: `GRAYARX-YYYYMM-XXXXX`
  - Amount: Subscription price (no VAT — not VAT registered)
  - Due Date: Net 30 (30 days from invoice date)
  - Status: `sent`
- **Database:** `invoices` table created
- **Email:** Invoice sent to dealership contact email (future enhancement)

### 5. Manual Bank Transfer Payment
- **Method:** Dealership transfers funds to GrayArx bank account
- **Bank Details:** Provided in invoice or onboarding email
- **Reference:** Invoice number or dealership name

### 6. Payment Recording (Admin)
- **URL:** https://www.grayarx.com/admin/billing
- **Action:** Founder receives bank transfer, clicks "Record Payment"
- **Payment Details:**
  - Invoice ID
  - Amount received
  - Bank reference/description
  - Payment method: `bank_transfer`
- **Database:** `payments` table created
- **Auto-Update:** If total paid ≥ invoice amount, invoice status → `paid`

### 7. Dealership Access Activated
- **Trigger:** Subscription status = `active`
- **Access:** Dealership can log in and use all platform features
- **Modules:** All enabled by default (can be toggled by founder)

### 8. Monthly Renewal
- **Trigger:** `nextRenewalDate` reached
- **Action:** New invoice automatically generated (future automation)
- **Billing Cycle:** Resets for next month

---

## Testing Checklist

### ✅ Test 1: Complete Signup Flow
- [ ] Visit https://www.grayarx.com/onboarding
- [ ] Fill out form with test dealership data
- [ ] Submit form
- [ ] Verify `onboardingSubmissions` record created in database

### ✅ Test 2: Founder Approval
- [ ] Log in as founder at https://www.grayarx.com/admin/onboarding
- [ ] Find test submission
- [ ] Click "Approve"
- [ ] Verify:
  - `dealerships` record created
  - `subscriptions` record created with correct plan
  - `users` record created for dealership owner
  - Dealership status = `active`

### ✅ Test 3: Invoice Generation
- [ ] Go to https://www.grayarx.com/admin/billing
- [ ] Select dealership from dropdown
- [ ] Click "Generate Invoice"
- [ ] Verify:
  - Invoice number format: `GRAYARX-YYYYMM-XXXXX`
  - Amount = subscription price (no VAT)
  - Due date = today + 30 days
  - Invoice status = `sent`

### ✅ Test 4: Payment Recording
- [ ] In Admin Billing page, click "Record Payment"
- [ ] Enter:
  - Invoice ID (from previous test)
  - Amount (total invoice amount)
  - Reference: "Test payment"
- [ ] Verify:
  - Payment recorded in `payments` table
  - Invoice status updated to `paid`
  - Success toast notification

### ✅ Test 5: Dealership Login
- [ ] Log out of admin account
- [ ] Go to https://www.grayarx.com/login
- [ ] Log in with dealership account (created during approval)
- [ ] Verify:
  - Redirected to dealership dashboard
  - Can access showroom, inventory, leads, etc.
  - All modules enabled

### ✅ Test 6: Subscription View
- [ ] While logged in as dealership, visit subscription page (if available)
- [ ] Verify:
  - Current plan displayed
  - Monthly price shown
  - Next renewal date shown
  - Auto-renew toggle available

---

## Pricing Reference

| Plan | Monthly Price | Annual (if billed) | Features |
|------|---------------|-------------------|----------|
| Starter | R3,500 | R42,000 | Basic agents, 50 leads/month |
| Professional | R8,750 | R105,000 | All agents, 500 leads/month |
| Enterprise | Custom | Custom | White-label, dedicated support |

---

## Bank Account Details (for dealerships)

**Recipient:** GrayArx (Pty) Ltd  
**Bank:** [FNB Business Account - to be updated]  
**Account Number:** [To be provided]  
**Branch Code:** [To be provided]  
**Reference:** Invoice number or dealership name  

---

## Future Enhancements

- [ ] Automated invoice email to dealership
- [ ] Automated monthly invoice generation (Heartbeat cron)
- [ ] PayFast integration (when FNB account issue resolved)
- [ ] Stripe integration (secondary payment method)
- [ ] Invoice PDF generation
- [ ] Payment receipt email
- [ ] Subscription cancellation flow
- [ ] Upgrade/downgrade plan flow
- [ ] Proration for mid-cycle changes

---

## Support

**For payment issues:** grayarx@gmail.com  
**For technical issues:** Contact founder

