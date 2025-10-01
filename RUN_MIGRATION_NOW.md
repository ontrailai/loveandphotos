# 🚀 Run Migration Now - Simple Steps

## Step 1: Open Supabase SQL Editor

Click this link (or copy to browser):
```
https://supabase.com/dashboard/project/ldxscjxoakqrmkgqwwhr/sql/new
```

## Step 2: Copy the SQL

The migration SQL is in:
```
supabase/migrations/20250930_availability_enhancement.sql
```

**OR** copy from below:

```sql
-- Availability System Enhancement Migration
-- Adds improved availability tracking for photographers
-- Created: 2025-09-30

-- Add available_dates array to photographers table for simplified availability tracking
ALTER TABLE public.photographers
ADD COLUMN IF NOT EXISTS available_dates DATE[] DEFAULT ARRAY[]::DATE[];

-- Add index for available_dates to improve search performance
CREATE INDEX IF NOT EXISTS idx_photographers_available_dates
ON public.photographers USING GIN(available_dates);

-- Add visible_in_search column (composite of is_public + has availability)
ALTER TABLE public.photographers
ADD COLUMN IF NOT EXISTS visible_in_search BOOLEAN GENERATED ALWAYS AS (
  is_public = true AND
  COALESCE(array_length(available_dates, 1), 0) > 0
) STORED;

-- Index for visible_in_search
CREATE INDEX IF NOT EXISTS idx_photographers_visible_in_search
ON public.photographers(visible_in_search) WHERE visible_in_search = true;

-- Function to check if photographer is available on a specific date
CREATE OR REPLACE FUNCTION is_photographer_available(
  photographer_available_dates DATE[],
  check_date DATE
) RETURNS BOOLEAN AS $$
BEGIN
  RETURN check_date = ANY(photographer_available_dates);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to get photographers available on a specific date
CREATE OR REPLACE FUNCTION get_available_photographers(
  event_date DATE,
  search_zip TEXT DEFAULT NULL
) RETURNS TABLE (
  id UUID,
  user_id UUID,
  bio TEXT,
  experience_years INTEGER,
  average_rating DECIMAL(3,2),
  total_reviews INTEGER,
  is_verified BOOLEAN,
  available_dates DATE[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.user_id,
    p.bio,
    p.experience_years,
    p.average_rating,
    p.total_reviews,
    p.is_verified,
    p.available_dates
  FROM public.photographers p
  WHERE p.visible_in_search = true
    AND event_date = ANY(p.available_dates)
    AND (search_zip IS NULL OR p.zip_code = search_zip);
END;
$$ LANGUAGE plpgsql STABLE;

-- Grant execute permission on functions
GRANT EXECUTE ON FUNCTION is_photographer_available(DATE[], DATE) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_available_photographers(DATE, TEXT) TO authenticated, anon;

-- Update RLS policies to include visible_in_search
DROP POLICY IF EXISTS "Anyone can view public photographers" ON public.photographers;

CREATE POLICY "Anyone can view searchable photographers" ON public.photographers
    FOR SELECT USING (visible_in_search = true);

-- Backfill: Add sample availability dates for existing photographers (next 90 days)
-- This ensures photographers are immediately visible in search
DO $$
DECLARE
  photographer_record RECORD;
  random_dates DATE[];
  i INTEGER;
  random_date DATE;
BEGIN
  FOR photographer_record IN
    SELECT id FROM public.photographers WHERE is_public = true
  LOOP
    random_dates := ARRAY[]::DATE[];

    -- Add 5-10 random dates in the next 90 days
    FOR i IN 1..(5 + floor(random() * 6)::INTEGER) LOOP
      random_date := CURRENT_DATE + (floor(random() * 90)::INTEGER || ' days')::INTERVAL;

      -- Avoid duplicates
      IF NOT (random_date = ANY(random_dates)) THEN
        random_dates := array_append(random_dates, random_date);
      END IF;
    END LOOP;

    -- Update photographer with sample dates
    UPDATE public.photographers
    SET available_dates = random_dates
    WHERE id = photographer_record.id;
  END LOOP;
END $$;

-- Add comment explaining the visible_in_search computed column
COMMENT ON COLUMN public.photographers.visible_in_search IS
'Computed column: true when photographer is public AND has at least one available date. Used for search filtering.';

COMMENT ON COLUMN public.photographers.available_dates IS
'Array of dates when photographer is available for bookings. Photographers can add/remove dates via the availability calendar.';
```

## Step 3: Paste and Run

1. Paste the SQL into the Supabase SQL Editor
2. Click the **RUN** button
3. Wait for "Success. No rows returned"

## Step 4: Verify

After running, execute this query to verify:

```sql
SELECT
  count(*) as total_photographers,
  count(available_dates) as photographers_with_dates
FROM photographers;
```

You should see photographers now have availability dates!

## ✅ What This Migration Does

- ✅ Adds `available_dates` column (DATE array)
- ✅ Adds `visible_in_search` computed column
- ✅ Creates indexes for fast searching
- ✅ Creates helper functions
- ✅ Updates security policies
- ✅ Backfills sample dates for existing photographers

## 🎯 After Migration

Once successful:
1. ✅ Dependencies already installed
2. ✅ Database migration complete
3. 🔄 **Next: Restart dev server** → `npm run dev`
4. 🧪 **Then: Start testing!**

---

**Status**: Ready to run! Just copy/paste the SQL above into Supabase Dashboard.
