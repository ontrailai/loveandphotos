-- Test restoration of first few photographer records

INSERT INTO photographer_preview_profiles (
  display_name, contact_email, contact_phone, bio, specialties,
  languages, years_experience, hourly_rate, location_city, location_state,
  is_available, is_verified, average_rating, total_reviews, total_bookings,
  portfolio_images
) VALUES
(
  'Bri Degraeve',
  'bridegraeve@gmail.com',
  '19136451336',
  'Professional Wedding Photography and Portrait Photography services in Kansas City, Kansas. Available for weddings, events, and special occasions.',
  ARRAY['Wedding Photography', 'Portrait Photography', 'Event Photography'],
  ARRAY['English'],
  4,
  150,
  'Kansas City',
  'Kansas',
  true,
  true,
  4.6,
  15,
  56,
  ARRAY['https://images.unsplash.com/photo-1606216794074-735e91aa2c92', 'https://images.unsplash.com/photo-1591604466107-ec97de577aff', 'https://images.unsplash.com/photo-1519741497674-611481863552', 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc']
),
(
  'Alexa Kelson',
  'alexakelson03@gmail.com',
  '12056410656',
  'Professional Wedding Photography and Portrait Photography services in Florence, Alabama. Available for weddings, events, and special occasions.',
  ARRAY['Wedding Photography', 'Portrait Photography', 'Event Photography'],
  ARRAY['English'],
  2,
  100,
  'Florence',
  'Alabama',
  true,
  true,
  4,
  19,
  50,
  ARRAY['https://images.unsplash.com/photo-1537633552985-df8429e8048b', 'https://images.unsplash.com/photo-1519741497674-611481863552', 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6']
),
(
  'Raylynn Marlow',
  'janelmarlow123@gmail.com',
  '14794400007',
  'Professional Wedding Photography and Portrait Photography services in Clarksville, Arkansas. Available for weddings, events, and special occasions.',
  ARRAY['Wedding Photography', 'Portrait Photography', 'Event Photography'],
  ARRAY['English'],
  4,
  150,
  'Clarksville',
  'Arkansas',
  true,
  true,
  4.6,
  11,
  27,
  ARRAY['https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6', 'https://images.unsplash.com/photo-1537633552985-df8429e8048b', 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc', 'https://images.unsplash.com/photo-1519741497674-611481863552']
)
ON CONFLICT (contact_email) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  updated_at = NOW();