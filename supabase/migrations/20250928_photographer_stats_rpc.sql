-- Migration: Add photographer stats tracking and RPC function
-- Created: 2025-09-28
-- Purpose: Fix missing get_photographer_stats RPC and add required columns

-- Add missing columns to photographers table for stats tracking
ALTER TABLE public.photographers
ADD COLUMN IF NOT EXISTS acceptance_rate DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS avg_response_time_minutes INTEGER,
ADD COLUMN IF NOT EXISTS has_minimum_data BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS manual_override_acceptance_rate DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS manual_override_response_time INTEGER;

-- Add indexes for better performance on stats queries
CREATE INDEX IF NOT EXISTS idx_photographers_acceptance_rate ON public.photographers(acceptance_rate) WHERE acceptance_rate IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_photographers_response_time ON public.photographers(avg_response_time_minutes) WHERE avg_response_time_minutes IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_photographers_has_min_data ON public.photographers(has_minimum_data);

-- Create the get_photographer_stats RPC function
-- This function calculates photographer statistics with business logic for minimum data thresholds
CREATE OR REPLACE FUNCTION public.get_photographer_stats(photographer_user_id UUID)
RETURNS TABLE (
  has_enough_data BOOLEAN,
  acceptance_rate DECIMAL,
  accepted_offers INTEGER,
  total_offers INTEGER,
  avg_response_time_hours DECIMAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  photographer_rec RECORD;
  booking_stats RECORD;
  min_bookings INTEGER := 5; -- Minimum bookings for reliable stats
BEGIN
  -- Get photographer record
  SELECT
    p.*,
    u.id as user_id
  INTO photographer_rec
  FROM public.photographers p
  JOIN public.users u ON u.id = p.user_id
  WHERE u.id = photographer_user_id;

  IF NOT FOUND THEN
    -- Return empty stats for non-existent photographer
    RETURN QUERY SELECT FALSE, 0::DECIMAL, 0, 0, 0::DECIMAL;
    RETURN;
  END IF;

  -- Calculate booking statistics from the last 6 months
  SELECT
    COUNT(*) as total_bookings,
    COUNT(*) FILTER (WHERE booking_status IN ('confirmed', 'completed')) as accepted_bookings,
    AVG(EXTRACT(EPOCH FROM (updated_at - created_at))/3600) FILTER (WHERE booking_status IN ('confirmed', 'completed')) as avg_response_hours
  INTO booking_stats
  FROM public.bookings
  WHERE photographer_id = photographer_rec.id
  AND created_at >= CURRENT_DATE - INTERVAL '6 months';

  -- Handle case where there are no bookings
  IF booking_stats.total_bookings IS NULL THEN
    booking_stats.total_bookings := 0;
    booking_stats.accepted_bookings := 0;
    booking_stats.avg_response_hours := NULL;
  END IF;

  -- Determine if we have enough data for reliable stats
  IF booking_stats.total_bookings >= min_bookings THEN
    RETURN QUERY SELECT
      TRUE as has_enough_data,
      COALESCE(
        photographer_rec.manual_override_acceptance_rate,
        CASE
          WHEN booking_stats.total_bookings > 0 THEN
            (booking_stats.accepted_bookings::DECIMAL / booking_stats.total_bookings * 100)::DECIMAL(5,2)
          ELSE 0::DECIMAL(5,2)
        END
      ) as acceptance_rate,
      COALESCE(booking_stats.accepted_bookings, 0) as accepted_offers,
      COALESCE(booking_stats.total_bookings, 0) as total_offers,
      COALESCE(
        photographer_rec.manual_override_response_time::DECIMAL / 60, -- Convert minutes to hours
        COALESCE(booking_stats.avg_response_hours, photographer_rec.response_time_hours::DECIMAL),
        24::DECIMAL -- Default to 24 hours if no data
      ) as avg_response_time_hours;
  ELSE
    -- Not enough data for reliable stats
    RETURN QUERY SELECT
      FALSE as has_enough_data,
      COALESCE(photographer_rec.manual_override_acceptance_rate, 0::DECIMAL) as acceptance_rate,
      COALESCE(booking_stats.accepted_bookings, 0) as accepted_offers,
      COALESCE(booking_stats.total_bookings, 0) as total_offers,
      COALESCE(
        photographer_rec.manual_override_response_time::DECIMAL / 60,
        photographer_rec.response_time_hours::DECIMAL,
        24::DECIMAL
      ) as avg_response_time_hours;
  END IF;
END;
$$;

-- Grant execute permission to anon and authenticated users
GRANT EXECUTE ON FUNCTION public.get_photographer_stats(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.get_photographer_stats(UUID) TO authenticated;

-- Create a trigger function to automatically update has_minimum_data
CREATE OR REPLACE FUNCTION public.update_photographer_minimum_data()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  booking_count INTEGER;
BEGIN
  -- Count bookings for this photographer in the last 6 months
  SELECT COUNT(*)
  INTO booking_count
  FROM public.bookings
  WHERE photographer_id = NEW.id
  AND created_at >= CURRENT_DATE - INTERVAL '6 months';

  -- Update has_minimum_data based on booking count
  NEW.has_minimum_data := booking_count >= 5;

  RETURN NEW;
END;
$$;

-- Create trigger to automatically update has_minimum_data when bookings change
DROP TRIGGER IF EXISTS trigger_update_photographer_minimum_data ON public.photographers;
CREATE TRIGGER trigger_update_photographer_minimum_data
  BEFORE INSERT OR UPDATE ON public.photographers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_photographer_minimum_data();

-- Create a function to batch update all photographer stats
-- This can be called periodically to keep cached stats up to date
CREATE OR REPLACE FUNCTION public.refresh_photographer_stats()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  photographer_record RECORD;
  booking_stats RECORD;
  updated_count INTEGER := 0;
BEGIN
  -- Iterate through all photographers
  FOR photographer_record IN
    SELECT id, user_id FROM public.photographers
  LOOP
    -- Calculate stats for this photographer
    SELECT
      COUNT(*) as total_bookings,
      COUNT(*) FILTER (WHERE booking_status IN ('confirmed', 'completed')) as accepted_bookings,
      AVG(EXTRACT(EPOCH FROM (updated_at - created_at))/60) FILTER (WHERE booking_status IN ('confirmed', 'completed')) as avg_response_minutes
    INTO booking_stats
    FROM public.bookings
    WHERE photographer_id = photographer_record.id
    AND created_at >= CURRENT_DATE - INTERVAL '6 months';

    -- Update photographer stats (only if not manually overridden)
    UPDATE public.photographers
    SET
      acceptance_rate = CASE
        WHEN manual_override_acceptance_rate IS NULL AND booking_stats.total_bookings > 0 THEN
          (booking_stats.accepted_bookings::DECIMAL / booking_stats.total_bookings * 100)::DECIMAL(5,2)
        ELSE acceptance_rate
      END,
      avg_response_time_minutes = CASE
        WHEN manual_override_response_time IS NULL AND booking_stats.avg_response_minutes IS NOT NULL THEN
          booking_stats.avg_response_minutes::INTEGER
        ELSE avg_response_time_minutes
      END,
      has_minimum_data = booking_stats.total_bookings >= 5
    WHERE id = photographer_record.id;

    updated_count := updated_count + 1;
  END LOOP;

  RETURN updated_count;
END;
$$;

-- Grant execute permission for the refresh function (admin only)
GRANT EXECUTE ON FUNCTION public.refresh_photographer_stats() TO authenticated;

-- Add helpful comments
COMMENT ON FUNCTION public.get_photographer_stats(UUID) IS 'Returns photographer statistics including acceptance rate and response time with minimum data thresholds';
COMMENT ON FUNCTION public.refresh_photographer_stats() IS 'Batch updates cached photographer statistics for all photographers';
COMMENT ON COLUMN public.photographers.acceptance_rate IS 'Cached acceptance rate percentage (0-100)';
COMMENT ON COLUMN public.photographers.avg_response_time_minutes IS 'Cached average response time in minutes';
COMMENT ON COLUMN public.photographers.has_minimum_data IS 'Whether photographer has enough bookings (5+) for reliable stats';
COMMENT ON COLUMN public.photographers.manual_override_acceptance_rate IS 'Manual override for acceptance rate (overrides calculated value)';
COMMENT ON COLUMN public.photographers.manual_override_response_time IS 'Manual override for response time in minutes';

-- Create a view for easy access to photographer stats
CREATE OR REPLACE VIEW public.photographer_stats_view AS
SELECT
  p.id,
  p.user_id,
  u.email,
  u.full_name,
  p.has_minimum_data,
  COALESCE(p.manual_override_acceptance_rate, p.acceptance_rate) as effective_acceptance_rate,
  COALESCE(p.manual_override_response_time, p.avg_response_time_minutes) as effective_response_time_minutes,
  p.acceptance_rate as calculated_acceptance_rate,
  p.avg_response_time_minutes as calculated_response_time,
  p.manual_override_acceptance_rate,
  p.manual_override_response_time,
  p.response_time_hours as legacy_response_time_hours
FROM public.photographers p
JOIN public.users u ON u.id = p.user_id;

-- Grant access to the view
GRANT SELECT ON public.photographer_stats_view TO anon;
GRANT SELECT ON public.photographer_stats_view TO authenticated;

COMMENT ON VIEW public.photographer_stats_view IS 'Comprehensive view of photographer statistics with effective values (manual overrides take precedence)';

-- Log successful migration
INSERT INTO public.migrations_log (migration_name, executed_at, description)
VALUES (
  '20250928_photographer_stats_rpc',
  NOW(),
  'Added photographer stats columns and get_photographer_stats RPC function'
) ON CONFLICT (migration_name) DO NOTHING;