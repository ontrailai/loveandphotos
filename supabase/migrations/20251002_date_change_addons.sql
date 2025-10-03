-- Migration: Add Date Change Add-On Fields to Bookings Table
-- Created: 2025-10-02
-- Purpose: Support $50 booking flow add-on and $495 post-booking date change feature

-- Add new columns to bookings table
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS can_change_date BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS date_change_used BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS date_change_method TEXT CHECK (date_change_method IN ('included', 'post-booking-add-on'));

-- Add helpful comments for database documentation
COMMENT ON COLUMN bookings.can_change_date IS 'Whether customer has permission to change shoot date (purchased $50 add-on or paid $495)';
COMMENT ON COLUMN bookings.date_change_used IS 'Whether the one-time date change has already been used';
COMMENT ON COLUMN bookings.date_change_method IS 'How date change permission was obtained: included ($50 at booking) or post-booking-add-on ($495 later)';

-- Create index for querying bookings with date change permissions
CREATE INDEX IF NOT EXISTS idx_bookings_date_change
ON bookings(can_change_date, date_change_used)
WHERE can_change_date = true;
