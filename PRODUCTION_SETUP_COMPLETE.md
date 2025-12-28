# 🚀 Complete Production Setup Guide

**One-time setup to get production working smoothly**

---

## Prerequisites Checklist

Before starting, ensure you have:

- [ ] Railway project created with Postgres, Redis, and LogTo services
- [ ] LogTo admin console accessible at `https://admin.auth.lemonade.art`
- [ ] Vercel project connected to your GitHub repository
- [ ] Custom domains configured:
  - `fire.lemonade.art` → Vercel
  - `auth.lemonade.art` → Railway LogTo (port 3001)
  - `admin.auth.lemonade.art` → Railway LogTo (port 3002)

---

## Step 1: Get All Credentials (5 minutes)

### A. Railway Database URLs

1. **Railway Dashboard** → **Fire Production** → **Postgres** → **Variables**
2. Copy **PUBLIC** `DATABASE_URL` (for Vercel):
   ```
   postgresql://postgres:password@host.proxy.rlwy.net:port/fire_db
   ```
3. Copy **PUBLIC** `REDIS_URL` (if using Redis):
   ```
   redis://default:password@host.proxy.rlwy.net:port
   ```

### B. LogTo Application Credentials

1. **LogTo Admin Console** → `https://admin.auth.lemonade.art`
2. **Applications** → Find **"Fire"** application
3. Copy:
   - **App ID:** `x0icr7qtjw9wrgecbjcj5`
   - **App Secret:** `#internal:wytIYoddLcT3DElicZGGeO5pR7Zx4fDk`
4. Verify **Redirect URI** is set to:
   ```
   https://fire.lemonade.art/api/auth/callback/logto
   ```

### C. Generate NEXTAUTH_SECRET

```bash
openssl rand -base64 32
```

Copy the output - you'll need it in Step 2.

---

## Step 2: Set Vercel Environment Variables (10 minutes)

**Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**

### Add These Variables (Set for Production ✅)

| Variable Name                | Value                                        | Notes                                             |
| ---------------------------- | -------------------------------------------- | ------------------------------------------------- |
| `NODE_ENV`                   | `production`                                 |                                                   |
| `NEXT_TELEMETRY_DISABLED`    | `1`                                          | Optional but recommended                          |
| `NEXTAUTH_URL`               | `https://fire.lemonade.art`                  | Your app domain                                   |
| `NEXTAUTH_SECRET`            | `<paste-from-step-1c>`                       | Generated secret                                  |
| `DATABASE_URL`               | `<paste-from-step-1a>`                       | Public Postgres URL                               |
| `REDIS_URL`                  | `<paste-from-step-1a>`                       | Public Redis URL (if using)                       |
| `LOGTO_ENDPOINT`             | `https://auth.lemonade.art`                  | LogTo API endpoint                                |
| `LOGTO_ISSUER`               | `https://auth.lemonade.art/oidc`             | LogTo OIDC issuer                                 |
| `LOGTO_APP_ID`               | `x0icr7qtjw9wrgecbjcj5`                      | From LogTo console                                |
| `LOGTO_APP_SECRET`           | `#internal:wytIYoddLcT3DElicZGGeO5pR7Zx4fDk` | From LogTo console (include `#internal:` prefix!) |
| `NEXT_PUBLIC_LOGTO_ENDPOINT` | `https://auth.lemonade.art`                  | For client-side components                        |
| `LOGTO_M2M_APP_ID`           | `<optional>`                                 | Only if using M2M                                 |
| `LOGTO_M2M_APP_SECRET`       | `<optional>`                                 | Only if using M2M                                 |
| `LOGTO_API_RESOURCE`         | `https://api.fire-platform.com`              | Optional                                          |

### ⚠️ Critical Checks

For **each variable**:

- ✅ Variable name is **exact** (case-sensitive, no typos)
- ✅ Value has **no quotes, no spaces, no trailing slashes**
- ✅ **Production** environment is checked ✅
- ✅ `LOGTO_APP_SECRET` includes the `#internal:` prefix

