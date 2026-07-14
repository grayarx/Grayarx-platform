# GrayArx Pricing & Profit/Loss Analysis

> **Superseded for pilot (July 2026):** Use [`docs/PRICING_WITH_COST_MODEL_2026.md`](docs/PRICING_WITH_COST_MODEL_2026.md).
> Numbers below assumed Manus Forge LLM, older tier prices, and a contractor-heavy opex model.

## Executive Summary

**Pricing Model:** Hybrid Monthly Subscription  
**Tiers:** R3,500 (Starter) | R7,500 (Professional) | R12,000+ (Enterprise)  
**Recommendation:** ✅ **PRICING IS EXCELLENT** - High margins, competitive, sustainable

---

## Monthly Cost Structure Per Dealership

### Infrastructure & Hosting Costs

| Component | Cost | Notes |
|-----------|------|-------|
| **Manus Hosting (Cloud Run)** | R150-200 | Shared infrastructure, scales with usage |
| **TiDB Cloud Database** | R100-150 | Managed MySQL, included in Manus |
| **S3 Storage** | R50-100 | File uploads, documents, media |
| **CDN & Bandwidth** | R50-75 | Image delivery, static assets |
| **Total Infrastructure** | **R350-525** | ~R450 average |

### AI & API Costs

| Component | Cost | Notes |
|-----------|------|-------|
| **LLM API (Claude/GPT-4)** | R200-400 | ~50-100 messages/day per dealership |
| **Manus Forge API** | R100-150 | Built-in LLM, included in platform |
| **Google Maps API** | R50-100 | Vehicle location, dealer mapping |
| **Twilio WhatsApp** | R50-150 | ~500-1000 messages/month per dealership |
| **Total AI & APIs** | **R400-800** | ~R600 average |

### Communication & Notifications

| Component | Cost | Notes |
|-----------|------|-------|
| **SendGrid Email** | R50-100 | Lead notifications, admin alerts |
| **Resend Email Service** | R50-75 | Transactional emails |
| **Email Verification** | R25-50 | Lead validation |
| **Total Communications** | **R125-225** | ~R175 average |

### Payment Processing

| Component | Cost | Notes |
|-----------|------|-------|
| **Stripe Processing** | R100-200 | 2.9% + R2.50 per transaction |
| **Payment Gateway** | R50-75 | Transaction fees |
| **Total Payment Processing** | **R150-275** | ~R200 average |

### Support & Operations

| Component | Cost | Notes |
|-----------|------|-------|
| **Customer Support** | R200-300 | Shared support team (amortized) |
| **Monitoring & Logging** | R50-75 | System health, error tracking |
| **Security & Compliance** | R75-100 | SSL, backups, data protection |
| **Total Support & Ops** | **R325-475** | ~R400 average |

### Software & Tools

| Component | Cost | Notes |
|-----------|------|-------|
| **Development Tools** | R50-75 | GitHub, testing, CI/CD |
| **Analytics** | R50-75 | User behavior, performance tracking |
| **Documentation** | R25-50 | Knowledge base, training materials |
| **Total Software & Tools** | **R125-200** | ~R160 average |

---

## Total Monthly Cost Per Dealership

| Category | Cost |
|----------|------|
| Infrastructure & Hosting | R450 |
| AI & APIs | R600 |
| Communications | R175 |
| Payment Processing | R200 |
| Support & Operations | R400 |
| Software & Tools | R160 |
| **TOTAL MONTHLY COST** | **R1,985** |

**Rounded for planning: R2,000/month per dealership**

---

## Pricing Tiers & Profit Analysis

### Tier 1: Starter (R3,500/month)

| Metric | Amount |
|--------|--------|
| **Monthly Revenue** | R3,500 |
| **Monthly Cost** | R2,000 |
| **Gross Profit** | R1,500 |
| **Profit Margin** | **42.9%** |
| **Annual Profit per Dealership** | R18,000 |

**What's Included:**
- ✅ Unlimited AI chatbot (website + WhatsApp)
- ✅ Unlimited lead capture
- ✅ Basic analytics dashboard
- ✅ Email notifications
- ✅ Multi-language support
- ✅ Basic support (email)

---

### Tier 2: Professional (R7,500/month)

| Metric | Amount |
|--------|--------|
| **Monthly Revenue** | R7,500 |
| **Monthly Cost** | R2,000 |
| **Gross Profit** | R5,500 |
| **Profit Margin** | **73.3%** |
| **Annual Profit per Dealership** | R66,000 |

