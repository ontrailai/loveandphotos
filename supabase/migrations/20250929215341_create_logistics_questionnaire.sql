-- Create logistics questionnaire table for pre-wedding T-60 logistics
-- One row per booking, stores client logistics information as JSONB

CREATE TABLE IF NOT EXISTS logistics_questionnaire (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'submitted')),
  answers JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on booking_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_logistics_questionnaire_booking_id
  ON logistics_questionnaire(booking_id);

-- Create index on user_id for RLS performance
CREATE INDEX IF NOT EXISTS idx_logistics_questionnaire_user_id
  ON logistics_questionnaire(user_id);

-- Enable Row Level Security
ALTER TABLE logistics_questionnaire ENABLE ROW LEVEL SECURITY;

-- Policy: Customers can manage their own logistics
CREATE POLICY "Customers can manage own logistics"
  ON logistics_questionnaire FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Photographers can view logistics for their bookings
CREATE POLICY "Photographers can view booking logistics"
  ON logistics_questionnaire FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bookings b
      INNER JOIN photographers p ON p.id = b.photographer_id
      WHERE b.id = booking_id AND p.user_id = auth.uid()
    )
  );

-- Create or replace function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_logistics_questionnaire_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER logistics_questionnaire_updated_at
  BEFORE UPDATE ON logistics_questionnaire
  FOR EACH ROW
  EXECUTE FUNCTION update_logistics_questionnaire_updated_at();