---

## Step 3: Verify LogTo Configuration (2 minutes)

1. **LogTo Admin Console** → `https://admin.auth.lemonade.art`
2. **Applications** → **"Fire"** application
3. Verify **Redirect URIs** includes:
   ```
   https://fire.lemonade.art/api/auth/callback/logto
   ```
4. If missing, add it and **Save**

---

## Step 4: Deploy to Vercel (2 minutes)

### Option A: Automatic (Recommended)

1. **Vercel Dashboard** → **Deployments**
2. Click **"..."** on latest deployment
3. Click **"Redeploy"**
4. Wait 1-2 minutes

### Option B: Manual Trigger

1. Push any commit to your repository
2. Vercel will auto-deploy

---

## Step 5: Verify Everything Works (5 minutes)

### A. Test Authentication Flow

1. Visit `https://fire.lemonade.art`
2. Click **"Sign In"**
3. Should redirect to `https://auth.lemonade.art`
4. Log in with your credentials
5. Should redirect back to `https://fire.lemonade.art/dashboard`

### B. Check Vercel Logs

1. **Vercel Dashboard** → **Logs** → **Production**
2. Click **"Sign In"** on your site
3. Look for:
   - ✅ No errors
   - ✅ Redirects to `https://auth.lemonade.art`
   - ❌ If you see `auth.fire.local`, environment variables aren't loaded

### C. Run Verification Script

```bash
./scripts/verify-production-setup.sh
```

This will check:

- ✅ All environment variables are set
- ✅ LogTo is accessible
- ✅ Database connection works
- ✅ Authentication flow works

---

## Troubleshooting

### Issue: Still seeing `auth.fire.local` in errors

**Cause:** Environment variables not loaded in Vercel

**Fix:**

1. Verify all variables are set for **Production** environment
2. Check variable names are **exact** (case-sensitive)
3. Redeploy Vercel after setting variables
4. Check Vercel logs for validation errors

### Issue: "Invalid client credentials"

**Cause:** Wrong LogTo App ID or Secret

**Fix:**

1. Verify `LOGTO_APP_ID` matches LogTo console
2. Verify `LOGTO_APP_SECRET` includes `#internal:` prefix
3. Check LogTo redirect URI matches exactly

### Issue: "Database connection failed"

**Cause:** Wrong database URL or network issue

**Fix:**

1. Verify using **PUBLIC** connection string (not internal)
2. Check Railway Postgres is running
3. Verify connection string format is correct

---

## Quick Reference

### Environment Variables Summary

```bash
# Required for Production
NODE_ENV=production
NEXTAUTH_URL=https://fire.lemonade.art
NEXTAUTH_SECRET=<generated>
DATABASE_URL=<public-postgres-url>
LOGTO_ENDPOINT=https://auth.lemonade.art
LOGTO_ISSUER=https://auth.lemonade.art/oidc
LOGTO_APP_ID=<from-logto>
LOGTO_APP_SECRET=<from-logto>
NEXT_PUBLIC_LOGTO_ENDPOINT=https://auth.lemonade.art
```

### Verification Commands

```bash
# Check production setup
./scripts/verify-production-setup.sh

# Test LogTo accessibility
curl https://auth.lemonade.art/oidc/.well-known/openid-configuration

# Check Vercel deployment
vercel ls
```

---

## Success Criteria

✅ **Authentication works:**

- Sign in redirects to LogTo
- Login completes successfully
- Redirects back to app
- User is logged in

✅ **No errors in logs:**

- No `auth.fire.local` references
- No validation errors
- No database connection errors

✅ **All features work:**

- Dashboard loads
- Posts display
- Events work
- Profile works

---

## Next Steps

Once production is working:

1. **Set up CI/CD** (see `CI_CD_SETUP.md`)
2. **Monitor logs** regularly
3. **Set up alerts** for errors
4. **Document any custom configurations**

---

**Need help?** Check `TROUBLESHOOTING_PRODUCTION.md` or review Vercel/Railway logs.
