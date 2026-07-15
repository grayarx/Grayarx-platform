#!/bin/bash

# Email Delivery Test Script
# Tests Resend integration by sending a test email

echo "🧪 Testing Email Delivery with Resend..."
echo ""

# Check if Resend API key is configured
if [ -z "$RESEND_API_KEY" ]; then
    echo "❌ ERROR: RESEND_API_KEY not configured in environment"
    echo ""
    echo "To fix this, add your Resend API key to the environment:"
    echo "  export RESEND_API_KEY='re_your-resend-api-key'"
    echo ""
    exit 1
fi

echo "✅ Resend API key found"
echo ""

# Send test email via Resend API
TEST_EMAIL="test@grayarx.local"
SUBJECT="GrayArx Email Delivery Test"
HTML_CONTENT="<html><body><h1>GrayArx Email Delivery Test</h1><p>If you received this email, the Resend integration is working correctly!</p><p>This is a test from the GrayArx platform.</p></body></html>"

echo "📧 Sending test email to: $TEST_EMAIL"
echo "Subject: $SUBJECT"
echo ""

RESPONSE=$(curl -s -X POST "https://api.resend.com/emails" \
  -H "Authorization: Bearer $RESEND_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"from\": \"noreply@grayarx.com\",
    \"to\": [\"$TEST_EMAIL\"],
    \"subject\": \"$SUBJECT\",
    \"html\": \"$HTML_CONTENT\"
  }")

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "https://api.resend.com/emails" \
  -H "Authorization: Bearer $RESEND_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"from\": \"noreply@grayarx.com\",
    \"to\": [\"$TEST_EMAIL\"],
    \"subject\": \"$SUBJECT\",
    \"html\": \"$HTML_CONTENT\"
  }")

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
    echo "✅ Email sent successfully!"
    echo "HTTP Status: $HTTP_CODE"
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
    echo "1. Verify Resend API key is correct"
    echo "2. Check Resend account status"
    echo "3. Verify sender domain is authenticated in Resend"
    echo ""
    exit 1
fi
