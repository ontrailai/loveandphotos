-- ============================================================================
-- Love & Photos - Client Dashboard Expansion - ROLLBACK
-- Rollback Migration: 20250930_rollback
--
-- Safely reverts the client dashboard expansion migration
-- WARNING: This will delete all data in the new tables
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. DROP TRIGGERS (Must be dropped before functions)
-- ============================================================================

DROP TRIGGER IF EXISTS trigger_update_questionnaire_updated_at ON public.questionnaires;
DROP TRIGGER IF EXISTS trigger_update_addon_updated_at ON public.addons;
DROP TRIGGER IF EXISTS trigger_update_booking_contract_uploaded ON public.contracts;
DROP TRIGGER IF EXISTS trigger_update_booking_questionnaires_completed ON public.questionnaires;
DROP TRIGGER IF EXISTS trigger_update_booking_addons_total ON public.booking_addons;

-- ============================================================================
-- 2. DROP FUNCTIONS
-- ============================================================================

DROP FUNCTION IF EXISTS update_questionnaire_updated_at();
DROP FUNCTION IF EXISTS update_addon_updated_at();
DROP FUNCTION IF EXISTS update_booking_contract_uploaded();
DROP FUNCTION IF EXISTS update_booking_questionnaires_completed();
DROP FUNCTION IF EXISTS update_booking_addons_total();
DROP FUNCTION IF EXISTS is_questionnaire_locked(UUID, DATE, TEXT);

-- ============================================================================
-- 3. DROP RLS POLICIES
-- ============================================================================

-- Contracts policies
DROP POLICY IF EXISTS "Clients can view own contracts" ON public.contracts;
DROP POLICY IF EXISTS "Admins can view all contracts" ON public.contracts;
DROP POLICY IF EXISTS "Photographers can view contracts for their bookings" ON public.contracts;
DROP POLICY IF EXISTS "Clients can upload contracts" ON public.contracts;
DROP POLICY IF EXISTS "Contracts are immutable" ON public.contracts;
DROP POLICY IF EXISTS "Contracts cannot be deleted" ON public.contracts;

-- Questionnaires policies
DROP POLICY IF EXISTS "Clients can view own questionnaires" ON public.questionnaires;
DROP POLICY IF EXISTS "Admins can view all questionnaires" ON public.questionnaires;
DROP POLICY IF EXISTS "Photographers can view questionnaires for their bookings" ON public.questionnaires;
DROP POLICY IF EXISTS "Clients can manage own questionnaires" ON public.questionnaires;
DROP POLICY IF EXISTS "Admins can unlock questionnaires" ON public.questionnaires;

-- Questionnaire answers policies
DROP POLICY IF EXISTS "Clients can view own answers" ON public.questionnaire_answers;
DROP POLICY IF EXISTS "Admins can view all answers" ON public.questionnaire_answers;
DROP POLICY IF EXISTS "Photographers can view answers for their bookings" ON public.questionnaire_answers;
DROP POLICY IF EXISTS "Clients can manage own answers" ON public.questionnaire_answers;

-- Reminders policies
DROP POLICY IF EXISTS "Service role can manage reminders" ON public.reminders;
DROP POLICY IF EXISTS "Admins can view reminders" ON public.reminders;

-- Addons policies
DROP POLICY IF EXISTS "Anyone can view active addons" ON public.addons;
DROP POLICY IF EXISTS "Admins can manage addons" ON public.addons;

-- Booking addons policies
DROP POLICY IF EXISTS "Clients can view own booking addons" ON public.booking_addons;
DROP POLICY IF EXISTS "Admins can view all booking addons" ON public.booking_addons;
DROP POLICY IF EXISTS "Photographers can view booking addons for their bookings" ON public.booking_addons;
DROP POLICY IF EXISTS "Clients can purchase addons" ON public.booking_addons;
DROP POLICY IF EXISTS "Service role can update addon payment status" ON public.booking_addons;

-- ============================================================================
-- 4. DROP TABLES (in reverse dependency order)
-- ============================================================================

-- Drop dependent tables first
DROP TABLE IF EXISTS public.booking_addons CASCADE;
DROP TABLE IF EXISTS public.questionnaire_answers CASCADE;
DROP TABLE IF EXISTS public.contracts CASCADE;
DROP TABLE IF EXISTS public.questionnaires CASCADE;
DROP TABLE IF EXISTS public.reminders CASCADE;
DROP TABLE IF EXISTS public.addons CASCADE;

-- ============================================================================
-- 5. REMOVE BOOKINGS TABLE ALTERATIONS
-- ============================================================================

-- Remove added columns from bookings table
ALTER TABLE public.bookings
DROP COLUMN IF EXISTS contract_uploaded,
DROP COLUMN IF EXISTS questionnaires_completed,
DROP COLUMN IF EXISTS addons_total_cents;

-- Drop index on event_date (only if it was added by our migration)
-- Note: Check if this index existed before; if so, don't drop it
-- DROP INDEX IF EXISTS idx_bookings_event_date;

-- ============================================================================
-- 6. REVOKE PERMISSIONS
-- ============================================================================

-- Revoke permissions from authenticated users
REVOKE SELECT, INSERT ON public.contracts FROM authenticated;
REVOKE SELECT, INSERT, UPDATE ON public.questionnaires FROM authenticated;
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.questionnaire_answers FROM authenticated;
REVOKE SELECT ON public.reminders FROM authenticated;
REVOKE SELECT ON public.addons FROM authenticated;
REVOKE SELECT, INSERT ON public.booking_addons FROM authenticated;

-- Revoke permissions from service role
REVOKE ALL ON public.contracts FROM service_role;
REVOKE ALL ON public.questionnaires FROM service_role;
REVOKE ALL ON public.questionnaire_answers FROM service_role;
REVOKE ALL ON public.reminders FROM service_role;
REVOKE ALL ON public.addons FROM service_role;
REVOKE ALL ON public.booking_addons FROM service_role;

-- ============================================================================
-- 7. VERIFY ROLLBACK
-- ============================================================================

DO $$
DECLARE
    table_count INTEGER;
BEGIN
    -- Check if any of the tables still exist
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name IN ('contracts', 'questionnaires', 'questionnaire_answers', 'reminders', 'addons', 'booking_addons');

    IF table_count > 0 THEN
        RAISE WARNING 'Rollback incomplete: % tables still exist', table_count;
    ELSE
        RAISE NOTICE 'Rollback completed successfully - all migration tables removed';
    END IF;

    -- Check if bookings columns were removed
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'bookings'
        AND column_name IN ('contract_uploaded', 'questionnaires_completed', 'addons_total_cents')
    ) THEN
        RAISE WARNING 'Some bookings columns still exist';
    ELSE
        RAISE NOTICE 'Bookings table alterations reverted successfully';
    END IF;
END $$;

COMMIT;

-- ============================================================================
-- ROLLBACK COMPLETE
-- ============================================================================

SELECT 'Migration 20250930_client_dashboard_expansion rolled back successfully' AS status;