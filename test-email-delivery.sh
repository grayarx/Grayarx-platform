#!/bin/bash

# Email Delivery Test Script
# Tests SendGrid integration by sending a test email

echo "🧪 Testing Email Delivery with SendGrid..."
echo ""

# Check if SendGrid API key is configured
if [ -z "$SENDGRID_API_KEY" ]; then
    echo "❌ ERROR: SENDGRID_API_KEY not configured in environment"
    echo ""
    echo "To fix this, add your SendGrid API key to the environment:"
    echo "  export SENDGRID_API_KEY='your-sendgrid-api-key'"
    echo ""
    exit 1
fi

echo "✅ SendGrid API key found"
echo ""

# Send test email via SendGrid API
TEST_EMAIL="test@grayarx.local"
SUBJECT="GrayArx Email Delivery Test"
HTML_CONTENT="<html><body><h1>GrayArx Email Delivery Test</h1><p>If you received this email, the SendGrid integration is working correctly!</p><p>This is a test from the GrayArx platform.</p></body></html>"

echo "📧 Sending test email to: $TEST_EMAIL"
echo "Subject: $SUBJECT"
echo ""

# Use curl to send via SendGrid API
RESPONSE=$(curl -s -X POST "https://api.sendgrid.com/v3/mail/send" \
  -H "Authorization: Bearer $SENDGRID_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"personalizations\": [
      {
        \"to\": [
          {
            \"email\": \"$TEST_EMAIL\",
            \"name\": \"GrayArx Test\"
          }
        ]
      }
    ],
    \"from\": {
      \"email\": \"noreply@grayarx.com\",
      \"name\": \"GrayArx Platform\"
    },
    \"subject\": \"$SUBJECT\",
    \"content\": [
      {
        \"type\": \"text/html\",
        \"value\": \"$HTML_CONTENT\"
      }
    ]
  }")

# Check response
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "https://api.sendgrid.com/v3/mail/send" \
  -H "Authorization: Bearer $SENDGRID_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"personalizations\": [
      {
        \"to\": [
          {
            \"email\": \"$TEST_EMAIL\",
            \"name\": \"GrayArx Test\"
          }
        ]
      }
    ],
    \"from\": {
      \"email\": \"noreply@grayarx.com\",
      \"name\": \"GrayArx Platform\"
    },
    \"subject\": \"$SUBJECT\",
    \"content\": [
      {
        \"type\": \"text/html\",
        \"value\": \"$HTML_CONTENT\"
      }
    ]
  }")

if [ "$HTTP_CODE" = "202" ]; then
    echo "✅ Email sent successfully!"
    echo "HTTP Status: $HTTP_CODE (202 Accepted)"
    echo ""
    echo "📬 The email should arrive in your inbox within 1-2 minutes."
    echo ""
    exit 0
else
    echo "❌ Email delivery failed!"
    echo "HTTP Status: $HTTP_CODE"
    echo "Response: $RESPONSE"
    echo ""
    echo "Troubleshooting:"
    echo "1. Verify SendGrid API key is correct"
    echo "2. Check SendGrid account status"
    echo "3. Verify sender email is authenticated"
    echo ""
    exit 1
fi
