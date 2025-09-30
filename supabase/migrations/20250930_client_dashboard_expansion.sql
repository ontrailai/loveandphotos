-- ============================================================================
-- Love & Photos - Client Dashboard Expansion
-- Migration: 20250930_client_dashboard_expansion
--
-- Features:
-- 1. Contract PDF upload/viewing
-- 2. Style Questionnaire
-- 3. Wedding Info Questionnaire
-- 4. Automated 60-day reminders
-- 5. Self-serve add-ons & extra hours
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. CONTRACTS TABLE
-- Store client contract PDFs with versioning
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    event_id UUID NOT NULL, -- Same as booking_id, denormalized for clarity

    -- File metadata
    storage_path TEXT NOT NULL UNIQUE,
    filename TEXT NOT NULL,
    file_size_bytes BIGINT NOT NULL CHECK (file_size_bytes > 0 AND file_size_bytes <= 20971520), -- Max 20MB
    mime_type TEXT NOT NULL CHECK (mime_type = 'application/pdf'),
    sha256_hash TEXT NOT NULL, -- For duplicate detection

    -- Version tracking
    version INTEGER NOT NULL DEFAULT 1,
    uploaded_by UUID NOT NULL REFERENCES public.users(id),
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Status tracking
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'signed', 'superseded')),
    notes TEXT,

    -- Ensure one version per booking
    UNIQUE(booking_id, version),

    -- Index for efficient queries
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Contracts indexes
CREATE INDEX idx_contracts_booking_id ON public.contracts(booking_id);
CREATE INDEX idx_contracts_client_id ON public.contracts(client_id);
CREATE INDEX idx_contracts_event_id ON public.contracts(event_id);
CREATE INDEX idx_contracts_status ON public.contracts(status) WHERE status != 'superseded';
CREATE INDEX idx_contracts_hash ON public.contracts(sha256_hash);
CREATE INDEX idx_contracts_uploaded_at ON public.contracts(uploaded_at DESC);

-- ============================================================================
-- 2. QUESTIONNAIRES TABLE
-- Track questionnaire state (Style & Wedding Info)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.questionnaires (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    event_id UUID NOT NULL, -- Same as booking_id

    -- Questionnaire type
    type TEXT NOT NULL CHECK (type IN ('style', 'wedding_info')),

    -- Status tracking
    status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'locked')),

    -- Timestamps
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    locked_at TIMESTAMPTZ,
    lock_reason TEXT, -- 'auto_lock' or 'admin_override'
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Progress tracking
    total_questions INTEGER NOT NULL DEFAULT 0,
    answered_questions INTEGER NOT NULL DEFAULT 0,

    -- Ensure one questionnaire per type per booking
    UNIQUE(booking_id, type)
);

-- Questionnaires indexes
CREATE INDEX idx_questionnaires_booking_id ON public.questionnaires(booking_id);
CREATE INDEX idx_questionnaires_client_id ON public.questionnaires(client_id);
CREATE INDEX idx_questionnaires_type ON public.questionnaires(type);
CREATE INDEX idx_questionnaires_status ON public.questionnaires(status);
CREATE INDEX idx_questionnaires_type_status ON public.questionnaires(type, status);
CREATE INDEX idx_questionnaires_completed_at ON public.questionnaires(completed_at);

-- ============================================================================
-- 3. QUESTIONNAIRE ANSWERS TABLE
-- Store individual question responses (flexible JSONB)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.questionnaire_answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    questionnaire_id UUID NOT NULL REFERENCES public.questionnaires(id) ON DELETE CASCADE,

    -- Question identification
    question_key TEXT NOT NULL, -- e.g., 'style_preference', 'venue_address'

    -- Answer storage (flexible JSONB for any response type)
    answer_value JSONB NOT NULL,

    -- Metadata
    answered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Ensure one answer per question per questionnaire
    UNIQUE(questionnaire_id, question_key)
);

-- Questionnaire answers indexes
CREATE INDEX idx_questionnaire_answers_questionnaire_id ON public.questionnaire_answers(questionnaire_id);
CREATE INDEX idx_questionnaire_answers_question_key ON public.questionnaire_answers(question_key);
CREATE INDEX idx_questionnaire_answers_updated_at ON public.questionnaire_answers(updated_at DESC);

