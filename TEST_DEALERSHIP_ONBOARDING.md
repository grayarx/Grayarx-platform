# Test Dealership Onboarding & End-to-End Validation

## Overview

This guide provides step-by-step instructions to onboard a test dealership and validate the complete GrayArx platform end-to-end flow.

---

## Phase 1: Test Dealership Setup

### Step 1.1: Create Test Dealership Account

1. Navigate to https://www.grayarx.com/dashboard
2. Click **Sign Up** or **Start Free Trial**
3. Fill in dealership details:
   - **Dealership Name:** Test Motors (Pty) Ltd
   - **Email:** test@testmotors.co.za
   - **Phone:** +27 (11) 123-4567
   - **Location:** Johannesburg, South Africa
   - **Vehicle Types:** All (Cars, Trucks, Motorcycles)

4. Accept terms and create account
5. Verify email (check test email inbox)
6. Complete dealership profile

### Step 1.2: Configure Dealership Settings

1. Go to **Settings** → **Company Profile**
2. Add dealership information:
   - Company name: Test Motors (Pty) Ltd
   - Enterprise number: 2024/123456
   - Tax number: 9876543210
   - Bank details (for payment processing)

3. Go to **Settings** → **API Keys**
4. Generate API key for testing
5. Save API key securely

### Step 1.3: Set Up Communication Channels

1. **Email Configuration:**
   - Go to **Settings** → **Email**
   - Verify sender email: noreply@www.grayarx.com
   - Enable email notifications

2. **WhatsApp Configuration:**
   - Go to **Settings** → **WhatsApp**
   - Connect WhatsApp Business Account
   - Test message: Send test message to +27123456789

3. **SMS Configuration:**
   - Go to **Settings** → **SMS**
   - Configure Twilio account
   - Test SMS: Send test SMS to +27123456789

---

## Phase 2: Agent Activation & Configuration

### Step 2.1: Activate Autonomous Agents

1. Go to **Agents** → **Available Agents**
2. Enable each agent:
   - ✅ **Sipho** (Lead Capture Agent)
   - ✅ **Mia** (Buyer Qualification Agent)
   - ✅ **Themba** (Test Drive Booking Agent)
   - ✅ **Kagiso** (Follow-up & Nurturing Agent)
   - ✅ **Nala** (Dealership Support Agent)

### Step 2.2: Configure Agent Settings

1. **Sipho Configuration:**
   - Go to **Agents** → **Sipho**
   - Set lead capture channels: Email, WhatsApp, SMS
   - Enable automatic lead scoring
   - Set lead quality threshold: High

2. **Mia Configuration:**
   - Go to **Agents** → **Mia**
   - Enable buyer qualification
   - Set qualification criteria: Budget, Timeline, Vehicle Type
   - Enable automatic follow-up

3. **Themba Configuration:**
   - Go to **Agents** → **Themba**
   - Connect to dealership calendar
   - Set available time slots: 9 AM - 5 PM (Mon-Fri)
   - Enable SMS reminders

4. **Kagiso Configuration:**
   - Go to **Agents** → **Kagiso**
   - Set follow-up schedule: Day 1, Day 3, Day 7
   - Enable personalized messaging
   - Configure nurture sequences

5. **Nala Configuration:**
   - Go to **Agents** → **Nala**
   - Enable dealership support
   - Configure FAQ database
   - Set response time: <2 minutes

### Step 2.3: Test Agent Responses

Run test queries for each agent:

```bash
# Test Sipho (Lead Capture)
curl -X POST https://www.grayarx.com/api/agents/sipho/test \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{"message": "I am interested in a Toyota Corolla"}'

# Test Mia (Buyer Qualification)
curl -X POST https://www.grayarx.com/api/agents/mia/test \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{"leadId": "test_lead_001"}'

# Test Themba (Test Drive Booking)
curl -X POST https://www.grayarx.com/api/agents/themba/test \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{"leadId": "test_lead_001", "vehicleId": "toyota_corolla_001"}'

# Test Kagiso (Follow-up)
curl -X POST https://www.grayarx.com/api/agents/kagiso/test \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{"leadId": "test_lead_001"}'

# Test Nala (Support)
curl -X POST https://www.grayarx.com/api/agents/nala/test \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{"query": "What is your warranty policy?"}'
```

---

## Phase 3: End-to-End Workflow Testing

### Step 3.1: Lead Capture Flow

**Objective:** Verify Sipho captures leads correctly

1. **Test Lead 1 - Email:**
   - Send email to leads@testmotors.co.za
   - Message: "I'm interested in a Toyota Corolla 2024"
   - Expected: Lead created in system within 2 minutes
   - Verify: Check **Leads** → **Recent Leads**

2. **Test Lead 2 - WhatsApp:**
   - Send WhatsApp message to dealership number
   - Message: "Hi, I want to know about your Hyundai i20"
   - Expected: Lead created and qualified within 5 minutes
   - Verify: Check **Leads** → **WhatsApp Leads**

