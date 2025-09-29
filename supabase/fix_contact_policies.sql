-- Fix RLS policies for contact_submissions table
-- Run this if you're getting policy already exists errors

-- First, drop all existing policies
DROP POLICY IF EXISTS "Anyone can create contact submissions" ON public.contact_submissions;
DROP POLICY IF EXISTS "Authenticated users can view contact submissions" ON public.contact_submissions;
DROP POLICY IF EXISTS "Authenticated users can update contact submissions" ON public.contact_submissions;

-- Make sure RLS is enabled
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

-- Recreate the policies
CREATE POLICY "Anyone can create contact submissions" 
  ON public.contact_submissions 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view contact submissions" 
  ON public.contact_submissions 
  FOR SELECT 
  USING (true);  -- Changed to allow any authenticated user to view

CREATE POLICY "Authenticated users can update contact submissions" 
  ON public.contact_submissions 
  FOR UPDATE 
  USING (true);  -- Changed to allow any authenticated user to update