-- ============================================================================
-- 4. REMINDERS TABLE
-- Track automated email reminders (idempotent)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Event reference
    event_id UUID NOT NULL, -- booking.id
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,

    -- Reminder type
    reminder_type TEXT NOT NULL CHECK (reminder_type IN ('questionnaire_60d', 'questionnaire_followup_53d')),

    -- Scheduling
    scheduled_for TIMESTAMPTZ NOT NULL,
    fired_at TIMESTAMPTZ,

    -- Payload (recipient info, questionnaire status, etc.)
    payload JSONB NOT NULL DEFAULT '{}',

    -- Idempotency key (format: "{booking_id}:{type}:{date}")
    unique_key TEXT NOT NULL UNIQUE,

    -- Audit trail
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Error tracking
    error_message TEXT,
    retry_count INTEGER NOT NULL DEFAULT 0
);

-- Reminders indexes
CREATE INDEX idx_reminders_event_id ON public.reminders(event_id);
CREATE INDEX idx_reminders_booking_id ON public.reminders(booking_id);
CREATE INDEX idx_reminders_scheduled_for ON public.reminders(scheduled_for) WHERE fired_at IS NULL;
CREATE INDEX idx_reminders_fired_at ON public.reminders(fired_at);
CREATE INDEX idx_reminders_type ON public.reminders(reminder_type);
CREATE INDEX idx_reminders_unique_key ON public.reminders(unique_key);

-- ============================================================================
-- 5. ADDONS CATALOG TABLE
-- Product catalog for extra hours and add-on services
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.addons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Product identification
    code TEXT NOT NULL UNIQUE, -- e.g., 'extra_hour', 'second_shooter'
    name TEXT NOT NULL,
    description TEXT,

    -- Pricing (in cents)
    price_cents INTEGER NOT NULL CHECK (price_cents >= 0),

    -- Product type
    kind TEXT NOT NULL CHECK (kind IN ('hour', 'addon')),

    -- Availability
    active BOOLEAN NOT NULL DEFAULT TRUE,

    -- Display configuration
    display_order INTEGER NOT NULL DEFAULT 100,
    icon_name TEXT, -- Lucide icon name (optional)

    -- Metadata (flexible for future fields)
    metadata JSONB DEFAULT '{}',

    -- Audit trail
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Addons indexes
CREATE INDEX idx_addons_code ON public.addons(code);
CREATE INDEX idx_addons_kind ON public.addons(kind);
CREATE INDEX idx_addons_active ON public.addons(active);
CREATE INDEX idx_addons_kind_active ON public.addons(kind, active);
CREATE INDEX idx_addons_display_order ON public.addons(display_order);

-- ============================================================================
-- 6. BOOKING ADDONS TABLE
-- Purchased add-ons linked to bookings
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.booking_addons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- References
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    addon_id UUID NOT NULL REFERENCES public.addons(id) ON DELETE RESTRICT,

    -- Purchase details
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price_cents INTEGER NOT NULL CHECK (unit_price_cents >= 0),
    total_price_cents INTEGER NOT NULL CHECK (total_price_cents >= 0),

    -- Payment tracking
    stripe_payment_intent_id TEXT,
    payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),

    -- Audit trail
    purchased_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    purchased_by UUID NOT NULL REFERENCES public.users(id),
    paid_at TIMESTAMPTZ,

    -- Metadata
    notes TEXT
);

-- Booking addons indexes
CREATE INDEX idx_booking_addons_booking_id ON public.booking_addons(booking_id);
CREATE INDEX idx_booking_addons_addon_id ON public.booking_addons(addon_id);
CREATE INDEX idx_booking_addons_payment_intent ON public.booking_addons(stripe_payment_intent_id);
CREATE INDEX idx_booking_addons_payment_status ON public.booking_addons(payment_status);
CREATE INDEX idx_booking_addons_purchased_at ON public.booking_addons(purchased_at DESC);

-- ============================================================================
-- 7. BOOKINGS TABLE ALTERATIONS
-- Add missing columns needed for new features
-- ============================================================================

-- Ensure event_date exists (should already be there, but safe to check)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public'
                   AND table_name = 'bookings'
                   AND column_name = 'event_date') THEN
        ALTER TABLE public.bookings ADD COLUMN event_date DATE;
    END IF;
END $$;

