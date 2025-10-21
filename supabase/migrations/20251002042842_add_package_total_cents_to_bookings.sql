-- Add package_total_cents column to bookings table
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS package_total_cents INTEGER;

COMMENT ON COLUMN bookings.package_total_cents IS 'Package price in cents for compute.js calculations';