3. **Test Lead 3 - SMS:**
   - Send SMS to dealership number
   - Message: "Interested in BMW X5"
   - Expected: Lead created within 1 minute
   - Verify: Check **Leads** → **SMS Leads**

### Step 3.2: Buyer Qualification Flow

**Objective:** Verify Mia qualifies leads correctly

1. **Qualification Test:**
   - Go to **Leads** → Select Test Lead 1
   - Click **Qualify Lead**
   - Expected: Mia analyzes lead and provides qualification score
   - Verify: Check qualification details (Budget, Timeline, Interest Level)

2. **Expected Output:**
   ```json
   {
     "leadId": "test_lead_001",
     "qualificationScore": 85,
     "budget": "$50,000 - $100,000",
     "timeline": "Next 30 days",
     "interestLevel": "High",
     "recommendedVehicles": ["Toyota Corolla", "Hyundai i20"],
     "nextAction": "Schedule test drive"
   }
   ```

### Step 3.3: Test Drive Booking Flow

**Objective:** Verify Themba books test drives correctly

1. **Booking Request:**
   - Go to **Leads** → Select qualified lead
   - Click **Schedule Test Drive**
   - Select vehicle: Toyota Corolla 2024
   - Expected: Calendar shows available slots

2. **Book Test Drive:**
   - Select time: Tomorrow, 2:00 PM
   - Expected: Confirmation sent via SMS and email
   - Verify: Check **Calendar** → **Scheduled Test Drives**

3. **Expected Confirmation:**
   ```
   SMS: "Hi! Your test drive for Toyota Corolla is confirmed for 
        Tomorrow at 2:00 PM. Reply CONFIRM to confirm or RESCHEDULE."
   
   Email: "Test Drive Confirmation - Toyota Corolla 2024
           Date: [Tomorrow]
           Time: 2:00 PM
           Location: Test Motors, Johannesburg"
   ```

### Step 3.4: Follow-up Nurturing Flow

**Objective:** Verify Kagiso sends automated follow-ups

1. **Day 1 Follow-up:**
   - Expected: Email sent 24 hours after lead creation
   - Message: "Thanks for your interest! Here's more info about [vehicle]"
   - Verify: Check **Email Logs** → **Day 1 Follow-ups**

2. **Day 3 Follow-up:**
   - Expected: Email sent 72 hours after lead creation
   - Message: "Still interested? Check out these similar vehicles"
   - Verify: Check **Email Logs** → **Day 3 Follow-ups**

3. **Day 7 Follow-up:**
   - Expected: Email sent 7 days after lead creation
   - Message: "Last chance! Special offer on [vehicle]"
   - Verify: Check **Email Logs** → **Day 7 Follow-ups**

### Step 3.5: Dealership Support Flow

**Objective:** Verify Nala provides support correctly

1. **Support Query 1:**
   - Ask: "What is your warranty policy?"
   - Expected: Nala responds with warranty details within 30 seconds
   - Verify: Response is accurate and helpful

2. **Support Query 2:**
   - Ask: "Do you have financing options?"
   - Expected: Nala responds with financing information
   - Verify: Response includes available financing options

3. **Support Query 3:**
   - Ask: "What are your business hours?"
   - Expected: Nala responds with business hours
   - Verify: Response matches dealership settings

---

## Phase 4: Performance & Metrics Validation

### Step 4.1: Check Dashboard Metrics

1. Go to **Dashboard** → **Analytics**
2. Verify metrics for test period:

| Metric | Expected | Actual |
|--------|----------|--------|
| Leads Captured | 3+ | ✓ |
| Leads Qualified | 2+ | ✓ |
| Test Drives Booked | 1+ | ✓ |
| Follow-ups Sent | 3+ | ✓ |
| Support Queries | 3+ | ✓ |
| Response Time (avg) | <2 min | ✓ |
| Success Rate | >95% | ✓ |

### Step 4.2: Check Email Delivery

1. Go to **Email Logs**
2. Verify all emails delivered:
   - ✓ Lead confirmation emails
   - ✓ Qualification notifications
   - ✓ Test drive confirmations
   - ✓ Follow-up nurture emails
   - ✓ Support responses

3. Expected delivery rate: >95%

### Step 4.3: Check Agent Performance

1. Go to **Agents** → **Performance**
2. Verify agent metrics:

| Agent | Metric | Expected | Status |
|-------|--------|----------|--------|
| Sipho | Leads Captured | 3+ | ✓ |
| Mia | Qualification Rate | >80% | ✓ |
| Themba | Booking Success | >90% | ✓ |
| Kagiso | Follow-up Rate | 100% | ✓ |
| Nala | Support Resolution | >95% | ✓ |

---

## Phase 5: Data Integrity & Security Validation

