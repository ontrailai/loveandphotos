# 🚨 DEPLOYMENT FIX - Action Plan

## ✅ LOCAL TESTING COMPLETE
Your local environment is now configured with the new credentials and working perfectly:
- ✅ Supabase: Connected to new project (tboltfobncbyjdvelavsl)
- ✅ Stripe: Using new test keys
- ✅ Cloudflare: Using new video
- ✅ No console errors (except expected stagewise warnings)

## 🔴 CRITICAL PRODUCTION ISSUE IDENTIFIED

### Root Cause
The Render production deployment is failing because `VITE_API_URL` and `VITE_APP_URL` are set to **localhost** instead of the production domain.

**Current (WRONG):**
```
VITE_API_URL=http://localhost:10000
VITE_APP_URL=http://localhost:5173
```

**Should Be:**
```
VITE_API_URL=https://loveandphotos.onrender.com
VITE_APP_URL=https://loveandphotos.onrender.com
```

### Why This Causes Failures
1. Frontend tries to call `http://localhost:10000` which doesn't exist in production
2. All API calls fail (authentication, bookings, payments)
3. Stripe redirects point to localhost instead of production
4. CORS errors occur because domains don't match

---

## 📋 STEP-BY-STEP FIX GUIDE

### Step 1: Access Render Dashboard
1. Go to: https://dashboard.render.com
2. Log into the client's account
3. Find service: **Love & Photos** (srv-d3o4113e5dus73adkk7g)
4. Click on the service to open dashboard

### Step 2: Update Environment Variables
1. Click **Environment** tab in left sidebar
2. Find and update these TWO variables:

**Variable 1:**
- Name: `VITE_API_URL`
- Old Value: `http://localhost:10000`
- **New Value:** `https://loveandphotos.onrender.com`

**Variable 2:**
- Name: `VITE_APP_URL`
- Old Value: `http://localhost:5173`
- **New Value:** `https://loveandphotos.onrender.com`

3. Click **Save Changes**

### Step 3: Trigger New Deployment
**IMPORTANT:** Vite embeds environment variables at BUILD TIME, so you MUST rebuild:

1. Go to **Manual Deploy** button (top right)
2. Select **"Clear build cache & deploy"**
3. Click **Deploy**
4. Wait for build to complete (usually 5-10 minutes)

### Step 4: Monitor Deployment
Watch the build logs for:
- ✅ Build completes successfully
- ✅ No environment variable errors
- ✅ Server starts on port 10000
- ❌ Any errors about missing variables or failed starts

### Step 5: Verify Production
Once deployed, test these critical flows:

1. **Homepage Loads**
   - Visit: https://loveandphotos.onrender.com
   - Check: No console errors
   - Verify: Images and video load

2. **Authentication Works**
   - Try: Register new account
   - Try: Login existing account
   - Check: Redirects work properly

3. **Search Functions**
   - Use: ZIP code search
   - Verify: Photographers load from database

4. **Payment Flow**
   - Browse: Select photographer
   - Start: Booking flow
   - Test: Stripe checkout opens

---

## 📝 COMPLETE ENVIRONMENT VARIABLE CHECKLIST

Copy ALL these to Render (most should already be there, just verify):

### ✅ Verified Correct (Already Set)
- `NODE_ENV=production`
- `PORT=10000`

### 🔴 MUST FIX (Currently Wrong)
- `VITE_API_URL=https://loveandphotos.onrender.com`
- `VITE_APP_URL=https://loveandphotos.onrender.com`

### ✅ Should Be Correct (Verify Present)
**Supabase:**
- `SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRib2x0Zm9ibmNiandqZWxhdnNsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDY1NjI5NywiZXhwIjoyMDc2MjMyMjk3fQ.loRENOUdOPhYB4Lt98NFO_kZzctsI51fhNKKknEwRF4`
- `SUPABASE_URL=https://tboltfobncbyjdvelavsl.supabase.co`
- `VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRib2x0Zm9ibmNiandqZWxhdnNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2NTYyOTcsImV4cCI6MjA3NjIzMjI5N30.krW-OaKtrQpAv8QThYAfq_51sWKzSwD_yUxHIzAgR4c`
- `VITE_SUPABASE_URL=https://tboltfobncbyjdvelavsl.supabase.co`

**Stripe:**
- `STRIPE_SECRET_KEY=[REDACTED - Set in Render dashboard]`
- `VITE_STRIPE_PUBLIC_KEY=pk_test_51SK8qJIikLQcr95S5ea5bGEzMrYKv5td6sG845ATzHZnkYoEpIASdoiXHC14vCIzm6LnGxElAoaj9NtQIGu1kvjG00gM7EUz86`

