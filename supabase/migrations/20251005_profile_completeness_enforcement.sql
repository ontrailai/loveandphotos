-- Profile Completeness Enforcement Migration
-- Ensures photographer profiles are only visible in search when all required fields are completed

-- Step 1: Create a function to check if a photographer profile is complete
CREATE OR REPLACE FUNCTION public.is_photographer_profile_complete(photographer_record public.photographers)
RETURNS BOOLEAN AS $$
DECLARE
  bio_word_count INTEGER;
  bio_char_count INTEGER;
  portfolio_count INTEGER;
  languages_count INTEGER;
  has_profile_photo BOOLEAN;
  has_address BOOLEAN;
BEGIN
  -- Check bio length (500 characters OR 100 words minimum)
  bio_char_count := COALESCE(length(photographer_record.bio), 0);
  bio_word_count := COALESCE(array_length(string_to_array(trim(photographer_record.bio), ' '), 1), 0);

  -- Check portfolio images (minimum 10)
  portfolio_count := COALESCE(array_length(photographer_record.portfolio_images, 1), 0);

  -- Check languages (cannot be empty)
  languages_count := COALESCE(array_length(photographer_record.languages, 1), 0);

  -- Check profile photo via users table join (will be validated in trigger)
  -- For now, we'll check if user_id exists and assume avatar_url check happens in app
  has_profile_photo := photographer_record.user_id IS NOT NULL;

  -- Check address fields
  has_address := (
    photographer_record.address_line1 IS NOT NULL AND
    photographer_record.address_line1 != '' AND
    photographer_record.city IS NOT NULL AND
    photographer_record.city != '' AND
    photographer_record.zip_code IS NOT NULL AND
    photographer_record.zip_code != ''
  );

  -- Return true only if ALL requirements are met
  RETURN (
    (bio_char_count >= 500 OR bio_word_count >= 100) AND
    portfolio_count >= 10 AND
    languages_count > 0 AND
    has_profile_photo AND
    has_address
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Step 2: Add a computed column for profile_complete status
ALTER TABLE public.photographers
ADD COLUMN IF NOT EXISTS profile_complete BOOLEAN GENERATED ALWAYS AS (
  public.is_photographer_profile_complete(photographers.*)
) STORED;

-- Step 3: Create index on profile_complete for faster queries
CREATE INDEX IF NOT EXISTS idx_photographers_profile_complete
ON public.photographers(profile_complete)
WHERE profile_complete = true;

-- Step 4: Create index on visible_in_search combined with profile_complete
CREATE INDEX IF NOT EXISTS idx_photographers_search_visibility
ON public.photographers(visible_in_search, profile_complete)
WHERE visible_in_search = true AND profile_complete = true;

-- Step 5: Create a trigger function to validate profile completeness before allowing visible_in_search=true
CREATE OR REPLACE FUNCTION public.validate_photographer_visibility()
RETURNS TRIGGER AS $$
DECLARE
  user_avatar_url TEXT;
BEGIN
  -- If trying to set visible_in_search to true, validate completeness
  IF NEW.visible_in_search = true THEN
    -- Check if user has avatar_url
    SELECT avatar_url INTO user_avatar_url
    FROM public.users
    WHERE id = NEW.user_id;

    -- Additional check for profile photo
    IF user_avatar_url IS NULL OR user_avatar_url = '' THEN
      RAISE EXCEPTION 'Profile photo is required to appear in search. Please upload a profile photo.'
        USING HINT = 'Upload a profile photo in your Profile Settings';
    END IF;

    -- Check bio length
    IF COALESCE(length(NEW.bio), 0) < 500 AND
       COALESCE(array_length(string_to_array(trim(NEW.bio), ' '), 1), 0) < 100 THEN
      RAISE EXCEPTION 'Bio must be at least 500 characters or 100 words to appear in search'
        USING HINT = 'Add more detail to your bio in Profile Settings';
    END IF;

    -- Check portfolio images
    IF COALESCE(array_length(NEW.portfolio_images, 1), 0) < 10 THEN
      RAISE EXCEPTION 'At least 10 portfolio images are required to appear in search'
        USING HINT = 'Upload more portfolio images in the Portfolio section';
    END IF;

    -- Check languages
    IF COALESCE(array_length(NEW.languages, 1), 0) = 0 THEN
      RAISE EXCEPTION 'At least one language must be selected to appear in search.'
        USING HINT = 'Add your language proficiency in Profile Settings';
    END IF;

    -- Check address
    IF NEW.address_line1 IS NULL OR NEW.address_line1 = '' OR
       NEW.city IS NULL OR NEW.city = '' OR
       NEW.zip_code IS NULL OR NEW.zip_code = '' THEN
      RAISE EXCEPTION 'Complete address (street, city, zip code) is required to appear in search.'
        USING HINT = 'Fill in your complete address in Profile Settings';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Create trigger to enforce validation
DROP TRIGGER IF EXISTS enforce_photographer_visibility ON public.photographers;
CREATE TRIGGER enforce_photographer_visibility
  BEFORE INSERT OR UPDATE OF visible_in_search, bio, portfolio_images, languages, address_line1, city, zip_code
  ON public.photographers
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_photographer_visibility();

-- Step 7: Update RLS policies to only show complete profiles in public search
-- Drop existing public select policy if it exists
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.photographers;

-- Create new policy that requires both visible_in_search=true AND profile_complete=true
CREATE POLICY "Public profiles are viewable by everyone"
ON public.photographers FOR SELECT
USING (
  visible_in_search = true AND
  profile_complete = true
);

-- Step 8: Allow photographers to view their own incomplete profiles
CREATE POLICY "Photographers can view own profile even if incomplete"
ON public.photographers FOR SELECT
USING (
  user_id = auth.uid()
);

-- Step 9: Add helpful comments
COMMENT ON FUNCTION public.is_photographer_profile_complete IS
'Checks if a photographer profile meets all requirements for public visibility:
- Bio: 500+ characters OR 100+ words
- Portfolio: 10+ images
- Languages: At least 1 language
- Profile photo: user.avatar_url must be set
- Address: Complete address (street, city, zip)';

COMMENT ON COLUMN public.photographers.profile_complete IS
'Computed column that indicates if the profile meets all requirements for public visibility.
Used to filter search results and enforce profile quality standards.';
