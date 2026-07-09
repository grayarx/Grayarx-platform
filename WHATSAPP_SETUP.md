# WhatsApp Business API Setup Guide

## Overview
Connect your dealership's WhatsApp Business Account to GrayArx for automated customer enquiries, test drive bookings, and trade-in valuations.

## Prerequisites
- Meta Business Account (free)
- WhatsApp Business Account (free)
- Business phone number
- GrayArx account with dealership setup

## Step-by-Step Setup

### Step 1: Create Meta Business Account
1. Go to https://business.facebook.com
2. Click "Create Account"
3. Enter your business details
4. Verify your email

### Step 2: Set Up WhatsApp Business Account
1. In Meta Business Suite, go to "WhatsApp" > "Getting Started"
2. Click "Create or add account"
3. Select your country and enter your business phone number
4. Verify your phone number (you'll receive a code via SMS or call)
5. Complete business verification (required for production)

### Step 3: Get WhatsApp Business API Credentials
1. Go to https://developers.facebook.com
2. Create a new app (if you don't have one)
3. Add "WhatsApp" product to your app
4. Go to "WhatsApp" > "API Setup"
5. Copy your:
   - **Phone Number ID** (looks like: 102345678901234)
   - **Business Account ID** (looks like: 987654321098765)
   - **Access Token** (long string starting with EAAB...)

### Step 4: Configure GrayArx
Add your WhatsApp credentials to GrayArx:

```bash
# Via environment variables
export WHATSAPP_PHONE_NUMBER_ID="your-phone-number-id"
export WHATSAPP_BUSINESS_ACCOUNT_ID="your-business-account-id"
export WHATSAPP_ACCESS_TOKEN="your-access-token"
```

Or use the GrayArx dashboard:
1. Go to Settings > Integrations > WhatsApp
2. Paste your credentials
3. Click "Connect"

### Step 5: Test Connection
```bash
curl -X POST https://your-domain.manus.space/api/trpc/whatsapp.testConnection \
  -H "Content-Type: application/json"
```

Expected response:
```json
{
  "success": true,
  "message": "WhatsApp connection successful"
}
```

## Features

### Automated Responses
- Customer sends "Hi" → Receives welcome message
- Customer asks about vehicle → Gets vehicle details
- Customer requests test drive → Gets booking form link

### Lead Notifications
- New enquiry → Dealership notified on WhatsApp
- Test drive booked → Confirmation sent to customer
- Trade-in submitted → Valuation sent to customer

### Two-Way Messaging
- Customers can reply to messages
- Dealership staff can respond directly from WhatsApp
- All conversations logged in GrayArx

## Message Templates

### Welcome Message
```
Hi! 👋 Welcome to [Dealership Name].

We're here to help you find the perfect vehicle or get a trade-in valuation.

What would you like to do?
1. Browse vehicles
2. Get trade-in valuation
3. Book a test drive
4. Talk to an agent

Reply with a number or just type your question!
```

### Vehicle Enquiry Response
```
Great! Here's the vehicle you asked about:

[Vehicle Name]
📅 Year: [Year]
🚗 Mileage: [Mileage] km
💰 Price: R[Price]
📍 Location: [Location]

Interested? 
- Reply "TEST DRIVE" to book a test drive
- Reply "TRADE-IN" to get a valuation
- Reply "MORE INFO" for additional details
```

### Test Drive Booking
```
Perfect! Let's book your test drive.

Please provide:
1. Your preferred date (e.g., Tomorrow, Monday)
2. Your preferred time (e.g., 10:00 AM)
3. Your name
4. Your phone number

We'll confirm your booking shortly!
```

## API Endpoints

### Send Message
```
POST /api/trpc/whatsapp.sendMessage
Body: {
  phoneNumber: "27123456789",
  message: "Hello! How can we help?"
}
```

### Get Message Templates
```
GET /api/trpc/whatsapp.getMessageTemplates
```

### Update Template
```
POST /api/trpc/whatsapp.updateTemplate
Body: {
  templateName: "welcome",
  content: "Your new message..."
}
```

### Get Conversation History
```
GET /api/trpc/whatsapp.getConversationHistory?phoneNumber=27123456789
```

## Webhook Configuration

### Set Up Webhook (for receiving messages)
1. Go to Meta App Dashboard > WhatsApp > Configuration
2. Under "Webhook URL", enter:
   ```
   https://your-domain.manus.space/api/webhooks/whatsapp
   ```
3. Under "Verify Token", enter any random string (e.g., `grayarx_webhook_2024`)
4. Click "Verify and Save"

### Webhook Events to Subscribe
- `message` - Incoming customer messages
- `message_status` - Delivery/read status updates
- `message_template_status_update` - Template approval status

## Pricing

### WhatsApp Business API Pricing (as of 2024)
- **Conversation-based pricing**: You pay per conversation
- **Inbound**: Free (customer initiates)
- **Outbound**: R0.50 - R2.00 per message (depending on category)
  - Marketing: R2.00
  - Utility: R1.00
  - Authentication: R0.50
  - Service: Free (first 1000/month)

### GrayArx Integration
- WhatsApp integration: Included in all plans
- Message templates: Unlimited
- Conversation history: 90 days retention

## Troubleshooting

### Connection Failed
- Verify access token is correct
- Check phone number ID format
- Ensure WhatsApp Business Account is verified

### Messages Not Sending
- Check daily message limit (1000/day for new accounts)
- Verify recipient phone number format (include country code)
- Check message content for prohibited words

### Not Receiving Messages
- Verify webhook URL is correct
- Check webhook is receiving POST requests
- Ensure verify token matches configuration

### Template Approval Pending
- Meta reviews templates within 24 hours
- Use generic templates while waiting
- Avoid promotional language in templates

## Support
- Meta Support: https://www.facebook.com/business/help
- GrayArx Support: support@grayarx.com
- WhatsApp Business Docs: https://developers.facebook.com/docs/whatsapp
