# 🔴 CRITICAL: Invalid Supabase URL

## Problem
The Supabase URL `https://tboltfobncbyjdvelavsl.supabase.co` **does not exist**.

DNS lookup fails with: `Could not resolve host: tboltfobncbyjdvelavsl.supabase.co`

## Evidence
1. **Production site error**: `ERR_NAME_NOT_RESOLVED` when trying to fetch photographers
2. **Local site error**: Same DNS resolution failure
3. **curl test**: `curl: (6) Could not resolve host: tboltfobncbyjdvelavsl.supabase.co`

## Provided Credentials (Check for Typos)
```
VITE_SUPABASE_URL: https://tboltfobncbyjdvelavsl.supabase.co
Project Reference: tboltfobncbyjdvelavsl
                            ^^^^^^^
```

## Possible Issues
1. **Typo in project reference**: `tboltfobncbyjdvelavsl` might have wrong characters
   - Could be: `tboltfobncbywjelavsl` (jd → jw)?
   - Or another character transposition?

2. **Wrong project**: Using wrong Supabase project reference

3. **Project doesn't exist**: Project was deleted or never created

## How to Fix

### Step 1: Verify Correct Supabase URL
1. Log into Supabase Dashboard: https://supabase.com/dashboard
2. Go to the **Love & Photos** project
3. Click **Settings** → **API**
4. Copy the exact **Project URL**
5. Compare with: `https://tboltfobncbyjdvelavsl.supabase.co`

### Step 2: Check for Typos
The project reference is: **`tboltfobncbyjdvelavsl`**

Common typo patterns:
- `jd` vs `jw`
- `cb` vs `cb`
- `velavsl` - does this look right?

### Step 3: Update Environment Variables
Once you have the **correct** Supabase URL:

**Local (.env.local):**
```bash
VITE_SUPABASE_URL=https://[CORRECT-REF].supabase.co
SUPABASE_URL=https://[CORRECT-REF].supabase.co
```

**Render Production:**
1. Update `VITE_SUPABASE_URL`
2. Update `SUPABASE_URL`
3. Get the correct anon key and service key for that project
4. Rebuild with cache clear

## Current Status
❌ **Photographers page**: Cannot load - DNS failure
❌ **Reviews**: Cannot load - DNS failure
❌ **Authentication**: Will fail - wrong Supabase project
❌ **All database operations**: Failing - invalid URL

## Action Required
**URGENT**: Verify the Supabase project URL from the dashboard and update all environment variables with the correct reference.
