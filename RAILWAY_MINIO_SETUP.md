# Railway MinIO Setup - 10 Minute Guide

## Why MinIO on Railway?
- ✅ Works with existing code (AWS SDK v2)
- ✅ Same setup as dev (no compatibility issues)
- ✅ S3-compatible API
- ✅ Deployed alongside your other Railway services

---

## Step 1: Create MinIO Service in Railway

1. **Railway Dashboard** → Your Project (Fire Production)
2. Click **+ New** → **Empty Service**
3. Service name: `minio`
4. Go to **Settings** tab

### Configure Docker Image

1. Under **Deploy**, change **Source** to **Docker Image**
2. **Image:** `minio/minio:latest`
3. **Start Command:** `server /data --console-address :9001`
4. Click **Deploy**

---

## Step 2: Add Environment Variables

In the MinIO service **Variables** tab, add:

```
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=<generate-secure-password-here>
```

Generate password with:
```bash
openssl rand -base64 24
```

---

## Step 3: Add Domain for MinIO API

1. MinIO service → **Settings** tab
2. Under **Networking** → **Public Networking**
3. Click **Generate Domain** for port **9000** (API port)
4. You'll get: `minio-production.up.railway.app` (example)
5. **Copy this domain**

---

## Step 4: Update Vercel Environment Variables

**Vercel Dashboard** → Settings → Environment Variables

Update/Add these (remove R2 ones if present):

```
S3_ENDPOINT=https://minio-production.up.railway.app
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=<password-from-step-2>
S3_BUCKET=fire-uploads
S3_REGION=us-east-1
S3_PUBLIC_URL=https://minio-production.up.railway.app/fire-uploads
```

**Important:** Use `https://` for the Railway domain (Railway provides SSL)

---

## Step 5: Create the Bucket

MinIO needs buckets to be created. Use MinIO Console or API:

### Option A: Via MinIO Console (Easiest)

1. Railway MinIO service → **Settings** → Generate domain for port **9001** (Console port)
2. Visit the console URL in browser
3. Login with `MINIO_ROOT_USER` and `MINIO_ROOT_PASSWORD`
4. Create bucket: `fire-uploads`
5. Set policy to **public** (or **download** for read-only)

### Option B: Via Script

```bash
# Install MinIO client
brew install minio/stable/mc

# Configure
mc alias set railway https://minio-production.up.railway.app minioadmin <your-password>

# Create bucket
mc mb railway/fire-uploads

# Set public policy
mc anonymous set download railway/fire-uploads
```

---

## Step 6: Redeploy Vercel

1. **Vercel Dashboard** → **Deployments**
2. Click current deployment → **...** → **Redeploy**
3. Wait 2-3 minutes

---

## Step 7: Test

1. Visit: `https://fire.lemonade.art/profile`
2. Upload a photo
3. Should work! ✅

---

## Cost

Railway MinIO usage:
- Execution time: ~$5-10/month
- Storage: Included in Railway plan
- Bandwidth: Included

Much simpler than debugging R2!

---

## Next Steps

After it works:
1. Consider adding a custom domain: `uploads.fire.lemonade.art`
2. Configure bucket policies for security
3. Set up backups

---

**This will definitely work - it's the same as dev!**

