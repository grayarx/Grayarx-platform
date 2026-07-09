# Dealership Prospect Generation Guide

## How Sipho Generates Prospects

**Sipho** (the prospector agent) runs nightly and scouts South African dealerships for you.

### What Sipho Collects

For each dealership:
- **Name** (e.g., "Acme Motors")
- **Region** (Gauteng, Western Cape, KZN, Limpopo, etc.)
- **City** (e.g., "Johannesburg")
- **Estimated monthly volume** (vehicles sold/month)
- **Contact email** (dealership manager or owner)
- **Phone number**
- **Website** (if available)
- **Score** (1–100, likelihood to buy GrayArx)

### Scoring Logic

Sipho prioritizes dealerships by:
- **Size:** Larger dealerships (50+ vehicles/month) score higher
- **Location:** Urban areas score higher than rural
- **Website quality:** Modern websites score higher
- **Recent activity:** Recently updated websites score higher
- **Fit:** Dealerships with 5–100 vehicles/month are ideal (not too small, not too large)

### Running Sipho

1. **Manual run:** Go to `/admin/sipho` → Click **"Run Prospector"** → Wait 5–10 minutes
2. **Automated:** Sipho runs nightly at 2 AM (automatic)
3. **Export:** Go to `/admin/prospects` → Click **"Export as CSV"**

### Expected Output

- **Week 1:** 50 prospects
- **Week 2:** 100 prospects
- **Week 3:** 150 prospects
- **Month 1:** 200+ prospects

### Quality Assurance

Each prospect is manually verified by Sipho before export:
- ✅ Email address is valid
- ✅ Phone number is valid
- ✅ Dealership is actively operating
- ✅ Not already a GrayArx customer

### Using the Prospect List

1. **Export as CSV** from `/admin/prospects`
2. **Import into email tool** (Gmail, Mailchimp, etc.)
3. **Send sales sequence** (5 emails over 21 days)
4. **Track opens/clicks** in your email tool
5. **Follow up** with high-engagement prospects

### Expected Conversion

- **Email opens:** 25–35%
- **Link clicks:** 5–10%
- **Trial signups:** 1–3%
- **Paid conversions:** 10–20% of trial signups

**Example:** 100 prospects → 30 opens → 7 clicks → 1–2 trials → 1 paid customer

### Refining Prospects

If a prospect doesn't fit (too small, wrong region, etc.):
1. Go to `/admin/prospects`
2. Click **"Mark as Not Interested"**
3. Sipho will deprioritize similar prospects in future runs

### Prospect Tiers

Sipho scores prospects into tiers:

| Tier | Score | Profile | Action |
|------|-------|---------|--------|
| **Tier 1** | 80–100 | Large dealerships, urban, modern website | Email immediately |
| **Tier 2** | 60–79 | Medium dealerships, growing | Email after Tier 1 |
| **Tier 3** | 40–59 | Smaller dealerships, rural | Email as follow-up |
| **Tier 4** | <40 | Very small or outdated | Archive |

### Timeline

- **Week 1:** Run Sipho, export 50 Tier 1 prospects
- **Week 2:** Send Email 1 to 50 prospects
- **Week 3:** Send Email 2–3 to non-openers
- **Week 4:** First trial signups expected
- **Week 5–6:** First paid conversions expected

---

## Next Steps

1. Go to `/admin/sipho` and click **"Run Prospector"**
2. Wait 5–10 minutes for initial results
3. Export as CSV once complete
4. Use the CSV with the sales email sequence
5. Track conversions in your email tool

**Expected result:** 1–2 paid customers per 100 prospects within 6 weeks.
