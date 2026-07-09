# GrayArx SMS Integration - Complete Setup Guide

## Overview

This guide covers the complete setup and deployment of SMS messaging for the GrayArx platform using Twilio. The system supports both **Sandbox mode** (for testing) and **Production mode** (for real customers).

---

## Table of Contents

1. [Current Status](#current-status)
2. [Sandbox Mode (Testing)](#sandbox-mode-testing)
3. [Production Setup](#production-setup)
4. [API Reference](#api-reference)
5. [Troubleshooting](#troubleshooting)
6. [Monitoring & Analytics](#monitoring--analytics)

---

## Current Status

**Current Configuration:**
- Mode: `mock` (Sandbox)
- Account SID: `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
- Auth Token: Configured âœ…
- Phone Number: Pending (awaiting Twilio verification)

**What's Working:**
- âœ… SMS sending (simulated in sandbox)
- âœ… Message persistence to database
- âœ… Conversation tracking
- âœ… Bulk SMS sending
- âœ… Message status tracking
- âœ… Error handling & retries

**What's Pending:**
- â³ Production phone number (Twilio verification in progress)
- â³ WhatsApp capability (to be added to phone number)
- â³ Webhook receiver (for incoming messages)

---

## Sandbox Mode (Testing)

### What is Sandbox Mode?

Sandbox mode allows you to test the entire SMS system without sending real messages or incurring costs. All messages are simulated and logged to the database.

### Using Sandbox Mode

1. **Access SMS Dashboard:**
   - Go to: `/dealer/sms`
   - Tab: "Send Message"

2. **Send Test Message:**
   - Phone: `+27821234567` (any format)
   - Message: Type your test message
   - Click: "Send SMS"
   - Result: Message logged to database, status shown immediately

3. **Test Bulk Sending:**
   - Go to: `/dealer/sms-bulk`
   - Upload CSV with phone numbers
   - Click: "Send Bulk SMS"
   - Result: All messages logged, results shown

4. **View Conversation History:**
   - Go to: `/dealer/sms`
   - Tab: "Conversations"
   - View all messages sent/received

### Sandbox Limitations

- âŒ Messages are NOT sent to real phones
- âŒ No incoming messages received
- âŒ No delivery confirmation from carriers
- âœ… Perfect for testing UI, database, and workflows

---

## Production Setup

### Step 1: Verify Twilio Account

**Status:** â³ In Progress

Your Twilio account verification is currently in progress. This typically takes 1-2 business days.

**What to expect:**
- Twilio will review your Individual Profile
- You'll receive an email confirmation
- Your account will be upgraded to production

**Check Status:**
- Go to: https://console.twilio.com
- Navigate to: Account > Security > Verification Status
- Look for: "Individual Profile" status

### Step 2: Get Production Phone Number

**Once verification is complete:**

1. **Log into Twilio Console:**
   - https://console.twilio.com

2. **Navigate to Phone Numbers:**
   - Left sidebar â†’ Messaging â†’ Try it out â†’ WhatsApp Senders
   - Or: Phone Numbers â†’ Inventory

3. **Search for South African Number:**
   - Country: South Africa
   - Type: Mobile
   - Capabilities: SMS + Voice (WhatsApp will be added later)
   - Cost: ~R60-80/month

4. **Purchase the Number:**
   - Select a number
   - Click "Buy"
   - Complete payment

5. **Copy Your Number:**
   - Format: `+27XXXXXXXXXX`
   - Example: `+27821234567`

### Step 3: Update Platform Configuration

**Once you have your production number:**

1. **Go to Platform Secrets:**
   - Dashboard â†’ Settings â†’ Secrets

2. **Update SMS Credentials:**
   - `TWILIO_ACCOUNT_SID`: `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - `TWILIO_API_KEY`: `b9d2df0697b6958c7b3d4d2f292cce27`
   - `TWILIO_PHONE_NUMBER`: `+27XXXXXXXXXX` (your new number)
   - `TWILIO_MODE`: Change from `mock` to `production`

3. **Save and Restart:**
   - Click "Save"
   - Server will restart automatically
   - SMS will now use real Twilio API

### Step 4: Test Production SMS

**After switching to production:**

1. **Send Test Message:**
   - Go to: `/dealer/sms`
   - Phone: Your personal phone number
   - Message: "Test from GrayArx"
   - Click: "Send SMS"

2. **Verify Receipt:**
   - Check your phone for the message
   - Should arrive within 5-10 seconds

3. **Check Status:**
   - Go to: `/dealer/sms`
   - Tab: "Setup Guide"
   - Status should show: "Production mode active"

---

## API Reference

### tRPC Endpoints

#### Send Single Message

```typescript
const result = await trpc.sms.sendMessage.mutate({
  phone: "+27821234567",
  message: "Hello! Thanks for your interest.",
  dealershipId: 1,
});

// Response:
{
  success: true,
  messageId: "SM1234567890abcdef",
  status: "sent",
  mode: "production"
}
```

#### Send Bulk Messages

```typescript
const result = await trpc.sms.sendBulk.mutate({
  recipients: [
    { phone: "+27821111111", message: "Message 1", dealershipId: 1 },
    { phone: "+27822222222", message: "Message 2", dealershipId: 1 },
  ],
});

// Response:
{
  results: [
    { phone: "+27821111111", success: true, messageId: "SM..." },
    { phone: "+27822222222", success: true, messageId: "SM..." },
  ]
}
```

#### Get Conversation History

```typescript
const messages = await trpc.sms.getConversationHistory.query({
  dealershipId: 1,
  customerPhone: "+27821234567",
});

// Response:
{
  messages: [
    {
      id: 1,
      direction: "outbound",
      content: "Hello!",
      status: "delivered",
      timestamp: "2026-05-24T19:00:00Z"
    },
    {
      id: 2,
      direction: "inbound",
      content: "Hi! I'm interested.",
      status: "delivered",
      timestamp: "2026-05-24T19:05:00Z"
    }
  ]
}
```

#### Get SMS Status

```typescript
const status = await trpc.sms.getStatus.query();

// Response:
{
  mode: "production",
  message: "SMS service active - Production mode",
  hasAccountSid: true,
  hasPhoneNumber: true
}
```

#### Test Send

```typescript
const result = await trpc.sms.testSend.mutate({
  phone: "+27821234567",
});

// Response:
{
  success: true,
  mode: "mock" or "production",
  message: "Test SMS sent"
}
```

---

## Message Formatting

### Phone Number Formats

All of these are automatically converted to E.164 format:

```
+27821234567    âœ… E.164 (preferred)
0821234567      âœ… Local format
27821234567     âœ… Without +
+27 82 123 4567 âœ… With spaces
```

### Message Content

**Best Practices:**

1. **Keep it short** (160 characters = 1 SMS)
   - Longer messages cost more
   - Aim for 1-2 SMS per message

2. **Include clear CTA** (Call-to-Action)
   - "Reply YES to confirm"
   - "Click here to book"
   - "Call 079 491 5187"

3. **Use South African context**
   - Include pricing in Rand (R)
   - Use local phone numbers
   - Reference local locations

4. **Example Messages:**

```
"Hi! We have a 2020 BMW 3 Series available for R249,999. 
Interested? Reply YES or call 079 491 5187"

"Your test drive is confirmed for tomorrow at 10am. 
See you at our Sandton showroom!"

"Special offer: 20% off selected vehicles this week only. 
Limited stock! Call now: 079 491 5187"
```

---

## Database Schema

### whatsapp_conversations

Tracks ongoing conversations with customers.

```sql
CREATE TABLE whatsapp_conversations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  dealershipId INT NOT NULL,
  customerPhone VARCHAR(20) NOT NULL,
  lastMessageAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status ENUM('active', 'closed') DEFAULT 'active',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### whatsapp_messages

Stores all sent and received messages.

```sql
CREATE TABLE whatsapp_messages (
  id INT PRIMARY KEY AUTO_INCREMENT,
  conversationId INT NOT NULL,
  direction ENUM('inbound', 'outbound') NOT NULL,
  messageType VARCHAR(50) DEFAULT 'text',
  content LONGTEXT NOT NULL,
  metaMessageId VARCHAR(100),
  status ENUM('sent', 'delivered', 'read', 'failed') DEFAULT 'sent',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversationId) REFERENCES whatsapp_conversations(id)
);
```

### whatsapp_queue

Retry queue for failed messages.

```sql
CREATE TABLE whatsapp_queue (
  id INT PRIMARY KEY AUTO_INCREMENT,
  messageId INT NOT NULL,
  retryCount INT DEFAULT 0,
  nextRetryAt TIMESTAMP,
  status ENUM('pending', 'processing', 'success', 'dead_letter') DEFAULT 'pending',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (messageId) REFERENCES whatsapp_messages(id)
);
```

---

## Webhook Integration (Future)

When incoming SMS is enabled, Twilio will send webhooks to:

```
POST https://yourdomain.com/api/webhooks/sms
```

**Webhook Payload:**

```json
{
  "MessageSid": "SM1234567890abcdef",
  "AccountSid": "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "From": "+27821234567",
  "To": "+27821234567",
  "Body": "Customer's reply message",
  "NumMedia": 0,
  "MessageStatus": "received"
}
```

**Setup Instructions:**

1. Go to Twilio Console
2. Phone Numbers â†’ Manage Numbers
3. Select your SMS number
4. Scroll to "Messaging"
5. Set "Webhook URL": `https://yourdomain.com/api/webhooks/sms`
6. Method: `POST`
7. Save

---

## Troubleshooting

### Messages Not Sending

**Check 1: Credentials**
```bash
# Verify credentials are set
echo $TWILIO_ACCOUNT_SID
echo $TWILIO_API_KEY
echo $TWILIO_PHONE_NUMBER
```

**Check 2: Mode**
```bash
# Verify mode is correct
curl https://yourdomain.com/api/trpc/sms.getStatus
```

**Check 3: Phone Format**
- Ensure phone starts with `+27` (South Africa)
- No spaces or special characters
- Example: `+27821234567`

### Messages Stuck in Queue

**Check Queue Status:**
```sql
SELECT * FROM whatsapp_queue 
WHERE status = 'pending' 
ORDER BY nextRetryAt ASC;
```

**Manual Retry:**
```typescript
await trpc.sms.retryDeadLettered.mutate({ messageId: 123 });
```

### High Failure Rate

**Common Causes:**
1. Invalid phone numbers
2. Twilio account out of credits
3. Network connectivity issues
4. Rate limiting (too many messages too fast)

**Solutions:**
1. Validate phone numbers before sending
2. Check Twilio account balance
3. Add delays between bulk sends
4. Use exponential backoff for retries

### Webhook Not Receiving

1. Verify webhook URL is publicly accessible
2. Check firewall allows Twilio IPs
3. Verify signature validation is working
4. Check server logs for errors

---

## Monitoring & Analytics

### Key Metrics

**Track these in your dashboard:**

1. **Message Volume**
   - Messages sent today
   - Messages sent this month
   - Trend over time

2. **Delivery Rate**
   - Sent: Messages accepted by Twilio
   - Delivered: Confirmed by carrier
   - Failed: Rejected or undeliverable

3. **Response Rate**
   - Inbound messages received
   - Customer response time
   - Conversation completion rate

4. **Cost Tracking**
   - Cost per message
   - Monthly spend
   - Budget alerts

### Database Queries

**Messages sent today:**
```sql
SELECT COUNT(*) as total_sent
FROM whatsapp_messages
WHERE direction = 'outbound'
AND DATE(createdAt) = CURDATE();
```

**Delivery rate:**
```sql
SELECT 
  status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM whatsapp_messages WHERE direction = 'outbound'), 2) as percentage
FROM whatsapp_messages
WHERE direction = 'outbound'
GROUP BY status;
```

**Top customers by message count:**
```sql
SELECT 
  customerPhone,
  COUNT(*) as message_count,
  MAX(lastMessageAt) as last_message
FROM whatsapp_conversations
GROUP BY customerPhone
ORDER BY message_count DESC
LIMIT 10;
```

---

## Costs & Billing

### Pricing (Twilio)

- **Phone Number**: ~R60-80/month (South Africa)
- **Outbound SMS**: ~R0.50-0.80 per message
- **Inbound SMS**: ~R0.50-0.80 per message
- **Minimum**: No minimum charge

### Cost Optimization

1. **Batch messages** - Send during off-peak hours
2. **Segment customers** - Only message interested buyers
3. **Use templates** - Pre-approved templates are cheaper
4. **Monitor usage** - Set Twilio budget alerts

### Billing Setup

1. Go to Twilio Console
2. Account â†’ Billing
3. Set monthly budget limit
4. Enable email alerts

---

## Support & Resources

### Twilio Documentation
- SMS API: https://www.twilio.com/docs/sms
- Python SDK: https://www.twilio.com/docs/libraries/python
- Status Page: https://status.twilio.com

### GrayArx Support
- Email: support@grayarx.com
- Phone: 079 491 5187
- WhatsApp: +27 82 123 4567

### Common Issues

**Q: Why are messages in sandbox mode?**
A: Waiting for Twilio verification. Once complete, switch `TWILIO_MODE` to `production`.

**Q: Can I use my personal phone number?**
A: No - Twilio requires a dedicated business number. Purchase one from Twilio.

**Q: How long do messages take to deliver?**
A: Usually 5-10 seconds. Delays can occur during peak times or network issues.

**Q: Can I receive SMS replies?**
A: Yes - Once webhooks are configured. Replies will appear in conversation history.

**Q: What's the character limit?**
A: 160 characters per SMS. Longer messages are split automatically.

---

## Next Steps

1. âœ… Sandbox testing complete
2. â³ Wait for Twilio verification (1-2 days)
3. â³ Purchase production phone number
4. â³ Update platform credentials
5. â³ Test production SMS
6. â³ Enable incoming SMS webhooks
7. â³ Monitor and optimize

---

**Last Updated:** May 24, 2026
**Version:** 1.0
**Status:** Production Ready (Sandbox Mode Active)
