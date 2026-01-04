# ✅ Production Quick Checklist

**Use this checklist to verify production is configured correctly**

---

## Pre-Deployment Checklist

### Railway Services

- [ ] Postgres service running
- [ ] Redis service running (if using)
- [ ] LogTo service running
- [ ] LogTo accessible at `https://auth.lemonade.art`
- [ ] LogTo admin accessible at `https://admin.auth.lemonade.art`

### LogTo Configuration

- [ ] "Fire" application created in LogTo
- [ ] Redirect URI set: `https://fire.lemonade.art/api/auth/callback/logto`
- [ ] App ID and Secret copied
- [ ] Admin user can log in to LogTo console

### Vercel Environment Variables

- [ ] `NODE_ENV=production`
- [ ] `NEXTAUTH_URL=https://fire.lemonade.art`
- [ ] `NEXTAUTH_SECRET=<generated>`
- [ ] `DATABASE_URL=<public-postgres-url>`
- [ ] `LOGTO_ENDPOINT=https://auth.lemonade.art`
- [ ] `LOGTO_ISSUER=https://auth.lemonade.art/oidc`
- [ ] `LOGTO_APP_ID=<from-logto>`
- [ ] `LOGTO_APP_SECRET=<from-logto>`
- [ ] `NEXT_PUBLIC_LOGTO_ENDPOINT=https://auth.lemonade.art`
- [ ] All variables set for **Production** environment ✅
- [ ] All variable names are **exact** (case-sensitive)
- [ ] All values have **no quotes, no spaces**

### Vercel Deployment

- [ ] Project connected to GitHub
- [ ] Latest code deployed
- [ ] Custom domain configured: `fire.lemonade.art`
- [ ] SSL certificate active

---

## Post-Deployment Verification

### Test Authentication

- [ ] Visit `https://fire.lemonade.art`
- [ ] Click "Sign In"
- [ ] Redirects to `https://auth.lemonade.art` ✅
- [ ] Can log in successfully ✅
- [ ] Redirects back to `https://fire.lemonade.art/dashboard` ✅
- [ ] User is logged in ✅

### Test Registration

- [ ] Click "Sign Up"
- [ ] Redirects to LogTo registration ✅
- [ ] Can create account ✅
- [ ] Redirects back to app ✅

### Check Logs

- [ ] Vercel logs show no errors
- [ ] No `auth.fire.local` references
- [ ] No validation errors
- [ ] No database connection errors

### Test Features

- [ ] Dashboard loads
- [ ] Posts display (if any)
- [ ] Events page works
- [ ] Profile page works

---

## Common Issues & Quick Fixes

### ❌ Still seeing `auth.fire.local`

**Fix:** Environment variables not loaded

1. Verify all vars set for **Production**
2. Check variable names are exact
3. Redeploy Vercel

### ❌ "Invalid client credentials"

**Fix:** Wrong LogTo credentials

1. Verify `LOGTO_APP_ID` matches LogTo
2. Verify `LOGTO_APP_SECRET` includes `#internal:` prefix
3. Check redirect URI in LogTo

### ❌ "Database connection failed"

**Fix:** Wrong database URL

1. Use **PUBLIC** connection string (not internal)
2. Verify Railway Postgres is running
3. Check connection string format

---

## Verification Script

Run this to check production setup:

```bash
./scripts/verify-production-setup.sh
```

---

## Success Criteria

✅ Authentication works end-to-end  
✅ No errors in Vercel logs  
✅ All features functional  
✅ Database connected  
✅ LogTo connected

---

**If all checks pass, production is ready! 🎉**
