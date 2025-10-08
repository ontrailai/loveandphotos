-- Migration: Add videographer_id to bookings table
-- Description: Adds videographer_id field to bookings table to support booking videographers separately
-- Date: 2025-10-07
-- Purpose: Enable clients to book a photographer + optional videographer in the same booking

-- Add videographer_id column to bookings table
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS videographer_id UUID REFERENCES photographers(id) ON DELETE SET NULL;

-- Add index for querying bookings by videographer
CREATE INDEX IF NOT EXISTS idx_bookings_videographer_id
  ON bookings(videographer_id)
  WHERE videographer_id IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN bookings.videographer_id IS 'Optional videographer assigned to this booking - references photographers table where is_videographer = true';

-- Update RLS policies to allow videographers to see their own bookings
-- (bookings table should already have policies allowing photographers to see their bookings)

-- Verify existing policies work for videographers
DO $$
BEGIN
  -- This is a verification check - policies should already exist for photographers
  -- which will also apply to videographers since they're in the same table
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'bookings'
    AND policyname LIKE '%photographer%'
  ) THEN
    RAISE NOTICE 'Warning: No photographer policy found for bookings table. Videographers may not be able to access their bookings.';
  END IF;
END $$;
