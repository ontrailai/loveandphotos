-- Create photographer_preview_profiles table for browseable photographer profiles
-- This table stores photographer profiles that customers can browse and book
-- Photographers can claim these profiles by linking their auth.users account

-- First, create the main table
CREATE TABLE IF NOT EXISTS public.photographer_preview_profiles (
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
  is_love_and_photos_choice BOOLEAN DEFAULT false,
  average_rating NUMERIC DEFAULT 4.5,
  total_reviews INTEGER DEFAULT 0,
  total_bookings INTEGER DEFAULT 0,
  portfolio_images TEXT[],
  user_id UUID REFERENCES auth.users(id),
  claimed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_preview_profiles_specialties
ON public.photographer_preview_profiles USING GIN(specialties);

CREATE INDEX IF NOT EXISTS idx_preview_profiles_location
ON public.photographer_preview_profiles(location_city, location_state);

CREATE INDEX IF NOT EXISTS idx_preview_profiles_is_available
ON public.photographer_preview_profiles(is_available)
WHERE is_available = TRUE;

CREATE INDEX IF NOT EXISTS idx_preview_profiles_lnp_choice
ON public.photographer_preview_profiles(is_love_and_photos_choice)
WHERE is_love_and_photos_choice = TRUE;

CREATE INDEX IF NOT EXISTS idx_preview_profiles_email
ON public.photographer_preview_profiles(contact_email);

-- Insert sample photographer data for testing and initial browsing
INSERT INTO public.photographer_preview_profiles (
  display_name, contact_email, contact_phone, bio, specialties,
  location_city, location_state, years_experience, hourly_rate,
  is_verified, is_love_and_photos_choice, average_rating, total_reviews, portfolio_images
) VALUES
-- Row 1 - Love & Photos Choice
('Bri Degraeve', 'bridegraeve@gmail.com', '19136451336',
 'Professional photographer specializing in weddings and events in Kansas City, Kansas. Known for capturing emotional moments with artistic flair.',
 ARRAY['Wedding Photography', 'Event Photography', 'Portrait Photography'],
 'Kansas City', 'Kansas', 5, 200, true, true, 4.9, 25,
 ARRAY['https://images.unsplash.com/photo-1606216794074-735e91aa2c92',
       'https://images.unsplash.com/photo-1519741497674-611481863552',
       'https://images.unsplash.com/photo-1511285560929-80b456fea0bc']),

-- Row 2
('Alexa Kelson', 'alexakelson03@gmail.com', '12056410656',
 'Professional photographer specializing in weddings and events in Florence, Alabama. Creative storytelling through photography.',
 ARRAY['Wedding Photography', 'Event Photography', 'Portrait Photography'],
 'Florence', 'Alabama', 3, 175, true, false, 4.7, 18,
 ARRAY['https://images.unsplash.com/photo-1537633552985-df8429e8048b',
       'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6']),

-- Row 3 - Love & Photos Choice
('Raylynn Marlow', 'janelmarlow123@gmail.com', '14794400007',
 'Professional photographer specializing in weddings and events in Clarksville, Arkansas. Expert in natural light photography.',
 ARRAY['Wedding Photography', 'Event Photography', 'Portrait Photography'],
 'Clarksville', 'Arkansas', 6, 150, true, true, 4.8, 22,
 ARRAY['https://images.unsplash.com/photo-1591604466107-ec97de577aff',
       'https://images.unsplash.com/photo-1606216794074-735e91aa2c92']),

-- Row 4
('Cesar Carbajal', 'cesarcapple2@gmail.com', '17126608087',
 'Professional photographer and videographer in Grimes, Iowa. Specializing in cinematic wedding coverage.',
 ARRAY['Wedding Photography', 'Videography', 'Event Coverage'],
 'Grimes', 'Iowa', 4, 225, true, false, 4.6, 15,
 ARRAY['https://images.unsplash.com/photo-1519741497674-611481863552']),

-- Row 5
('Jason Kirshman', 'jason@kirshman.net', '14803106112',
 'Professional photographer and videographer in Arlington, Texas. Award-winning wedding and event specialist.',
 ARRAY['Wedding Photography', 'Videography', 'Event Coverage'],
 'Arlington', 'Texas', 8, 300, true, false, 4.9, 35,
 ARRAY['https://images.unsplash.com/photo-1511285560929-80b456fea0bc']),

-- Row 6
('Christion Holly', 'turfycutie121@yahoo.com', '18287764621',
 'Professional photographer in Mars Hill, North Carolina. Passionate about capturing authentic moments.',
 ARRAY['Wedding Photography', 'Portrait Photography'],
 'Mars Hill', 'North Carolina', 2, 125, true, false, 4.5, 12,
 ARRAY['https://images.unsplash.com/photo-1537633552985-df8429e8048b']),

-- Row 7 - Love & Photos Choice
('Olivia Robinson', 'oliviarobinson474@gmail.com', '12094526672',
 'Professional photographer and videographer in Lodi, California. Expert in destination weddings.',
 ARRAY['Wedding Photography', 'Videography', 'Event Coverage'],
 'Lodi', 'California', 5, 250, true, true, 4.8, 28,
 ARRAY['https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6']),

-- Row 8
('Christopher Gibson', 'treetops.ski.guru@gmail.com', '19896143836',
 'Professional videographer in Gaylord, Michigan. Cinematic wedding films and event coverage.',
 ARRAY['Videography', 'Wedding Films', 'Event Coverage'],
 'Gaylord', 'Michigan', 6, 275, true, false, 4.7, 20,
 ARRAY['https://images.unsplash.com/photo-1591604466107-ec97de577aff']),

-- Row 9
('Madison Parker', 'madisonparker.photo@gmail.com', '15551234567',
 'Creative wedding photographer based in Austin, Texas. Known for vibrant, joyful imagery.',
 ARRAY['Wedding Photography', 'Engagement Photography', 'Portrait Photography'],
 'Austin', 'Texas', 4, 225, true, false, 4.8, 19,
 ARRAY['https://images.unsplash.com/photo-1606216794074-735e91aa2c92',
       'https://images.unsplash.com/photo-1519741497674-611481863552']),

-- Row 10 - Love & Photos Choice
('Michael Chen', 'mchenphoto@gmail.com', '14155678901',
 'Award-winning photographer in San Francisco, California. Specializing in luxury weddings and events.',
 ARRAY['Wedding Photography', 'Event Photography', 'Portrait Photography'],
 'San Francisco', 'California', 10, 400, true, true, 4.9, 45,
 ARRAY['https://images.unsplash.com/photo-1511285560929-80b456fea0bc',
       'https://images.unsplash.com/photo-1537633552985-df8429e8048b',
       'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6']);

-- Update updated_at timestamp on row updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_photographer_preview_profiles_updated_at
  BEFORE UPDATE ON public.photographer_preview_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE public.photographer_preview_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access to available profiles
CREATE POLICY "Public can view available photographer profiles"
ON public.photographer_preview_profiles FOR SELECT
USING (is_available = true);

-- Create policy for photographers to update their own profiles
CREATE POLICY "Photographers can update own profiles"
ON public.photographer_preview_profiles FOR UPDATE
USING (auth.uid() = user_id);

-- Create policy for authenticated users to claim unclaimed profiles
CREATE POLICY "Users can claim unclaimed profiles"
ON public.photographer_preview_profiles FOR UPDATE
USING (user_id IS NULL AND auth.uid() IS NOT NULL);