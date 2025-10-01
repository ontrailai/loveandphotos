# Photographer Availability System - Quick Start Guide

## 🚀 Getting Started

### Step 1: Run Database Migration

```bash
# Option A: Using Supabase CLI
npx supabase db push

# Option B: Direct SQL (Supabase Dashboard)
# Copy/paste contents of: supabase/migrations/20250930_availability_enhancement.sql
```

### Step 2: Install Dependencies

The calendar component requires `react-day-picker`:

```bash
npm install react-day-picker
```

### Step 3: Restart Development Server

```bash
npm run dev
```

## 📋 Testing Checklist

### ✅ Photographer Testing

1. **Login as Photographer**
   - Navigate to: `/talent/dashboard`

2. **Set Availability**
   - Click "Availability" in sidebar
   - Select 3-5 future dates on calendar
   - Click "Save Availability"
   - ✅ Should see: "Availability updated successfully!"

3. **Check Visibility Status**
   - Navigate to "Profile" page
   - ✅ Should see: "✅ Visible in Client Search" (green box)
   - Toggle "Public/Private" switch
   - ⚠️ When private: Should see "Not Visible in Search"

4. **Manage Availability**
   - Go back to Availability page
   - Add more dates
   - Remove some dates
   - Click "Clear All"
   - ✅ Verify stats update correctly

### ✅ Client Testing

1. **Browse Without Date Filter**
   - Navigate to: `/browse`
   - ✅ Should see photographer in results

2. **Browse With Date Filter**
   - Select a date you set as available
   - ✅ Photographer should appear
   - Select a date NOT in availability
   - ✅ Should see: "No photographers available on [date]"

3. **Edge Cases**
   - Photographer sets profile to Private
   - ✅ Should NOT appear even with availability
   - Photographer clears all dates
   - ✅ Should NOT appear even when Public

## 🎯 Expected Behavior

### Visibility Logic
```
visible_in_search = is_public AND has_future_availability
```

| is_public | has_availability | visible_in_search | Client Sees? |
|-----------|------------------|-------------------|--------------|
| ✅ true   | ✅ Yes           | ✅ true           | ✅ YES       |
| ✅ true   | ❌ No            | ❌ false          | ❌ NO        |
| ❌ false  | ✅ Yes           | ❌ false          | ❌ NO        |
| ❌ false  | ❌ No            | ❌ false          | ❌ NO        |

### Date Matching
- Client selects: `2025-11-15`
- Query: `WHERE '2025-11-15' = ANY(available_dates)`
- Only photographers with Nov 15 in their availability array appear

## 🔍 Debugging

### Check Database Directly

```sql
-- View photographer availability
SELECT
  u.full_name,
  p.is_public,
  p.available_dates,
  p.visible_in_search
FROM photographers p
JOIN users u ON p.user_id = u.id
WHERE p.user_id = 'YOUR_USER_ID';

-- Count visible photographers
SELECT COUNT(*) FROM photographers WHERE visible_in_search = true;

-- Check availability for specific date
SELECT
  u.full_name,
  p.available_dates
FROM photographers p
JOIN users u ON p.user_id = u.id
WHERE '2025-11-15' = ANY(p.available_dates);
```

### Common Issues

**Problem**: Calendar not showing
- **Fix**: Check if `react-day-picker` installed
- Run: `npm install react-day-picker`

**Problem**: Dates not saving
- **Fix**: Check Supabase connection
- Verify user is authenticated
- Check browser console for errors

**Problem**: visible_in_search always false
- **Fix**: Run migration to add computed column
- Ensure available_dates array has future dates

**Problem**: Photographer not in search
- **Check**: Both is_public = true AND has future dates
- **SQL**: `SELECT is_public, available_dates, visible_in_search FROM photographers WHERE user_id = '...'`

## 📊 Sample Data

For testing, the migration includes a backfill that adds 5-10 random dates to existing photographers. To verify:

```sql
-- Check backfilled data
SELECT
  u.full_name,
  array_length(p.available_dates, 1) as date_count,
  p.available_dates[1:3] as sample_dates
FROM photographers p
JOIN users u ON p.user_id = u.id
WHERE p.is_public = true
LIMIT 10;
```

## 🎨 UI Preview

### Availability Page
- Large calendar with date picker
- Selected dates highlighted in pink
- Stats panel showing future/past dates
- "How It Works" instructions
- Save button with loading state

### Profile Page Visibility Indicator
- **Green**: ✅ Visible in Client Search
- **Amber**: ⚠️ Not Visible (needs availability)
- **Gray**: ❌ Private (hidden)

### Browse Page Date Filter
- Date input in filter panel
- Contextual "no results" message when filtering by date
- Clear indication of active date filter

## 📝 Next Steps

1. ✅ Run migration
2. ✅ Install dependencies
3. ✅ Test photographer workflow
4. ✅ Test client search with date filter
5. ✅ Verify visibility indicator
6. ✅ Check edge cases

## 🚨 Rollback (If Needed)

```sql
-- Remove added columns
ALTER TABLE photographers DROP COLUMN IF EXISTS available_dates;
ALTER TABLE photographers DROP COLUMN IF EXISTS visible_in_search;

-- Drop functions
DROP FUNCTION IF EXISTS is_photographer_available(DATE[], DATE);
DROP FUNCTION IF EXISTS get_available_photographers(DATE, TEXT);

-- Drop indexes
DROP INDEX IF EXISTS idx_photographers_available_dates;
DROP INDEX IF EXISTS idx_photographers_visible_in_search;
```

---

**Ready to test!** Follow the checklist above and report any issues. 🚀
