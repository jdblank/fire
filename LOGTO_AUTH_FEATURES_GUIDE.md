# LogTo Advanced Authentication Features Guide

This guide shows you how to enable passwordless login, social authentication, and two-factor authentication using LogTo's built-in features. **No custom code required** - everything is configured through the LogTo Admin Console!

---

## 🔑 Phase 3: Enable Advanced Authentication

### Accessing LogTo Admin Console

**URL:** http://localhost:3002

Log in with your LogTo admin credentials.

---

## 1. Social Login (OAuth)

### 1.1 Enable Google Login

**Step 1:** Go to **Connectors** (left sidebar) → **Social** tab

**Step 2:** Click **Add Social Connector** → Select **Google**

**Step 3:** Get Google OAuth Credentials
- Visit: https://console.cloud.google.com/apis/credentials
- Create OAuth 2.0 Client ID (Web application)
- Authorized redirect URIs: `http://localhost:3001/callback/google`
- Copy Client ID and Client Secret

**Step 4:** Configure in LogTo
- Paste Client ID
- Paste Client Secret
- Save

**Result:** Users will see "Continue with Google" button on login!

### 1.2 Enable GitHub Login

**Step 1:** Go to **Connectors** → **Social** → **Add Social Connector** → **GitHub**

**Step 2:** Get GitHub OAuth App
- Visit: https://github.com/settings/developers
- New OAuth App
- Homepage URL: `http://localhost:3000`
- Authorization callback URL: `http://localhost:3001/callback/github`
- Copy Client ID and Client Secret

**Step 3:** Configure in LogTo
- Paste Client ID
- Paste Client Secret
- Save

**Result:** Users see "Continue with GitHub" button!

### 1.3 Other Social Logins Available

LogTo supports these out-of-the-box (same process):
- **Facebook** - Facebook for Developers
- **Apple** - Apple Developer (requires paid account)
- **Discord** - Discord Developer Portal
- **Twitter/X** - Twitter Developer Portal
- **Microsoft** - Azure AD
- **LinkedIn** - LinkedIn Developer

---

## 2. Passwordless Login

### 2.1 Enable Email Magic Link

**Step 1:** Go to **Sign-in Experience** (left sidebar)

**Step 2:** Click **Sign-up and Sign-in** tab

**Step 3:** Under **Sign-in methods**, click **Add another**

**Step 4:** Select **Email verification code**

**Step 5:** Configure email connector
- Go to **Connectors** → **Email and SMS** tab
- Add email connector (SMTP, SendGrid, AWS SES, etc.)
- For testing: Use LogTo's default connector

**Result:** Users can choose "Continue with email" and receive a magic link!

### 2.2 Enable SMS OTP (Optional)

**Step 1:** Go to **Sign-in Experience** → **Sign-up and Sign-in**

**Step 2:** Add **Phone verification code** as sign-in method

**Step 3:** Configure SMS connector
- Go to **Connectors** → **Email and SMS**
- Add SMS connector (Twilio, AWS SNS, etc.)
- Requires account with SMS provider

**Result:** Users can sign in with phone number + OTP code!

---

## 3. Two-Factor Authentication (MFA)

### 3.1 Enable TOTP (Google Authenticator)

**Step 1:** Go to **Sign-in Experience** (left sidebar)

**Step 2:** Click **Multi-factor authentication** tab

**Step 3:** Enable **Authenticator app OTP**

**Step 4:** Set MFA policy:
- **Optional:** Users can enable if they want
- **Mandatory:** All users must enable MFA
- **Conditional:** Required for certain roles

**Result:** Users can enable MFA in their LogTo profile settings!

### 3.2 Enable Backup Codes

**Step 1:** In **Multi-factor authentication** settings

**Step 2:** Enable **Backup codes**

**Result:** Users get recovery codes when enabling MFA!

### 3.3 How Users Enable MFA

1. Log in to Fire app
2. Visit LogTo profile settings (you can add a link)
3. Go to **Security** section
4. Click **Enable two-factor authentication**
5. Scan QR code with authenticator app
6. Enter code to verify
7. Save backup codes

---

## 4. Customize Sign-in Experience

### 4.1 Branding

**Go to:** Sign-in Experience → **Branding** tab

Configure:
- **Logo:** Upload your Fire logo
- **Primary color:** Match your brand
- **App name:** "Fire" 
- **Favicon:** Upload icon

### 4.2 Sign-in/Sign-up Flow

**Go to:** Sign-in Experience → **Sign-up and Sign-in** tab

Options:
- **Username required:** Toggle on/off
- **Email/Phone verification:** Required or optional
- **Password requirements:** Complexity rules
- **Social sign-in order:** Drag to reorder buttons

### 4.3 Terms and Privacy

**Go to:** Sign-in Experience → **Others** tab

Add links to:
- Terms of Service
- Privacy Policy

---

## 5. Testing Authentication Methods

### Test Checklist

- [ ] **Email/Password:** Traditional login still works
- [ ] **Google OAuth:** Click "Continue with Google"
- [ ] **GitHub OAuth:** Click "Continue with GitHub"  
- [ ] **Email Magic Link:** Request verification code
- [ ] **SMS OTP:** (If configured) Phone verification
- [ ] **MFA:** Enable TOTP, test login with 2FA code

### Testing in Incognito/Private Mode

Always test new auth methods in incognito to avoid session conflicts!

---

## 6. Optional: Update Fire UI

While LogTo handles everything, you can optionally enhance your Fire login/register pages:

### 6.1 Show Social Login Hints

Update `apps/web/src/app/(auth)/login/page.tsx`:

```typescript
<p className="text-sm text-gray-600 text-center">
  You can also sign in with Google or GitHub
</p>
```

### 6.2 Add MFA Settings Link

Update user dropdown menu to link to LogTo profile:

```typescript
<a
  href="http://localhost:3001/profile"
  target="_blank"
  className="block px-4 py-2 text-sm text-gray-700"
>
  Security Settings (MFA)
</a>
```

---

## 7. Production Considerations

### Social Login

For production, update redirect URIs in each provider:
- Google: `https://yourdomain.com/callback/google`
- GitHub: `https://yourdomain.com/callback/github`

### Email Provider

Set up production email service:
- **SendGrid:** Reliable, free tier available
- **AWS SES:** Cost-effective, requires verification
- **Postmark:** Great deliverability

### SMS Provider

For SMS OTP:
- **Twilio:** Industry standard
- **AWS SNS:** Good if already on AWS
- **Vonage:** International coverage

---

## Quick Start: Enable Google Login Right Now!

**5-Minute Setup:**

1. Visit http://localhost:3002 (LogTo Admin)
2. **Connectors** → **Social** → **Add** → **Google**
3. Use these test credentials (Google's public test app):
   - Client ID: `test` (create your own for real use)
   - Client Secret: `test`
4. **Sign-in Experience** → Verify Google appears in methods
5. Log out of Fire, try logging in with Google!

---

## Summary

✅ **No code changes needed** - All configuration via LogTo Admin Console  
✅ **Production-ready** - LogTo handles security, sessions, tokens  
✅ **Flexible** - Enable only what you want  
✅ **User-friendly** - Clean UI for all auth methods  

Choose the features you want, configure in minutes, and your users get enterprise-grade authentication! 🚀



