# GrayArx Go-to-Market Strategy

**Date:** 23 May 2026  
**Status:** Ready for Beta Launch  
**Timeline:** 2 weeks to beta, 6 weeks to paid launch

---

## Phase 1: Payment Processing Options for South Africa

### Option 1: **PayFast** ⭐ RECOMMENDED (Fastest)
- **Approval time:** 24–48 hours
- **Setup:** Merchant account + API keys
- **Fees:** 2.5% + R0.50 per transaction (or 1.5% for high volume)
- **Payout:** Daily to your bank account
- **Pros:** Fastest approval, local support, familiar to SA businesses
- **Cons:** Slightly higher fees than Stripe
- **Implementation:** 2–3 credits, 1 day

### Option 2: **Yoco** (Fast Alternative)
- **Approval time:** 2–3 days
- **Setup:** Online application, instant API access
- **Fees:** 2.9% + R0.50 per transaction
- **Payout:** Next business day
- **Pros:** Very fast, modern API, good for recurring billing
- **Cons:** Slightly higher fees
- **Implementation:** 2–3 credits, 1 day

### Option 3: **Stripe** (Slower but Cheapest)
- **Approval time:** 3–7 days (SA is slower)
- **Setup:** Online application, manual review
- **Fees:** 2.9% + R0.30 per transaction
- **Payout:** 2 business days
- **Pros:** Cheapest fees, global standard, best UX
- **Cons:** Slowest approval
- **Implementation:** 3–4 credits, 1 day (once approved)

### Option 4: **Manual Bank Transfer** (Interim)
- **Approval time:** Instant
- **Setup:** None (use your existing bank account)
- **Fees:** None (you set the price)
- **Payout:** Manual reconciliation
- **Pros:** Zero setup time, full control
- **Cons:** Manual invoicing, no automation
- **Implementation:** 1 credit, 1 day (interim solution)

---

## **RECOMMENDATION: Hybrid Approach**

**Week 1 (Beta):** Launch with **Manual Bank Transfer** + **PayFast** (apply today, ready in 48 hours)
- Dealerships choose to pay via bank transfer (invoice-based) or PayFast (card)
- Zero delay to launch
- Collect first payments while Stripe is in review

**Week 2 (Paid Beta):** Add **Stripe** once approved
- Dealerships get all three options
- You get the cheapest fees on Stripe

**Cost:** ~3 credits to wire PayFast + manual billing; Stripe is free once approved

---

## Phase 2: Pricing Tiers & Feature Matrix

### **Tier 1: Starter — R1,999/month**
**Target:** Solo dealers, 1–5 vehicles/month

| Feature | Starter | Pro | Enterprise |
|---------|---------|-----|------------|
| **Vehicles in inventory** | 50 | 500 | Unlimited |
| **Leads/month** | 100 | 500 | Unlimited |
| **Email drips (Mia)** | Day 1 only | Day 1/3/7 | Day 1/3/7 + custom |
| **WhatsApp triage (Bongi)** | ✅ | ✅ | ✅ |
| **Trade-In Estimator (Tumi)** | ✅ | ✅ | ✅ |
| **Finance Calculator** | ✅ | ✅ | ✅ |
| **Comparison Tool** | ✅ | ✅ | ✅ |
| **Prospector (Sipho)** | ❌ | ✅ | ✅ |
| **Voice calls (Themba)** | ❌ | ✅ | ✅ |
| **Custom branding** | ❌ | ✅ | ✅ |
| **API access** | ❌ | ❌ | ✅ |
| **Dedicated support** | Email (48h) | Email (24h) | Phone (4h) |
| **Trial period** | 14 days free | 14 days free | Custom |

### **Tier 2: Pro — R4,999/month**
**Target:** Growing dealerships, 10–50 vehicles/month, want full agent suite

### **Tier 3: Enterprise — Custom**
**Target:** Large dealerships, 100+ vehicles/month, need custom integration

---

## Phase 3: Current Feature Inventory (What You Can Offer NOW)