-- Add contract_uploaded flag
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS contract_uploaded BOOLEAN DEFAULT FALSE;

-- Add questionnaires_completed flag
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS questionnaires_completed BOOLEAN DEFAULT FALSE;

-- Add addons_total_cents for tracking add-on purchases
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS addons_total_cents INTEGER DEFAULT 0 CHECK (addons_total_cents >= 0);

-- Create index on event_date for reminder queries
CREATE INDEX IF NOT EXISTS idx_bookings_event_date ON public.bookings(event_date);

-- ============================================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all new tables
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questionnaires ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questionnaire_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_addons ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 8.1 CONTRACTS POLICIES
-- ============================================================================

-- Clients can view their own contracts
CREATE POLICY "Clients can view own contracts"
    ON public.contracts FOR SELECT
    USING (client_id = auth.uid());

-- Admins can view all contracts
CREATE POLICY "Admins can view all contracts"
    ON public.contracts FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Photographers can view contracts for their bookings (after payment)
CREATE POLICY "Photographers can view contracts for their bookings"
    ON public.contracts FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.bookings b
            JOIN public.photographers p ON b.photographer_id = p.id
            WHERE b.id = contracts.booking_id
            AND p.user_id = auth.uid()
            AND b.payment_status = 'paid'
        )
    );

-- Clients can upload contracts for their own bookings
CREATE POLICY "Clients can upload contracts"
    ON public.contracts FOR INSERT
    WITH CHECK (client_id = auth.uid());

-- No updates allowed (contracts are immutable once uploaded)
CREATE POLICY "Contracts are immutable"
    ON public.contracts FOR UPDATE
    USING (FALSE);

-- No deletes allowed (contracts are permanent records)
CREATE POLICY "Contracts cannot be deleted"
    ON public.contracts FOR DELETE
    USING (FALSE);

-- ============================================================================
-- 8.2 QUESTIONNAIRES POLICIES
-- ============================================================================

-- Clients can view their own questionnaires
CREATE POLICY "Clients can view own questionnaires"
    ON public.questionnaires FOR SELECT
    USING (client_id = auth.uid());

-- Admins can view all questionnaires
CREATE POLICY "Admins can view all questionnaires"
    ON public.questionnaires FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Photographers can view questionnaires for their bookings (after payment)
CREATE POLICY "Photographers can view questionnaires for their bookings"
    ON public.questionnaires FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.bookings b
            JOIN public.photographers p ON b.photographer_id = p.id
            WHERE b.id = questionnaires.booking_id
            AND p.user_id = auth.uid()
            AND b.payment_status = 'paid'
        )
    );

-- Clients can create/update their own questionnaires
CREATE POLICY "Clients can manage own questionnaires"
    ON public.questionnaires FOR ALL
    USING (client_id = auth.uid());

-- Admins can update any questionnaire (for unlock override)
CREATE POLICY "Admins can unlock questionnaires"
    ON public.questionnaires FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================================================
-- 8.3 QUESTIONNAIRE ANSWERS POLICIES
-- ============================================================================

-- Answers inherit questionnaire permissions
CREATE POLICY "Clients can view own answers"
    ON public.questionnaire_answers FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.questionnaires q
            WHERE q.id = questionnaire_answers.questionnaire_id
            AND q.client_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all answers"
    ON public.questionnaire_answers FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Photographers can view answers for their bookings"
    ON public.questionnaire_answers FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.questionnaires q
            JOIN public.bookings b ON b.id = q.booking_id
            JOIN public.photographers p ON b.photographer_id = p.id
            WHERE q.id = questionnaire_answers.questionnaire_id
            AND p.user_id = auth.uid()
            AND b.payment_status = 'paid'
        )
    );

-- Clients can manage their own answers
CREATE POLICY "Clients can manage own answers"
    ON public.questionnaire_answers FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.questionnaires q
            WHERE q.id = questionnaire_answers.questionnaire_id
            AND q.client_id = auth.uid()
        )
    );

-- ============================================================================
-- 8.4 REMINDERS POLICIES
-- ============================================================================

-- Only service role can manage reminders (cron job)
CREATE POLICY "Service role can manage reminders"
    ON public.reminders FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

-- Admins can view reminders
CREATE POLICY "Admins can view reminders"
    ON public.reminders FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================================================
