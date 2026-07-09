# GrayArx API Documentation

Complete guide to integrating with GrayArx via webhooks and REST API.

---

## Table of Contents

1. [Authentication](#authentication)
2. [Webhooks](#webhooks)
3. [REST API](#rest-api)
4. [Code Examples](#code-examples)
5. [CRM Integrations](#crm-integrations)
6. [Error Handling](#error-handling)

---

## Authentication

### API Keys

All API requests require authentication using an API key.

**Format:** `Bearer grayarx_<random>`

**Headers:**
```
Authorization: Bearer grayarx_<your-api-key>
```

### Creating an API Key

1. Go to **Integrations** → **API Keys**
2. Click **Create API Key**
3. Enter a name (e.g., "Salesforce Integration")
4. Copy the key (shown only once)
5. Store securely in your environment

### Key Scopes

Each API key has specific permissions:

- `read_leads` - Read lead data
- `write_leads` - Create/update leads
- `read_inventory` - Read vehicle inventory
- `read_bookings` - Read test drive bookings
- `*` - Full access (admin only)

### Rate Limiting

- **Limit:** 1,000 requests per hour per API key
- **Headers:** Response includes `X-RateLimit-Remaining` and `X-RateLimit-Reset`
- **Status Code:** 429 when limit exceeded

---

## Webhooks

### What are Webhooks?

Webhooks send real-time notifications to your system when events occur in GrayArx.

**Example:** When a customer submits a lead form, GrayArx sends an HTTP POST to your webhook URL with the lead data.

### Setting Up a Webhook

1. Go to **Integrations** → **Webhooks**
2. Enter your webhook URL (must be HTTPS)
3. Select events to subscribe to
4. Click **Create Webhook**
5. GrayArx will send a test event

### Webhook Events

| Event | Triggered When |
|-------|----------------|
| `lead.created` | New lead submitted |
| `lead.updated` | Lead status/details changed |
| `booking.created` | Test drive booking created |
| `booking.updated` | Booking status changed |
| `vehicle.created` | New vehicle added |
| `vehicle.updated` | Vehicle details changed |
| `vehicle.deleted` | Vehicle removed |

### Webhook Payload Format

```json
{
  "event": "lead.created",
  "resourceType": "lead",
  "resourceId": 12345,
  "data": {
    "id": 12345,
    "dealershipId": 1,
    "customerName": "John Doe",
    "customerEmail": "john@example.com",
    "customerPhone": "+27123456789",
    "vehicleInterest": "Toyota Fortuner",
    "message": "Interested in test drive",
    "source": "whatsapp",
    "language": "en",
    "leadScore": 85,
    "createdAt": "2026-06-01T14:30:00Z"
  },
  "timestamp": "2026-06-01T14:30:00Z"
}
```

### Verifying Webhook Signatures

All webhooks are signed with HMAC-SHA256 for security.

**Headers:**
- `X-Webhook-Signature` - HMAC-SHA256 signature
- `X-Webhook-ID` - Webhook ID
- `X-Webhook-Event` - Event type

**To verify:**

```python
import hmac
import hashlib

def verify_webhook(payload_string, signature, secret):
    expected_signature = hmac.new(
        secret.encode(),
        payload_string.encode(),
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(signature, expected_signature)
```

### Webhook Retry Logic

If your webhook fails to respond:

1. **Attempt 1:** Immediate
2. **Attempt 2:** After 1 minute
3. **Attempt 3:** After 5 minutes
4. **Attempt 4:** After 15 minutes
5. **Attempt 5:** After 1 hour
6. **Attempt 6:** After 24 hours

After 6 attempts, the webhook is marked as failed.

---

## REST API

### Base URL

```
https://api.grayarx.com/api
```

### Endpoints

#### Get Leads

```
GET /leads
```

**Parameters:**
- `limit` (optional, default: 50, max: 100)
- `offset` (optional, default: 0)

**Example:**
```bash
curl -H "Authorization: Bearer grayarx_..." \
  "https://api.grayarx.com/api/leads?limit=10&offset=0"
```

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "dealershipId": 1,
      "customerName": "John Doe",
      "customerEmail": "john@example.com",
      "customerPhone": "+27123456789",
      "vehicleInterest": "Toyota Fortuner",
      "leadScore": 85,
      "createdAt": "2026-06-01T14:30:00Z"
    }
  ],
  "limit": 10,
  "offset": 0,
  "total": 1
}
```

#### Get Lead Details

```
GET /leads/:id
```

**Example:**
```bash
curl -H "Authorization: Bearer grayarx_..." \
  "https://api.grayarx.com/api/leads/123"
```

#### Get Inventory

```
GET /inventory
```

**Parameters:**
- `limit` (optional, default: 50, max: 100)
- `offset` (optional, default: 0)

**Example:**
```bash
curl -H "Authorization: Bearer grayarx_..." \
  "https://api.grayarx.com/api/inventory?limit=10"
```

#### Get Bookings

```
GET /bookings
```

**Parameters:**
- `limit` (optional, default: 50, max: 100)
- `offset` (optional, default: 0)

**Example:**
```bash
curl -H "Authorization: Bearer grayarx_..." \
  "https://api.grayarx.com/api/bookings"
```

#### Get Statistics

```
GET /stats
```

**Example:**
```bash
curl -H "Authorization: Bearer grayarx_..." \
  "https://api.grayarx.com/api/stats"
```

**Response:**
```json
{
  "data": {
    "totalLeads": 150,
    "totalVehicles": 45,
    "totalBookings": 32,
    "timestamp": "2026-06-01T14:30:00Z"
  }
}
```

---

## Code Examples

### Python

```python
import requests
import hmac
import hashlib
import json

API_KEY = "grayarx_..."
BASE_URL = "https://api.grayarx.com/api"

# Get leads
response = requests.get(
    f"{BASE_URL}/leads",
    headers={"Authorization": f"Bearer {API_KEY}"},
    params={"limit": 10}
)
leads = response.json()["data"]

# Handle webhook
def handle_webhook(request):
    payload = request.get_data(as_text=True)
    signature = request.headers.get("X-Webhook-Signature")
    secret = "your_webhook_secret"
    
    expected = hmac.new(
        secret.encode(),
        payload.encode(),
        hashlib.sha256
    ).hexdigest()
    
    if hmac.compare_digest(signature, expected):
        data = json.loads(payload)
        print(f"Received {data['event']}: {data['data']}")
```

### JavaScript / Node.js

```javascript
const API_KEY = "grayarx_...";
const BASE_URL = "https://api.grayarx.com/api";

// Get leads
async function getLeads() {
  const response = await fetch(`${BASE_URL}/leads?limit=10`, {
    headers: {
      "Authorization": `Bearer ${API_KEY}`
    }
  });
  const data = await response.json();
  return data.data;
}

// Handle webhook
function verifyWebhook(payload, signature, secret) {
  const crypto = require("crypto");
  const expected = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
  return crypto.timingSafeEqual(signature, expected);
}
```

### cURL

```bash
# Get leads
curl -H "Authorization: Bearer grayarx_..." \
  "https://api.grayarx.com/api/leads?limit=10"

# Get specific lead
curl -H "Authorization: Bearer grayarx_..." \
  "https://api.grayarx.com/api/leads/123"

# Get inventory
curl -H "Authorization: Bearer grayarx_..." \
  "https://api.grayarx.com/api/inventory"

# Get statistics
curl -H "Authorization: Bearer grayarx_..." \
  "https://api.grayarx.com/api/stats"
```

---

## CRM Integrations

### Salesforce

**Setup:**

1. Create a Salesforce Connected App
2. Get your OAuth credentials
3. In GrayArx, create an API key with `write_leads` scope
4. Use Salesforce Flow to call GrayArx API on lead creation

**Example Flow:**
```
Trigger: Lead Created
  → Call REST API (GrayArx /api/leads)
  → Map Salesforce fields to GrayArx payload
  → Log response
```

### HubSpot

**Setup:**

1. Go to HubSpot Settings → Integrations → Webhooks
2. Create webhook for "Deal Created" event
3. Point to your webhook handler
4. Map HubSpot fields to GrayArx leads

**Example:**
```javascript
// HubSpot webhook handler
app.post("/hubspot-webhook", (req, res) => {
  const deal = req.body;
  
  // Create lead in GrayArx
  fetch("https://api.grayarx.com/api/leads", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      customerName: deal.properties.dealname,
      customerEmail: deal.properties.hs_lead_status,
      vehicleInterest: deal.properties.dealstage
    })
  });
  
  res.sendStatus(200);
});
```

### Pipedrive

**Setup:**

1. Go to Pipedrive Settings → Webhooks
2. Select "Deal Won" event
3. Add webhook URL
4. Map Pipedrive fields to GrayArx

---

## Error Handling

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad request (invalid parameters) |
| 401 | Unauthorized (invalid API key) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not found |
| 429 | Rate limit exceeded |
| 500 | Server error |

### Error Response Format

```json
{
  "error": "Rate limit exceeded",
  "remaining": 0,
  "resetAt": "2026-06-01T15:30:00Z"
}
```

### Best Practices

1. **Always verify webhook signatures** before processing
2. **Implement exponential backoff** for retries
3. **Log all API calls** for debugging
4. **Store API keys securely** (use environment variables)
5. **Test webhooks** before going live
6. **Monitor rate limits** and adjust batch sizes
7. **Handle 429 responses** gracefully

---

## Support

For issues or questions:
- Email: support@grayarx.com
- Documentation: https://docs.grayarx.com
- Status: https://status.grayarx.com
