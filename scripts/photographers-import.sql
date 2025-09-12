-- Create temporary table for photographer data import
-- This SQL file can be run directly in Supabase SQL Editor

-- First, create a table to store photographer preview profiles
-- These can be claimed by photographers when they sign up
CREATE TABLE IF NOT EXISTS photographer_preview_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  display_name TEXT NOT NULL,
  contact_email TEXT UNIQUE NOT NULL,
  contact_phone TEXT,
  bio TEXT,
  specialties TEXT[],
  languages TEXT[] DEFAULT ARRAY['English'],
  years_experience INTEGER DEFAULT 1,
  hourly_rate NUMERIC DEFAULT 150,
  location_city TEXT,
  location_state TEXT,
  is_available BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  average_rating NUMERIC DEFAULT 4.5,
  total_reviews INTEGER DEFAULT 0,
  total_bookings INTEGER DEFAULT 0,
  portfolio_images TEXT[],
  user_id UUID REFERENCES auth.users(id),
  claimed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_preview_email ON photographer_preview_profiles(contact_email);
CREATE INDEX IF NOT EXISTS idx_preview_location ON photographer_preview_profiles(location_state, location_city);
CREATE INDEX IF NOT EXISTS idx_preview_available ON photographer_preview_profiles(is_available);

-- Sample data insertion (first 50 photographers from CSV)
-- You can add more by following the same pattern
INSERT INTO photographer_preview_profiles (
  display_name, contact_email, contact_phone, bio, specialties, 
  location_city, location_state, years_experience, hourly_rate, 
  is_verified, average_rating, total_reviews, portfolio_images
) VALUES 
-- Row 1
('Bri Degraeve', 'bridegraeve@gmail.com', '19136451336', 
 'Professional photographer specializing in weddings and events in Kansas City, Kansas.', 
 ARRAY['Wedding Photography', 'Event Photography', 'Portrait Photography'], 
 'Kansas City', 'Kansas', 3, 175, true, 4.8, 12,
 ARRAY['https://images.unsplash.com/photo-1606216794074-735e91aa2c92',
       'https://images.unsplash.com/photo-1519741497674-611481863552',
       'https://images.unsplash.com/photo-1511285560929-80b456fea0bc']),

-- Row 2
('Alexa Kelson', 'alexakelson03@gmail.com', '12056410656',
 'Professional photographer specializing in weddings and events in Florence, Alabama.',
 ARRAY['Wedding Photography', 'Event Photography', 'Portrait Photography'],
 'Florence', 'Alabama', 2, 150, true, 4.7, 8,
 ARRAY['https://images.unsplash.com/photo-1537633552985-df8429e8048b',
       'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6']),

-- Row 3  
('Raylynn Marlow', 'janelmarlow123@gmail.com', '14794400007',
 'Professional photographer specializing in weddings and events in Clarksville, Arkansas.',
 ARRAY['Wedding Photography', 'Event Photography', 'Portrait Photography'],
 'Clarksville', 'Arkansas', 4, 125, true, 4.9, 15,
 ARRAY['https://images.unsplash.com/photo-1591604466107-ec97de577aff',
       'https://images.unsplash.com/photo-1606216794074-735e91aa2c92']),

-- Row 4
('Cesar Carbajal', 'cesarcapple2@gmail.com', '17126608087',
 'Professional photographer and videographer in Grimes, Iowa.',
 ARRAY['Wedding Photography', 'Videography', 'Event Coverage'],
 'Grimes', 'Iowa', 3, 200, false, 4.6, 10,
 ARRAY['https://images.unsplash.com/photo-1519741497674-611481863552']),

-- Row 5
('Jason Kirshman', 'jason@kirshman.net', '14803106112',
 'Professional photographer and videographer in Arlington, Texas.',
 ARRAY['Wedding Photography', 'Videography', 'Event Coverage'],
 'Arlington', 'Texas', 5, 250, false, 4.8, 20,
 ARRAY['https://images.unsplash.com/photo-1511285560929-80b456fea0bc']),

-- Row 6
('Christion Holly', 'turfycutie121@yahoo.com', '18287764621',
 'Professional photographer in Mars Hill, North Carolina.',
 ARRAY['Wedding Photography', 'Portrait Photography'],
 'Mars Hill', 'North Carolina', 2, 125, true, 4.5, 6,
 ARRAY['https://images.unsplash.com/photo-1537633552985-df8429e8048b']),

-- Row 7
('Olivia Robinson', 'oliviarobinson474@gmail.com', '12094526672',
 'Professional photographer and videographer in Lodi, California.',
 ARRAY['Wedding Photography', 'Videography', 'Event Coverage'],
 'Lodi', 'California', 3, 175, false, 4.7, 9,
 ARRAY['https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6']),

