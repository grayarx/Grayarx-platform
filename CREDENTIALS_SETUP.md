# GrayArx API Credentials Setup Guide

This guide walks you through setting up all required API credentials for GrayArx production deployment.

## Overview

GrayArx integrates with the following services:

| Service | Purpose | Required | Setup Time |
|---------|---------|----------|-----------|
| Stripe | Payment processing | Yes | 15 min |
| Twilio | SMS notifications | Yes | 10 min |
| Resend | Email delivery | Yes | 10 min |
| Google OAuth | Social login | Optional | 10 min |
| Apple OAuth | Social login | Optional | 10 min |

## Step-by-Step Setup

### 1. Stripe (Payment Processing)

**Purpose:** Process payments for dealership subscriptions

**Setup Steps:**

1. Go to https://dashboard.stripe.com/register
2. Create a Stripe account
3. Complete identity verification
4. Navigate to **Developers** → **API Keys**
5. Copy your **Secret Key** (starts with `sk_live_`)
6. Copy your **Publishable Key** (starts with `pk_live_`)

**Configuration:**

```bash
# Add to .env.production
STRIPE_API_KEY=sk_live_your_key_here
STRIPE_PUBLISHABLE_KEY=pk_live_your_key_here
```

**Webhook Setup:**

1. Go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Enter: `https://your-domain.com/api/webhooks/stripe`
4. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Copy **Signing Secret**

```bash
STRIPE_WEBHOOK_SECRET=whsec_your_secret_here
```

**Verification:**

```bash
curl https://api.stripe.com/v1/account \
  -u sk_live_your_key_here:
```

### 2. Twilio (SMS Notifications)

**Purpose:** Send SMS verification codes and alerts

**Setup Steps:**

1. Go to https://www.twilio.com/console
2. Create a Twilio account
3. Verify your phone number
4. Navigate to **Account** → **API Keys & tokens**
5. Copy your **Account SID**
6. Copy your **Auth Token**

**Phone Number Setup:**

1. Go to **Phone Numbers** → **Manage** → **Active Numbers**
2. Purchase a phone number (or use existing)
3. Note the phone number (e.g., +1234567890)

**Configuration:**

```bash
# Add to .env.production
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_API_KEY=your_api_key_here
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_MODE=live
```

**Verification:**

```bash
curl -X GET https://api.twilio.com/2010-04-01/Accounts/$TWILIO_ACCOUNT_SID \
  -u $TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN
```

**Testing:**

```bash
# Send test SMS
curl -X POST https://api.twilio.com/2010-04-01/Accounts/$TWILIO_ACCOUNT_SID/Messages.json \
  -d "Body=Test message" \
  -d "From=$TWILIO_PHONE_NUMBER" \
  -d "To=+1234567890" \
  -u $TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN
```

### 3. Resend (Email Delivery)

**Purpose:** Send verification emails, password resets, alerts

**Setup Steps:**

1. Go to https://resend.com/
2. Create a Resend account
3. Navigate to **API Keys**
4. Click **Create API Key**
5. Give it a name (e.g., "GrayArx Production")
6. Copy the API key (starts with `re_`)

**Domain / Sender Verification:**

1. Go to **Domains** and add your sending domain (e.g., `grayarx.com`), or
2. Use a verified single sender address under **Emails**
3. Add the SPF/DKIM DNS records Resend provides
4. Click **Verify** after DNS propagation

**Configuration:**

```bash
# Add to .env.production
RESEND_API_KEY=re_your_api_key_here
EMAIL_USER=noreply@grayarx.com
```

**Verification:**

```bash
curl --request GET \
  --url https://api.resend.com/domains \
  --header "Authorization: Bearer re_your_api_key_here"
```

**Testing:**

```bash
curl --request POST \
  --url https://api.resend.com/emails \
  --header "Authorization: Bearer re_your_api_key_here" \
  --header "Content-Type: application/json" \
  --data '{
    "from": "noreply@grayarx.com",
    "to": "test@example.com",
    "subject": "Test Email",
    "html": "<p>Test</p>"
  }'
```

### 4. Dealer Authentication (Email/Password)

**Purpose:** Dealer login and session management

**Setup Steps:**

1. Set a strong `JWT_SECRET` for session signing
2. Dealers sign in at `/login` with email and password
3. No external OAuth provider is required for dealer access

**Configuration:**

```bash
# Add to .env.production
JWT_SECRET=your_strong_random_secret
OWNER_OPEN_ID=your_owner_id
OWNER_NAME=Your Name
```

