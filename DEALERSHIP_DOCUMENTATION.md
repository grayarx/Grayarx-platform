# GrayArx Dealership Documentation Package

**Version:** 1.0  
**Last Updated:** May 25, 2026  
**For:** Dealership Partners

---

## Table of Contents

1. [Quick Start Guide](#quick-start-guide)
2. [SMS Messaging Features](#sms-messaging-features)
3. [API Integration](#api-integration)
4. [Webhook Configuration](#webhook-configuration)
5. [Testing Procedures](#testing-procedures)
6. [Production Deployment](#production-deployment)
7. [Troubleshooting](#troubleshooting)
8. [Cost & Pricing](#cost--pricing)
9. [Compliance & Data Protection](#compliance--data-protection)
10. [Support & Contact](#support--contact)

---

## Quick Start Guide

### What is GrayArx?

GrayArx is an AI-powered dealership operating system that helps you:
- ✅ Send SMS messages to customers automatically
- ✅ Manage customer conversations
- ✅ Track message delivery status
- ✅ Send bulk campaigns
- ✅ Integrate with your existing systems

### Getting Started (5 minutes)

1. **Log into your GrayArx dashboard**
   - URL: https://grayarx.manus.space
   - Use your dealership credentials

2. **Navigate to SMS Messaging**
   - Click "SMS" in the left sidebar
   - You'll see the messaging interface

3. **Send your first message**
   - Enter customer phone number
   - Type your message
   - Click "Send"
   - Watch delivery status update in real-time

---

## SMS Messaging Features

### Individual Messages

**Use Case:** Send personalized messages to customers

```
Example: "Hi John, your vehicle is ready for collection. 
Please call us at 011-123-4567. - GrayArx Dealership"
```

**Features:**
- ✅ Instant delivery
- ✅ Delivery confirmation
- ✅ Read receipts (when available)
- ✅ Character limit: 160 characters per SMS
- ✅ Longer messages: Auto-split into multiple SMS

### Bulk SMS Campaigns

**Use Case:** Send campaigns to multiple customers

**Steps:**
1. Click "Bulk Send" in SMS section
2. Upload CSV file with phone numbers
3. Create your message template
4. Review recipients (preview first 10)
5. Click "Send Campaign"
6. Monitor delivery in real-time

**CSV Format:**
```
phone_number,customer_name,vehicle_info
+27821234567,John Smith,Toyota Corolla 2020
+27831234567,Jane Doe,Honda Civic 2019
```

### Message Templates

**Pre-built templates for common scenarios:**

- **Service Reminder:** "Your vehicle service is due. Book now: [link]"
- **Vehicle Ready:** "Your vehicle is ready for collection. Call us to arrange pickup."
- **Follow-up:** "Thank you for your purchase! How are you enjoying your new vehicle?"
- **Promotion:** "Special offer: 20% off service this month. Valid until [date]"
- **Appointment Confirmation:** "Confirmed: Service appointment on [date] at [time]"

### Conversation History

**View all messages with a customer:**
- Click on customer name
- See full conversation thread
- Search by date, message content, or status
- Export conversation as PDF

---

## API Integration

### For Developers: tRPC Endpoints

If you're integrating GrayArx with your own systems:

#### Send Single Message

```typescript
const response = await trpc.sms.sendMessage.mutate({
  phoneNumber: "+27821234567",
  message: "Your vehicle is ready for collection",
  templateId: "vehicle_ready" // optional
});

// Response:
// {
//   success: true,
//   messageId: "msg_abc123",
//   status: "sent",
//   deliveredAt: "2026-05-25T10:30:00Z"
// }
```

#### Send Bulk Messages

```typescript
const response = await trpc.sms.sendBulk.mutate({
  recipients: [
    { phoneNumber: "+27821234567", name: "John" },
    { phoneNumber: "+27831234567", name: "Jane" }
  ],
  message: "Special offer: 20% off service",
  campaignName: "May 2026 Promotion"
});

// Response:
// {
//   success: true,
//   campaignId: "camp_xyz789",
//   totalRecipients: 2,
//   successCount: 2,
//   failureCount: 0,
//   estimatedCost: "R0.10"
// }
```

#### Get Conversation History

```typescript
const response = await trpc.sms.getConversationHistory.query({
  phoneNumber: "+27821234567",
  limit: 50
});

// Response:
// {
//   messages: [
//     {
//       id: "msg_1",
//       direction: "outbound",
//       content: "Your vehicle is ready",
//       status: "delivered",
//       sentAt: "2026-05-25T10:30:00Z"
//     }
//   ],
//   total: 1
// }
```

#### Get SMS Status

```typescript
const response = await trpc.sms.getStatus.query();

// Response:
// {
//   isConfigured: true,
//   mode: "production",
//   phoneNumber: "+27960980138041",
//   creditsAvailable: 500,
//   creditsUsedThisMonth: 45,
//   nextBillingDate: "2026-06-01"
// }
```

### Authentication

All API calls require authentication via your dealership account. Include your session token in the request header.

---

## Webhook Configuration

### Receiving Incoming Messages

When customers reply to your messages, GrayArx can automatically forward them to your system.

#### Setup Steps

1. **Get your webhook URL:**
   - Contact GrayArx support
   - You'll receive a unique webhook URL for your dealership

2. **Register with GrayArx:**
   - Provide your webhook endpoint
   - Example: `https://yourdealership.com/api/webhooks/sms`

3. **Receive messages:**
   ```json
   {
     "event": "message.received",
     "messageId": "msg_abc123",
     "phoneNumber": "+27821234567",
     "content": "Yes, I'm interested in the Toyota",
     "receivedAt": "2026-05-25T10:35:00Z",
     "dealershipId": "dealer_123"
   }
   ```

#### Webhook Signature Validation

Every webhook includes a signature for security. Validate it:

```typescript
import crypto from 'crypto';

function validateWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const hash = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return hash === signature;
}
```

---

## Testing Procedures

### Sandbox Testing (Free, No SMS Sent)

1. **Enable Sandbox Mode:**
   - Go to Settings → SMS Configuration
   - Toggle "Sandbox Mode" ON
   - No real SMS will be sent

2. **Test Messages:**
   - Send messages to any phone number
   - Messages logged but not delivered
   - Perfect for testing workflows

3. **Verify Integration:**
   - Check message logs
   - Confirm database entries
   - Test webhook delivery

### Production Testing (Real SMS Sent)

1. **Send Test SMS:**
   - Send message to your own phone
   - Verify delivery within 30 seconds
   - Check message status

2. **Bulk Campaign Test:**
   - Create small campaign (5-10 recipients)
   - Monitor delivery rates
   - Check customer responses

3. **Webhook Testing:**
   - Reply to test SMS
   - Verify webhook received message
   - Confirm data accuracy

---

## Production Deployment

### Pre-Deployment Checklist

- [ ] SMS credentials configured
- [ ] Phone number verified with Twilio
- [ ] Sandbox testing completed
- [ ] Webhook endpoint tested
- [ ] Customer consent obtained (POPIA compliance)
- [ ] Message templates reviewed
- [ ] Cost budget approved
- [ ] Support contact established

### Going Live Steps

1. **Switch from Sandbox to Production:**
   - Settings → SMS Configuration
   - Toggle "Sandbox Mode" OFF
   - Confirm production phone number

2. **Enable Webhooks:**
   - Settings → Webhooks
   - Enter your webhook endpoint
   - Test webhook delivery

3. **Monitor First 24 Hours:**
   - Watch delivery rates
   - Monitor error logs
   - Be available for support

4. **Scale Gradually:**
   - Start with small campaigns
   - Monitor delivery success rate
   - Increase volume as confidence grows

---

## Troubleshooting

### Common Issues & Solutions

#### Issue: Messages Not Sending

**Symptoms:** Message stuck in "pending" status

**Solutions:**
1. Check phone number format (must be +27XXXXXXXXXX)
2. Verify SMS credits available
3. Check customer phone number is valid
4. Review error logs for specific error code

#### Issue: Slow Delivery

**Symptoms:** Messages taking >2 minutes to deliver

**Solutions:**
1. Check network connectivity
2. Verify Twilio service status
3. Check message queue (may be backlogged)
4. Contact support if issue persists

#### Issue: Webhook Not Receiving Messages

**Symptoms:** Incoming customer messages not received

**Solutions:**
1. Verify webhook URL is correct
2. Check webhook endpoint is publicly accessible
3. Verify signature validation is working
4. Check firewall/security rules
5. Review webhook logs for errors

#### Issue: High Failure Rate

**Symptoms:** Many messages failing to deliver

**Solutions:**
1. Verify phone numbers are in correct format
2. Check for invalid/inactive numbers
3. Review message content (may be flagged as spam)
4. Check carrier restrictions
5. Contact support for carrier-specific issues

### Error Codes

| Code | Meaning | Solution |
|------|---------|----------|
| 21211 | Invalid phone number | Use E.164 format: +27XXXXXXXXXX |
| 20003 | Authentication failed | Check credentials in settings |
| 21608 | Unregistered phone number | Verify number is active |
| 21610 | Account suspended | Contact support immediately |
| 30001 | Message queue full | Wait 5 minutes and retry |

### Getting Help

**Support Channels:**
- Email: support@grayarx.com
- Phone: +27960980138041
- Chat: Available in dashboard
- Response time: 24 hours

---

## Cost & Pricing

### SMS Pricing

| Volume | Cost per SMS | Monthly Minimum |
|--------|-------------|-----------------|
| 1-100 | R0.10 | R10 |
| 101-1,000 | R0.08 | R80 |
| 1,001-10,000 | R0.06 | R600 |
| 10,001+ | R0.05 | Contact sales |

### Cost Calculator

**Example Campaign:**
- Recipients: 500 customers
- Messages per recipient: 1
- Total SMS: 500
- Cost at R0.08 per SMS: **R40**

### Billing

- **Billing Cycle:** Monthly (1st to end of month)
- **Payment Method:** Credit card or bank transfer
- **Invoice:** Sent via email on 1st of month
- **Payment Terms:** Due within 7 days

### Cost Optimization Tips

1. **Segment campaigns:** Send only to interested customers
2. **Use templates:** Pre-written templates reduce errors
3. **Batch sending:** Combine multiple small campaigns
4. **Monitor delivery:** Remove invalid numbers from lists
5. **A/B testing:** Test message content before bulk send

---

## Compliance & Data Protection

### POPIA Compliance

**Personal Information Protection Act (POPIA) Requirements:**

1. **Consent:** Obtain explicit consent before sending SMS
2. **Opt-out:** Provide easy unsubscribe option
3. **Data Security:** Encrypt all customer data
4. **Data Retention:** Delete data after 3 years (unless required)
5. **Breach Notification:** Report breaches within 30 days

### Message Content Guidelines

**Allowed:**
- ✅ Service reminders
- ✅ Appointment confirmations
- ✅ Vehicle status updates
- ✅ Promotional offers (with opt-out)
- ✅ Customer support messages

**Not Allowed:**
- ❌ Spam or unsolicited messages
- ❌ Messages without consent
- ❌ Phishing or fraudulent content
- ❌ Adult or offensive content
- ❌ Messages to opted-out customers

### Data Protection

**GrayArx Security Measures:**
- ✅ End-to-end encryption
- ✅ Secure credential storage
- ✅ Regular security audits
- ✅ Backup & disaster recovery
- ✅ Access control & logging
- ✅ GDPR & POPIA compliant

---

## Support & Contact

### Getting Support

**For Technical Issues:**
- Email: support@grayarx.com
- Phone: +27960980138041
- Hours: Monday-Friday, 08:00-17:00 SAST

**For Billing Questions:**
- Email: billing@grayarx.com
- Phone: +27960980138041

**For Emergency Issues:**
- Phone: +27960980138041 (24/7)
- Email: emergency@grayarx.com

### Documentation Resources

- **API Documentation:** https://grayarx.manus.space/docs/api
- **Video Tutorials:** https://grayarx.manus.space/tutorials
- **Community Forum:** https://community.grayarx.com
- **Knowledge Base:** https://help.grayarx.com

### Feedback & Feature Requests

We'd love to hear from you!
- Submit feedback in dashboard
- Request new features
- Report bugs
- Share success stories

---

## Appendix

### Phone Number Formats

**Valid Formats:**
- `+27821234567` (International, recommended)
- `0821234567` (Local, auto-converted)
- `27821234567` (Without +, auto-converted)

**Invalid Formats:**
- `821234567` (Missing country code)
- `+27 82 123 4567` (Spaces not allowed)
- `(082) 123-4567` (Parentheses/dashes not allowed)

### Message Length Guidelines

- **SMS:** 160 characters max (single SMS)
- **Long SMS:** 153 characters per SMS (multi-part)
- **Special characters:** Some reduce character limit

**Example:**
- "Hello, your vehicle is ready!" = 30 characters (1 SMS)
- "Hello, your vehicle is ready for collection. Please call us at 011-123-4567 to arrange pickup. Thank you!" = 110 characters (1 SMS)

### Carrier Information

**South African Carriers Supported:**
- ✅ Vodacom
- ✅ MTN
- ✅ Cell C
- ✅ Telkom
- ✅ Virgin Mobile
- ✅ Rain
- ✅ Lte/Fixed wireless

---

**Document Version:** 1.0  
**Last Updated:** May 25, 2026  
**Next Review:** June 25, 2026

**Questions?** Contact support@grayarx.com