-- 8.5 ADDONS CATALOG POLICIES
-- ============================================================================

-- Anyone (authenticated) can view active add-ons
CREATE POLICY "Anyone can view active addons"
    ON public.addons FOR SELECT
    USING (active = TRUE);

-- Only admins can manage add-ons catalog
CREATE POLICY "Admins can manage addons"
    ON public.addons FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================================================
-- 8.6 BOOKING ADDONS POLICIES
-- ============================================================================

-- Clients can view add-ons for their own bookings
CREATE POLICY "Clients can view own booking addons"
    ON public.booking_addons FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.bookings b
            WHERE b.id = booking_addons.booking_id
            AND b.customer_id = auth.uid()
        )
    );

-- Admins can view all booking add-ons
CREATE POLICY "Admins can view all booking addons"
    ON public.booking_addons FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Photographers can view add-ons for their bookings
CREATE POLICY "Photographers can view booking addons for their bookings"
    ON public.booking_addons FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.bookings b
            JOIN public.photographers p ON b.photographer_id = p.id
            WHERE b.id = booking_addons.booking_id
            AND p.user_id = auth.uid()
        )
    );

-- Clients can purchase add-ons for their own bookings
CREATE POLICY "Clients can purchase addons"
    ON public.booking_addons FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.bookings b
            WHERE b.id = booking_id
            AND b.customer_id = auth.uid()
        )
        AND purchased_by = auth.uid()
    );

-- Only service role can update payment status (via webhook)
CREATE POLICY "Service role can update addon payment status"
    ON public.booking_addons FOR UPDATE
    USING (auth.jwt()->>'role' = 'service_role');

-- ============================================================================
-- 9. TRIGGERS & FUNCTIONS
-- ============================================================================

-- Function to auto-update questionnaires.updated_at
CREATE OR REPLACE FUNCTION update_questionnaire_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_questionnaire_updated_at
    BEFORE UPDATE ON public.questionnaires
    FOR EACH ROW
    EXECUTE FUNCTION update_questionnaire_updated_at();

-- Function to auto-update addons.updated_at
CREATE OR REPLACE FUNCTION update_addon_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_addon_updated_at
    BEFORE UPDATE ON public.addons
    FOR EACH ROW
    EXECUTE FUNCTION update_addon_updated_at();

-- Function to auto-update booking.contract_uploaded when contract is inserted
CREATE OR REPLACE FUNCTION update_booking_contract_uploaded()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.bookings
    SET contract_uploaded = TRUE,
        updated_at = NOW()
    WHERE id = NEW.booking_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_booking_contract_uploaded
    AFTER INSERT ON public.contracts
    FOR EACH ROW
    EXECUTE FUNCTION update_booking_contract_uploaded();

-- Function to update booking.questionnaires_completed when both questionnaires are completed
CREATE OR REPLACE FUNCTION update_booking_questionnaires_completed()
RETURNS TRIGGER AS $$
DECLARE
    completed_count INTEGER;
BEGIN
    -- Count completed questionnaires for this booking
    SELECT COUNT(*) INTO completed_count
    FROM public.questionnaires
    WHERE booking_id = NEW.booking_id
    AND status = 'completed';

    -- If both questionnaires are completed, mark booking
    IF completed_count >= 2 THEN
        UPDATE public.bookings
        SET questionnaires_completed = TRUE,
            updated_at = NOW()
        WHERE id = NEW.booking_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_booking_questionnaires_completed
    AFTER UPDATE ON public.questionnaires
    FOR EACH ROW
    WHEN (NEW.status = 'completed' AND OLD.status != 'completed')
    EXECUTE FUNCTION update_booking_questionnaires_completed();

-- Function to update booking.addons_total_cents when add-ons are purchased
CREATE OR REPLACE FUNCTION update_booking_addons_total()
RETURNS TRIGGER AS $$
DECLARE
    new_total INTEGER;
BEGIN
    -- Calculate total of paid add-ons for this booking
    SELECT COALESCE(SUM(total_price_cents), 0) INTO new_total
    FROM public.booking_addons
    WHERE booking_id = NEW.booking_id
    AND payment_status = 'paid';

    -- Update booking totals
    UPDATE public.bookings
    SET addons_total_cents = new_total,
        updated_at = NOW()
    WHERE id = NEW.booking_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_booking_addons_total
    AFTER INSERT OR UPDATE ON public.booking_addons
    FOR EACH ROW
    WHEN (NEW.payment_status = 'paid')
    EXECUTE FUNCTION update_booking_addons_total();

