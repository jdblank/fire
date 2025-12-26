# Production Status

## ✅ Production is Live and Working!

Last updated: November 18, 2025

---

## Production URLs

- **Application:** https://fire.lemonade.art
- **LogTo API:** https://auth.lemonade.art
- **LogTo Admin:** https://admin.auth.lemonade.art

---

## What's Working

✅ **Authentication**
- User registration (email + password)
- User sign in
- OAuth flow with LogTo
- Admin role support

✅ **Database**
- Railway PostgreSQL (`fire_db`)
- All Prisma migrations applied
- Tables created and accessible

✅ **LogTo Configuration**
- Email-based registration enabled
- Roles: admin, moderator, user
- Fire Platform Server M2M app configured
- Management API access working

✅ **Vercel Deployment**
- Webhook auto-deploys on push to `main`
- All environment variables configured
- Custom domain `fire.lemonade.art` active
- Latest code deployed

✅ **CI/CD Pipeline**
```
Dev → git push → GitHub → Webhook → Vercel → Production
```

---

## Key Configuration

### Environment Variables (Vercel)
All required variables set for Production environment:
- `LOGTO_ENDPOINT`, `LOGTO_ISSUER`, `LOGTO_APP_ID`, `LOGTO_APP_SECRET`
- `LOGTO_M2M_APP_ID`, `LOGTO_M2M_APP_SECRET`
- `NEXT_PUBLIC_LOGTO_ENDPOINT`
- `DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`

### LogTo Roles
- **admin** - Full administrative access
- **moderator** - Limited admin access  
- **user** - Default role for new users

### Admin User
- Email: `josh@lemonade.art`
- Role: admin

---

## Tests

All 84 tests passing:
- ✅ 23 unit tests
- ✅ 61 integration tests

---

## Development Workflow

1. Make changes locally
2. Test in dev environment (`docker-compose up`)
3. Run tests: `docker-compose -f docker-compose.yml -f docker-compose.tools.yml run --rm test-unit`
4. Commit: `git add . && git commit -m "description"`
5. Push: `git push origin main`
6. Vercel auto-deploys (2-3 minutes)
7. Test production

---

## Credentials

See `PRODUCTION_CREDENTIALS.md` (gitignored, local only)

---

## Next Steps (Optional)

- Apply dev branding to production LogTo
- Import dev users if needed
- Set up monitoring/alerts
- Configure backups

