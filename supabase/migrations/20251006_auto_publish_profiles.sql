-- Auto-Publish Profile System Migration
-- Automatically publishes profiles when all required fields are complete
-- Makes address_line1 optional (only city, state, zip required)

-- Step 1: Update validation function to make address_line1 optional
CREATE OR REPLACE FUNCTION public.is_photographer_profile_complete(photographer_record public.photographers)
RETURNS BOOLEAN AS $$
DECLARE
  bio_word_count INTEGER;
  bio_char_count INTEGER;
  portfolio_count INTEGER;
  languages_count INTEGER;
  has_profile_photo BOOLEAN;
  has_address BOOLEAN;
  user_avatar_url TEXT;
BEGIN
  -- Check bio length (500 characters OR 100 words minimum)
  bio_char_count := COALESCE(length(photographer_record.bio), 0);
  bio_word_count := COALESCE(array_length(string_to_array(trim(photographer_record.bio), ' '), 1), 0);

  -- Check portfolio images (minimum 10)
  portfolio_count := COALESCE(array_length(photographer_record.portfolio_images, 1), 0);

  -- Check languages (cannot be empty)
  languages_count := COALESCE(array_length(photographer_record.languages, 1), 0);

  -- Check profile photo via users table
  SELECT avatar_url INTO user_avatar_url
  FROM public.users
  WHERE id = photographer_record.user_id;

  has_profile_photo := user_avatar_url IS NOT NULL AND user_avatar_url != '';

  -- Check address fields (city, state, zip required; address_line1 is OPTIONAL)
  has_address := (
    photographer_record.city IS NOT NULL AND
    photographer_record.city != '' AND
    photographer_record.state IS NOT NULL AND
    photographer_record.state != '' AND
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

-- Step 2: Update validation trigger to make address_line1 optional
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

    -- Check address (city, state, zip required; address_line1 is OPTIONAL)
    IF NEW.city IS NULL OR NEW.city = '' OR
       NEW.state IS NULL OR NEW.state = '' OR
       NEW.zip_code IS NULL OR NEW.zip_code = '' THEN
      RAISE EXCEPTION 'City, state, and ZIP code are required to appear in search.'
        USING HINT = 'Fill in your address (city, state, ZIP) in Profile Settings';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Create auto-publish trigger function
-- This automatically sets visible_in_search=true when profile becomes complete
CREATE OR REPLACE FUNCTION public.auto_publish_complete_profile()
RETURNS TRIGGER AS $$
DECLARE
  is_complete BOOLEAN;
BEGIN
  -- Check if profile is complete using our validation function
  is_complete := public.is_photographer_profile_complete(NEW.*);

  -- Auto-publish if complete and not already published
  IF is_complete AND (NEW.visible_in_search = false OR NEW.visible_in_search IS NULL) THEN
    NEW.visible_in_search := true;
    RAISE NOTICE 'Profile auto-published: All requirements met for photographer %', NEW.user_id;

  -- Auto-unpublish if incomplete and currently published
  ELSIF NOT is_complete AND NEW.visible_in_search = true THEN
    NEW.visible_in_search := false;
    RAISE NOTICE 'Profile auto-unpublished: Requirements no longer met for photographer %', NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Create trigger for auto-publishing
DROP TRIGGER IF EXISTS auto_publish_photographer_profile ON public.photographers;
CREATE TRIGGER auto_publish_photographer_profile
  BEFORE INSERT OR UPDATE OF bio, portfolio_images, languages, city, state, zip_code
  ON public.photographers
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_publish_complete_profile();

-- Step 5: Update existing complete profiles to be published
-- This is a one-time update for existing profiles
UPDATE public.photographers
SET visible_in_search = true
WHERE public.is_photographer_profile_complete(photographers.*) = true
  AND (visible_in_search = false OR visible_in_search IS NULL);

-- Step 6: Update comments
COMMENT ON FUNCTION public.is_photographer_profile_complete IS
'Checks if a photographer profile meets all requirements for auto-publishing:
- Bio: 500+ characters OR 100+ words
- Portfolio: 10+ images
- Languages: At least 1 language
- Profile photo: users.avatar_url must be set
- Address: City, State, ZIP (street address is OPTIONAL)';

COMMENT ON FUNCTION public.auto_publish_complete_profile IS
'Automatically publishes photographer profiles when all requirements are met.
Profiles are auto-published (visible_in_search=true) when complete.
Profiles are auto-unpublished (visible_in_search=false) when incomplete.';

-- Step 7: Add helpful view for monitoring profile status
CREATE OR REPLACE VIEW public.photographer_profile_status AS
SELECT
  p.id,
  p.user_id,
  u.email,
  u.full_name,
  p.visible_in_search,
  p.profile_complete,
  CASE
    WHEN p.profile_complete AND p.visible_in_search THEN 'Published'
    WHEN p.profile_complete AND NOT p.visible_in_search THEN 'Complete but not published'
    WHEN NOT p.profile_complete AND p.visible_in_search THEN 'Published but incomplete (ERROR)'
    ELSE 'Incomplete and not published'
  END as status,
  -- Individual requirement checks
  (COALESCE(length(p.bio), 0) >= 500 OR
   COALESCE(array_length(string_to_array(trim(p.bio), ' '), 1), 0) >= 100) as has_bio,
  (COALESCE(array_length(p.portfolio_images, 1), 0) >= 10) as has_portfolio,
  (COALESCE(array_length(p.languages, 1), 0) > 0) as has_languages,
  (u.avatar_url IS NOT NULL AND u.avatar_url != '') as has_photo,
  (p.city IS NOT NULL AND p.city != '' AND
   p.state IS NOT NULL AND p.state != '' AND
   p.zip_code IS NOT NULL AND p.zip_code != '') as has_address,
  p.updated_at
FROM public.photographers p
LEFT JOIN public.users u ON p.user_id = u.id;

COMMENT ON VIEW public.photographer_profile_status IS
'Monitoring view for photographer profile completion and publication status.
Shows which requirements are met/missing for each profile.';
