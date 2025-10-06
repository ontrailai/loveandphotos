-- Migration: Enforce photographer blocked dates validation
-- Ensures bookings cannot be created on dates when photographer is unavailable
-- Uses inverse availability model (dates NOT in array are available)

-- Create trigger function to validate booking dates
CREATE OR REPLACE FUNCTION validate_booking_date()
RETURNS TRIGGER AS $$
DECLARE
  photographer_unavailable_dates DATE[];
BEGIN
  -- Fetch photographer's unavailable dates
  SELECT unavailable_dates INTO photographer_unavailable_dates
  FROM public.photographers
  WHERE id = NEW.photographer_id;

  -- Check if booking date is in unavailable dates array
  IF is_photographer_unavailable(photographer_unavailable_dates, NEW.event_date) THEN
    RAISE EXCEPTION 'Cannot create booking: photographer is not available on %', NEW.event_date;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to validate booking dates on INSERT and UPDATE
DROP TRIGGER IF EXISTS validate_booking_date_trigger ON public.bookings;
CREATE TRIGGER validate_booking_date_trigger
  BEFORE INSERT OR UPDATE OF event_date, photographer_id ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION validate_booking_date();

-- Add comment explaining the trigger
COMMENT ON TRIGGER validate_booking_date_trigger ON public.bookings IS
  'Prevents bookings on dates marked as unavailable by the photographer. Uses inverse availability model where all dates are available unless explicitly blocked.';

-- Create index to optimize constraint validation
CREATE INDEX IF NOT EXISTS idx_bookings_photographer_event_date
  ON public.bookings(photographer_id, event_date);

COMMENT ON INDEX idx_bookings_photographer_event_date IS
  'Optimizes validation of photographer unavailability when creating bookings';
