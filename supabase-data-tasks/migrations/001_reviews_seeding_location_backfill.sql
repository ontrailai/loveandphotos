-- Migration: Reviews Seeding + Location Backfill
-- This migration adds is_seeded column to reviews table and enforces location data consistency

BEGIN;

-- ==========================================
-- PART 1: Reviews Table Enhancement
-- ==========================================

-- Add is_seeded column to reviews table for transparency
ALTER TABLE reviews
ADD COLUMN IF NOT EXISTS is_seeded BOOLEAN DEFAULT FALSE;

-- Create index for performance when filtering seeded reviews
CREATE INDEX IF NOT EXISTS idx_reviews_is_seeded ON reviews(is_seeded) WHERE is_seeded = TRUE;

-- Add comment for documentation
COMMENT ON COLUMN reviews.is_seeded IS 'Indicates if this review was generated via seeding script for testing/demo purposes';

-- ==========================================
-- PART 2: Location Data Cleaning & Constraints
-- ==========================================

-- Clean existing data in photographer_preview_profiles
UPDATE photographer_preview_profiles
SET
  location_city = TRIM(COALESCE(NULLIF(location_city, ''), 'Unknown')),
  location_state = TRIM(COALESCE(NULLIF(location_state, ''), 'Unknown'))
WHERE
  location_city IS NULL OR location_city = '' OR
  location_state IS NULL OR location_state = '';

-- Set NOT NULL constraints with defaults
ALTER TABLE photographer_preview_profiles
ALTER COLUMN location_city SET DEFAULT 'Unknown',
ALTER COLUMN location_city SET NOT NULL;

ALTER TABLE photographer_preview_profiles
ALTER COLUMN location_state SET DEFAULT 'Unknown',
ALTER COLUMN location_state SET NOT NULL;

-- Add CHECK constraints to prevent empty strings
ALTER TABLE photographer_preview_profiles
ADD CONSTRAINT check_location_city_not_empty
CHECK (location_city != '');

ALTER TABLE photographer_preview_profiles
ADD CONSTRAINT check_location_state_not_empty
CHECK (location_state != '');

-- Add comments for documentation
COMMENT ON COLUMN photographer_preview_profiles.location_city IS 'City location - never null or empty, defaults to Unknown';
COMMENT ON COLUMN photographer_preview_profiles.location_state IS 'State location - never null or empty, defaults to Unknown';

-- ==========================================
-- PART 3: Trigger for Review Count Updates
-- ==========================================

-- Function to update photographer review statistics
CREATE OR REPLACE FUNCTION update_photographer_review_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the photographer's review count and average rating
  UPDATE photographers
  SET
    total_reviews = (
      SELECT COUNT(*)
      FROM reviews
      WHERE photographer_id = COALESCE(NEW.photographer_id, OLD.photographer_id)
    ),
    average_rating = (
      SELECT ROUND(AVG(rating)::numeric, 2)
      FROM reviews
      WHERE photographer_id = COALESCE(NEW.photographer_id, OLD.photographer_id)
    ),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.photographer_id, OLD.photographer_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic review count updates
DROP TRIGGER IF EXISTS trigger_update_photographer_review_stats ON reviews;
CREATE TRIGGER trigger_update_photographer_review_stats
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_photographer_review_stats();

COMMIT;