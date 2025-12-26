# Get [SIGNIN] Logs to See Role Fetching Error

## Export Runtime Logs

1. **Vercel Dashboard** → **Deployments** → Click the latest deployment
2. Click **"Runtime Logs"** tab
3. Try signing in again at `https://fire.lemonade.art/login`
4. Watch for new log entries with `[SIGNIN]`
5. Export as CSV
6. Search for lines with `[SIGNIN]`

## What to Look For

You should see:
```
[SIGNIN] Starting signIn callback
[SIGNIN] Fetching user roles from LogTo
[SIGNIN] Failed to fetch roles from LogTo, using default USER role
```

And an error with details about WHY it failed.

## Most Likely Issues

1. **M2M credentials not working** - Can't get token for Management API
2. **getUserFromLogTo function error** - API call failing
3. **Network/timeout issue** - Vercel can't reach LogTo Management API

The error details will show exactly what's failing so we can fix it.