### 5. Google OAuth (Optional - Social Login)

**Purpose:** Allow users to login with Google

**Setup Steps:**

1. Go to https://console.cloud.google.com/
2. Create a new project
3. Enable **Google+ API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Select **Web application**
6. Add authorized redirect URIs:
   - `https://your-domain.com/oauth/callback`
7. Copy **Client ID** and **Client Secret**

**Configuration:**

```bash
# Add to .env.production
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret
```

### 6. Apple OAuth (Optional - Social Login)

**Purpose:** Allow users to login with Apple

**Setup Steps:**

1. Go to https://developer.apple.com/
2. Sign in with Apple Developer account
3. Go to **Certificates, Identifiers & Profiles**
4. Create a new **App ID** with "Sign in with Apple"
5. Create a **Service ID**
6. Register a **Redirect URI**: `https://your-domain.com/oauth/callback`
7. Create a **Private Key** for authentication
8. Download the private key file

**Configuration:**

```bash
# Add to .env.production
APPLE_CLIENT_ID=com.grayarx.app
APPLE_TEAM_ID=your_team_id
APPLE_KEY_ID=your_key_id
APPLE_PRIVATE_KEY=your_private_key_content
```

## Credential Validation Script

```bash
#!/bin/bash

echo "Validating GrayArx Credentials..."

# Check Stripe
if [ -z "$STRIPE_API_KEY" ]; then
  echo "❌ STRIPE_API_KEY not set"
else
  echo "✓ STRIPE_API_KEY configured"
fi

# Check Twilio
if [ -z "$TWILIO_ACCOUNT_SID" ]; then
  echo "❌ TWILIO_ACCOUNT_SID not set"
else
  echo "✓ TWILIO_ACCOUNT_SID configured"
fi

# Check Resend
if [ -z "$RESEND_API_KEY" ]; then
  echo "❌ RESEND_API_KEY not set"
else
  echo "✓ RESEND_API_KEY configured"
fi

# Check JWT (dealer auth)
if [ -z "$JWT_SECRET" ]; then
  echo "❌ JWT_SECRET not set"
else
  echo "✓ JWT_SECRET configured"
fi

echo ""
echo "Credential validation complete!"
```

## Credential Rotation

### Stripe API Key Rotation

1. Go to **Developers** → **API Keys**
2. Click **Reveal** next to your current key
3. Click **Roll key**
4. Update `.env.production` with new key
5. Redeploy application

### Twilio Auth Token Rotation

1. Go to **Account** → **API Keys & tokens**
2. Click **Promote** next to your secondary token
3. Generate a new secondary token
4. Update `.env.production`
5. Redeploy application

### Resend API Key Rotation

1. Go to **API Keys** in Resend dashboard
2. Create a new API key
3. Test with new key
4. Delete old key
5. Update `.env.production`
6. Redeploy application

## Troubleshooting

### Stripe Connection Error

```bash
# Verify API key format
echo $STRIPE_API_KEY | grep -E "^sk_live_"

# Test connection
curl https://api.stripe.com/v1/account -u $STRIPE_API_KEY:
```

### Twilio Connection Error

```bash
# Verify credentials
curl -X GET https://api.twilio.com/2010-04-01/Accounts/$TWILIO_ACCOUNT_SID \
  -u $TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN

# Check phone number format
echo $TWILIO_PHONE_NUMBER | grep -E "^\+[0-9]{10,15}$"
```

### Resend Connection Error

```bash
# Verify API key
curl --request GET \
  --url https://api.resend.com/domains \
  --header "Authorization: Bearer $RESEND_API_KEY"
```

## Security Best Practices

1. **Never commit credentials** to version control
2. **Rotate credentials** every 90 days
3. **Use separate credentials** for development and production
4. **Monitor API usage** for unusual activity
5. **Set API rate limits** to prevent abuse
6. **Use webhook signatures** to verify requests
7. **Enable two-factor authentication** on all accounts
8. **Store credentials** in secure vaults (e.g., AWS Secrets Manager)

## Next Steps

After setting up all credentials:

1. Update `.env.production` with all credentials
2. Run credential validation script
3. Deploy application
4. Test all integrations
5. Monitor logs for errors
6. Set up monitoring and alerting

## Support

For credential setup issues:
- Stripe: https://support.stripe.com/
- Twilio: https://support.twilio.com/
- Resend: https://resend.com/docs
- Manus: support@manus.im
