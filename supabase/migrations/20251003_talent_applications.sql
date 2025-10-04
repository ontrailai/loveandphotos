-- Talent Applications Gateway System
-- Created: 2025-10-03
-- Purpose: Strict application-first onboarding with eligibility validation

-- ============================================
-- CREATE talent_applications TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.talent_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Applicant Information
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    role TEXT NOT NULL CHECK (role IN ('photographer', 'videographer')),

    -- Application Answers (JSONB for flexible question storage)
    answers JSONB NOT NULL DEFAULT '{}',

    -- Eligibility & Status
    is_accepted BOOLEAN NOT NULL DEFAULT false,
    rejection_reason TEXT,

    -- User Account Link (NULL if rejected, populated if accepted)
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    -- Audit Trail
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- CREATE INDEXES
-- ============================================

-- Fast lookup by email for duplicate detection
CREATE INDEX idx_talent_applications_email ON public.talent_applications(email);

-- Fast lookup by user_id for accepted applicants
CREATE INDEX idx_talent_applications_user_id ON public.talent_applications(user_id);

-- Fast lookup by acceptance status for admin review
CREATE INDEX idx_talent_applications_status ON public.talent_applications(is_accepted);

-- Fast lookup by role for analytics
CREATE INDEX idx_talent_applications_role ON public.talent_applications(role);

-- Composite index for email + acceptance (prevent duplicate accepted applications)
CREATE UNIQUE INDEX idx_talent_applications_email_accepted
ON public.talent_applications(email)
WHERE is_accepted = true;

-- ============================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.talent_applications ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES
-- ============================================

-- Applicants can view their own applications (if authenticated)
CREATE POLICY "Users can view their own applications"
ON public.talent_applications
FOR SELECT
TO authenticated
USING (
    user_id = auth.uid()
    OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- Anyone can submit applications (anon or authenticated)
CREATE POLICY "Anyone can submit applications"
ON public.talent_applications
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Admins can view all applications
CREATE POLICY "Admins can view all applications"
ON public.talent_applications
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
        AND users.role = 'admin'
    )
);

-- Admins can update applications (for manual review)
CREATE POLICY "Admins can update applications"
ON public.talent_applications
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
        AND users.role = 'admin'
    )
);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to check if user has an accepted application
CREATE OR REPLACE FUNCTION has_accepted_application(
    p_user_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.talent_applications
        WHERE user_id = p_user_id
        AND is_accepted = true
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function to get application status by email
CREATE OR REPLACE FUNCTION get_application_status(
    p_email TEXT
) RETURNS TABLE(
    application_id UUID,
    is_accepted BOOLEAN,
    submitted_at TIMESTAMPTZ,
    role TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        id,
        talent_applications.is_accepted,
        talent_applications.submitted_at,
        talent_applications.role
    FROM public.talent_applications
    WHERE email = p_email
    ORDER BY submitted_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION has_accepted_application(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_application_status(TEXT) TO authenticated, anon;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE public.talent_applications IS
'Stores all talent applications with strict eligibility validation. Only accepted applicants gain access to talent portal.';

COMMENT ON COLUMN public.talent_applications.answers IS
'JSONB object storing all application question responses for auditing and review';

COMMENT ON COLUMN public.talent_applications.is_accepted IS
'TRUE if applicant passed all eligibility requirements, FALSE if rejected';

COMMENT ON COLUMN public.talent_applications.user_id IS
'Linked user account (only populated for accepted applicants after account creation)';

COMMENT ON COLUMN public.talent_applications.rejection_reason IS
'Human-readable reason for rejection (e.g., "Failed age requirement")';
