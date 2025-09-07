-- Run this in your Supabase SQL editor to create test users and data

-- Test Customer Account
-- Email: customer@test.com
-- Password: Test123456!

-- Test Photographer Account  
-- Email: photographer@test.com
-- Password: Test123456!

-- Create test users (run in Supabase Dashboard SQL editor)
-- Note: You'll need to create these through your app's signup flow
-- or use Supabase Auth Admin API

-- After creating users through signup, run this to set up test data:

-- Insert test photographer profile
INSERT INTO photographers (
  id,
  user_id,
  bio,
  experience_years,
  equipment_list,
  specialties,
  languages,
  service_area_zip_codes,
  pay_tier_id,
  average_rating,
  total_reviews,
  is_verified,
  is_public,
  onboarding_completed
) VALUES (
  gen_random_uuid(),
  (SELECT id FROM auth.users WHERE email = 'photographer@test.com'),
  'Professional wedding photographer with 5 years of experience',
  5,
  ARRAY['Canon R5', 'Various L-series lenses', 'Profoto lighting'],
  ARRAY['Wedding', 'Portrait', 'Event'],
  ARRAY['English', 'Spanish'],
  ARRAY['10001', '10002', '10003'],
  1, -- Bronze tier
  4.8,
  25,
  true,
  true,
  true
);

-- Insert test packages
INSERT INTO packages (
  title,
  description,
  base_price,
  duration_minutes,
  includes,
  deliverables,
  is_active
) VALUES 
(
  'Essential Package',
  '2 hours of photography coverage',
  500.00,
  120,
  ARRAY['Pre-event consultation', 'Professional editing', 'Online gallery'],
  ARRAY['50-75 edited photos', 'Digital delivery within 2 weeks'],
  true
),
(
  'Premium Package',
  '4 hours of photography coverage',
  1200.00,
  240,
  ARRAY['Pre-event consultation', 'Professional editing', 'Online gallery', 'Second shooter'],
  ARRAY['150-200 edited photos', 'Digital delivery within 2 weeks', 'Print rights'],
  true
),
(
  'Luxury Package',
  'Full day coverage',
  2500.00,
  480,
  ARRAY['Pre-event consultation', 'Professional editing', 'Online gallery', 'Second shooter', 'Album'],
  ARRAY['300+ edited photos', 'Digital delivery within 2 weeks', 'Premium album', 'Print rights'],
  true
);

-- Insert test booking (if you have both users created)
INSERT INTO bookings (
  customer_id,
  photographer_id,
  package_id,
  event_date,
  event_time,
  event_type,
  venue_name,
  venue_address,
  guest_count,
  total_amount,
  payment_status,
  booking_status,
  special_requests
) VALUES (
  (SELECT id FROM auth.users WHERE email = 'customer@test.com'),
  (SELECT id FROM photographers WHERE is_public = true LIMIT 1),
  (SELECT id FROM packages WHERE title = 'Premium Package'),
  CURRENT_DATE + INTERVAL '30 days',
  '14:00',
  'Wedding',
  'Grand Ballroom',
  '{"street": "123 Main St", "city": "New York", "state": "NY", "zip": "10001"}'::jsonb,
  150,
  1200.00,
  'pending',
  'pending',
  'Please focus on candid moments'
);

-- Insert job queue entry for the booking
INSERT INTO job_queue (
  booking_id,
  photographer_id,
  upload_status,
  deadline
) VALUES (
  (SELECT id FROM bookings ORDER BY created_at DESC LIMIT 1),
  (SELECT photographer_id FROM bookings ORDER BY created_at DESC LIMIT 1),
  'pending',
  CURRENT_DATE + INTERVAL '45 days'
);