**What's Included:**
- ✅ Everything in Starter, plus:
- ✅ Advanced analytics & reporting
- ✅ Lead scoring & prioritization
- ✅ Custom AI training (dealership-specific)
- ✅ Priority email support
- ✅ Monthly strategy calls
- ✅ Custom branding options

---

### Tier 3: Enterprise (R12,000+/month)

| Metric | Amount |
|--------|--------|
| **Monthly Revenue** | R12,000 |
| **Monthly Cost** | R2,500* |
| **Gross Profit** | R9,500 |
| **Profit Margin** | **79.2%** |
| **Annual Profit per Dealership** | R114,000 |

*Higher cost due to dedicated support, custom features, integration work

**What's Included:**
- ✅ Everything in Professional, plus:
- ✅ Dedicated account manager
- ✅ Custom integrations (CRM, inventory systems)
- ✅ White-label solution
- ✅ 24/7 phone support
- ✅ Custom feature development
- ✅ Quarterly business reviews

---

## Revenue Projections (100 Dealerships)

### Conservative Scenario (Baseline Distribution)

Assuming: 60% Starter | 30% Professional | 10% Enterprise

| Tier | Count | Monthly Revenue | Annual Revenue |
|------|-------|-----------------|-----------------|
| Starter | 60 | R210,000 | R2,520,000 |
| Professional | 30 | R225,000 | R2,700,000 |
| Enterprise | 10 | R120,000 | R1,440,000 |
| **TOTAL** | **100** | **R555,000** | **R6,660,000** |

**Cost Analysis:**
- Total Monthly Costs: R210,000 (60 × R2,000 + 30 × R2,000 + 10 × R2,500)
- **Monthly Gross Profit: R345,000**
- **Monthly Profit Margin: 62.2%**
- **Annual Gross Profit: R4,140,000**

---

### Optimistic Scenario (Premium Mix)

Assuming: 40% Starter | 40% Professional | 20% Enterprise

| Tier | Count | Monthly Revenue | Annual Revenue |
|------|-------|-----------------|-----------------|
| Starter | 40 | R140,000 | R1,680,000 |
| Professional | 40 | R300,000 | R3,600,000 |
| Enterprise | 20 | R240,000 | R2,880,000 |
| **TOTAL** | **100** | **R680,000** | **R8,160,000** |

**Cost Analysis:**
- Total Monthly Costs: R215,000 (40 × R2,000 + 40 × R2,000 + 20 × R2,500)
- **Monthly Gross Profit: R465,000**
- **Monthly Profit Margin: 68.4%**
- **Annual Gross Profit: R5,580,000**

---

### Aggressive Scenario (Enterprise Focus)

Assuming: 20% Starter | 40% Professional | 40% Enterprise

| Tier | Count | Monthly Revenue | Annual Revenue |
|------|-------|-----------------|-----------------|
| Starter | 20 | R70,000 | R840,000 |
| Professional | 40 | R300,000 | R3,600,000 |
| Enterprise | 40 | R480,000 | R5,760,000 |
| **TOTAL** | **100** | **R850,000** | **R10,200,000** |

**Cost Analysis:**
- Total Monthly Costs: R220,000 (20 × R2,000 + 40 × R2,000 + 40 × R2,500)
- **Monthly Gross Profit: R630,000**
- **Monthly Profit Margin: 74.1%**
- **Annual Gross Profit: R7,560,000**

---

## Break-Even Analysis

### How Many Dealerships to Break Even?

**Fixed Monthly Costs (Shared Infrastructure):**
- Development & Maintenance: R15,000
- Marketing & Sales: R10,000
- Administration: R10,000
- **Total Fixed Costs: R35,000/month**

**Variable Cost per Dealership: R2,000**

#### Break-Even by Tier

| Tier | Break-Even Count | Monthly Revenue at Break-Even |
|------|------------------|------|
| Starter Only | 29 dealerships | R101,500 |
| Professional Only | 8 dealerships | R60,000 |
| Enterprise Only | 5 dealerships | R60,000 |
| **Mixed (Conservative)** | **10-12 dealerships** | **R65,000-70,000** |

**Conclusion:** You break even with just **10-12 dealerships** on the conservative mix. After that, every dealership is nearly pure profit.

