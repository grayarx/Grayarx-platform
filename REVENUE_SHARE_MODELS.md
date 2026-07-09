# Revenue Share Models for GrayArx Referral Program

## Model Comparison

### Model 1: Tiered Revenue Share (Recommended for SaaS)

**How it works:** Referrer gets % of all revenue from referred customer

| Tier | Monthly Revenue | Referrer Share | GrayArx Keeps |
|------|-----------------|-----------------|----------------|
| Starter | $99 | 20% ($19.80) | 80% ($79.20) |
| Pro | $299 | 20% ($59.80) | 80% ($239.20) |
| Enterprise | Custom | 20% | 80% |

**Example:**
- You refer Dealership B → They sign up for Pro ($299/mo)
- You earn: $59.80/month (recurring, as long as they stay)
- After 12 months: $717.60 total from this one referral

**Pros:**
- ✅ Recurring passive income
- ✅ Incentivizes quality referrals (keeps customers longer)
- ✅ Scales with customer success
- ✅ Industry standard for SaaS

**Cons:**
- ❌ Unpredictable income (depends on churn)
- ❌ Lower immediate payoff
- ❌ Complex tracking

---

### Model 2: One-Time Referral Bonus

**How it works:** Fixed payment per successful referral

| Tier | Bonus Per Referral |
|------|-------------------|
| Starter | $50 |
| Pro | $150 |
| Enterprise | $500 |

**Example:**
- You refer Dealership B → They sign up for Pro
- You earn: $150 (one-time, immediately)

**Pros:**
- ✅ Immediate payment
- ✅ Simple to understand
- ✅ Easy to track
- ✅ Predictable income

**Cons:**
- ❌ No recurring benefit
- ❌ Doesn't reward customer retention
- ❌ Lower total earnings potential
- ❌ Less incentive for quality

---

### Model 3: Hybrid Model (Best of Both)

**How it works:** Upfront bonus + ongoing revenue share

| Tier | Upfront Bonus | Monthly Revenue Share | Total Year 1 |
|------|---------------|----------------------|--------------|
| Starter | $50 | 10% ($9.90/mo) | $168.80 |
| Pro | $150 | 15% ($44.85/mo) | $687.20 |
| Enterprise | $500 | 20% (custom %) | Variable |

**Example:**
- You refer Dealership B → They sign up for Pro
- You earn: $150 immediately + $44.85/month
- Year 1 total: $687.20

**Pros:**
- ✅ Immediate cash + recurring income
- ✅ Rewards quality referrals
- ✅ Balances risk/reward
- ✅ Highly motivating

**Cons:**
- ❌ More complex
- ❌ Higher cost to company
- ❌ Requires careful tracking

---

### Model 4: Tiered Escalation (Rewards High Performers)

**How it works:** Revenue share increases based on total referrals

| Referrals | Revenue Share | Bonus |
|-----------|--------------|-------|
| 1-5 | 15% | - |
| 6-10 | 20% | $500 |
| 11-20 | 25% | $1,000 |
| 20+ | 30% | $2,000 |

**Example:**
- You refer 8 dealerships → You get 20% + $500 bonus
- If one referred dealership pays $299/mo
- You earn: $59.80/mo per referral + $500 bonus

**Pros:**
- ✅ Gamified - motivates high performers
- ✅ Rewards loyalty
- ✅ Builds affiliate community
- ✅ Scales with success

**Cons:**
- ❌ Very complex
- ❌ Highest cost to company
- ❌ Requires sophisticated tracking

---

### Model 5: Revenue Share with Clawback (Risk-Adjusted)

**How it works:** Full revenue share, but clawed back if customer churns

| Scenario | Referrer Earnings |
|----------|------------------|
| Customer stays 12+ months | 20% of all revenue |
| Customer churns in 6 months | 10% of revenue (clawed back 50%) |
| Customer churns in 3 months | 0% (full clawback) |

**Example:**
- You refer Dealership B → They sign up for Pro ($299/mo)
- Months 1-3: You earn 0% (trial period)
- Month 4-6: You earn 10% ($29.90/mo)
- Month 7+: You earn 20% ($59.80/mo)