**Cloudflare:**
- `VITE_CF_STREAM_HLS=https://customer-c24sauyk9nlgoptq.cloudflarestream.com/babc3cd7d0fbd841eb8f92d5d0e09276/manifest/video.m3u8`
- `VITE_CF_STREAM_SUBDOMAIN=customer-c24sauyk9nlgoptq.cloudflarestream.com`
- `VITE_CF_STREAM_VIDEO_ID=babc3cd7d0fbd841eb8f92d5d0e09276`

---

## 🔍 TROUBLESHOOTING COMMON ERRORS

### Error: "Failed to fetch" in console
**Cause:** VITE_API_URL still pointing to localhost
**Fix:** Verify variable was saved and rebuild was triggered

### Error: "Supabase client initialization failed"
**Cause:** Wrong Supabase keys or URL
**Fix:** Double-check all 4 Supabase variables match new project

### Error: "Stripe is not defined"
**Cause:** Wrong Stripe public key
**Fix:** Verify VITE_STRIPE_PUBLIC_KEY matches new account

### Error: Video not playing
**Cause:** Cloudflare CORS not configured
**Fix:** Add `loveandphotos.onrender.com` to allowed origins in Cloudflare dashboard

### Error: Build fails with "process is not defined"
**Cause:** Environment variables not available at build time
**Fix:** Ensure all VITE_ prefixed variables are set

---

## 📊 POST-DEPLOYMENT VERIFICATION

After deployment succeeds, run these checks:

### 1. Health Check
```bash
curl https://loveandphotos.onrender.com/api/health
```
Should return: `{"status":"healthy","timestamp":"..."}`

### 2. Console Logs
Open: https://loveandphotos.onrender.com
Check browser console for:
- ✅ No "Failed to fetch" errors
- ✅ "Environment properly configured" message
- ✅ Supabase connection successful
- ✅ Configuration status shows all ✅

### 3. Database Connection
- Browse photographers page
- Should load data from Supabase
- Check network tab for successful API calls

### 4. Payment Flow
- Start booking process
- Should redirect to Stripe checkout
- Verify success URL points to render.com domain

---

## 📞 NEED HELP?

If deployment still fails after fixing VITE_API_URL and VITE_APP_URL:

1. **Check Render Build Logs**
   - Look for: "Could not resolve" errors
   - Look for: Missing environment variable warnings
   - Check: Node version compatibility

2. **Verify Supabase Database**
   - Confirm: All tables migrated
   - Check: RLS policies enabled
   - Test: Can query users table

3. **Test Stripe Integration**
   - Verify: Webhook endpoint configured
   - Check: Test mode vs production mode
   - Confirm: Success URL matches domain

4. **Cloudflare Configuration**
   - Check: Video is published
   - Verify: CORS allows render domain
   - Test: HLS URL works in browser

---

## 🎯 SUCCESS CRITERIA

Deployment is successful when:

- ✅ Site loads at https://loveandphotos.onrender.com
- ✅ No console errors except expected warnings
- ✅ User can register/login
- ✅ Photographers page loads with data
- ✅ Booking flow completes
- ✅ Stripe checkout opens correctly
- ✅ Video plays on homepage
- ✅ All images load
- ✅ Navigation works

---

## 📁 FILES CREATED

1. **MIGRATION_ANALYSIS.md** - Detailed comparison of old vs new config
2. **RENDER_PRODUCTION_ENV.txt** - Copy-paste ready environment variables
3. **DEPLOYMENT_FIX_ACTION_PLAN.md** - This file (step-by-step fix guide)

All files are in your project root: `/mnt/c/Users/riley/Desktop/loveandphotos/`

---

## 🚀 NEXT STEPS

1. ⏱️ **NOW**: Fix VITE_API_URL and VITE_APP_URL in Render
2. ⏱️ **NOW**: Trigger rebuild with cache clear
3. ⏱️ **5-10 min**: Wait for build to complete
4. ✅ **Then**: Test production site
5. ✅ **Then**: Verify all critical flows work
6. 📊 **Optional**: Monitor for 24 hours to catch edge cases

---

## 💡 PREVENTION

To avoid this issue in future deployments:

1. Always use production URLs in production env vars
2. Never hardcode localhost in configuration
3. Use different env files for dev vs production
4. Test build locally before deploying: `npm run build`
5. Document all environment variables in repo

---

Good luck with the deployment! The fix should be straightforward once those two URL variables are corrected. 🎉
