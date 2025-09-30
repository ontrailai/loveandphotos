-- Create booking_amendments table for tracking booking modifications
-- Stores differential changes when clients add hours or add-ons to existing bookings

CREATE TABLE IF NOT EXISTS booking_amendments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  amendment_type TEXT DEFAULT 'add_hours_and_addons' CHECK (amendment_type IN ('add_hours_and_addons', 'add_hours', 'add_addons')),
  hours_added NUMERIC DEFAULT 0 CHECK (hours_added >= 0),
  add_ons_added JSONB DEFAULT '[]',
  add_ons_removed JSONB DEFAULT '[]',
  price_differential NUMERIC NOT NULL CHECK (price_differential >= 0),
  late_fee NUMERIC DEFAULT 0 CHECK (late_fee >= 0),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed')),
  stripe_payment_intent_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Create index on booking_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_booking_amendments_booking_id
  ON booking_amendments(booking_id);

-- Create index on payment_status for filtering
CREATE INDEX IF NOT EXISTS idx_booking_amendments_payment_status
  ON booking_amendments(payment_status);

-- Create index on created_at for chronological ordering
CREATE INDEX IF NOT EXISTS idx_booking_amendments_created_at
  ON booking_amendments(created_at DESC);

-- Enable Row Level Security
ALTER TABLE booking_amendments ENABLE ROW LEVEL SECURITY;

-- Policy: Customers can manage amendments for their own bookings
CREATE POLICY "Customers can manage own booking amendments"
  ON booking_amendments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.id = booking_id AND b.customer_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.id = booking_id AND b.customer_id = auth.uid()
    )
  );

-- Policy: Photographers can view amendments for their bookings
CREATE POLICY "Photographers can view booking amendments"
  ON booking_amendments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bookings b
      INNER JOIN photographers p ON p.id = b.photographer_id
      WHERE b.id = booking_id AND p.user_id = auth.uid()
    )
  );

-- Create function to update completed_at when payment_status changes to 'paid'
CREATE OR REPLACE FUNCTION update_amendment_completed_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.payment_status = 'paid' AND OLD.payment_status != 'paid' THEN
    NEW.completed_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for completed_at
CREATE TRIGGER booking_amendments_completed_at
  BEFORE UPDATE ON booking_amendments
  FOR EACH ROW
  EXECUTE FUNCTION update_amendment_completed_at();