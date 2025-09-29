-- Migration: Fix Row Level Security (RLS) on contact_submissions
-- Date: 2025-01-23
-- Purpose: Enable RLS and add proper security policies to protect customer data

-- ============================================
-- ENABLE RLS ON CONTACT_SUBMISSIONS TABLE
-- ============================================

-- Enable Row Level Security (currently disabled - SECURITY RISK!)
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- CREATE RLS POLICIES
-- ============================================

-- Policy: Public users can submit contact forms
CREATE POLICY "Anyone can create contact submissions" 
ON public.contact_submissions
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

-- Policy: Only admins can view contact submissions
CREATE POLICY "Only admins can view contact submissions" 
ON public.contact_submissions
FOR SELECT 
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.id = auth.uid() 
        AND users.role = 'admin'
    )
);

-- Policy: Only admins can update contact submissions (mark as read, add notes, etc.)
CREATE POLICY "Only admins can update contact submissions" 
ON public.contact_submissions
FOR UPDATE 
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.id = auth.uid() 
        AND users.role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.id = auth.uid() 
        AND users.role = 'admin'
    )
);

-- Policy: Only admins can delete contact submissions
CREATE POLICY "Only admins can delete contact submissions" 
ON public.contact_submissions
FOR DELETE 
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.id = auth.uid() 
        AND users.role = 'admin'
    )
);

-- ============================================
-- FIX OTHER RLS GAPS IDENTIFIED
-- ============================================

-- Add missing policy for photographers to manage their own data
CREATE POLICY "Photographers can view their own profile" 
ON public.photographers
FOR SELECT 
TO authenticated
USING (
    user_id = auth.uid() 
    OR is_public = true
    OR EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.id = auth.uid() 
        AND users.role = 'admin'
    )
);

CREATE POLICY "Photographers can update their own profile" 
ON public.photographers
FOR UPDATE 
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Add missing policy for photographers to view their bookings
CREATE POLICY "Photographers can view their bookings" 
ON public.bookings
FOR SELECT 
TO authenticated
USING (
    photographer_id IN (
        SELECT id FROM public.photographers 
        WHERE user_id = auth.uid()
    )
    OR customer_id = auth.uid()
    OR EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.id = auth.uid() 
        AND users.role = 'admin'
    )
);

-- ============================================
-- VERIFY RLS IS ENABLED
-- ============================================

DO $$
DECLARE
    rls_status boolean;
BEGIN
    SELECT relrowsecurity INTO rls_status
    FROM pg_class
    WHERE relname = 'contact_submissions'
    AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
    
    IF rls_status THEN
        RAISE NOTICE 'SUCCESS: RLS is now enabled on contact_submissions table';
    ELSE
        RAISE EXCEPTION 'ERROR: Failed to enable RLS on contact_submissions table';
    END IF;
END $$;