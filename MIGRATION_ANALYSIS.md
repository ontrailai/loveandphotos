# Environment Migration Analysis - Love & Photos

## 🔴 CRITICAL ISSUES FOUND

### 1. **RENDER DEPLOYMENT FAILURE ROOT CAUSE**
**Issue**: VITE_API_URL and VITE_APP_URL are set to localhost in production
```
❌ WRONG (Current Render Config):
VITE_API_URL=http://localhost:10000
VITE_APP_URL=http://localhost:5173

✅ CORRECT (Should be):
VITE_API_URL=https://loveandphotos.onrender.com
VITE_APP_URL=https://loveandphotos.onrender.com
```

**Impact**:
- Frontend cannot connect to backend API (trying to reach localhost instead of live server)
- Authentication redirects will fail
- Stripe payment redirects will fail
- All API calls will fail with CORS or connection errors

**Fix**: Update these environment variables in Render dashboard immediately


### 2. **Database Migration Verification Needed**
The Supabase project changed from:
- OLD: `ldxscjxoakqrmkgqwwhr`
- NEW: `tboltfobncbyjdvelavsl`

**Critical Checks**:
- ✅ Database schema migrated via pg_dump
- ⚠️ RLS policies need verification
- ⚠️ Storage buckets need migration
- ⚠️ Edge functions need migration (if any)
- ⚠️ Auth providers/settings need configuration


## 📊 Environment Variable Comparison

### Supabase (Changed ✅)
| Variable | Old Value | New Value | Status |
|----------|-----------|-----------|--------|
| VITE_SUPABASE_URL | ldxscjxoakqrmkgqwwhr.supabase.co | tboltfobncbyjdvelavsl.supabase.co | ✅ Different Project |
| VITE_SUPABASE_ANON_KEY | Old key | New key | ✅ New Keys |
| SUPABASE_SERVICE_KEY | Old key | New key | ✅ New Keys |

### Stripe (Changed ✅)
| Variable | Old Value | New Value | Status |
|----------|-----------|-----------|--------|
| VITE_STRIPE_PUBLIC_KEY | pk_test_51SCVcy... | pk_test_51SK8qJI... | ✅ Different Account |
| STRIPE_SECRET_KEY | sk_test_51SCVcy... | sk_test_51SK8qJI... | ✅ Different Account |

### Cloudflare Stream (Changed ✅)
| Variable | Old Value | New Value | Status |
|----------|-----------|-----------|--------|
| VITE_CF_STREAM_HLS | customer-rgn1u11l.../b389be72... | customer-c24sauy.../babc3cd7... | ✅ Different Video |
| VITE_CF_STREAM_SUBDOMAIN | customer-rgn1u11lvoqolqnf | customer-c24sauyk9nlgoptq | ✅ Different Account |
| VITE_CF_STREAM_VIDEO_ID | b389be72308f6f818dffea9960e10e89 | babc3cd7d0fbd841eb8f92d5d0e09276 | ✅ Different Video |

### App URLs (🔴 CRITICAL - WRONG FOR PRODUCTION)
| Variable | Local Dev | Production (Current) | Production (Should Be) |
|----------|-----------|---------------------|----------------------|
| VITE_APP_URL | http://localhost:5173 | http://localhost:5173 | https://loveandphotos.onrender.com |
| VITE_API_URL | http://localhost:5173 | http://localhost:10000 | https://loveandphotos.onrender.com |
| PORT | 5173 | 10000 | 10000 ✅ |
| NODE_ENV | development | production | production ✅ |


## 🛠️ IMMEDIATE ACTION ITEMS

### 1. Fix Render Environment Variables (URGENT)
Log into client's Render dashboard and update:
```bash
VITE_API_URL=https://loveandphotos.onrender.com
VITE_APP_URL=https://loveandphotos.onrender.com
```

### 2. Verify Supabase Configuration
- [ ] Check RLS policies are active
- [ ] Verify storage buckets exist
- [ ] Test authentication flows
- [ ] Confirm all tables migrated correctly
- [ ] Check for any database triggers/functions

### 3. Test Stripe Integration
- [ ] Verify webhook endpoint is configured
- [ ] Test payment flow in production
- [ ] Confirm customer can see Stripe checkout
- [ ] Verify payment success redirects work

### 4. Verify Cloudflare Stream
- [ ] Test video plays on production site
- [ ] Confirm CORS headers allow domain
- [ ] Check video loads on "Forever Starts Here" section


## 📝 LOCAL ENVIRONMENT UPDATE

I will now update your local `.env.local` file with the new credentials so you can test locally against the client's infrastructure.


## 🔍 Common Deployment Errors to Check

### Error 1: "Failed to fetch" or CORS errors
**Cause**: VITE_API_URL pointing to localhost
**Fix**: Update to production URL

### Error 2: "Supabase client error"
**Cause**: RLS policies blocking access or invalid keys
**Fix**: Verify RLS policies and key permissions

### Error 3: "Stripe checkout not loading"
**Cause**: VITE_STRIPE_PUBLIC_KEY mismatch or VITE_APP_URL incorrect
**Fix**: Verify Stripe keys and success redirect URL

### Error 4: "Video not playing"
**Cause**: Cloudflare CORS not configured for new domain
**Fix**: Add loveandphotos.onrender.com to allowed origins in Cloudflare


## 🎯 Testing Checklist

After fixing Render environment variables, test:
- [ ] Homepage loads without errors
- [ ] User registration works
- [ ] User login works
- [ ] Photographer browse page works
- [ ] Booking flow completes
- [ ] Payment processing works
- [ ] Video background plays
- [ ] Dashboard pages load
- [ ] All API calls succeed


## 📞 Next Steps

1. **CRITICAL**: Fix Render env vars (VITE_API_URL, VITE_APP_URL)
2. Update local .env.local for testing
3. Test locally against new infrastructure
4. Verify production deployment after env var fix
5. Monitor production logs for any remaining issues