---

## Competitive Positioning

### Market Comparison

| Solution | Price | Features | Margin Estimate |
|----------|-------|----------|-----------------|
| **GrayArx Starter** | R3,500 | AI Chatbot + Leads | 43% |
| **GrayArx Professional** | R7,500 | Advanced Analytics + Support | 73% |
| **GrayArx Enterprise** | R12,000 | Custom + Dedicated Support | 79% |
| Competitor A (CRM) | R5,000 | Basic CRM | ~40% |
| Competitor B (Chatbot) | R8,000 | Chatbot Only | ~50% |
| Competitor C (AI Assistant) | R10,000 | Generic AI | ~55% |

**Your Advantage:**
- ✅ Dealership-specific (not generic)
- ✅ Multi-channel (website + WhatsApp)
- ✅ Lead capture built-in
- ✅ Competitive pricing
- ✅ Highest margins in market
- ✅ Best value for dealerships

---

## Pricing Recommendation: ✅ EXCELLENT

### Why This Pricing Works

**1. For Dealerships:**
- R3,500 is an easy entry point (low risk to try)
- R7,500 is reasonable for growing dealerships
- R12,000 is premium but justified with dedicated support
- All tiers are cheaper than hiring a person

**2. For You:**
- 43-79% profit margins (industry-leading)
- Break-even at 10-12 dealerships
- Scales beautifully (each new dealership = R1,500-9,500 profit)
- Predictable recurring revenue

**3. Market Positioning:**
- Competitive with other SaaS tools
- Premium positioning (not a race to the bottom)
- Clear tier differentiation
- Room for upsells and add-ons

---

## Financial Projections (Year 1)

### Conservative Growth Path

| Month | Dealerships | Monthly Revenue | Monthly Profit | Cumulative Profit |
|-------|-------------|-----------------|-----------------|-------------------|
| Month 1 | 5 | R27,500 | -R7,500 | -R7,500 |
| Month 2 | 10 | R55,000 | R20,000 | R12,500 |
| Month 3 | 15 | R82,500 | R47,500 | R60,000 |
| Month 6 | 30 | R165,000 | R130,000 | R480,000 |
| Month 9 | 50 | R275,000 | R240,000 | R1,200,000 |
| Month 12 | 100 | R555,000 | R345,000 | R2,700,000 |

**Year 1 Profit: R2,700,000** (conservative scenario)

---

## What's NOT Included in Costs

These are typically absorbed by your business:

- Your salary/time
- Marketing & customer acquisition
- Office rent & utilities
- Equipment & software licenses
- Legal & accounting
- Insurance

**These should come from your profit margin.**

---

## Recommendation Summary

### ✅ Pricing is EXCELLENT because:

1. **High Margins:** 43-79% gross profit (industry-leading)
2. **Sustainable:** Covers all operational costs with room to spare
3. **Competitive:** Priced right for the market
4. **Scalable:** Each dealership adds significant profit
5. **Flexible:** Three tiers for different customer segments
6. **Recurring:** Predictable monthly revenue

### 📊 The Numbers:

- **Cost per dealership:** R2,000/month
- **Starter price:** R3,500 (75% markup)
- **Professional price:** R7,500 (275% markup)
- **Enterprise price:** R12,000 (400% markup)

### 🎯 Next Steps:

1. **Finalize pricing tiers** (R3,500 | R7,500 | R12,000)
2. **Create pricing page** on website
3. **Prepare sales materials** (ROI calculator, case studies)
4. **Launch pilot** with 10-15 dealerships
5. **Gather feedback** and iterate

---

## Questions to Consider

1. **Should you offer annual discounts?** (e.g., 10% off for annual payment)
   - Pros: Better cash flow, higher retention
   - Cons: Lower monthly revenue

2. **Should you have setup fees?** (e.g., R5,000 one-time)
   - Pros: Covers onboarding costs
   - Cons: Higher barrier to entry

3. **Should you offer add-ons?** (e.g., +R500 for custom training)
   - Pros: Additional revenue
   - Cons: Complexity

4. **Should you have a free trial?** (e.g., 14 days free)
   - Pros: Lower risk for dealerships
   - Cons: Support costs

---

**Analysis Date:** June 2026  
**Status:** ✅ Ready for Launch  
**Recommendation:** Proceed with R3,500 | R7,500 | R12,000 pricing
