# Issue #73 Fix - Deployment Guide

## Problem Summary
**Root Cause**: Typo in Supabase project reference causing DNS resolution failures
**Symptom**: `net::ERR_NAME_NOT_RESOLVED` for all Supabase API calls
**Impact**: Photographer/videographer applications failing, reviews not loading

## The Fix

### Character-Level Typo (Position 13-14)
- ❌ **WRONG**: `tboltfobncbj**dv**elavsl.supabase.co` (doesn't exist)
- ✅ **CORRECT**: `tboltfobncbj**wj**elavsl.supabase.co` (actual project)

## Deployment Steps

### 1. Update Render Environment Variables

Go to: https://dashboard.render.com/web/srv-d3o4113e5dus73adkk7g/env

**Update these 2 variables:**

```
SUPABASE_URL=https://tboltfobncbjwjelavsl.supabase.co
VITE_SUPABASE_URL=https://tboltfobncbjwjelavsl.supabase.co
```

### 2. Trigger Rebuild

1. Go to: https://dashboard.render.com/web/srv-d3o4113e5dus73adkk7g
2. Click **"Manual Deploy"**
3. Select **"Clear build cache & deploy"**
4. Wait for build to complete (~5-10 minutes)

### 3. Verify Fix

Run the Playwright test:
```bash
cd /mnt/c/Users/riley/Desktop/loveandphotos
npx playwright test tests/e2e/issue73-photographer-application.spec.js
```

Or manually test:
1. Go to https://loveandphotos.onrender.com/talent/apply
2. Fill out photographer application
3. Submit
4. Should redirect to `/talent/training` without errors

## Expected Results

### ✅ Success Indicators
- No `ERR_NAME_NOT_RESOLVED` errors in console
- All Supabase requests resolve to `tboltfobncbjwjelavsl.supabase.co`
- Application submits successfully
- Reviews load on homepage
- Maximum 1 "Multiple GoTrueClient" warning (harmless)

### ❌ Failure Indicators (if still broken)
- DNS errors in console
- Requests to `tboltfobncbjdvelavsl.supabase.co` (wrong URL)
- Application submission fails
- Reviews don't load

## Verification Checklist

- [ ] Updated `SUPABASE_URL` in Render dashboard
- [ ] Updated `VITE_SUPABASE_URL` in Render dashboard
- [ ] Triggered "Clear build cache & deploy"
- [ ] Build completed successfully
- [ ] Playwright test passes
- [ ] Manual test on production site works
- [ ] Console shows no DNS errors
- [ ] Network tab shows correct Supabase URL

## Rollback Plan (if needed)

If the fix doesn't work, the issue is elsewhere. The environment file change is safe and correct - verified against:
- Local `.env.local` (working)
- Supabase project dashboard
- Actual Supabase project ref from service role key

## Files Modified

1. `/mnt/c/Users/riley/Desktop/loveandphotos.env` - Desktop reference (already fixed)
2. Render Dashboard Environment Variables - **NEEDS MANUAL UPDATE**

## Test Script Location

`/mnt/c/Users/riley/Desktop/loveandphotos/tests/e2e/issue73-photographer-application.spec.js`