-- ============================================================================
-- 10. HELPER FUNCTIONS
-- ============================================================================

-- Function to check if questionnaire is locked based on event date
CREATE OR REPLACE FUNCTION is_questionnaire_locked(
    p_questionnaire_id UUID,
    p_event_date DATE,
    p_type TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    days_until_event INTEGER;
    lock_threshold INTEGER;
BEGIN
    -- Calculate days until event
    days_until_event := p_event_date - CURRENT_DATE;

    -- Determine lock threshold based on type
    IF p_type = 'style' THEN
        lock_threshold := 14; -- T-14 for style
    ELSIF p_type = 'wedding_info' THEN
        lock_threshold := 7;  -- T-7 for wedding info
    ELSE
        RETURN FALSE; -- Unknown type, don't lock
    END IF;

    -- Return TRUE if within lock window
    RETURN days_until_event < lock_threshold;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 11. COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE public.contracts IS 'Client contract PDF storage with versioning and audit trail';
COMMENT ON TABLE public.questionnaires IS 'Style and Wedding Info questionnaire state tracking';
COMMENT ON TABLE public.questionnaire_answers IS 'Individual questionnaire responses stored as JSONB';
COMMENT ON TABLE public.reminders IS 'Automated email reminder tracking with idempotency';
COMMENT ON TABLE public.addons IS 'Product catalog for extra hours and add-on services';
COMMENT ON TABLE public.booking_addons IS 'Purchased add-ons linked to bookings with payment tracking';

COMMENT ON COLUMN public.contracts.sha256_hash IS 'SHA-256 hash for duplicate detection and integrity verification';
COMMENT ON COLUMN public.contracts.version IS 'Contract version number, increments on replacement';
COMMENT ON COLUMN public.questionnaires.type IS 'style or wedding_info';
COMMENT ON COLUMN public.questionnaires.status IS 'not_started | in_progress | completed | locked';
COMMENT ON COLUMN public.reminders.unique_key IS 'Idempotency key format: {booking_id}:{type}:{date}';
COMMENT ON COLUMN public.addons.kind IS 'hour (extra hours) or addon (services)';
COMMENT ON COLUMN public.booking_addons.payment_status IS 'pending | paid | failed | refunded';

-- ============================================================================
-- 12. GRANT PERMISSIONS
-- ============================================================================

-- Grant authenticated users access to read/write their own data
GRANT SELECT, INSERT ON public.contracts TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.questionnaires TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.questionnaire_answers TO authenticated;
GRANT SELECT ON public.reminders TO authenticated;
GRANT SELECT ON public.addons TO authenticated;
GRANT SELECT, INSERT ON public.booking_addons TO authenticated;

-- Grant service role full access for background jobs
GRANT ALL ON public.contracts TO service_role;
GRANT ALL ON public.questionnaires TO service_role;
GRANT ALL ON public.questionnaire_answers TO service_role;
GRANT ALL ON public.reminders TO service_role;
GRANT ALL ON public.addons TO service_role;
GRANT ALL ON public.booking_addons TO service_role;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Log migration completion
DO $$
BEGIN
    RAISE NOTICE 'Migration 20250930_client_dashboard_expansion completed successfully';
    RAISE NOTICE 'Created tables: contracts, questionnaires, questionnaire_answers, reminders, addons, booking_addons';
    RAISE NOTICE 'Created % indexes', (
        SELECT COUNT(*)
        FROM pg_indexes
        WHERE schemaname = 'public'
        AND indexname LIKE 'idx_contracts%'
        OR indexname LIKE 'idx_questionnaires%'
        OR indexname LIKE 'idx_questionnaire_answers%'
        OR indexname LIKE 'idx_reminders%'
        OR indexname LIKE 'idx_addons%'
        OR indexname LIKE 'idx_booking_addons%'
    );
    RAISE NOTICE 'Created % RLS policies', (
        SELECT COUNT(*)
        FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename IN ('contracts', 'questionnaires', 'questionnaire_answers', 'reminders', 'addons', 'booking_addons')
    );
END $$;