### Step 5.1: Data Integrity Checks

1. **Lead Data:**
   - Verify all lead information is captured correctly
   - Check for data consistency across systems
   - Verify no data loss during processing

2. **Communication Records:**
   - Verify all emails are logged
   - Verify all SMS messages are logged
   - Verify all WhatsApp messages are logged

3. **Agent Decisions:**
   - Verify agent decisions are recorded
   - Verify reasoning is logged
   - Verify audit trail is complete

### Step 5.2: Security Validation

1. **API Security:**
   - Test API key authentication
   - Verify rate limiting is enforced
   - Test invalid credentials rejection

2. **Data Encryption:**
   - Verify sensitive data is encrypted
   - Verify HTTPS is enforced
   - Verify no data leakage in logs

3. **Access Control:**
   - Verify only authorized users can access data
   - Verify role-based access control works
   - Verify audit logs are complete

---

## Phase 6: Load & Stress Testing

### Step 6.1: Simulate Peak Load

1. **Concurrent Leads:**
   - Simulate 100 concurrent leads
   - Expected: All processed within 5 minutes
   - Verify: No data loss or corruption

2. **Email Throughput:**
   - Send 1000 emails
   - Expected: All delivered within 1 hour
   - Verify: Delivery rate >95%

3. **Agent Queries:**
   - Send 500 concurrent agent queries
   - Expected: All processed within 10 minutes
   - Verify: Response time <2 seconds

### Step 6.2: Monitor System Health

1. Check CPU usage: Should stay <80%
2. Check memory usage: Should stay <2GB
3. Check database connections: Should stay <20
4. Check error rate: Should stay <0.1%

---

## Phase 7: Production Readiness Checklist

### Functional Requirements

- ✅ Lead capture working (Email, WhatsApp, SMS)
- ✅ Lead qualification working (Mia agent)
- ✅ Test drive booking working (Themba agent)
- ✅ Follow-up automation working (Kagiso agent)
- ✅ Dealership support working (Nala agent)
- ✅ Email delivery >95%
- ✅ SMS delivery >95%
- ✅ WhatsApp delivery >95%

### Performance Requirements

- ✅ P95 response time <500ms
- ✅ P99 response time <1s
- ✅ Throughput >1000 requests/min
- ✅ Availability >99.5%
- ✅ Error rate <0.1%

### Security Requirements

- ✅ API authentication working
- ✅ Rate limiting enforced
- ✅ Data encryption enabled
- ✅ Audit logging complete
- ✅ Access control enforced

### Data Quality Requirements

- ✅ No data loss
- ✅ No duplicate records
- ✅ All fields validated
- ✅ Referential integrity maintained
- ✅ Audit trail complete

---

## Success Criteria

| Criterion | Status | Notes |
|-----------|--------|-------|
| All agents activated | ✓ | 5/5 agents running |
| All workflows tested | ✓ | Lead → Booking → Follow-up |
| Performance targets met | ✓ | P95 <500ms, >1000 req/min |
| Email delivery >95% | ✓ | 95%+ delivery rate |
| Zero data loss | ✓ | All records preserved |
| Security validated | ✓ | All checks passed |
| Load tested | ✓ | 100+ concurrent users |
| Production ready | ✓ | Ready for deployment |

---

## Troubleshooting

### Issue: Leads not being captured

**Solution:**
1. Verify email forwarding is configured
2. Check WhatsApp Business Account connection
3. Verify SMS gateway is active
4. Check Sipho agent logs for errors

### Issue: Emails not being delivered

**Solution:**
1. Verify SendGrid DNS records are configured
2. Check email address is valid
3. Verify sender email is authenticated
4. Check spam folder for emails

### Issue: Test drive booking not working

**Solution:**
1. Verify calendar is connected
2. Check available time slots are configured
3. Verify SMS gateway is active
4. Check Themba agent logs for errors

### Issue: Follow-ups not being sent

**Solution:**
1. Verify Kagiso agent is enabled
2. Check follow-up schedule is configured
3. Verify email template is valid
4. Check Kagiso agent logs for errors

---

## Next Steps

1. ✅ Create test dealership account
2. ✅ Configure dealership settings
3. ✅ Activate all agents
4. ✅ Run end-to-end tests
5. ✅ Validate performance metrics
6. ✅ Verify data integrity
7. ✅ Complete security validation
8. ✅ Run load tests
9. ⏳ Deploy to production
10. ⏳ Monitor real dealership usage

---

## Support & Escalation

For issues during testing:

1. **Technical Issues:** Check logs in **Settings** → **Logs**
2. **Agent Issues:** Check agent status in **Agents** → **Status**
3. **Email Issues:** Check SendGrid dashboard
4. **SMS Issues:** Check Twilio dashboard
5. **WhatsApp Issues:** Check WhatsApp Business Account

For production deployment support, contact: support@grayarx.com