### ✅ **Fully Implemented & Live**
- Public showroom with AI search
- Inventory CSV import (bulk + single)
- Lead capture (honeypot + rate-limit protected)
- Mia (email drips: Day 1/3/7, 11 languages)
- Bongi (WhatsApp triage, message drafts)
- Themba (voice call scripts)
- Sipho (prospector: nightly SA lead scouting)
- Lerato (fallback inbox)
- Thandi (invoice CRUD, VAT calc)
- Tumi (trade-in valuation, 8-factor)
- Kagiso (24h audit, patch proposals)
- Trade-In Estimator page
- Finance Calculator
- Comparison Tool (up to 3 vehicles)
- Per-dealership module toggles (enable/disable features)
- Per-dealership brand kit (logo, accent color)
- Admin dashboard (dealership list, KPIs, module toggles)
- Per-agent activity feed
- Lead pipeline Kanban board
- Showroom SEO (sitemap.xml + JSON-LD)
- POPIA consent + e-signature (audit trail)

### 🟡 **Partial / Needs Polish**
- Custom branding (subdomain per dealership)
- Dealer-branded emails (from dealer's own domain)
- Dealer-branded WhatsApp (dealer name in signature)
- Analytics dashboard (lead funnel, conversion rates)
- Monthly report email

### ❌ **Not Yet Implemented**
- API access for third-party integrations
- Custom workflows (per dealership)
- Advanced reporting (ROI, lead quality scoring)
- Mobile app (iOS/Android)

---

## Phase 4: Recommended Pricing Strategy

### **Why These Prices?**

**Starter (R1,999):**
- Covers your infrastructure costs (~R800/month per dealership)
- Leaves R1,200 gross margin
- Attractive to price-sensitive dealers
- Expected conversion: 30% of prospects

**Pro (R4,999):**
- 2.5x Starter price
- Includes Prospector + Voice agents (high value)
- Expected conversion: 50% of prospects who try Starter
- Gross margin: R3,500/month

**Enterprise (Custom):**
- Minimum R9,999/month
- For dealerships with 100+ vehicles
- Includes API access, dedicated support
- Expected conversion: 20% of Pro customers

### **Revenue Projection (Year 1)**
- 50 dealerships at Starter (R1,999) = R99,950/month
- 25 dealerships at Pro (R4,999) = R124,975/month
- 5 dealerships at Enterprise (R12,000 avg) = R60,000/month
- **Total:** R284,925/month (~R3.4M annual)
- **Gross margin (60%):** ~R2M annual

---

## Phase 5: What You Need to Launch

### **Immediate (Today)**
1. ✅ **Bank account** — You have this
2. ✅ **Tax number** — You have this (TaxNumber.pdf)
3. ✅ **Support email** — grayarx@gmail.com
4. ⏳ **Payment processor** — Apply to PayFast today (24–48h approval)

### **This Week**
5. Decide on pricing tiers (use the table above as a template)
6. Finalize feature matrix (what's in each tier?)
7. Generate first 50 dealership prospects (Sipho agent)

### **Next Week**
8. Wire PayFast into the platform
9. Build sales email sequence
10. Deploy to www.grayarx.com

---

## Phase 6: Auto-Generate Dealership Prospects

**How it works:**
- Sipho (prospector agent) runs nightly, scouting SA dealerships
- Generates 5–10 new prospects per night
- Stores them in the `prospects` table with contact info + score
- You export as CSV for email outreach

**What you'll get:**
- Dealership name
- Region (Gauteng, Western Cape, KZN, etc.)
- Estimated monthly volume
- Contact email
- Phone number
- Score (1–100, based on likelihood to buy)

**Timeline:** Run Sipho for 1 week → 50 prospects → Ready to email

---

## Summary: Go-to-Market Timeline

| Week | Action | Owner | Status |
|------|--------|-------|--------|
| **Week 1** | Apply to PayFast | You | ⏳ |
| **Week 1** | Finalize pricing tiers | You | ⏳ |
| **Week 1** | Wire PayFast + manual billing | Manus | ⏳ |
| **Week 1** | Run Sipho to generate 50 prospects | Manus | ⏳ |
| **Week 2** | Build sales email sequence | Manus | ⏳ |
| **Week 2** | Deploy to www.grayarx.com | Manus | ⏳ |
| **Week 2** | Start emailing first 50 dealerships | You | ⏳ |
| **Week 3** | First paid signups (if Stripe approved) | — | ⏳ |

---

## Next Steps

1. **Confirm pricing tiers** — Do you agree with Starter/Pro/Enterprise at R1,999/R4,999/Custom?
2. **Apply to PayFast** — I'll provide the link + setup guide
3. **Confirm support email** — grayarx@gmail.com?
4. **GIF for emails** — You mentioned needing a GIF. What should it show? (animated logo? product demo?)

Once you confirm, I'll start wiring PayFast + running Sipho to generate your prospect list.
