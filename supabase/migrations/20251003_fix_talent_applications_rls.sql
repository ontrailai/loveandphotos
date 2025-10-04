-- Fix RLS Policies for Talent Applications
-- Issue: 403 errors on INSERT and SELECT operations
-- Root cause: Policies too restrictive for anonymous application submissions

-- ============================================
-- DROP EXISTING RESTRICTIVE POLICIES
-- ============================================

DROP POLICY IF EXISTS "Users can view their own applications" ON public.talent_applications;
DROP POLICY IF EXISTS "Anyone can submit applications" ON public.talent_applications;

-- ============================================
-- CREATE IMPROVED RLS POLICIES
-- ============================================

-- Allow ANYONE (including anonymous users) to submit applications
-- This is essential for the application form to work
CREATE POLICY "Allow anonymous application submissions"
ON public.talent_applications
FOR INSERT
TO public
WITH CHECK (true);

-- Allow users to view applications matching their email (even before account creation)
-- This allows checking if someone has already applied
CREATE POLICY "Users can view applications by email"
ON public.talent_applications
FOR SELECT
TO public
USING (
    email = current_setting('request.jwt.claims', true)::json->>'email'
    OR user_id = auth.uid()
    OR email IN (
        SELECT email FROM auth.users WHERE id = auth.uid()
    )
);

-- Fallback: Allow reading applications if no auth context (for initial application check)
CREATE POLICY "Allow checking application existence"
ON public.talent_applications
FOR SELECT
TO anon
USING (true);

-- ============================================
-- COMMENT ON POLICIES
-- ============================================

COMMENT ON POLICY "Allow anonymous application submissions" ON public.talent_applications IS
'Allows anyone (authenticated or anonymous) to submit talent applications. Essential for the application form.';

COMMENT ON POLICY "Users can view applications by email" ON public.talent_applications IS
'Allows users to view applications matching their email address or user_id.';

COMMENT ON POLICY "Allow checking application existence" ON public.talent_applications IS
'Fallback policy allowing anonymous users to check if applications exist. Required for TalentDashboardLayout.';