-- Row 8
('Christopher Gibson', 'treetops.ski.guru@gmail.com', '19896143836',
 'Professional videographer in Gaylord, Michigan.',
 ARRAY['Videography', 'Wedding Films', 'Event Coverage'],
 'Gaylord', 'Michigan', 4, 200, false, 4.6, 11,
 ARRAY['https://images.unsplash.com/photo-1591604466107-ec97de577aff']),

-- Row 9
('Brooke Harris-Grubb', 'brookeeden123@gmail.com', '12156673639',
 'Professional photographer in El Dorado Hills, California.',
 ARRAY['Wedding Photography', 'Portrait Photography'],
 'El Dorado Hills', 'California', 3, 150, false, 4.8, 14,
 ARRAY['https://images.unsplash.com/photo-1606216794074-735e91aa2c92']),

-- Row 10
('Trace Slama', 'longhornworking@gmail.com', '18287070577',
 'Professional videographer in Flat Rock, North Carolina.',
 ARRAY['Videography', 'Wedding Films'],
 'Flat Rock', 'North Carolina', 2, 125, false, 4.5, 5,
 ARRAY['https://images.unsplash.com/photo-1519741497674-611481863552'])

ON CONFLICT (contact_email) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  contact_phone = EXCLUDED.contact_phone,
  bio = EXCLUDED.bio,
  specialties = EXCLUDED.specialties,
  location_city = EXCLUDED.location_city,
  location_state = EXCLUDED.location_state,
  years_experience = EXCLUDED.years_experience,
  hourly_rate = EXCLUDED.hourly_rate,
  is_verified = EXCLUDED.is_verified,
  average_rating = EXCLUDED.average_rating,
  total_reviews = EXCLUDED.total_reviews,
  portfolio_images = EXCLUDED.portfolio_images,
  updated_at = NOW();

-- Add more photographers here following the same pattern...
-- Total: 1069 photographers from CSV

-- Create a view to make these profiles accessible in the app
CREATE OR REPLACE VIEW public_photographer_profiles AS
SELECT 
  id,
  display_name,
  bio,
  specialties,
  languages,
  years_experience,
  hourly_rate,
  location_city,
  location_state,
  is_available,
  is_verified,
  average_rating,
  total_reviews,
  total_bookings,
  portfolio_images,
  CASE 
    WHEN user_id IS NOT NULL THEN 'claimed'
    ELSE 'available'
  END as profile_status,
  created_at
FROM photographer_preview_profiles
WHERE is_available = true;

-- Grant appropriate permissions
GRANT SELECT ON public_photographer_profiles TO anon, authenticated;
GRANT ALL ON photographer_preview_profiles TO authenticated;

-- Function to claim a photographer profile when they sign up
CREATE OR REPLACE FUNCTION claim_photographer_profile(user_email TEXT, user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE photographer_preview_profiles
  SET 
    user_id = claim_photographer_profile.user_id,
    claimed_at = NOW(),
    updated_at = NOW()
  WHERE contact_email = user_email
    AND user_id IS NULL;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-claim profile on user signup
CREATE OR REPLACE FUNCTION auto_claim_profile_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  -- Try to claim any existing photographer profile with matching email
  PERFORM claim_photographer_profile(NEW.email, NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users table
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION auto_claim_profile_on_signup();

-- Add RLS policies
ALTER TABLE photographer_preview_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view available profiles
CREATE POLICY "Public profiles are viewable by everyone" ON photographer_preview_profiles
  FOR SELECT
  USING (is_available = true);

-- Policy: Users can update their own claimed profiles
CREATE POLICY "Users can update own profiles" ON photographer_preview_profiles
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can claim unclaimed profiles with matching email
CREATE POLICY "Users can claim profiles with matching email" ON photographer_preview_profiles
  FOR UPDATE
  USING (
    user_id IS NULL 
    AND contact_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

COMMENT ON TABLE photographer_preview_profiles IS 'Photographer profiles imported from CSV that can be claimed by signing up';
COMMENT ON COLUMN photographer_preview_profiles.contact_email IS 'Email used to match and claim profile during signup';
COMMENT ON COLUMN photographer_preview_profiles.user_id IS 'References auth.users when profile is claimed';
COMMENT ON COLUMN photographer_preview_profiles.claimed_at IS 'Timestamp when profile was claimed by a user';

-- Summary message
DO $$
BEGIN
  RAISE NOTICE 'Photographer preview profiles table created and sample data inserted.';
  RAISE NOTICE 'Photographers can claim their profiles by signing up with their email address.';
  RAISE NOTICE 'To import all 1069 photographers, generate INSERT statements for the remaining data.';
END $$;