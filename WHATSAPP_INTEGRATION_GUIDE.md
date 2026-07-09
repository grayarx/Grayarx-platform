# WhatsApp Business API Integration Guide

## Overview

Complete WhatsApp Business API integration for GrayArx platform with:
- Multi-channel message routing (WhatsApp, Email, SMS)
- AI agent integration (Sipho, Mia, Themba, Kagiso, Nala)
- Real-time message handling and webhook processing
- Conversation context management
- Automatic message routing based on intent

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    WhatsApp Business API                     │
│                  (Meta Cloud Messaging)                      │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
    ┌───▼─────────────┐      ┌───────▼──────────┐
    │  Webhook Handler │      │  Message Sender  │
    │  (Incoming)      │      │  (Outgoing)      │
    └───┬─────────────┘      └───────┬──────────┘
        │                             │
        └──────────────┬──────────────┘
                       │
        ┌──────────────▼──────────────┐
        │  Message Router & Handler   │
        │  - Intent Detection         │
        │  - Agent Assignment         │
        │  - Context Management       │
        └──────────────┬──────────────┘
                       │
        ┌──────────────▼──────────────┐
        │   Multi-Channel Router      │
        │  - WhatsApp                 │
        │  - Email                    │
        │  - SMS                      │
        └──────────────┬──────────────┘
                       │
        ┌──────────────▼──────────────┐
        │      AI Agent Layer         │
        │  - Sipho (Lead Capture)     │
        │  - Mia (Qualification)      │
        │  - Themba (Test Drive)      │
        │  - Kagiso (Follow-up)       │
        │  - Nala (Support)           │
        └─────────────────────────────┘
```

---

## Setup Instructions

### Step 1: Create WhatsApp Business Account

1. Go to [Meta Business Manager](https://business.facebook.com)
2. Create a new business account
3. Navigate to WhatsApp Business Accounts
4. Create or connect a WhatsApp Business Account
5. Add a verified phone number

### Step 2: Get Required Credentials

From Meta Business Manager, collect:
- **Phone Number ID**: Found in WhatsApp Business Accounts → Phone Numbers
- **Business Account ID**: Found in Settings → Business Information
- **Access Token**: Create a system user with `whatsapp_business_messaging` permission

### Step 3: Configure in GrayArx

1. Navigate to Dashboard → Settings → WhatsApp Setup
2. Enter your credentials:
   - Phone Number ID
   - Business Account ID
   - Access Token
   - Display Name (e.g., "GrayArx Support")
3. Click "Configure WhatsApp"
4. Copy the webhook URL and verify token

### Step 4: Set Up Webhook in Meta

1. In Meta Business Manager, go to your app settings
2. Add a webhook for WhatsApp messages
3. Paste the webhook URL from step 3
4. Paste the verify token
5. Subscribe to these events:
   - `messages`
   - `message_status`
   - `message_template_status_update`

### Step 5: Verify Webhook

1. Click "Verify" in Meta Business Manager
2. GrayArx will receive the verification challenge
3. Once verified, you're ready to receive messages

---

## Message Flow

### Incoming Message

```
Customer sends WhatsApp message
         ↓
Webhook received at /api/whatsapp/webhook
         ↓
Message parsed and validated
         ↓
Intent detection (lead, qualification, booking, support)
         ↓
Route to appropriate agent:
  - Lead inquiry → Sipho (lead capture)
  - Qualification → Mia (lead qualification)
  - Test drive → Themba (booking)
  - Follow-up → Kagiso (follow-up)
  - Support → Nala (customer support)
         ↓
Agent generates response using LLM
         ↓
Response sent back via WhatsApp
         ↓
Conversation stored in database
```

### Outgoing Message

```
Dealership sends message via dashboard
         ↓
Message routed to preferred channel(s):
  - WhatsApp (primary)
  - Email (fallback)
  - SMS (fallback)
         ↓
Message sent via appropriate provider
         ↓
Delivery status tracked
         ↓
