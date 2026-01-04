# TODO for Tomorrow

## 🎯 Cloudflare R2 Setup for Profile Photos

**Current Status:**

- ❌ Profile photo upload fails in production (no S3 storage)
- ✅ Works in dev (MinIO running in Docker)
- ✅ Password change now works (just implemented)

**Steps to Complete:**

### 1. Create Cloudflare R2 Bucket

See: `CLOUDFLARE_R2_SETUP_GUIDE.md` for detailed steps

Quick version:

1. Cloudflare Dashboard → R2 → Create bucket: `fire-production-uploads`
2. Create API token (Read & Write permissions)
3. Save credentials: Access Key ID, Secret Access Key, Endpoint URL

### 2. Add Environment Variables to Vercel

```
S3_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
S3_ACCESS_KEY=<from-step-1>
S3_SECRET_KEY=<from-step-1>
S3_BUCKET=fire-production-uploads
S3_REGION=auto
S3_PUBLIC_URL=https://uploads.fire.lemonade.art
```

### 3. Configure Custom Domain (Optional)

For cleaner URLs: `https://uploads.fire.lemonade.art`

- R2 Bucket → Settings → Connect domain
- Add DNS record (CNAME)

### 4. Implement Protected Images

Since you want images for authenticated users only:

**Option A: Signed URLs (Recommended)**

- Images stored privately in R2
- Generate temporary signed URLs (1 hour expiry)
- Users must be logged in to view

**Option B: Proxy Endpoint**

- API endpoint checks authentication
- Proxies requests to R2
- Full control over access

I recommend Option A (signed URLs) - it's simpler and more performant.

### 5. Code Changes Needed

See `CLOUDFLARE_R2_SETUP_GUIDE.md` section "Secure Images for Authenticated Users Only"

Minimal changes required:

- Remove `ACL: 'public-read'` from upload
- Add `getSignedUrl()` function
- Update image URLs to use signed URLs

### 6. Test

After setup:

1. Redeploy Vercel
2. Upload profile photo
3. Verify it saves and displays correctly

---

## Estimated Time: 30 minutes

- 10 min: Create R2 bucket and get credentials
- 5 min: Add to Vercel
- 10 min: Code changes for signed URLs
- 5 min: Test

---

## What's Already Working

✅ Development environment
✅ Production environment
✅ Authentication (email-based)
✅ Admin roles
✅ Password change
✅ CI/CD webhook
✅ All 84 tests passing
✅ Branding matched
✅ Footer with Terms/Privacy
✅ Wiki "Coming Soon" page
✅ "Latest News" instead of "Community Feed"

---

## Notes

- Cloudflare R2 is FREE for egress (bandwidth)
- Very cheap for storage (~$1/month)
- S3-compatible (minimal code changes)
- Global CDN built-in
- Can add protected/signed URLs for security

Good stopping point for today! 🎉
