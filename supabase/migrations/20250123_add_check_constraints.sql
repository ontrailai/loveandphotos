-- Migration: Add Check Constraints for Data Integrity
-- Date: 2025-01-23
-- Purpose: Prevent invalid data from entering the system (negative prices, invalid amounts, etc.)

-- ============================================
-- BOOKINGS TABLE CONSTRAINTS
-- ============================================

-- Ensure booking amounts are positive
ALTER TABLE public.bookings 
ADD CONSTRAINT check_positive_total_amount 
CHECK (total_amount > 0);

-- Ensure deposit is non-negative and less than or equal to total
ALTER TABLE public.bookings 
ADD CONSTRAINT check_valid_deposit_amount 
CHECK (deposit_amount >= 0 AND (deposit_amount IS NULL OR deposit_amount <= total_amount));

-- Ensure final amount is reasonable when set
ALTER TABLE public.bookings 
ADD CONSTRAINT check_valid_final_amount 
CHECK (final_amount IS NULL OR final_amount >= 0);

-- Ensure overtime hours are non-negative
ALTER TABLE public.bookings 
ADD CONSTRAINT check_valid_overtime_hours 
CHECK (overtime_hours >= 0);

-- Ensure event end time is after start time
ALTER TABLE public.bookings 
ADD CONSTRAINT check_valid_event_times 
CHECK (event_end_time IS NULL OR event_end_time > event_time);

-- ============================================
-- PACKAGES TABLE CONSTRAINTS
-- ============================================

-- Ensure package price is positive
ALTER TABLE public.packages 
ADD CONSTRAINT check_positive_base_price 
CHECK (base_price > 0);

-- Ensure duration is positive
ALTER TABLE public.packages 
ADD CONSTRAINT check_positive_duration 
CHECK (duration_minutes > 0);

-- Ensure max guests is reasonable
ALTER TABLE public.packages 
ADD CONSTRAINT check_valid_max_guests 
CHECK (max_guests IS NULL OR max_guests > 0);

-- ============================================
-- PAY_TIERS TABLE CONSTRAINTS
-- ============================================

-- Ensure hourly rate is positive
ALTER TABLE public.pay_tiers 
ADD CONSTRAINT check_positive_hourly_rate 
CHECK (hourly_rate > 0);

-- Ensure commission percentage is between 0 and 100
ALTER TABLE public.pay_tiers 
ADD CONSTRAINT check_valid_commission 
CHECK (commission_percentage >= 0 AND commission_percentage <= 100);

-- ============================================
-- PHOTOGRAPHERS TABLE CONSTRAINTS
-- ============================================

-- Ensure travel radius is reasonable
ALTER TABLE public.photographers 
ADD CONSTRAINT check_valid_travel_radius 
CHECK (travel_radius_miles >= 0 AND travel_radius_miles <= 500);

-- Ensure experience years is non-negative
ALTER TABLE public.photographers 
ADD CONSTRAINT check_valid_experience_years 
CHECK (experience_years >= 0);

-- Ensure response time is reasonable (in hours)
ALTER TABLE public.photographers 
ADD CONSTRAINT check_valid_response_time 
CHECK (response_time_hours IS NULL OR (response_time_hours >= 0 AND response_time_hours <= 168));

-- ============================================
-- PHOTOGRAPHER_PREVIEW_PROFILES TABLE CONSTRAINTS
-- ============================================

-- Ensure hourly rate is positive
ALTER TABLE public.photographer_preview_profiles 
ADD CONSTRAINT check_positive_hourly_rate_preview 
CHECK (hourly_rate IS NULL OR hourly_rate > 0);

-- Ensure years experience is non-negative
ALTER TABLE public.photographer_preview_profiles 
ADD CONSTRAINT check_valid_experience_preview 
CHECK (years_experience >= 0);

-- Ensure rating is between 0 and 5
ALTER TABLE public.photographer_preview_profiles 
ADD CONSTRAINT check_valid_rating_preview 
CHECK (average_rating IS NULL OR (average_rating >= 0 AND average_rating <= 5));

-- ============================================
-- REVIEWS TABLE CONSTRAINTS (Already has rating constraint)
-- ============================================

-- Add constraint for helpful count
ALTER TABLE public.reviews 
ADD CONSTRAINT check_valid_helpful_count 
CHECK (helpful_count >= 0);

-- ============================================
-- EMAIL FORMAT VALIDATION
-- ============================================

-- Add email format check on users table
ALTER TABLE public.users 
ADD CONSTRAINT check_valid_email_format 
CHECK (email ~* '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Add email format check on photographer preview profiles
ALTER TABLE public.photographer_preview_profiles 
ADD CONSTRAINT check_valid_contact_email_format 
CHECK (contact_email ~* '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- ============================================
-- CHAT TABLES CONSTRAINTS
-- ============================================

-- Ensure confidence score is between 0 and 1
ALTER TABLE public.chat_messages 
ADD CONSTRAINT check_valid_confidence 
CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1));

-- Ensure response time is positive
ALTER TABLE public.chat_conversations 
ADD CONSTRAINT check_positive_response_time 
CHECK (response_time IS NULL OR response_time > 0);

-- ============================================
-- VERIFY CONSTRAINTS
-- ============================================

DO $$
DECLARE
    constraint_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO constraint_count
    FROM pg_constraint
    WHERE conname LIKE 'check_%'
    AND connamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
    
    RAISE NOTICE 'Data integrity constraints added successfully';
    RAISE NOTICE 'Total check constraints in database: %', constraint_count;
    RAISE NOTICE 'These constraints will prevent:';
    RAISE NOTICE '  - Negative prices and amounts';
    RAISE NOTICE '  - Invalid email formats';
    RAISE NOTICE '  - Illogical time ranges';
    RAISE NOTICE '  - Out-of-range values';
END $$;