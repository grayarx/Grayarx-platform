# Google OAuth Setup Guide for GrayArx

This guide shows how to set up Google OAuth for dealership login (completely FREE).

---

## Step-by-Step Google OAuth Setup

### Step 1: Create Google Cloud Project

1. Go to https://console.cloud.google.com/
2. Click the project dropdown at the top
3. Click **"NEW PROJECT"**
4. Enter project name: **"GrayArx Dealership"**
5. Click **"CREATE"**
6. Wait for project to be created (takes 1-2 minutes)

### Step 2: Enable Google+ API

1. In Google Cloud Console, go to **"APIs & Services"** (left sidebar)
2. Click **"Library"**
3. Search for **"Google+ API"**
4. Click on it
5. Click **"ENABLE"**
6. Wait for it to enable

### Step 3: Create OAuth 2.0 Credentials

1. Go to **"APIs & Services"** > **"Credentials"** (left sidebar)
2. Click **"+ CREATE CREDENTIALS"** button
3. Select **"OAuth 2.0 Client ID"**
4. If prompted, click **"Configure OAuth Consent Screen"** first:
   - Select **"External"** user type
   - Click **"CREATE"**
   - Fill in:
     - **App name**: GrayArx
     - **User support email**: your@email.com
     - **Developer contact**: your@email.com
   - Click **"SAVE AND CONTINUE"**
   - Skip scopes (click "SAVE AND CONTINUE")
   - Add your email as test user
   - Click **"SAVE AND CONTINUE"**
   - Review and click **"BACK TO DASHBOARD"**

5. Now create OAuth credentials:
   - Click **"+ CREATE CREDENTIALS"** again
   - Select **"OAuth 2.0 Client ID"**
   - Select application type: **"Web application"**
   - Enter name: **"GrayArx Web Client"**
   - Under "Authorized redirect URIs", add:
     - `https://your-app-domain.com/auth/google/callback`
     - `http://localhost:3000/auth/google/callback` (for testing)
   - Click **"CREATE"**

### Step 4: Get Your Credentials

1. You'll see a popup with your credentials
2. Click **"DOWNLOAD JSON"** to save them
3. Or copy the credentials:
   - **Client ID**: `XXXXXXX.apps.googleusercontent.com`
   - **Client Secret**: `GOCSPX-XXXXXXX`

4. Save these somewhere safe (you'll need them)

---

## Credentials You'll Get

| Credential | Example | Where to Use |
|-----------|---------|-------------|
| **Client ID** | `123456789.apps.googleusercontent.com` | Frontend login button |
| **Client Secret** | `GOCSPX-XXXXXXX` | Backend OAuth verification |
| **Redirect URI** | `https://your-app.com/auth/google/callback` | Where user returns after login |

---

## Implementation in GrayArx

Once you have the credentials, I'll:

1. Add Google login button to homepage
2. Create OAuth callback handler
3. Automatically create dealership account on first login
4. Store user info securely

---

## Cost

**FREE** - Google OAuth is completely free for up to 1 million API calls/month

---

## Security Notes

⚠️ **Important:**
- Never share your **Client Secret** publicly
- Store it in environment variables only
- Rotate credentials yearly
- Monitor login attempts

---

## Next Steps

1. Complete steps 1-4 above
2. Send me your **Client ID** and **Client Secret**
3. I'll integrate Google login into GrayArx
4. Test login with your Google account
5. Launch!

---

## Troubleshooting

**"Redirect URI mismatch" error?**
- Make sure redirect URI in Google Console matches exactly what's in your app
- Include `http://` or `https://`
- Include `/auth/google/callback` at the end

**"Invalid Client ID" error?**
- Check you copied the full Client ID (should end with `.apps.googleusercontent.com`)
- Make sure you enabled Google+ API

**Still having issues?**
- Google OAuth Docs: https://developers.google.com/identity/protocols/oauth2
- Contact Google Support: https://support.google.com/

---

**Ready? Start with Step 1 above!**
