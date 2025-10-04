-- Declined Jobs Blacklist System
-- Created: 2025-10-03
-- Purpose: Track photographer job declines and enforce blacklist filtering

-- ============================================
-- CREATE declined_jobs TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.declined_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Core references
    talent_id UUID NOT NULL REFERENCES public.photographers(id) ON DELETE CASCADE,
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

    -- Metadata
    declined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reason TEXT,

    -- Audit fields
    ip_address INET,
    user_agent TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Prevent duplicate declines
    UNIQUE(talent_id, booking_id)
);

-- ============================================
-- CREATE INDEXES
-- ============================================

-- Fast lookup for talent's declined bookings
CREATE INDEX idx_declined_jobs_talent_id ON public.declined_jobs(talent_id);

-- Fast lookup for customer's blacklisted talents
CREATE INDEX idx_declined_jobs_customer_id ON public.declined_jobs(customer_id);

-- Fast lookup for booking decline status
CREATE INDEX idx_declined_jobs_booking_id ON public.declined_jobs(booking_id);

-- Composite index for filtering talent-customer combinations
CREATE INDEX idx_declined_jobs_talent_customer ON public.declined_jobs(talent_id, customer_id);

-- ============================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.declined_jobs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES
-- ============================================

-- Photographers can view their own declined jobs
CREATE POLICY "Photographers can view their declined jobs"
ON public.declined_jobs
FOR SELECT
TO authenticated
USING (
    talent_id IN (
        SELECT id FROM public.photographers
        WHERE user_id = auth.uid()
    )
);

-- Photographers can create decline records for their own jobs
CREATE POLICY "Photographers can decline jobs"
ON public.declined_jobs
FOR INSERT
TO authenticated
WITH CHECK (
    talent_id IN (
        SELECT id FROM public.photographers
        WHERE user_id = auth.uid()
    )
    AND booking_id IN (
        SELECT id FROM public.bookings
        WHERE photographer_id = talent_id
    )
);

-- Admins can view all declined jobs
CREATE POLICY "Admins can view all declined jobs"
ON public.declined_jobs
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
        AND users.role = 'admin'
    )
);

-- Prevent deletion of decline records (permanent blacklist)
-- Only admins can delete (via service role)

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to check if talent is blacklisted for a customer
CREATE OR REPLACE FUNCTION is_talent_blacklisted_for_customer(
    p_talent_id UUID,
    p_customer_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.declined_jobs
        WHERE talent_id = p_talent_id
        AND customer_id = p_customer_id
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function to get blacklisted talent IDs for a customer
CREATE OR REPLACE FUNCTION get_blacklisted_talents_for_customer(
    p_customer_id UUID
) RETURNS TABLE(talent_id UUID) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT declined_jobs.talent_id
    FROM public.declined_jobs
    WHERE declined_jobs.customer_id = p_customer_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION is_talent_blacklisted_for_customer(UUID, UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_blacklisted_talents_for_customer(UUID) TO authenticated, anon;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE public.declined_jobs IS
'Tracks photographer job declines. Creates permanent blacklist preventing future matches between talent and customer.';

COMMENT ON COLUMN public.declined_jobs.talent_id IS
'Photographer who declined the job';

COMMENT ON COLUMN public.declined_jobs.booking_id IS
'Specific booking that was declined';

COMMENT ON COLUMN public.declined_jobs.customer_id IS
'Customer whose jobs this photographer is blacklisted from';

COMMENT ON COLUMN public.declined_jobs.reason IS
'Optional reason for decline (future feature)';

COMMENT ON COLUMN public.declined_jobs.ip_address IS
'IP address of decline action for audit trail';

COMMENT ON COLUMN public.declined_jobs.user_agent IS
'User agent of decline action for audit trail';