Status update sent to dealership
```

---

## API Endpoints

### Configure WhatsApp

**POST** `/api/whatsapp/configure`

```json
{
  "dealershipId": "dealer_123",
  "phoneNumberId": "1234567890123456",
  "businessAccountId": "1234567890123456",
  "accessToken": "your_access_token",
  "displayName": "GrayArx Support"
}
```

Response:
```json
{
  "success": true,
  "webhookUrl": "https://www.grayarx.com/api/whatsapp/webhook?dealership_id=dealer_123",
  "webhookVerifyToken": "verify_dealer_123_1234567890"
}
```

### Send Message

**POST** `/api/whatsapp/send`

```json
{
  "dealershipId": "dealer_123",
  "phoneNumber": "+27123456789",
  "message": "Hi! Thanks for your interest. How can we help?",
  "mediaUrl": "https://example.com/image.jpg",
  "mediaType": "image"
}
```

### Get Message History

**GET** `/api/whatsapp/history/:phoneNumber?dealership_id=dealer_123&limit=50`

### Send Template Message

**POST** `/api/whatsapp/template`

```json
{
  "dealershipId": "dealer_123",
  "phoneNumber": "+27123456789",
  "templateName": "test_drive_confirmation",
  "parameters": ["John", "2026-05-25", "14:00"]
}
```

---

## Agent Routing Logic

### Sipho - Lead Capture

**Triggers:**
- "interested in"
- "price"
- "available"
- "do you have"
- "which models"

**Actions:**
- Welcome customer
- Ask about vehicle interests
- Collect budget information
- Identify needs
- Create lead record

### Mia - Lead Qualification

**Triggers:**
- Customer has vehicle interest
- Budget information needed
- Timeline not established

**Actions:**
- Assess budget and timeline
- Identify vehicle preferences
- Determine purchase intent
- Qualify leads for sales team

### Themba - Test Drive Booking

**Triggers:**
- "test drive"
- "book a drive"
- "schedule drive"
- "when can i"

**Actions:**
- Confirm vehicle preference
- Check availability
- Schedule test drive
- Send confirmation

### Kagiso - Follow-up

**Triggers:**
- Multiple messages exchanged
- No test drive scheduled
- Time since last contact

**Actions:**
- Follow up on interest
- Answer remaining questions
- Provide additional info
- Move toward purchase

### Nala - Customer Support

**Triggers:**
- General questions
- Support requests
- Default fallback

**Actions:**
- Answer questions
- Provide information
- Handle complaints
- Escalate if needed

---

## Multi-Channel Routing

### Channel Priority

1. **WhatsApp** (Primary)
   - Fastest response
   - Best engagement
   - Rich media support

2. **Email** (Secondary)
   - Detailed information
   - Document sharing
   - Formal communication

3. **SMS** (Tertiary)
   - Quick notifications
   - Time-sensitive alerts
   - Backup channel

### Fallback Strategy

If primary channel fails:
1. Try secondary channel
2. If secondary fails, try tertiary
3. Log failure and notify dealership
4. Retry after 5 minutes

### Customer Preferences

Customers can set:
- Preferred channel (WhatsApp, Email, SMS, Auto)
- Opt-in/out for each channel
- Do Not Disturb hours

---

## Testing

### Test Webhook

```bash
curl -X POST https://www.grayarx.com/api/whatsapp/webhook?dealership_id=dealer_123 \
  -H "Content-Type: application/json" \
  -d '{
    "object": "whatsapp_business_account",
    "entry": [{
      "id": "123456",
      "changes": [{
        "value": {
          "messaging_product": "whatsapp",
          "metadata": {
            "display_phone_number": "+27123456789",
            "phone_number_id": "1234567890123456"
          },
          "messages": [{
            "from": "+27987654321",
            "id": "wamid.123456",
            "timestamp": "1234567890",
            "type": "text",
            "text": { "body": "Hi, I am interested in your vehicles" }
          }]
        },
        "field": "messages"
      }]
    }]
  }'
```

### Test Message Sending

```bash
curl -X POST https://www.grayarx.com/api/whatsapp/send \
  -H "Content-Type: application/json" \
  -d '{
    "dealershipId": "dealer_123",
    "phoneNumber": "+27123456789",
    "message": "Thanks for your interest! How can we help?"
  }'
```

### Test Multi-Channel Routing

```bash
curl -X POST https://www.grayarx.com/api/whatsapp/send \
  -H "Content-Type: application/json" \
  -d '{
    "dealershipId": "dealer_123",
    "phoneNumber": "+27123456789",
    "message": "Important update about your test drive",
    "preferredChannel": "auto"
  }'
```

---

## Monitoring & Analytics

### Message Statistics

- Total messages sent/received
- Messages by channel
- Messages by agent
- Delivery rates
- Response times
- Conversion rates

### Agent Performance

- Messages handled
- Average response time
- Customer satisfaction
- Lead conversion rate
- Test drive bookings

### Channel Health

- WhatsApp: Uptime, delivery rate
- Email: Delivery rate, bounce rate
- SMS: Delivery rate, carrier issues

---

## Troubleshooting

### Webhook Not Receiving Messages

1. Verify webhook URL is correct
2. Verify verify token matches
3. Check firewall/security settings
4. Ensure HTTPS is enabled
5. Check Meta Business Manager logs

### Messages Not Sending

1. Verify access token is valid
2. Verify phone number is verified
3. Check customer opt-in status
4. Verify rate limits not exceeded
5. Check message format

### Agent Not Responding

1. Check LLM API connection
2. Verify agent configuration
3. Check conversation context
4. Review error logs
5. Test with simple message

### Multi-Channel Fallback Not Working

1. Verify all channels configured
2. Check customer preferences
3. Verify fallback order
4. Test each channel individually
5. Check error logs

---

## Best Practices

### Message Content

- Keep messages concise (max 160 chars for SMS)
- Use friendly, professional tone
- Include clear call-to-action
- Avoid spam-like language
- Personalize when possible

### Timing

- Respect customer timezone
- Avoid late-night messages
- Use Do Not Disturb settings
- Space out messages
- Follow up appropriately

### Compliance

- Get explicit opt-in
- Honor opt-out requests
- Comply with local regulations
- Maintain message history
- Protect customer data

### Performance

- Monitor delivery rates
- Track response times
- Optimize agent responses
- Use templates for common messages
- Batch similar messages

---

## Production Deployment

### Pre-Deployment Checklist

- [ ] WhatsApp Business Account verified
- [ ] Phone number verified
- [ ] Webhook configured in Meta
- [ ] All agents tested
- [ ] Multi-channel routing tested
- [ ] Message templates created
- [ ] Error handling verified
- [ ] Monitoring configured
- [ ] Backup channels ready
- [ ] Customer support trained

### Deployment Steps

1. Enable WhatsApp for production dealership
2. Monitor first 24 hours closely
3. Track message delivery rates
4. Monitor agent responses
5. Collect customer feedback
6. Optimize based on metrics

### Post-Deployment

- Monitor daily metrics
- Review customer feedback
- Optimize agent responses
- Update message templates
- Expand to more dealerships
- Continuously improve

---

## Support

For issues or questions:
- Email: support@grayarx.com
- Phone: +27 (11) 123-4567
- Documentation: https://docs.grayarx.com/whatsapp

---

**Status:** ✅ READY FOR PRODUCTION  
**Last Updated:** 2026-05-24  
**Version:** 1.0
