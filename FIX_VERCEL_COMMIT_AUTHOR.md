# Fix "Commit Author is Required" Error

## Problem

Vercel shows "A commit author is required" because commits use a local email (`infrastructure@fire-platform.local`) that doesn't match a GitHub account.

## Solution 1: Fix Git Config for Future Commits

Set your git email to match your GitHub account:

```bash
git config user.email "your-github-email@example.com"
```

Or use GitHub's noreply email:

```bash
git config user.email "josh.blank@users.noreply.github.com"
```

## Solution 2: Focus on Automatic Deployments (Webhook)

The "commit author required" error only affects **manual deployments**. If the webhook is working, **automatic deployments** will work fine regardless of commit author.

### Verify Webhook Exists

1. **GitHub** → Your Repository → **Settings** → **Webhooks**
2. Do you see a webhook from `vercel.com`?
3. If YES: Check "Recent Deliveries" - are there recent `push` events?
4. If NO: The webhook wasn't created - need to reconnect properly

### If Webhook Doesn't Exist

The webhook should be created when you:

1. Connect GitHub in Vercel project settings
2. Complete the configuration step
3. Click "Deploy"

**Make sure you complete ALL steps** - don't skip the configuration/deploy step!

## Solution 3: Check Vercel Project Git Settings

1. **Vercel Dashboard** → Your Project → **Settings** → **Git**
2. What does it show?
   - Does it show your repository is connected?
   - What branch is selected?
   - Is "Auto-deploy from GitHub" ON?

## Solution 4: Try Vercel CLI Instead

If webhook still won't work, use CLI (doesn't require author matching):

```bash
# Login first
vercel login

# Then deploy
vercel --prod
```

---

## Most Important: Get Webhook Working

The webhook is the key - once it's working:

- Automatic deployments happen on every `git push`
- No need for manual deployments
- Commit author doesn't matter

**Check GitHub webhooks right now** - do you see a Vercel webhook? If not, that's the root cause.
