-- Inverse Availability Model Migration
-- Refactors availability system from "available dates" to "unavailable dates" (blocked dates)
-- ALL future dates are available by default unless explicitly marked as unavailable
-- Created: 2025-10-03

-- Step 1: Rename existing available_dates to unavailable_dates
-- This preserves existing data while inverting the logic
ALTER TABLE public.photographers
RENAME COLUMN available_dates TO unavailable_dates;

-- Update the index to match new column name
DROP INDEX IF EXISTS idx_photographers_available_dates;
CREATE INDEX IF NOT EXISTS idx_photographers_unavailable_dates
ON public.photographers USING GIN(unavailable_dates);

-- Step 2: Drop dependent policy before modifying visible_in_search column
DROP POLICY IF EXISTS "Anyone can view searchable photographers" ON public.photographers;

-- Step 3: Update visible_in_search computed column
-- Remove dependency on having dates - photographers are visible if public
ALTER TABLE public.photographers
DROP COLUMN IF EXISTS visible_in_search;

ALTER TABLE public.photographers
ADD COLUMN visible_in_search BOOLEAN GENERATED ALWAYS AS (
  is_public = true
) STORED;

-- Recreate index for visible_in_search
DROP INDEX IF EXISTS idx_photographers_visible_in_search;
CREATE INDEX IF NOT EXISTS idx_photographers_visible_in_search
ON public.photographers(visible_in_search) WHERE visible_in_search = true;

-- Recreate the policy with same logic
CREATE POLICY "Anyone can view searchable photographers" ON public.photographers
    FOR SELECT USING (visible_in_search = true);

-- Step 4: Clear all unavailable dates (reset to fully available calendars)
-- Since we're inverting the model, we start fresh with all photographers fully available
UPDATE public.photographers
SET unavailable_dates = ARRAY[]::DATE[]
WHERE unavailable_dates IS NOT NULL;

-- Step 5: Update/Replace helper functions for inverse logic

-- Function to check if photographer is unavailable on a specific date (inverse of previous logic)
DROP FUNCTION IF EXISTS is_photographer_available(DATE[], DATE);

CREATE OR REPLACE FUNCTION is_photographer_unavailable(
  photographer_unavailable_dates DATE[],
  check_date DATE
) RETURNS BOOLEAN AS $$
BEGIN
  RETURN check_date = ANY(photographer_unavailable_dates);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to get photographers available on a specific date (inverse logic)
-- Now returns photographers who DON'T have the date in their unavailable_dates array
DROP FUNCTION IF EXISTS get_available_photographers(DATE, TEXT);

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
  unavailable_dates DATE[]
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
    p.unavailable_dates
  FROM public.photographers p
  WHERE p.visible_in_search = true
    AND NOT (event_date = ANY(COALESCE(p.unavailable_dates, ARRAY[]::DATE[])))
    AND (search_zip IS NULL OR p.zip_code = search_zip);
END;
$$ LANGUAGE plpgsql STABLE;

-- Grant execute permission on new functions
GRANT EXECUTE ON FUNCTION is_photographer_unavailable(DATE[], DATE) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_available_photographers(DATE, TEXT) TO authenticated, anon;

-- Step 6: Update column comments for clarity
COMMENT ON COLUMN public.photographers.visible_in_search IS
'Computed column: true when photographer profile is public. All public photographers appear in search regardless of availability dates.';

COMMENT ON COLUMN public.photographers.unavailable_dates IS
'Array of dates when photographer is NOT available (blocked dates). All other future dates are available by default. Photographers manage blocked dates via the availability calendar.';