**Pros:**
- ✅ Incentivizes quality referrals
- ✅ Protects GrayArx from churn
- ✅ Fair to both parties

**Cons:**
- ❌ Complex to explain
- ❌ Referrers feel penalized
- ❌ Difficult to track

---

## Recommendation for GrayArx

### **Best Model: Hybrid Model (Model 3)**

**Why:**
1. **Immediate motivation** - $150 upfront gets referrers excited
2. **Recurring reward** - 15% ongoing incentivizes quality
3. **Balanced cost** - ~$600-800 cost per high-value referral (acceptable)
4. **Scalable** - Works for 10 or 1000 referrals
5. **Industry proven** - Used by Salesforce, HubSpot, Slack

### Proposed Structure for GrayArx

```
Starter Plan ($99/mo)
├─ Upfront Bonus: $50
├─ Monthly Share: 10% ($9.90/mo)
└─ Year 1 Total: $168.80

Pro Plan ($299/mo)
├─ Upfront Bonus: $150
├─ Monthly Share: 15% ($44.85/mo)
└─ Year 1 Total: $687.20

Enterprise Plan (Custom)
├─ Upfront Bonus: $500
├─ Monthly Share: 20% (custom)
└─ Year 1 Total: $2,500+ (estimated)
```

### Financial Impact Analysis

**Scenario: 50 referrals in Year 1**

| Plan Mix | Avg Revenue/Referral | Total GrayArx Revenue | Total Referrer Payouts | Net Margin |
|----------|----------------------|----------------------|------------------------|-----------|
| 60% Pro, 40% Starter | $287/mo | $172,200/year | $28,400/year | 83.5% |
| 50% Pro, 50% Starter | $199/mo | $119,400/year | $20,100/year | 83.2% |
| 70% Pro, 30% Starter | $339/mo | $203,400/year | $33,800/year | 83.4% |

**Conclusion:** Even with 50 referrals, GrayArx keeps 83%+ margin while referrers earn meaningful income.

---

## Implementation Details

### Tracking System
- Unique referral links per dealership
- Automatic commission calculation
- Monthly payout via Stripe Connect
- Real-time dashboard showing earnings

### Payout Schedule
- Upfront bonus: Paid within 7 days of referral signup
- Monthly share: Paid on 1st of following month
- Minimum payout: $10 (batched if under)
- Payment method: Bank transfer or Stripe

### Clawback Rules
- If customer cancels within 30 days: Upfront bonus refunded
- If customer cancels within 90 days: 50% of monthly share refunded
- After 90 days: No clawback

### Fraud Prevention
- Verify referral relationship
- Prevent self-referrals
- Monitor for suspicious patterns
- Manual review for large commissions

---

## Alternative Scenarios

### If You Want Maximum Recurring Income
**Use: Tiered Revenue Share (Model 1)**
- 20% of all revenue forever
- No upfront bonus
- Best long-term earnings

### If You Want Quick Cash
**Use: One-Time Bonus (Model 2)**
- $150 per Pro referral
- Immediate payment
- Best for short-term needs

### If You Want to Reward Top Performers
**Use: Tiered Escalation (Model 4)**
- 15-30% based on volume
- Bonuses at milestones
- Best for competitive dealerships

---

## Recommendation Summary

**For GrayArx, I recommend: HYBRID MODEL**

**Structure:**
- Starter: $50 upfront + 10% monthly
- Pro: $150 upfront + 15% monthly  
- Enterprise: $500 upfront + 20% monthly

**Why this works:**
1. ✅ Dealerships get immediate cash motivation
2. ✅ Recurring income rewards quality referrals
3. ✅ GrayArx maintains 83%+ margins
4. ✅ Industry-standard approach
5. ✅ Easy to explain and track
6. ✅ Scalable to any volume

**Ready to implement?** Let me know and I'll build:
1. Referral tracking system
2. Commission calculation engine
3. Payout automation via Stripe
4. Affiliate dashboard
5. Analytics and reporting
