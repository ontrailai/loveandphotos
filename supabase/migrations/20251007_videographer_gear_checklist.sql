-- Migration: Add Videographer Gear Checklist Fields
-- Description: Adds boolean fields to photographers table for videographer gear tracking
-- Date: 2025-10-07
-- Purpose: Enable videographers to showcase their equipment instead of portfolio images

-- Add gear checklist boolean columns to photographers table
ALTER TABLE photographers
  ADD COLUMN IF NOT EXISTS gear_has_camera BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS gear_has_lenses BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS gear_has_tripod BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS gear_has_gimbal BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS gear_has_drone BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS gear_has_audio_recorder BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS gear_has_lighting BOOLEAN DEFAULT FALSE;

-- Add index for querying videographers specifically
CREATE INDEX IF NOT EXISTS idx_photographers_is_videographer
  ON photographers(is_videographer)
  WHERE is_videographer = TRUE;

-- Add index for gear filtering (useful for future search features)
CREATE INDEX IF NOT EXISTS idx_photographers_gear
  ON photographers(gear_has_camera, gear_has_drone, gear_has_gimbal)
  WHERE is_videographer = TRUE;

-- Add comments for documentation
COMMENT ON COLUMN photographers.gear_has_camera IS 'Videographer owns professional camera(s) - used in gear checklist';
COMMENT ON COLUMN photographers.gear_has_lenses IS 'Videographer owns professional lenses - used in gear checklist';
COMMENT ON COLUMN photographers.gear_has_tripod IS 'Videographer owns tripod - used in gear checklist';
COMMENT ON COLUMN photographers.gear_has_gimbal IS 'Videographer owns gimbal/stabilizer - used in gear checklist';
COMMENT ON COLUMN photographers.gear_has_drone IS 'Videographer owns drone - used in gear checklist';
COMMENT ON COLUMN photographers.gear_has_audio_recorder IS 'Videographer owns professional audio equipment - used in gear checklist';
COMMENT ON COLUMN photographers.gear_has_lighting IS 'Videographer owns lighting gear - used in gear checklist';

-- Update RLS policies to allow videographers to update their own gear fields
-- (photographers table should already have policies allowing users to update their own profiles)

-- Verify existing policies allow gear field updates
DO $$
BEGIN
  -- This is a verification check - policies should already exist
  -- If not, they will be added in a future migration
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'photographers'
    AND policyname LIKE '%update%own%'
  ) THEN
    RAISE NOTICE 'Warning: No update policy found for photographers table. Users may not be able to update gear fields.';
  END IF;
END $$;
