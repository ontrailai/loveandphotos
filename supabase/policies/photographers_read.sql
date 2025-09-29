-- =============================================
-- RLS Policy for photographer_preview_profiles table
-- =============================================
-- This policy allows anonymous users to read photographer profiles
-- for the public /photographers browse page

-- Note: The photographer_preview_profiles table currently has RLS disabled
-- If you enable RLS, you'll need this policy for public read access

-- Enable RLS on the table (currently disabled in production)
-- ALTER TABLE photographer_preview_profiles ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
-- This allows anyone (including anonymous users) to view available photographers
CREATE POLICY "public_read_photographer_profiles"
ON photographer_preview_profiles
FOR SELECT
USING (
    is_available = true  -- Only show photographers marked as available
);

-- Additional optional policies for authenticated users
-- CREATE POLICY "photographers_update_own_profile"
-- ON photographer_preview_profiles
-- FOR UPDATE
-- USING (user_id = auth.uid());

-- CREATE POLICY "photographers_claim_profile"
-- ON photographer_preview_profiles
-- FOR UPDATE
-- USING (
--     user_id IS NULL  -- Profile not yet claimed
--     AND auth.uid() IS NOT NULL  -- User is authenticated
-- );

-- =============================================
-- RLS Policy for photographers table
-- =============================================
-- The photographers table has RLS enabled
-- These policies control access to photographer data

-- Allow public read access to public photographer profiles
CREATE POLICY "public_read_photographers"
ON photographers
FOR SELECT
USING (
    is_public = true  -- Only show photographers with public profiles
);

-- Allow photographers to read their own full profile
CREATE POLICY "photographers_read_own"
ON photographers
FOR SELECT
USING (user_id = auth.uid());

-- Allow photographers to update their own profile
CREATE POLICY "photographers_update_own"
ON photographers
FOR UPDATE
USING (user_id = auth.uid());

-- =============================================
-- Notes:
-- =============================================
-- 1. The photographer_preview_profiles table is currently used for the browse page
-- 2. It has RLS disabled, so all data is publicly accessible
-- 3. If you enable RLS, apply the policies above
-- 4. The photographers table has RLS enabled and requires policies
-- 5. Make sure to test after applying any policy changes