# LogTo Authentication Setup Guide

Follow these steps to configure LogTo authentication for the Fire Platform.

## Step 1: Access LogTo Admin Console

Open your browser and go to:

```
http://localhost:3002
```

## Step 2: Create Admin Account

On first visit, you'll see the setup wizard:

1. **Choose your region**: Select your preferred region
2. **Create admin account**:
   - Email: Use your email
   - Password: Create a strong password
   - Click "Create account"

**✅ Save these credentials securely!**

## Step 3: Complete Initial Setup

1. Skip the optional steps or follow the quick tour
2. You'll land on the LogTo dashboard

## Step 4: Create API Resource

This allows your Next.js app to authenticate API requests.

1. Go to **API Resources** (left sidebar)
2. Click **Create API Resource**
3. Fill in:
   - **API Name**: `Fire Platform API`
   - **API Identifier**: `https://api.fire-platform.local`
   - Click **Create**

**✅ Note: API Identifier must be a valid URI (but doesn't need to be a real URL)**

## Step 5: Create Machine-to-Machine Application

This allows server-side authentication for your Next.js app.

1. Go to **Applications** (left sidebar)
2. Click **Create Application**
3. Select **Machine-to-Machine**
4. Fill in:
   - **Application name**: `Fire Platform Server`
   - **Description**: `Backend API authentication`
5. Click **Create**

### Get M2M Credentials

After creation:

1. You'll see **App ID** and **App Secret**
2. **COPY THESE IMMEDIATELY** - you'll need them!

```
App ID: <your-app-id-here>
App Secret: <your-app-secret-here>
```

**⚠️ IMPORTANT: Save these in a secure password manager!**

### Assign Permissions

1. In your M2M application settings
2. Go to **API Resources** tab
3. Click **Assign API Resources**
4. Select:
   - ✅ **Logto Management API** (for user management)
   - ✅ **Fire Platform API** (your custom API)
5. Select all permissions or specific ones needed:
   - `all` (full access) - for development
   - Or specific scopes for production
6. Click **Assign**

## Step 6: Create Traditional Web Application

This is for user-facing authentication (login/logout).

1. Go to **Applications** → **Create Application**
2. Select **Traditional Web**
3. Fill in:
   - **Application name**: `Fire Platform Web`
   - **Description**: `User authentication for web app`
4. Click **Create**

### Configure Web App

After creation:

1. **Copy App ID and App Secret**
2. Configure **Redirect URIs**:
   - Click **Add URI**
   - Add: `http://localhost:3000/api/auth/callback/logto`
   - Click **Save**
3. Configure **Post Sign-out Redirect URIs**:
   - Add: `http://localhost:3000`
   - Click **Save**
4. Configure **CORS Allowed Origins** (if needed):
   - Add: `http://localhost:3000`

### Save Web App Credentials

```
Web App ID: <your-web-app-id-here>
Web App Secret: <your-web-app-secret-here>
```

## Step 7: Configure Sign-in Experience (Optional but Recommended)

1. Go to **Sign-in Experience** (left sidebar)
2. Customize:
   - **Brand color**: Your platform color
   - **Logo**: Upload your logo (optional)
   - **Sign-in methods**:
     - ✅ Email + Password (enabled by default)
     - ✅ Email verification code (optional)
     - Social logins (optional)
3. Click **Save Changes**

## Step 8: Update Environment Variables

Now that you have all credentials, update your `docker-compose.yml`:

### Edit docker-compose.yml

Find the `app` service (currently commented out) and update:

```yaml
environment:
  # LogTo Configuration
  LOGTO_ENDPOINT: http://logto:3001
  LOGTO_APP_ID: <your-web-app-id>
  LOGTO_APP_SECRET: <your-web-app-secret>

  # NextAuth Configuration
  NEXTAUTH_URL: http://localhost:3000
  NEXTAUTH_SECRET: <generate-a-random-32-char-string>

  # LogTo Management API (M2M)
  LOGTO_M2M_APP_ID: <your-m2m-app-id>
  LOGTO_M2M_APP_SECRET: <your-m2m-app-secret>
  LOGTO_API_RESOURCE: https://api.fire-platform.local
```

### Generate NEXTAUTH_SECRET

Run this command to generate a secure secret:

```bash
openssl rand -base64 32
```

## Step 9: Test Authentication

After updating the environment and starting the app:

1. Go to `http://localhost:3000`
2. Click "Sign In"
3. You should be redirected to LogTo
4. Create a test user account
5. After authentication, you should be redirected back

## Verification Checklist

- [ ] LogTo admin account created
- [ ] API Resource created (`Fire Platform API`)
- [ ] M2M Application created with credentials saved
- [ ] M2M Application has Management API permissions
- [ ] Web Application created with credentials saved
- [ ] Redirect URIs configured
- [ ] Environment variables updated in docker-compose.yml
- [ ] NEXTAUTH_SECRET generated and added

## Troubleshooting

### "Redirect URI mismatch"

- Check that redirect URIs in LogTo match exactly: `http://localhost:3000/api/auth/callback/logto`
- No trailing slashes
- Correct protocol (http vs https)

### "Invalid credentials"

- Double-check App ID and App Secret
- Make sure you're using Web App credentials for LOGTO_APP_ID (not M2M)
- Check for extra spaces or characters

### "Cannot connect to LogTo"

- Ensure LogTo container is running: `docker-compose ps`
- Check LogTo is accessible: `curl http://localhost:3001/api/status`
- View logs: `docker-compose logs logto`

## Next Steps

Once LogTo is configured:

1. We'll integrate authentication into the Next.js app
2. Create protected routes and middleware
3. Build user profile pages
4. Start developing features with authentication

---

**Need help?** Check `TESTING.md` for infrastructure validation commands.
