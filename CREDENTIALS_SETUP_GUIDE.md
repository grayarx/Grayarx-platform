# GrayArx Platform - Complete Credentials Setup Guide

This guide provides step-by-step instructions to obtain all credentials needed for full GrayArx platform deployment.

---

## 1. WhatsApp Business API (For Themba Chatbot)

### What It Is
WhatsApp Business API enables automated messaging, chatbots, and customer engagement through WhatsApp. This powers the Themba chatbot feature.

### Step-by-Step Setup

#### Step 1: Create Meta Developer Account
1. Go to https://developers.facebook.com/
2. Click "Get Started"
3. Create a Facebook account or login with existing account
4. Verify your email address

#### Step 2: Create Meta App
1. Go to https://developers.facebook.com/apps
2. Click "Create App"
3. Enter app name: "GrayArx WhatsApp"
4. Enter your email
5. Select use case: **"Connect with customers through WhatsApp"**
6. Click "Next"
7. Select or create a Meta Business Portfolio
8. Review publishing requirements (may be empty)
9. Click "Create App"

#### Step 3: Get WhatsApp Business Account
1. In the app dashboard, go to **WhatsApp > API Setup**
2. Click **"Start using the API"**
3. Under "Connect your WhatsApp Business Account":
   - Select **"Create a WhatsApp Business Account"** (if you don't have one)
   - Fill in business details (name, address, phone, website)
   - Verify your business phone number (must receive SMS or call)
4. Once created, you'll see your **WhatsApp Business Account ID**

#### Step 4: Add Phone Number
1. In API Setup, click **"Add a phone number"**
2. Enter your business phone number (South African format: +27XXXXXXXXX)
3. Verify via SMS or call
4. You'll receive your **Phone Number ID**

#### Step 5: Generate Access Token
1. In API Setup, click **"Generate access token"**
2. Select permissions:
   - `whatsapp_business_messaging`
   - `whatsapp_business_management`
   - `business_management`
3. Copy and save your **Access Token** (temporary - valid 1 hour)

#### Step 6: Create Permanent Access Token
1. Go to https://business.facebook.com/settings/
2. Click **"System users"** in sidebar
3. Click **"Add"** button
4. Create new system user with name "GrayArx WhatsApp"
5. Select the user and click **"Assign Assets"**
6. Assign:
   - Your Meta App (Manage app: Full control)
   - Your WhatsApp Business Account (Manage WhatsApp Business Accounts: Full control)
7. Click **"Assign assets"**
8. Click **"Generate token"**
9. Add same permissions as above
10. Copy and save your **Permanent Access Token**

### Credentials You'll Get
- **WhatsApp Business Account ID**: `1234567890123456`
- **Phone Number ID**: `1234567890123456`
- **Access Token**: `EAABs...` (long string)

### Cost
- **Free** to set up
- **Pay per message**: R 0.08-0.15 per message (depending on message type)
- **Estimated monthly cost** (1,000 messages): R 80-150

### Where to Use
- Themba chatbot activation
- Customer inquiries and support
- Test drive booking confirmations

---

## 2. Twilio SMS (For Service Reminders & Notifications)

### What It Is
Twilio provides SMS/text messaging capabilities for sending service reminders, appointment confirmations, and notifications to customers.

### Step-by-Step Setup

#### Step 1: Create Twilio Account
1. Go to https://www.twilio.com/try-twilio
2. Click "Sign up"
3. Enter email, password, and phone number
4. Verify your email
5. Verify your phone number (receive SMS code)

#### Step 2: Get Twilio Phone Number
1. Go to https://console.twilio.com/
2. Click **"Phone Numbers"** in left sidebar
3. Click **"Buy a Number"**
4. Select country: **South Africa**
5. Select area code (optional)
6. Click **"Search"**
7. Select a number (e.g., +27 11 XXX XXXX)
8. Click **"Buy"** (R 150-200/month)
9. Confirm purchase

#### Step 3: Get API Credentials
1. Go to https://console.twilio.com/
2. In left sidebar, click **"Account"**
3. You'll see:
   - **Account SID**: `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - **Auth Token**: `your_auth_token_here`
4. Copy and save both

#### Step 4: Verify Your Phone Number (For Testing)
1. In Twilio console, go to **"Phone Numbers"**
2. Click **"Verified Caller IDs"**
3. Click **"Add a Verified Caller ID"**
4. Enter your personal phone number
5. Verify via SMS code

### Credentials You'll Get
- **Account SID**: `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
- **Auth Token**: `your_auth_token_here`
- **Twilio Phone Number**: `+27 11 XXX XXXX`

### Cost
- **Phone number**: R 150-200/month
- **SMS sending**: R 0.08-0.12 per SMS (South Africa)
- **SMS receiving**: R 0.05 per SMS
- **Estimated monthly cost** (5,000 reminders): R 400-600 + phone number

### Where to Use
- Service reminder SMS
- Appointment confirmations
- Test drive booking notifications
- Customer alerts

---

## 3. DMS Integration - Dealer.com API (Optional for Tier 3)

### What It Is
Dealer.com is a dealership management system. Integration allows syncing vehicle inventory and customer data.

### Step-by-Step Setup

#### Step 1: Get Dealer.com Account
1. Contact Dealer.com sales: https://www.dealer.com/contact
2. Request API access
3. Provide:
   - Company name: GrayArx
   - Use case: Inventory sync, customer data integration
   - Expected API volume: 1,000+ calls/month

#### Step 2: Get API Credentials
1. Once approved, log into Dealer.com admin
2. Go to **Settings > API Keys**
3. Generate new API key
4. Copy:
   - **API Key**: `your_api_key_here`
   - **API Secret**: `your_api_secret_here`
   - **Dealer ID**: `12345`

### Credentials You'll Get
- **API Key**: `your_api_key_here`
- **API Secret**: `your_api_secret_here`
- **Dealer ID**: `12345`

### Cost
- **Integration**: Free (included with Dealer.com subscription)
- **Dealer.com subscription**: R 5,000-15,000/month

### Where to Use
- Vehicle inventory sync
- Customer data integration
- Sales tracking

---

## 4. CRM Integration - Salesforce (Optional for Tier 3)

### What It Is
Salesforce is a customer relationship management platform. Integration allows syncing leads, customers, and sales data.

### Step-by-Step Setup

#### Step 1: Create Salesforce Account
1. Go to https://www.salesforce.com/form/signup/freetrial-sales/
2. Enter email, company, phone
3. Verify email
4. Create password
5. Complete setup wizard

#### Step 2: Get OAuth Credentials
1. Log into Salesforce
2. Go to **Setup > Apps > App Manager**
3. Click **"New Connected App"**
4. Fill in:
   - **Connected App Name**: GrayArx
   - **API Name**: GrayArx
   - **Contact Email**: your@email.com
5. Under "API (Enable OAuth Settings)":
   - Check **"Enable OAuth Settings"**
   - **Callback URL**: `https://your-app.com/oauth/callback`
   - **Selected OAuth Scopes**: Add `Full` and `Refresh Token`
6. Click **"Save"**
7. Go to **Manage > Edit Policies**
8. Set "Permitted Users" to "All users may self-authorize"
9. Click **"Save"**

#### Step 3: Get Consumer Key & Secret
1. In Connected App, click **"View"**
2. Click **"Reveal"** next to Consumer Secret
3. Copy:
   - **Consumer Key**: `your_consumer_key`
   - **Consumer Secret**: `your_consumer_secret`
   - **Login URL**: `https://login.salesforce.com`

### Credentials You'll Get
- **Consumer Key**: `your_consumer_key`
- **Consumer Secret**: `your_consumer_secret`
- **Login URL**: `https://login.salesforce.com`
- **Username**: your@email.com
- **Password**: your_password

### Cost
- **Salesforce Free Trial**: Free for 30 days
- **Salesforce Essentials**: $165/month (1 user)
- **Salesforce Professional**: $330/month (1 user)

### Where to Use
- Lead management
- Customer data sync
- Sales pipeline tracking

---

## Summary Table

| Service | Required? | Setup Time | Monthly Cost | Credentials Needed |
|---------|-----------|-----------|--------------|-------------------|
| WhatsApp Business API | ✅ Yes | 30 mins | R 80-150 | Account ID, Phone ID, Access Token |
| Twilio SMS | ✅ Yes | 15 mins | R 550-800 | Account SID, Auth Token, Phone # |
| Dealer.com | ❌ Optional | 1-2 days | Included | API Key, Secret, Dealer ID |
| Salesforce | ❌ Optional | 30 mins | R 165-330 | Consumer Key, Secret, Login URL |

---

## Implementation Timeline

### Week 1: Essential Setup
1. **Monday**: Create Meta Developer account + WhatsApp Business Account
2. **Tuesday**: Verify WhatsApp phone number + generate tokens
3. **Wednesday**: Create Twilio account + buy phone number
4. **Thursday**: Get Twilio credentials + verify phone
5. **Friday**: Test both services with sample messages

### Week 2: Integration
1. **Monday-Tuesday**: Integrate WhatsApp credentials into GrayArx
2. **Wednesday-Thursday**: Integrate Twilio credentials into GrayArx
3. **Friday**: End-to-end testing (chatbot + SMS reminders)

### Week 3-4: Optional Integrations
1. Contact Dealer.com for API access
2. Set up Salesforce (if needed)
3. Integrate APIs into GrayArx

---

## Next Steps

1. **Start with WhatsApp & Twilio** (required for launch)
2. **Provide credentials** to GrayArx team
3. **Test integrations** in staging environment
4. **Launch to production**
5. **Add DMS/CRM integrations** later (Month 2-3)

---

## Support & Troubleshooting

**WhatsApp Issues?**
- Contact Meta Support: https://developers.facebook.com/support/

**Twilio Issues?**
- Contact Twilio Support: https://support.twilio.com/
- Twilio Docs: https://www.twilio.com/docs/

**DMS Integration Issues?**
- Contact Dealer.com Support

**Salesforce Issues?**
- Contact Salesforce Support: https://help.salesforce.com/

---

## Security Best Practices

⚠️ **IMPORTANT**: Never share credentials publicly!

1. **Store credentials securely**:
   - Use environment variables (not hardcoded)
   - Use password managers (1Password, LastPass)
   - Rotate tokens regularly

2. **Restrict API access**:
   - Use IP whitelisting where available
   - Set rate limits
   - Monitor API usage

3. **Audit logs**:
   - Enable logging for all API calls
   - Review logs weekly
   - Alert on suspicious activity

---

**Ready to get started? Begin with Step 1 above!**
