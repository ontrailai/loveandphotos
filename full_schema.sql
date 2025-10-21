


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE SCHEMA IF NOT EXISTS "storage";


ALTER SCHEMA "storage" OWNER TO "supabase_admin";


CREATE TYPE "public"."booking_status" AS ENUM (
    'pending',
    'confirmed',
    'completed',
    'cancelled',
    'declined_by_talent'
);


ALTER TYPE "public"."booking_status" OWNER TO "postgres";


CREATE TYPE "public"."payment_status" AS ENUM (
    'pending',
    'paid',
    'refunded',
    'failed'
);


ALTER TYPE "public"."payment_status" OWNER TO "postgres";


CREATE TYPE "public"."upload_status" AS ENUM (
    'pending',
    'in_progress',
    'completed',
    'approved'
);


ALTER TYPE "public"."upload_status" OWNER TO "postgres";


CREATE TYPE "public"."user_role" AS ENUM (
    'customer',
    'photographer',
    'admin'
);


ALTER TYPE "public"."user_role" OWNER TO "postgres";


CREATE TYPE "storage"."buckettype" AS ENUM (
    'STANDARD',
    'ANALYTICS'
);


ALTER TYPE "storage"."buckettype" OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "public"."audit_account_blacklist"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  IF NEW.is_blacklisted = TRUE AND (OLD.is_blacklisted IS NULL OR OLD.is_blacklisted = FALSE) THEN
    INSERT INTO admin_audit_log (user_id, actor_id, action, payload)
    VALUES (
      NEW.id,
      COALESCE(auth.uid(), NEW.id), -- Use current user or self
      'account_blacklisted',
      jsonb_build_object(
        'reason', NEW.delete_reason,
        'soft_deleted', NEW.soft_deleted,
        'deleted_at', NEW.deleted_at
      )
    );
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."audit_account_blacklist"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."auto_publish_complete_profile"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  is_complete BOOLEAN;
BEGIN
  -- Check if profile is complete
  is_complete := public.is_photographer_profile_complete(NEW.*);

  -- Auto-publish if complete and not already public
  IF is_complete AND (NEW.is_public = false OR NEW.is_public IS NULL) THEN
    NEW.is_public := true;
    RAISE NOTICE 'Profile auto-published: All requirements met for photographer %', NEW.user_id;

  -- Auto-unpublish if incomplete and currently public
  ELSIF NOT is_complete AND NEW.is_public = true THEN
    NEW.is_public := false;
    RAISE NOTICE 'Profile auto-unpublished: Requirements no longer met for photographer %', NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."auto_publish_complete_profile"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."auto_publish_complete_profile"() IS 'Automatically publishes photographer profiles when all requirements are met.
Sets is_public=true when profile becomes complete.
Sets is_public=false when profile becomes incomplete.
visible_in_search is auto-computed as (is_public AND profile_complete).';



CREATE OR REPLACE FUNCTION "public"."calculate_booking_hours"("start_time" time without time zone, "end_time" time without time zone) RETURNS numeric
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
BEGIN
  -- Calculate the difference in hours (handles times crossing midnight)
  RETURN EXTRACT(EPOCH FROM (end_time - start_time)) / 3600.0;
END;
$$;


ALTER FUNCTION "public"."calculate_booking_hours"("start_time" time without time zone, "end_time" time without time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_daily_chat_analytics"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_date DATE := CURRENT_DATE - INTERVAL '1 day';
  v_total_conversations INTEGER;
  v_unique_users INTEGER;
  v_avg_messages DECIMAL(5,2);
  v_avg_response DECIMAL(5,2);
  v_positive INTEGER;
  v_neutral INTEGER;
  v_negative INTEGER;
  v_unanswered INTEGER;
  v_escalated INTEGER;
  v_top_intents JSONB;
BEGIN
  -- Calculate metrics
  SELECT 
    COUNT(DISTINCT id),
    COUNT(DISTINCT user_id),
    AVG(message_count),
    AVG(response_time)
  INTO v_total_conversations, v_unique_users, v_avg_messages, v_avg_response
  FROM chat_conversations
  WHERE DATE(created_at) = v_date;
  
  -- Calculate satisfaction
  SELECT 
    COUNT(*) FILTER (WHERE satisfaction = 'positive'),
    COUNT(*) FILTER (WHERE satisfaction = 'neutral'),
    COUNT(*) FILTER (WHERE satisfaction = 'negative'),
    COUNT(*) FILTER (WHERE status = 'unanswered'),
    COUNT(*) FILTER (WHERE status = 'escalated')
  INTO v_positive, v_neutral, v_negative, v_unanswered, v_escalated
  FROM chat_conversations
  WHERE DATE(created_at) = v_date;
  
  -- Get top intents
  SELECT jsonb_agg(intent_count)
  INTO v_top_intents
  FROM (
    SELECT jsonb_build_object(
      'intent', intent,
      'count', COUNT(*)
    ) as intent_count
    FROM chat_messages
    WHERE DATE(created_at) = v_date
      AND intent IS NOT NULL
    GROUP BY intent
    ORDER BY COUNT(*) DESC
    LIMIT 10
  ) t;
  
  -- Insert or update analytics
  INSERT INTO chat_analytics (
    date,
    total_conversations,
    unique_users,
    avg_messages_per_conversation,
    avg_response_time,
    satisfaction_positive,
    satisfaction_neutral,
    satisfaction_negative,
    unanswered_count,
    escalated_count,
    top_intents
  ) VALUES (
    v_date,
    COALESCE(v_total_conversations, 0),
    COALESCE(v_unique_users, 0),
    COALESCE(v_avg_messages, 0),
    COALESCE(v_avg_response, 0),
    COALESCE(v_positive, 0),
    COALESCE(v_neutral, 0),
    COALESCE(v_negative, 0),
    COALESCE(v_unanswered, 0),
    COALESCE(v_escalated, 0),
    v_top_intents
  )
  ON CONFLICT (date) DO UPDATE SET
    total_conversations = EXCLUDED.total_conversations,
    unique_users = EXCLUDED.unique_users,
    avg_messages_per_conversation = EXCLUDED.avg_messages_per_conversation,
    avg_response_time = EXCLUDED.avg_response_time,
    satisfaction_positive = EXCLUDED.satisfaction_positive,
    satisfaction_neutral = EXCLUDED.satisfaction_neutral,
    satisfaction_negative = EXCLUDED.satisfaction_negative,
    unanswered_count = EXCLUDED.unanswered_count,
    escalated_count = EXCLUDED.escalated_count,
    top_intents = EXCLUDED.top_intents;
END;
$$;


ALTER FUNCTION "public"."calculate_daily_chat_analytics"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_photographer_acceptance_rate"("photographer_uuid" "uuid") RETURNS numeric
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    total_requests INTEGER;
    accepted_requests INTEGER;
BEGIN
    -- Count total booking requests
    SELECT COUNT(*)
    INTO total_requests
    FROM bookings
    WHERE photographer_id = photographer_uuid
    AND booking_status IN ('confirmed', 'cancelled', 'completed');

    -- Count accepted requests (confirmed + completed)
    SELECT COUNT(*)
    INTO accepted_requests
    FROM bookings
    WHERE photographer_id = photographer_uuid
    AND booking_status IN ('confirmed', 'completed');

    -- Return acceptance rate as percentage (0-100)
    IF total_requests > 0 THEN
        RETURN ROUND((accepted_requests::NUMERIC / total_requests::NUMERIC) * 100, 2);
    ELSE
        RETURN NULL;
    END IF;
END;
$$;


ALTER FUNCTION "public"."calculate_photographer_acceptance_rate"("photographer_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_photographer_response_time"("photographer_uuid" "uuid") RETURNS numeric
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    avg_response_minutes NUMERIC;
    response_count INTEGER;
BEGIN
    -- Calculate average response time for initial messages
    WITH response_times AS (
        SELECT 
            MIN(EXTRACT(EPOCH FROM (r.created_at - m.created_at)) / 60) AS response_minutes
        FROM messages m
        -- Find photographer's first response to each initial message
        JOIN LATERAL (
            SELECT created_at
            FROM messages
            WHERE sender_id = photographer_uuid
            AND recipient_id = m.sender_id
            AND created_at > m.created_at
            ORDER BY created_at ASC
            LIMIT 1
        ) r ON true
        WHERE m.recipient_id = photographer_uuid
        AND m.is_initial = true
        AND m.created_at > NOW() - INTERVAL '30 days'  -- Only consider recent messages
        GROUP BY m.id
    )
    SELECT 
        AVG(response_minutes),
        COUNT(*)
    INTO avg_response_minutes, response_count
    FROM response_times
    WHERE response_minutes <= 2880;  -- Only count responses within 48 hours
    
    -- If less than 3 responses, return NULL (insufficient data)
    IF response_count < 3 THEN
        RETURN NULL;
    END IF;
    
    RETURN ROUND(avg_response_minutes, 0);
END;
$$;


ALTER FUNCTION "public"."calculate_photographer_response_time"("photographer_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_photographer_tier_upgrade"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    new_tier_id INTEGER;
BEGIN
    SELECT id INTO new_tier_id
    FROM public.pay_tiers
    WHERE min_jobs_required <= NEW.completed_jobs_count
    ORDER BY min_jobs_required DESC
    LIMIT 1;
    
    IF new_tier_id IS NOT NULL AND new_tier_id > NEW.pay_tier_id THEN
        NEW.pay_tier_id = new_tier_id;
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."check_photographer_tier_upgrade"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_application_status"("p_email" "text") RETURNS TABLE("application_id" "uuid", "is_accepted" boolean, "submitted_at" timestamp with time zone, "role" "text")
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."get_application_status"("p_email" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_available_photographers"("event_date" "date", "search_zip" "text" DEFAULT NULL::"text") RETURNS TABLE("id" "uuid", "user_id" "uuid", "bio" "text", "experience_years" integer, "average_rating" numeric, "total_reviews" integer, "is_verified" boolean, "unavailable_dates" "date"[])
    LANGUAGE "plpgsql" STABLE
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.user_id,
    p.bio,
    p.experience_years,
    p.average_rating,
    p.total_reviews,
    p.is_verified,
    p.unavailable_dates
  FROM public.photographers p
  WHERE p.visible_in_search = true
    AND NOT (event_date = ANY(COALESCE(p.unavailable_dates, ARRAY[]::DATE[])))
    AND (search_zip IS NULL OR p.zip_code = search_zip);
END;
$$;


ALTER FUNCTION "public"."get_available_photographers"("event_date" "date", "search_zip" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_blacklisted_talents_for_customer"("p_customer_id" "uuid") RETURNS TABLE("talent_id" "uuid")
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT declined_jobs.talent_id
    FROM public.declined_jobs
    WHERE declined_jobs.customer_id = p_customer_id;
END;
$$;


ALTER FUNCTION "public"."get_blacklisted_talents_for_customer"("p_customer_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_photographer_stats"("photographer_user_id" "uuid") RETURNS TABLE("has_enough_data" boolean, "acceptance_rate" numeric, "accepted_offers" integer, "total_offers" integer, "avg_response_time_hours" numeric)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  photographer_rec RECORD;
  booking_stats RECORD;
  min_bookings INTEGER := 5; -- Minimum bookings for reliable stats
BEGIN
  -- Get photographer record
  SELECT
    p.*,
    u.id as user_id
  INTO photographer_rec
  FROM public.photographers p
  JOIN public.users u ON u.id = p.user_id
  WHERE u.id = photographer_user_id;

  IF NOT FOUND THEN
    -- Return empty stats for non-existent photographer
    RETURN QUERY SELECT FALSE, 0::DECIMAL, 0, 0, 0::DECIMAL;
    RETURN;
  END IF;

  -- Check for manual overrides first
  IF photographer_rec.manual_override_acceptance_rate IS NOT NULL OR 
     photographer_rec.manual_override_response_time IS NOT NULL THEN
    RETURN QUERY SELECT 
      TRUE, -- Has enough data (manual override)
      COALESCE(photographer_rec.manual_override_acceptance_rate, photographer_rec.acceptance_rate, 0)::DECIMAL,
      0, -- We don't track individual counts with manual override
      0, -- We don't track individual counts with manual override
      COALESCE(photographer_rec.manual_override_response_time::DECIMAL / 60, 
               photographer_rec.avg_response_time_minutes::DECIMAL / 60, 0)::DECIMAL;
    RETURN;
  END IF;

  -- Calculate booking statistics from actual data
  -- Use contract_signed_at - created_at for response time (when photographer accepted/confirmed)
  SELECT
    COUNT(*) FILTER (WHERE booking_status = 'confirmed') as accepted_count,
    COUNT(*) as total_count,
    AVG(
      CASE 
        WHEN booking_status = 'confirmed' AND contract_signed_at IS NOT NULL 
        THEN EXTRACT(EPOCH FROM (contract_signed_at - created_at)) / 3600 
        ELSE NULL 
      END
    ) as avg_response_hours
  INTO booking_stats
  FROM public.bookings
  WHERE photographer_id = photographer_rec.id
    AND booking_status IN ('confirmed', 'rejected', 'cancelled');

  -- Determine if we have enough data
  IF booking_stats.total_count >= min_bookings THEN
    -- We have enough data for reliable stats
    RETURN QUERY SELECT
      TRUE,
      CASE 
        WHEN booking_stats.total_count > 0 
        THEN (booking_stats.accepted_count::DECIMAL / booking_stats.total_count::DECIMAL * 100)
        ELSE 0
      END,
      booking_stats.accepted_count,
      booking_stats.total_count,
      COALESCE(booking_stats.avg_response_hours, 0)::DECIMAL;
      
    -- Update cached values in photographers table
    UPDATE public.photographers
    SET 
      acceptance_rate = CASE 
        WHEN booking_stats.total_count > 0 
        THEN (booking_stats.accepted_count::DECIMAL / booking_stats.total_count::DECIMAL * 100)
        ELSE NULL
      END,
      avg_response_time_minutes = COALESCE(booking_stats.avg_response_hours * 60, NULL),
      has_minimum_data = TRUE
    WHERE id = photographer_rec.id;
  ELSE
    -- Not enough data for reliable stats
    RETURN QUERY SELECT
      FALSE,
      CASE 
        WHEN booking_stats.total_count > 0 
        THEN (booking_stats.accepted_count::DECIMAL / booking_stats.total_count::DECIMAL * 100)
        ELSE 0
      END,
      booking_stats.accepted_count,
      booking_stats.total_count,
      COALESCE(booking_stats.avg_response_hours, 0)::DECIMAL;
      
    -- Update has_minimum_data flag
    UPDATE public.photographers
    SET has_minimum_data = FALSE
    WHERE id = photographer_rec.id;
  END IF;
END;
$$;


ALTER FUNCTION "public"."get_photographer_stats"("photographer_user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_photographer_stats"("photographer_user_id" "uuid") IS 'Returns photographer statistics - FIXED to use contract_signed_at instead of non-existent responded_at column';



CREATE OR REPLACE FUNCTION "public"."has_accepted_application"("p_user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.talent_applications
        WHERE user_id = p_user_id
        AND is_accepted = true
    );
END;
$$;


ALTER FUNCTION "public"."has_accepted_application"("p_user_id" "uuid") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."photographers" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "bio" "text",
    "camera_type" "text"[],
    "equipment_list" "jsonb" DEFAULT '[]'::"jsonb",
    "pay_tier_id" integer DEFAULT 1,
    "portfolio_url" "text",
    "website_url" "text",
    "instagram_handle" "text",
    "experience_years" integer DEFAULT 0,
    "completed_jobs_count" integer DEFAULT 0,
    "languages" "text"[] DEFAULT ARRAY['English'::"text"],
    "specialties" "text"[],
    "travel_radius_miles" integer DEFAULT 25,
    "trust_badges" "text"[] DEFAULT ARRAY[]::"text"[],
    "is_public" boolean DEFAULT true,
    "is_verified" boolean DEFAULT false,
    "average_rating" numeric(3,2) DEFAULT 0.00,
    "total_reviews" integer DEFAULT 0,
    "response_time_hours" integer,
    "cancellation_rate" numeric(5,2) DEFAULT 0.00,
    "onboarding_completed" boolean DEFAULT false,
    "onboarding_step" integer DEFAULT 1,
    "stripe_account_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "booking_acceptance_rate" numeric(5,2),
    "acceptance_rate" double precision,
    "avg_response_time_minutes" integer,
    "total_booking_requests" integer DEFAULT 0,
    "total_accepted_bookings" integer DEFAULT 0,
    "has_minimum_data" boolean DEFAULT false,
    "manual_override_acceptance_rate" double precision,
    "manual_override_response_time" integer,
    "metrics_last_updated" timestamp without time zone,
    "gender" "text",
    "style_tags" "text"[] DEFAULT ARRAY[]::"text"[],
    "is_videographer" boolean DEFAULT false,
    "lnp_choice" boolean DEFAULT false,
    "portfolio_images" "text"[] DEFAULT ARRAY[]::"text"[],
    "address_line1" "text",
    "city" "text",
    "state" "text",
    "zip_code" "text",
    "country" "text" DEFAULT 'USA'::"text",
    "profile_complete" boolean DEFAULT false,
    "unavailable_dates" "date"[] DEFAULT ARRAY[]::"date"[],
    "visible_in_search" boolean GENERATED ALWAYS AS ((("is_public" = true) AND ("profile_complete" = true))) STORED,
    "gear_has_camera" boolean DEFAULT false,
    "gear_has_lenses" boolean DEFAULT false,
    "gear_has_tripod" boolean DEFAULT false,
    "gear_has_gimbal" boolean DEFAULT false,
    "gear_has_drone" boolean DEFAULT false,
    "gear_has_audio_recorder" boolean DEFAULT false,
    "gear_has_lighting" boolean DEFAULT false,
    "training_completed" boolean DEFAULT false NOT NULL,
    CONSTRAINT "check_valid_experience_years" CHECK (("experience_years" >= 0)),
    CONSTRAINT "check_valid_travel_radius" CHECK ((("travel_radius_miles" >= 0) AND ("travel_radius_miles" <= 500))),
    CONSTRAINT "photographers_booking_acceptance_rate_check" CHECK ((("booking_acceptance_rate" >= (0)::numeric) AND ("booking_acceptance_rate" <= (100)::numeric))),
    CONSTRAINT "photographers_gender_check" CHECK ((("gender" IS NULL) OR ("gender" = ANY (ARRAY['male'::"text", 'female'::"text", 'prefer-not-to-say'::"text"]))))
);


ALTER TABLE "public"."photographers" OWNER TO "postgres";


COMMENT ON COLUMN "public"."photographers"."acceptance_rate" IS 'Calculated acceptance rate (accepted/total requests) - NULL if insufficient data';



COMMENT ON COLUMN "public"."photographers"."avg_response_time_minutes" IS 'Average time to first response in minutes - NULL if insufficient data';



COMMENT ON COLUMN "public"."photographers"."total_booking_requests" IS 'Total number of booking requests received';



COMMENT ON COLUMN "public"."photographers"."total_accepted_bookings" IS 'Total number of bookings accepted';



COMMENT ON COLUMN "public"."photographers"."has_minimum_data" IS 'True if photographer has at least 3 booking requests for meaningful metrics';



COMMENT ON COLUMN "public"."photographers"."manual_override_acceptance_rate" IS 'Admin manual override for acceptance rate';



COMMENT ON COLUMN "public"."photographers"."manual_override_response_time" IS 'Admin manual override for response time in minutes';



COMMENT ON COLUMN "public"."photographers"."metrics_last_updated" IS 'Timestamp of last metrics calculation';



COMMENT ON COLUMN "public"."photographers"."address_line1" IS 'Street address line 1';



COMMENT ON COLUMN "public"."photographers"."city" IS 'City name';



COMMENT ON COLUMN "public"."photographers"."state" IS 'US State (2-letter code)';



COMMENT ON COLUMN "public"."photographers"."zip_code" IS 'ZIP code (5-digit format)';



COMMENT ON COLUMN "public"."photographers"."country" IS 'Country (default USA)';



COMMENT ON COLUMN "public"."photographers"."unavailable_dates" IS 'Array of dates when photographer is NOT available (blocked dates). All other future dates are available by default. Photographers manage blocked dates via the availability calendar.';



COMMENT ON COLUMN "public"."photographers"."gear_has_camera" IS 'Videographer owns professional camera(s) - used in gear checklist';



COMMENT ON COLUMN "public"."photographers"."gear_has_lenses" IS 'Videographer owns professional lenses - used in gear checklist';



COMMENT ON COLUMN "public"."photographers"."gear_has_tripod" IS 'Videographer owns tripod - used in gear checklist';



COMMENT ON COLUMN "public"."photographers"."gear_has_gimbal" IS 'Videographer owns gimbal/stabilizer - used in gear checklist';



COMMENT ON COLUMN "public"."photographers"."gear_has_drone" IS 'Videographer owns drone - used in gear checklist';



COMMENT ON COLUMN "public"."photographers"."gear_has_audio_recorder" IS 'Videographer owns professional audio equipment - used in gear checklist';



COMMENT ON COLUMN "public"."photographers"."gear_has_lighting" IS 'Videographer owns lighting gear - used in gear checklist';



COMMENT ON COLUMN "public"."photographers"."training_completed" IS 'Whether the photographer/videographer has completed the mandatory onboarding training video';



COMMENT ON CONSTRAINT "photographers_gender_check" ON "public"."photographers" IS 'Ensures gender can only be: male, female, prefer-not-to-say, or NULL';



CREATE OR REPLACE FUNCTION "public"."is_photographer_profile_complete"("photographer_record" "public"."photographers") RETURNS boolean
    LANGUAGE "plpgsql" STABLE
    AS $$
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

  -- Check portfolio images (minimum 10) - ONLY for photographers, NOT videographers
  portfolio_count := COALESCE(array_length(photographer_record.portfolio_images, 1), 0);

  -- Check languages (cannot be empty)
  languages_count := COALESCE(array_length(photographer_record.languages, 1), 0);

  -- Check profile photo via users table
  SELECT avatar_url INTO user_avatar_url
  FROM public.users
  WHERE id = photographer_record.user_id;

  has_profile_photo := user_avatar_url IS NOT NULL AND user_avatar_url != '';

  -- Check address fields (city, state, zip required)
  has_address := (
    photographer_record.city IS NOT NULL AND
    photographer_record.city != '' AND
    photographer_record.state IS NOT NULL AND
    photographer_record.state != '' AND
    photographer_record.zip_code IS NOT NULL AND
    photographer_record.zip_code != ''
  );

  -- Return true based on profile type
  IF photographer_record.is_videographer = true THEN
    -- Videographers do NOT need portfolio images
    RETURN (
      (bio_char_count >= 500 OR bio_word_count >= 100) AND
      languages_count > 0 AND
      has_profile_photo AND
      has_address
    );
  ELSE
    -- Photographers need portfolio images
    RETURN (
      (bio_char_count >= 500 OR bio_word_count >= 100) AND
      portfolio_count >= 10 AND
      languages_count > 0 AND
      has_profile_photo AND
      has_address
    );
  END IF;
END;
$$;


ALTER FUNCTION "public"."is_photographer_profile_complete"("photographer_record" "public"."photographers") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."is_photographer_profile_complete"("photographer_record" "public"."photographers") IS 'Checks if a profile meets all requirements for auto-publishing.
For photographers: Bio, Portfolio (10+ images), Languages, Profile photo, Address
For videographers: Bio, Languages, Profile photo, Address (NO portfolio requirement)';



CREATE OR REPLACE FUNCTION "public"."is_photographer_unavailable"("photographer_unavailable_dates" "date"[], "check_date" "date") RETURNS boolean
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
BEGIN
  RETURN check_date = ANY(photographer_unavailable_dates);
END;
$$;


ALTER FUNCTION "public"."is_photographer_unavailable"("photographer_unavailable_dates" "date"[], "check_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_talent_blacklisted_for_customer"("p_talent_id" "uuid", "p_customer_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.declined_jobs
        WHERE talent_id = p_talent_id
        AND customer_id = p_customer_id
    );
END;
$$;


ALTER FUNCTION "public"."is_talent_blacklisted_for_customer"("p_talent_id" "uuid", "p_customer_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."scheduled_update_photographer_metrics"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Update all photographer metrics
  PERFORM update_all_photographer_metrics();
  
  -- Log the update
  INSERT INTO audit_logs (action, entity_type, entity_id, created_at)
  VALUES ('scheduled_metrics_update', 'photographers', NULL, NOW());
END;
$$;


ALTER FUNCTION "public"."scheduled_update_photographer_metrics"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_photographer_display_name"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- When user's full_name is updated, update the corresponding preview profile
  UPDATE photographer_preview_profiles
  SET 
    display_name = NEW.full_name,
    updated_at = NOW()
  WHERE user_id = NEW.id;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."sync_photographer_display_name"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_update_photographer_metrics_on_booking"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Update metrics when booking status changes to confirmed, completed, or cancelled
  IF (TG_OP = 'UPDATE' AND 
      OLD.booking_status IS DISTINCT FROM NEW.booking_status AND
      NEW.booking_status IN ('confirmed', 'completed', 'cancelled')) OR
     (TG_OP = 'INSERT') THEN
    
    -- Update photographer metrics asynchronously
    PERFORM update_photographer_metrics(NEW.photographer_id);
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_update_photographer_metrics_on_booking"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_update_photographer_response_time"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  photographer_uuid UUID;
  is_first_response BOOLEAN;
BEGIN
  -- Check if this is from a photographer
  SELECT p.user_id INTO photographer_uuid
  FROM photographers p
  WHERE p.user_id = NEW.sender_id;
  
  IF photographer_uuid IS NOT NULL AND NEW.booking_id IS NOT NULL THEN
    -- Check if this is the first response from photographer for this booking
    SELECT NOT EXISTS (
      SELECT 1 FROM messages
      WHERE booking_id = NEW.booking_id
        AND sender_id = photographer_uuid
        AND id != NEW.id
        AND created_at < NEW.created_at
    ) INTO is_first_response;
    
    -- If it's the first response, update metrics
    IF is_first_response THEN
      PERFORM update_photographer_metrics(photographer_uuid);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_update_photographer_response_time"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_all_photographer_metrics"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  photographer_record RECORD;
BEGIN
  FOR photographer_record IN 
    SELECT user_id FROM photographers
  LOOP
    PERFORM update_photographer_metrics(photographer_record.user_id);
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."update_all_photographer_metrics"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_amendment_completed_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NEW.payment_status = 'paid' AND OLD.payment_status != 'paid' THEN
    NEW.completed_at = NOW();
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_amendment_completed_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_booking_contract_signed"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Update the booking to mark contract as signed
    UPDATE public.bookings
    SET contract_signed = true,
        updated_at = now()
    WHERE id = NEW.booking_id;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_booking_contract_signed"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_conversation_stats"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE chat_conversations
    SET 
      message_count = message_count + 1,
      last_message = NEW.content,
      updated_at = NOW()
    WHERE id = NEW.conversation_id;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_conversation_stats"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_customer_style_preferences_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_customer_style_preferences_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_logistics_questionnaire_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_logistics_questionnaire_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_photographer_metrics"("photographer_uuid" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  calc_acceptance_rate FLOAT;
  calc_total_requests INTEGER;
  calc_total_accepted INTEGER;
  calc_has_min_data BOOLEAN;
  calc_response_time INTEGER;
  override_acceptance FLOAT;
  override_response INTEGER;
BEGIN
  -- Get calculated acceptance rate
  SELECT 
    acceptance_rate_val,
    total_requests,
    total_accepted,
    has_min_data
  INTO 
    calc_acceptance_rate,
    calc_total_requests,
    calc_total_accepted,
    calc_has_min_data
  FROM calculate_photographer_acceptance_rate(photographer_uuid);

  -- Get calculated response time
  calc_response_time := calculate_photographer_response_time(photographer_uuid);

  -- Check for manual overrides
  SELECT 
    manual_override_acceptance_rate,
    manual_override_response_time
  INTO 
    override_acceptance,
    override_response
  FROM photographers
  WHERE user_id = photographer_uuid;

  -- Update photographer metrics
  UPDATE photographers
  SET 
    acceptance_rate = COALESCE(override_acceptance, calc_acceptance_rate),
    avg_response_time_minutes = COALESCE(override_response, calc_response_time),
    total_booking_requests = calc_total_requests,
    total_accepted_bookings = calc_total_accepted,
    has_minimum_data = calc_has_min_data,
    metrics_last_updated = NOW()
  WHERE user_id = photographer_uuid;
END;
$$;


ALTER FUNCTION "public"."update_photographer_metrics"("photographer_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_photographer_metrics_on_booking"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Only update if booking status changed to a final state
    -- Removed 'rejected' as it's not a valid enum value
    IF NEW.booking_status IN ('confirmed', 'cancelled', 'completed') AND
       (OLD.booking_status IS NULL OR OLD.booking_status != NEW.booking_status) THEN
        
        -- Update photographer metrics
        -- Fixed: use id instead of user_id to match foreign key relationship
        UPDATE photographers
        SET 
            acceptance_rate = calculate_photographer_acceptance_rate(NEW.photographer_id),
            has_minimum_data = CASE 
                WHEN calculate_photographer_acceptance_rate(NEW.photographer_id) IS NOT NULL 
                THEN true 
                ELSE has_minimum_data 
            END
        WHERE id = NEW.photographer_id;  -- Fixed: was user_id, should be id
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_photographer_metrics_on_booking"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_photographer_metrics_on_message"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Only update for photographer responses to initial messages
    IF NEW.sender_id IN (SELECT user_id FROM photographers) THEN
        UPDATE photographers
        SET 
            avg_response_time_minutes = calculate_photographer_response_time(NEW.sender_id),
            has_minimum_data = CASE 
                WHEN calculate_photographer_response_time(NEW.sender_id) IS NOT NULL 
                     AND acceptance_rate IS NOT NULL
                THEN true 
                ELSE has_minimum_data 
            END
        WHERE user_id = NEW.sender_id;
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_photographer_metrics_on_message"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_photographer_review_stats"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Update the photographer's review count and average rating
  UPDATE photographers
  SET
    total_reviews = (
      SELECT COUNT(*)
      FROM reviews
      WHERE photographer_id = COALESCE(NEW.photographer_id, OLD.photographer_id)
    ),
    average_rating = (
      SELECT ROUND(AVG(rating)::numeric, 2)
      FROM reviews
      WHERE photographer_id = COALESCE(NEW.photographer_id, OLD.photographer_id)
    ),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.photographer_id, OLD.photographer_id);

  RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION "public"."update_photographer_review_stats"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_photographer_stats"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    UPDATE public.photographers
    SET 
        average_rating = (
            SELECT AVG(rating)::DECIMAL(3,2)
            FROM public.reviews
            WHERE photographer_id = NEW.photographer_id
        ),
        total_reviews = (
            SELECT COUNT(*)
            FROM public.reviews
            WHERE photographer_id = NEW.photographer_id
        )
    WHERE id = NEW.photographer_id;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_photographer_stats"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_photographer_visibility"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  IF NEW.soft_deleted = TRUE OR NEW.is_blacklisted = TRUE THEN
    UPDATE photographers
    SET is_public = FALSE, visible_in_search = FALSE
    WHERE user_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_photographer_visibility"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_style_questionnaires_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_style_questionnaires_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_booking_date"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  photographer_unavailable_dates DATE[];
BEGIN
  -- Fetch photographer's unavailable dates
  SELECT unavailable_dates INTO photographer_unavailable_dates
  FROM public.photographers
  WHERE id = NEW.photographer_id;

  -- Check if booking date is in unavailable dates array
  IF is_photographer_unavailable(photographer_unavailable_dates, NEW.event_date) THEN
    RAISE EXCEPTION 'Cannot create booking: photographer is not available on %', NEW.event_date;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."validate_booking_date"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_photographer_visibility"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
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

    -- Check portfolio images ONLY for photographers (not videographers)
    IF NEW.is_videographer = false AND COALESCE(array_length(NEW.portfolio_images, 1), 0) < 10 THEN
      RAISE EXCEPTION 'At least 10 portfolio images are required to appear in search'
        USING HINT = 'Upload more portfolio images in the Portfolio section';
    END IF;

    -- Check languages
    IF COALESCE(array_length(NEW.languages, 1), 0) = 0 THEN
      RAISE EXCEPTION 'At least one language must be selected to appear in search.'
        USING HINT = 'Add your language proficiency in Profile Settings';
    END IF;

    -- Check address (city, state, zip required)
    IF NEW.city IS NULL OR NEW.city = '' OR
       NEW.state IS NULL OR NEW.state = '' OR
       NEW.zip_code IS NULL OR NEW.zip_code = '' THEN
      RAISE EXCEPTION 'City, state, and ZIP code are required to appear in search.'
        USING HINT = 'Fill in your address (city, state, ZIP) in Profile Settings';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."validate_photographer_visibility"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."validate_photographer_visibility"() IS 'Validates profile completeness before allowing visible_in_search=true.
Videographers do NOT need portfolio images. Photographers need 10+ portfolio images.';



CREATE OR REPLACE FUNCTION "public"."validate_videographer_style_tags"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  approved_styles TEXT[] := ARRAY[
    'Candid',
    'Cinematic',
    'Documentary',
    'Fine Art',
    'Lifestyle',
    'Moody',
    'Vintage',
    'Modern',
    'Bright & Airy',
    'Posed',
    'Editorial'
  ];
  style TEXT;
BEGIN
  -- Only validate if style_tags is being updated and is not null
  IF NEW.style_tags IS NOT NULL THEN
    FOREACH style IN ARRAY NEW.style_tags
    LOOP
      IF NOT (style = ANY(approved_styles)) THEN
        RAISE EXCEPTION 'Invalid video style: %. Allowed styles are: %', 
          style, array_to_string(approved_styles, ', ')
          USING ERRCODE = 'P0001',
                HINT = 'Please select only from the approved video styles';
      END IF;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."validate_videographer_style_tags"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "storage"."add_prefixes"("_bucket_id" "text", "_name" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    prefixes text[];
BEGIN
    prefixes := "storage"."get_prefixes"("_name");

    IF array_length(prefixes, 1) > 0 THEN
        INSERT INTO storage.prefixes (name, bucket_id)
        SELECT UNNEST(prefixes) as name, "_bucket_id" ON CONFLICT DO NOTHING;
    END IF;
END;
$$;


ALTER FUNCTION "storage"."add_prefixes"("_bucket_id" "text", "_name" "text") OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."can_insert_object"("bucketid" "text", "name" "text", "owner" "uuid", "metadata" "jsonb") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  INSERT INTO "storage"."objects" ("bucket_id", "name", "owner", "metadata") VALUES (bucketid, name, owner, metadata);
  -- hack to rollback the successful insert
  RAISE sqlstate 'PT200' using
  message = 'ROLLBACK',
  detail = 'rollback successful insert';
END
$$;


ALTER FUNCTION "storage"."can_insert_object"("bucketid" "text", "name" "text", "owner" "uuid", "metadata" "jsonb") OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."delete_leaf_prefixes"("bucket_ids" "text"[], "names" "text"[]) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_rows_deleted integer;
BEGIN
    LOOP
        WITH candidates AS (
            SELECT DISTINCT
                t.bucket_id,
                unnest(storage.get_prefixes(t.name)) AS name
            FROM unnest(bucket_ids, names) AS t(bucket_id, name)
        ),
        uniq AS (
             SELECT
                 bucket_id,
                 name,
                 storage.get_level(name) AS level
             FROM candidates
             WHERE name <> ''
             GROUP BY bucket_id, name
        ),
        leaf AS (
             SELECT
                 p.bucket_id,
                 p.name,
                 p.level
             FROM storage.prefixes AS p
                  JOIN uniq AS u
                       ON u.bucket_id = p.bucket_id
                           AND u.name = p.name
                           AND u.level = p.level
             WHERE NOT EXISTS (
                 SELECT 1
                 FROM storage.objects AS o
                 WHERE o.bucket_id = p.bucket_id
                   AND o.level = p.level + 1
                   AND o.name COLLATE "C" LIKE p.name || '/%'
             )
             AND NOT EXISTS (
                 SELECT 1
                 FROM storage.prefixes AS c
                 WHERE c.bucket_id = p.bucket_id
                   AND c.level = p.level + 1
                   AND c.name COLLATE "C" LIKE p.name || '/%'
             )
        )
        DELETE
        FROM storage.prefixes AS p
            USING leaf AS l
        WHERE p.bucket_id = l.bucket_id
          AND p.name = l.name
          AND p.level = l.level;

        GET DIAGNOSTICS v_rows_deleted = ROW_COUNT;
        EXIT WHEN v_rows_deleted = 0;
    END LOOP;
END;
$$;


ALTER FUNCTION "storage"."delete_leaf_prefixes"("bucket_ids" "text"[], "names" "text"[]) OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."delete_prefix"("_bucket_id" "text", "_name" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Check if we can delete the prefix
    IF EXISTS(
        SELECT FROM "storage"."prefixes"
        WHERE "prefixes"."bucket_id" = "_bucket_id"
          AND level = "storage"."get_level"("_name") + 1
          AND "prefixes"."name" COLLATE "C" LIKE "_name" || '/%'
        LIMIT 1
    )
    OR EXISTS(
        SELECT FROM "storage"."objects"
        WHERE "objects"."bucket_id" = "_bucket_id"
          AND "storage"."get_level"("objects"."name") = "storage"."get_level"("_name") + 1
          AND "objects"."name" COLLATE "C" LIKE "_name" || '/%'
        LIMIT 1
    ) THEN
    -- There are sub-objects, skip deletion
    RETURN false;
    ELSE
        DELETE FROM "storage"."prefixes"
        WHERE "prefixes"."bucket_id" = "_bucket_id"
          AND level = "storage"."get_level"("_name")
          AND "prefixes"."name" = "_name";
        RETURN true;
    END IF;
END;
$$;


ALTER FUNCTION "storage"."delete_prefix"("_bucket_id" "text", "_name" "text") OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."delete_prefix_hierarchy_trigger"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    prefix text;
BEGIN
    prefix := "storage"."get_prefix"(OLD."name");

    IF coalesce(prefix, '') != '' THEN
        PERFORM "storage"."delete_prefix"(OLD."bucket_id", prefix);
    END IF;

    RETURN OLD;
END;
$$;


ALTER FUNCTION "storage"."delete_prefix_hierarchy_trigger"() OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."enforce_bucket_name_length"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
    if length(new.name) > 100 then
        raise exception 'bucket name "%" is too long (% characters). Max is 100.', new.name, length(new.name);
    end if;
    return new;
end;
$$;


ALTER FUNCTION "storage"."enforce_bucket_name_length"() OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."extension"("name" "text") RETURNS "text"
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
DECLARE
    _parts text[];
    _filename text;
BEGIN
    SELECT string_to_array(name, '/') INTO _parts;
    SELECT _parts[array_length(_parts,1)] INTO _filename;
    RETURN reverse(split_part(reverse(_filename), '.', 1));
END
$$;


ALTER FUNCTION "storage"."extension"("name" "text") OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."filename"("name" "text") RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
_parts text[];
BEGIN
	select string_to_array(name, '/') into _parts;
	return _parts[array_length(_parts,1)];
END
$$;


ALTER FUNCTION "storage"."filename"("name" "text") OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."foldername"("name" "text") RETURNS "text"[]
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
DECLARE
    _parts text[];
BEGIN
    -- Split on "/" to get path segments
    SELECT string_to_array(name, '/') INTO _parts;
    -- Return everything except the last segment
    RETURN _parts[1 : array_length(_parts,1) - 1];
END
$$;


ALTER FUNCTION "storage"."foldername"("name" "text") OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."get_level"("name" "text") RETURNS integer
    LANGUAGE "sql" IMMUTABLE STRICT
    AS $$
SELECT array_length(string_to_array("name", '/'), 1);
$$;


ALTER FUNCTION "storage"."get_level"("name" "text") OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."get_prefix"("name" "text") RETURNS "text"
    LANGUAGE "sql" IMMUTABLE STRICT
    AS $_$
SELECT
    CASE WHEN strpos("name", '/') > 0 THEN
             regexp_replace("name", '[\/]{1}[^\/]+\/?$', '')
         ELSE
             ''
        END;
$_$;


ALTER FUNCTION "storage"."get_prefix"("name" "text") OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."get_prefixes"("name" "text") RETURNS "text"[]
    LANGUAGE "plpgsql" IMMUTABLE STRICT
    AS $$
DECLARE
    parts text[];
    prefixes text[];
    prefix text;
BEGIN
    -- Split the name into parts by '/'
    parts := string_to_array("name", '/');
    prefixes := '{}';

    -- Construct the prefixes, stopping one level below the last part
    FOR i IN 1..array_length(parts, 1) - 1 LOOP
            prefix := array_to_string(parts[1:i], '/');
            prefixes := array_append(prefixes, prefix);
    END LOOP;

    RETURN prefixes;
END;
$$;


ALTER FUNCTION "storage"."get_prefixes"("name" "text") OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."get_size_by_bucket"() RETURNS TABLE("size" bigint, "bucket_id" "text")
    LANGUAGE "plpgsql" STABLE
    AS $$
BEGIN
    return query
        select sum((metadata->>'size')::bigint) as size, obj.bucket_id
        from "storage".objects as obj
        group by obj.bucket_id;
END
$$;


ALTER FUNCTION "storage"."get_size_by_bucket"() OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."list_multipart_uploads_with_delimiter"("bucket_id" "text", "prefix_param" "text", "delimiter_param" "text", "max_keys" integer DEFAULT 100, "next_key_token" "text" DEFAULT ''::"text", "next_upload_token" "text" DEFAULT ''::"text") RETURNS TABLE("key" "text", "id" "text", "created_at" timestamp with time zone)
    LANGUAGE "plpgsql"
    AS $_$
BEGIN
    RETURN QUERY EXECUTE
        'SELECT DISTINCT ON(key COLLATE "C") * from (
            SELECT
                CASE
                    WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                        substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1)))
                    ELSE
                        key
                END AS key, id, created_at
            FROM
                storage.s3_multipart_uploads
            WHERE
                bucket_id = $5 AND
                key ILIKE $1 || ''%'' AND
                CASE
                    WHEN $4 != '''' AND $6 = '''' THEN
                        CASE
                            WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                                substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1))) COLLATE "C" > $4
                            ELSE
                                key COLLATE "C" > $4
                            END
                    ELSE
                        true
                END AND
                CASE
                    WHEN $6 != '''' THEN
                        id COLLATE "C" > $6
                    ELSE
                        true
                    END
            ORDER BY
                key COLLATE "C" ASC, created_at ASC) as e order by key COLLATE "C" LIMIT $3'
        USING prefix_param, delimiter_param, max_keys, next_key_token, bucket_id, next_upload_token;
END;
$_$;


ALTER FUNCTION "storage"."list_multipart_uploads_with_delimiter"("bucket_id" "text", "prefix_param" "text", "delimiter_param" "text", "max_keys" integer, "next_key_token" "text", "next_upload_token" "text") OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."list_objects_with_delimiter"("bucket_id" "text", "prefix_param" "text", "delimiter_param" "text", "max_keys" integer DEFAULT 100, "start_after" "text" DEFAULT ''::"text", "next_token" "text" DEFAULT ''::"text") RETURNS TABLE("name" "text", "id" "uuid", "metadata" "jsonb", "updated_at" timestamp with time zone)
    LANGUAGE "plpgsql"
    AS $_$
BEGIN
    RETURN QUERY EXECUTE
        'SELECT DISTINCT ON(name COLLATE "C") * from (
            SELECT
                CASE
                    WHEN position($2 IN substring(name from length($1) + 1)) > 0 THEN
                        substring(name from 1 for length($1) + position($2 IN substring(name from length($1) + 1)))
                    ELSE
                        name
                END AS name, id, metadata, updated_at
            FROM
                storage.objects
            WHERE
                bucket_id = $5 AND
                name ILIKE $1 || ''%'' AND
                CASE
                    WHEN $6 != '''' THEN
                    name COLLATE "C" > $6
                ELSE true END
                AND CASE
                    WHEN $4 != '''' THEN
                        CASE
                            WHEN position($2 IN substring(name from length($1) + 1)) > 0 THEN
                                substring(name from 1 for length($1) + position($2 IN substring(name from length($1) + 1))) COLLATE "C" > $4
                            ELSE
                                name COLLATE "C" > $4
                            END
                    ELSE
                        true
                END
            ORDER BY
                name COLLATE "C" ASC) as e order by name COLLATE "C" LIMIT $3'
        USING prefix_param, delimiter_param, max_keys, next_token, bucket_id, start_after;
END;
$_$;


ALTER FUNCTION "storage"."list_objects_with_delimiter"("bucket_id" "text", "prefix_param" "text", "delimiter_param" "text", "max_keys" integer, "start_after" "text", "next_token" "text") OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."lock_top_prefixes"("bucket_ids" "text"[], "names" "text"[]) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_bucket text;
    v_top text;
BEGIN
    FOR v_bucket, v_top IN
        SELECT DISTINCT t.bucket_id,
            split_part(t.name, '/', 1) AS top
        FROM unnest(bucket_ids, names) AS t(bucket_id, name)
        WHERE t.name <> ''
        ORDER BY 1, 2
        LOOP
            PERFORM pg_advisory_xact_lock(hashtextextended(v_bucket || '/' || v_top, 0));
        END LOOP;
END;
$$;


ALTER FUNCTION "storage"."lock_top_prefixes"("bucket_ids" "text"[], "names" "text"[]) OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."objects_delete_cleanup"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_bucket_ids text[];
    v_names      text[];
BEGIN
    IF current_setting('storage.gc.prefixes', true) = '1' THEN
        RETURN NULL;
    END IF;

    PERFORM set_config('storage.gc.prefixes', '1', true);

    SELECT COALESCE(array_agg(d.bucket_id), '{}'),
           COALESCE(array_agg(d.name), '{}')
    INTO v_bucket_ids, v_names
    FROM deleted AS d
    WHERE d.name <> '';

    PERFORM storage.lock_top_prefixes(v_bucket_ids, v_names);
    PERFORM storage.delete_leaf_prefixes(v_bucket_ids, v_names);

    RETURN NULL;
END;
$$;


ALTER FUNCTION "storage"."objects_delete_cleanup"() OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."objects_insert_prefix_trigger"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    PERFORM "storage"."add_prefixes"(NEW."bucket_id", NEW."name");
    NEW.level := "storage"."get_level"(NEW."name");

    RETURN NEW;
END;
$$;


ALTER FUNCTION "storage"."objects_insert_prefix_trigger"() OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."objects_update_cleanup"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    -- NEW - OLD (destinations to create prefixes for)
    v_add_bucket_ids text[];
    v_add_names      text[];

    -- OLD - NEW (sources to prune)
    v_src_bucket_ids text[];
    v_src_names      text[];
BEGIN
    IF TG_OP <> 'UPDATE' THEN
        RETURN NULL;
    END IF;

    -- 1) Compute NEW−OLD (added paths) and OLD−NEW (moved-away paths)
    WITH added AS (
        SELECT n.bucket_id, n.name
        FROM new_rows n
        WHERE n.name <> '' AND position('/' in n.name) > 0
        EXCEPT
        SELECT o.bucket_id, o.name FROM old_rows o WHERE o.name <> ''
    ),
    moved AS (
         SELECT o.bucket_id, o.name
         FROM old_rows o
         WHERE o.name <> ''
         EXCEPT
         SELECT n.bucket_id, n.name FROM new_rows n WHERE n.name <> ''
    )
    SELECT
        -- arrays for ADDED (dest) in stable order
        COALESCE( (SELECT array_agg(a.bucket_id ORDER BY a.bucket_id, a.name) FROM added a), '{}' ),
        COALESCE( (SELECT array_agg(a.name      ORDER BY a.bucket_id, a.name) FROM added a), '{}' ),
        -- arrays for MOVED (src) in stable order
        COALESCE( (SELECT array_agg(m.bucket_id ORDER BY m.bucket_id, m.name) FROM moved m), '{}' ),
        COALESCE( (SELECT array_agg(m.name      ORDER BY m.bucket_id, m.name) FROM moved m), '{}' )
    INTO v_add_bucket_ids, v_add_names, v_src_bucket_ids, v_src_names;

    -- Nothing to do?
    IF (array_length(v_add_bucket_ids, 1) IS NULL) AND (array_length(v_src_bucket_ids, 1) IS NULL) THEN
        RETURN NULL;
    END IF;

    -- 2) Take per-(bucket, top) locks: ALL prefixes in consistent global order to prevent deadlocks
    DECLARE
        v_all_bucket_ids text[];
        v_all_names text[];
    BEGIN
        -- Combine source and destination arrays for consistent lock ordering
        v_all_bucket_ids := COALESCE(v_src_bucket_ids, '{}') || COALESCE(v_add_bucket_ids, '{}');
        v_all_names := COALESCE(v_src_names, '{}') || COALESCE(v_add_names, '{}');

        -- Single lock call ensures consistent global ordering across all transactions
        IF array_length(v_all_bucket_ids, 1) IS NOT NULL THEN
            PERFORM storage.lock_top_prefixes(v_all_bucket_ids, v_all_names);
        END IF;
    END;

    -- 3) Create destination prefixes (NEW−OLD) BEFORE pruning sources
    IF array_length(v_add_bucket_ids, 1) IS NOT NULL THEN
        WITH candidates AS (
            SELECT DISTINCT t.bucket_id, unnest(storage.get_prefixes(t.name)) AS name
            FROM unnest(v_add_bucket_ids, v_add_names) AS t(bucket_id, name)
            WHERE name <> ''
        )
        INSERT INTO storage.prefixes (bucket_id, name)
        SELECT c.bucket_id, c.name
        FROM candidates c
        ON CONFLICT DO NOTHING;
    END IF;

    -- 4) Prune source prefixes bottom-up for OLD−NEW
    IF array_length(v_src_bucket_ids, 1) IS NOT NULL THEN
        -- re-entrancy guard so DELETE on prefixes won't recurse
        IF current_setting('storage.gc.prefixes', true) <> '1' THEN
            PERFORM set_config('storage.gc.prefixes', '1', true);
        END IF;

        PERFORM storage.delete_leaf_prefixes(v_src_bucket_ids, v_src_names);
    END IF;

    RETURN NULL;
END;
$$;


ALTER FUNCTION "storage"."objects_update_cleanup"() OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."objects_update_level_trigger"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Ensure this is an update operation and the name has changed
    IF TG_OP = 'UPDATE' AND (NEW."name" <> OLD."name" OR NEW."bucket_id" <> OLD."bucket_id") THEN
        -- Set the new level
        NEW."level" := "storage"."get_level"(NEW."name");
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "storage"."objects_update_level_trigger"() OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."objects_update_prefix_trigger"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    old_prefixes TEXT[];
BEGIN
    -- Ensure this is an update operation and the name has changed
    IF TG_OP = 'UPDATE' AND (NEW."name" <> OLD."name" OR NEW."bucket_id" <> OLD."bucket_id") THEN
        -- Retrieve old prefixes
        old_prefixes := "storage"."get_prefixes"(OLD."name");

        -- Remove old prefixes that are only used by this object
        WITH all_prefixes as (
            SELECT unnest(old_prefixes) as prefix
        ),
        can_delete_prefixes as (
             SELECT prefix
             FROM all_prefixes
             WHERE NOT EXISTS (
                 SELECT 1 FROM "storage"."objects"
                 WHERE "bucket_id" = OLD."bucket_id"
                   AND "name" <> OLD."name"
                   AND "name" LIKE (prefix || '%')
             )
         )
        DELETE FROM "storage"."prefixes" WHERE name IN (SELECT prefix FROM can_delete_prefixes);

        -- Add new prefixes
        PERFORM "storage"."add_prefixes"(NEW."bucket_id", NEW."name");
    END IF;
    -- Set the new level
    NEW."level" := "storage"."get_level"(NEW."name");

    RETURN NEW;
END;
$$;


ALTER FUNCTION "storage"."objects_update_prefix_trigger"() OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."operation"() RETURNS "text"
    LANGUAGE "plpgsql" STABLE
    AS $$
BEGIN
    RETURN current_setting('storage.operation', true);
END;
$$;


ALTER FUNCTION "storage"."operation"() OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."prefixes_delete_cleanup"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_bucket_ids text[];
    v_names      text[];
BEGIN
    IF current_setting('storage.gc.prefixes', true) = '1' THEN
        RETURN NULL;
    END IF;

    PERFORM set_config('storage.gc.prefixes', '1', true);

    SELECT COALESCE(array_agg(d.bucket_id), '{}'),
           COALESCE(array_agg(d.name), '{}')
    INTO v_bucket_ids, v_names
    FROM deleted AS d
    WHERE d.name <> '';

    PERFORM storage.lock_top_prefixes(v_bucket_ids, v_names);
    PERFORM storage.delete_leaf_prefixes(v_bucket_ids, v_names);

    RETURN NULL;
END;
$$;


ALTER FUNCTION "storage"."prefixes_delete_cleanup"() OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."prefixes_insert_trigger"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    PERFORM "storage"."add_prefixes"(NEW."bucket_id", NEW."name");
    RETURN NEW;
END;
$$;


ALTER FUNCTION "storage"."prefixes_insert_trigger"() OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."search"("prefix" "text", "bucketname" "text", "limits" integer DEFAULT 100, "levels" integer DEFAULT 1, "offsets" integer DEFAULT 0, "search" "text" DEFAULT ''::"text", "sortcolumn" "text" DEFAULT 'name'::"text", "sortorder" "text" DEFAULT 'asc'::"text") RETURNS TABLE("name" "text", "id" "uuid", "updated_at" timestamp with time zone, "created_at" timestamp with time zone, "last_accessed_at" timestamp with time zone, "metadata" "jsonb")
    LANGUAGE "plpgsql"
    AS $$
declare
    can_bypass_rls BOOLEAN;
begin
    SELECT rolbypassrls
    INTO can_bypass_rls
    FROM pg_roles
    WHERE rolname = coalesce(nullif(current_setting('role', true), 'none'), current_user);

    IF can_bypass_rls THEN
        RETURN QUERY SELECT * FROM storage.search_v1_optimised(prefix, bucketname, limits, levels, offsets, search, sortcolumn, sortorder);
    ELSE
        RETURN QUERY SELECT * FROM storage.search_legacy_v1(prefix, bucketname, limits, levels, offsets, search, sortcolumn, sortorder);
    END IF;
end;
$$;


ALTER FUNCTION "storage"."search"("prefix" "text", "bucketname" "text", "limits" integer, "levels" integer, "offsets" integer, "search" "text", "sortcolumn" "text", "sortorder" "text") OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."search_legacy_v1"("prefix" "text", "bucketname" "text", "limits" integer DEFAULT 100, "levels" integer DEFAULT 1, "offsets" integer DEFAULT 0, "search" "text" DEFAULT ''::"text", "sortcolumn" "text" DEFAULT 'name'::"text", "sortorder" "text" DEFAULT 'asc'::"text") RETURNS TABLE("name" "text", "id" "uuid", "updated_at" timestamp with time zone, "created_at" timestamp with time zone, "last_accessed_at" timestamp with time zone, "metadata" "jsonb")
    LANGUAGE "plpgsql" STABLE
    AS $_$
declare
    v_order_by text;
    v_sort_order text;
begin
    case
        when sortcolumn = 'name' then
            v_order_by = 'name';
        when sortcolumn = 'updated_at' then
            v_order_by = 'updated_at';
        when sortcolumn = 'created_at' then
            v_order_by = 'created_at';
        when sortcolumn = 'last_accessed_at' then
            v_order_by = 'last_accessed_at';
        else
            v_order_by = 'name';
        end case;

    case
        when sortorder = 'asc' then
            v_sort_order = 'asc';
        when sortorder = 'desc' then
            v_sort_order = 'desc';
        else
            v_sort_order = 'asc';
        end case;

    v_order_by = v_order_by || ' ' || v_sort_order;

    return query execute
        'with folders as (
           select path_tokens[$1] as folder
           from storage.objects
             where objects.name ilike $2 || $3 || ''%''
               and bucket_id = $4
               and array_length(objects.path_tokens, 1) <> $1
           group by folder
           order by folder ' || v_sort_order || '
     )
     (select folder as "name",
            null as id,
            null as updated_at,
            null as created_at,
            null as last_accessed_at,
            null as metadata from folders)
     union all
     (select path_tokens[$1] as "name",
            id,
            updated_at,
            created_at,
            last_accessed_at,
            metadata
     from storage.objects
     where objects.name ilike $2 || $3 || ''%''
       and bucket_id = $4
       and array_length(objects.path_tokens, 1) = $1
     order by ' || v_order_by || ')
     limit $5
     offset $6' using levels, prefix, search, bucketname, limits, offsets;
end;
$_$;


ALTER FUNCTION "storage"."search_legacy_v1"("prefix" "text", "bucketname" "text", "limits" integer, "levels" integer, "offsets" integer, "search" "text", "sortcolumn" "text", "sortorder" "text") OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."search_v1_optimised"("prefix" "text", "bucketname" "text", "limits" integer DEFAULT 100, "levels" integer DEFAULT 1, "offsets" integer DEFAULT 0, "search" "text" DEFAULT ''::"text", "sortcolumn" "text" DEFAULT 'name'::"text", "sortorder" "text" DEFAULT 'asc'::"text") RETURNS TABLE("name" "text", "id" "uuid", "updated_at" timestamp with time zone, "created_at" timestamp with time zone, "last_accessed_at" timestamp with time zone, "metadata" "jsonb")
    LANGUAGE "plpgsql" STABLE
    AS $_$
declare
    v_order_by text;
    v_sort_order text;
begin
    case
        when sortcolumn = 'name' then
            v_order_by = 'name';
        when sortcolumn = 'updated_at' then
            v_order_by = 'updated_at';
        when sortcolumn = 'created_at' then
            v_order_by = 'created_at';
        when sortcolumn = 'last_accessed_at' then
            v_order_by = 'last_accessed_at';
        else
            v_order_by = 'name';
        end case;

    case
        when sortorder = 'asc' then
            v_sort_order = 'asc';
        when sortorder = 'desc' then
            v_sort_order = 'desc';
        else
            v_sort_order = 'asc';
        end case;

    v_order_by = v_order_by || ' ' || v_sort_order;

    return query execute
        'with folders as (
           select (string_to_array(name, ''/''))[level] as name
           from storage.prefixes
             where lower(prefixes.name) like lower($2 || $3) || ''%''
               and bucket_id = $4
               and level = $1
           order by name ' || v_sort_order || '
     )
     (select name,
            null as id,
            null as updated_at,
            null as created_at,
            null as last_accessed_at,
            null as metadata from folders)
     union all
     (select path_tokens[level] as "name",
            id,
            updated_at,
            created_at,
            last_accessed_at,
            metadata
     from storage.objects
     where lower(objects.name) like lower($2 || $3) || ''%''
       and bucket_id = $4
       and level = $1
     order by ' || v_order_by || ')
     limit $5
     offset $6' using levels, prefix, search, bucketname, limits, offsets;
end;
$_$;


ALTER FUNCTION "storage"."search_v1_optimised"("prefix" "text", "bucketname" "text", "limits" integer, "levels" integer, "offsets" integer, "search" "text", "sortcolumn" "text", "sortorder" "text") OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."search_v2"("prefix" "text", "bucket_name" "text", "limits" integer DEFAULT 100, "levels" integer DEFAULT 1, "start_after" "text" DEFAULT ''::"text", "sort_order" "text" DEFAULT 'asc'::"text", "sort_column" "text" DEFAULT 'name'::"text", "sort_column_after" "text" DEFAULT ''::"text") RETURNS TABLE("key" "text", "name" "text", "id" "uuid", "updated_at" timestamp with time zone, "created_at" timestamp with time zone, "last_accessed_at" timestamp with time zone, "metadata" "jsonb")
    LANGUAGE "plpgsql" STABLE
    AS $_$
DECLARE
    sort_col text;
    sort_ord text;
    cursor_op text;
    cursor_expr text;
    sort_expr text;
BEGIN
    -- Validate sort_order
    sort_ord := lower(sort_order);
    IF sort_ord NOT IN ('asc', 'desc') THEN
        sort_ord := 'asc';
    END IF;

    -- Determine cursor comparison operator
    IF sort_ord = 'asc' THEN
        cursor_op := '>';
    ELSE
        cursor_op := '<';
    END IF;
    
    sort_col := lower(sort_column);
    -- Validate sort column  
    IF sort_col IN ('updated_at', 'created_at') THEN
        cursor_expr := format(
            '($5 = '''' OR ROW(date_trunc(''milliseconds'', %I), name COLLATE "C") %s ROW(COALESCE(NULLIF($6, '''')::timestamptz, ''epoch''::timestamptz), $5))',
            sort_col, cursor_op
        );
        sort_expr := format(
            'COALESCE(date_trunc(''milliseconds'', %I), ''epoch''::timestamptz) %s, name COLLATE "C" %s',
            sort_col, sort_ord, sort_ord
        );
    ELSE
        cursor_expr := format('($5 = '''' OR name COLLATE "C" %s $5)', cursor_op);
        sort_expr := format('name COLLATE "C" %s', sort_ord);
    END IF;

    RETURN QUERY EXECUTE format(
        $sql$
        SELECT * FROM (
            (
                SELECT
                    split_part(name, '/', $4) AS key,
                    name,
                    NULL::uuid AS id,
                    updated_at,
                    created_at,
                    NULL::timestamptz AS last_accessed_at,
                    NULL::jsonb AS metadata
                FROM storage.prefixes
                WHERE name COLLATE "C" LIKE $1 || '%%'
                    AND bucket_id = $2
                    AND level = $4
                    AND %s
                ORDER BY %s
                LIMIT $3
            )
            UNION ALL
            (
                SELECT
                    split_part(name, '/', $4) AS key,
                    name,
                    id,
                    updated_at,
                    created_at,
                    last_accessed_at,
                    metadata
                FROM storage.objects
                WHERE name COLLATE "C" LIKE $1 || '%%'
                    AND bucket_id = $2
                    AND level = $4
                    AND %s
                ORDER BY %s
                LIMIT $3
            )
        ) obj
        ORDER BY %s
        LIMIT $3
        $sql$,
        cursor_expr,    -- prefixes WHERE
        sort_expr,      -- prefixes ORDER BY
        cursor_expr,    -- objects WHERE
        sort_expr,      -- objects ORDER BY
        sort_expr       -- final ORDER BY
    )
    USING prefix, bucket_name, limits, levels, start_after, sort_column_after;
END;
$_$;


ALTER FUNCTION "storage"."search_v2"("prefix" "text", "bucket_name" "text", "limits" integer, "levels" integer, "start_after" "text", "sort_order" "text", "sort_column" "text", "sort_column_after" "text") OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW; 
END;
$$;


ALTER FUNCTION "storage"."update_updated_at_column"() OWNER TO "supabase_storage_admin";


CREATE TABLE IF NOT EXISTS "public"."account_purge_queue" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "booking_id" "uuid",
    "enqueued_at" timestamp with time zone DEFAULT "now"(),
    "purge_after" timestamp with time zone NOT NULL,
    "processed" boolean DEFAULT false,
    "processed_at" timestamp with time zone,
    "result" "text",
    "created_by" "uuid"
);


ALTER TABLE "public"."account_purge_queue" OWNER TO "postgres";


COMMENT ON TABLE "public"."account_purge_queue" IS 'Queue for scheduled permanent account deletions';



CREATE TABLE IF NOT EXISTS "public"."addons" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "price_cents" integer NOT NULL,
    "kind" "text" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "display_order" integer,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "code" "text",
    "icon_name" "text",
    CONSTRAINT "addons_kind_check" CHECK (("kind" = ANY (ARRAY['hour'::"text", 'addon'::"text"]))),
    CONSTRAINT "addons_price_cents_check" CHECK (("price_cents" >= 0))
);


ALTER TABLE "public"."addons" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."admin_audit_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "actor_id" "uuid" NOT NULL,
    "action" "text" NOT NULL,
    "payload" "jsonb",
    "ip_address" "inet",
    "user_agent" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."admin_audit_log" OWNER TO "postgres";


COMMENT ON TABLE "public"."admin_audit_log" IS 'Immutable audit trail for admin actions and account changes';



CREATE TABLE IF NOT EXISTS "public"."audit_logs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "action" "text" NOT NULL,
    "entity_type" "text" NOT NULL,
    "entity_id" "uuid",
    "old_values" "jsonb",
    "new_values" "jsonb",
    "ip_address" "inet",
    "user_agent" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."audit_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."availability" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "photographer_id" "uuid" NOT NULL,
    "date" "date" NOT NULL,
    "is_available" boolean DEFAULT true,
    "time_slots" "jsonb" DEFAULT '[]'::"jsonb",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."availability" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."booking_addons" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "booking_id" "uuid" NOT NULL,
    "addon_id" "uuid" NOT NULL,
    "quantity" integer DEFAULT 1 NOT NULL,
    "unit_price_cents" integer NOT NULL,
    "late_fee_cents" integer DEFAULT 0 NOT NULL,
    "total_price_cents" integer NOT NULL,
    "payment_status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "stripe_payment_intent_id" "text",
    "purchased_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "booking_addons_late_fee_cents_check" CHECK (("late_fee_cents" >= 0)),
    CONSTRAINT "booking_addons_payment_status_check" CHECK (("payment_status" = ANY (ARRAY['pending'::"text", 'paid'::"text", 'failed'::"text", 'refunded'::"text"]))),
    CONSTRAINT "booking_addons_quantity_check" CHECK (("quantity" > 0)),
    CONSTRAINT "booking_addons_total_price_cents_check" CHECK (("total_price_cents" >= 0)),
    CONSTRAINT "booking_addons_unit_price_cents_check" CHECK (("unit_price_cents" >= 0))
);


ALTER TABLE "public"."booking_addons" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."booking_amendments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "booking_id" "uuid" NOT NULL,
    "amendment_type" "text" DEFAULT 'add_hours_and_addons'::"text",
    "hours_added" numeric DEFAULT 0,
    "add_ons_added" "jsonb" DEFAULT '[]'::"jsonb",
    "add_ons_removed" "jsonb" DEFAULT '[]'::"jsonb",
    "price_differential" numeric NOT NULL,
    "late_fee" numeric DEFAULT 0,
    "payment_status" "text" DEFAULT 'pending'::"text",
    "stripe_payment_intent_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "completed_at" timestamp with time zone,
    CONSTRAINT "booking_amendments_amendment_type_check" CHECK (("amendment_type" = ANY (ARRAY['add_hours_and_addons'::"text", 'add_hours'::"text", 'add_addons'::"text"]))),
    CONSTRAINT "booking_amendments_hours_added_check" CHECK (("hours_added" >= (0)::numeric)),
    CONSTRAINT "booking_amendments_late_fee_check" CHECK (("late_fee" >= (0)::numeric)),
    CONSTRAINT "booking_amendments_payment_status_check" CHECK (("payment_status" = ANY (ARRAY['pending'::"text", 'paid'::"text", 'failed'::"text"]))),
    CONSTRAINT "booking_amendments_price_differential_check" CHECK (("price_differential" >= (0)::numeric))
);


ALTER TABLE "public"."booking_amendments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."bookings" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "customer_id" "uuid" NOT NULL,
    "photographer_id" "uuid" NOT NULL,
    "package_id" "uuid",
    "event_date" "date" NOT NULL,
    "event_time" time without time zone,
    "event_end_time" time without time zone,
    "event_type" "text",
    "venue_name" "text",
    "venue_address" "jsonb",
    "guest_count" integer,
    "total_amount" numeric(10,2) NOT NULL,
    "deposit_amount" numeric(10,2),
    "payment_status" "public"."payment_status" DEFAULT 'pending'::"public"."payment_status",
    "booking_status" "public"."booking_status" DEFAULT 'pending'::"public"."booking_status",
    "personalization_data" "jsonb" DEFAULT '{}'::"jsonb",
    "special_requests" "text",
    "stripe_session_id" "text",
    "stripe_payment_intent_id" "text",
    "contract_url" "text",
    "contract_signed_at" timestamp with time zone,
    "cancellation_reason" "text",
    "cancelled_at" timestamp with time zone,
    "cancelled_by" "uuid",
    "overtime_hours" numeric(4,2) DEFAULT 0,
    "final_amount" numeric(10,2),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "contract_signed" boolean DEFAULT false,
    "contract_signed_url" "text",
    "payment_plan" "text" DEFAULT 'full'::"text",
    "payment_schedule" "jsonb" DEFAULT '[]'::"jsonb",
    "confirmation_email_sent" boolean DEFAULT false,
    "confirmation_email_sent_at" timestamp with time zone,
    "hours_booked" numeric(4,2),
    "package_total_cents" integer,
    "package_type" "text",
    "can_change_date" boolean DEFAULT false,
    "date_change_used" boolean DEFAULT false,
    "date_change_method" "text",
    "late_fee_applied" boolean DEFAULT false,
    "days_until_event" integer,
    "location_city" "text",
    "location_state" "text",
    "videographer_id" "uuid",
    CONSTRAINT "bookings_date_change_method_check" CHECK (("date_change_method" = ANY (ARRAY['included'::"text", 'post-booking-add-on'::"text"]))),
    CONSTRAINT "bookings_payment_plan_check" CHECK (("payment_plan" = ANY (ARRAY['full'::"text", 'deposit+3'::"text", 'installments'::"text", 'deposit500'::"text", 'monthly199'::"text"]))),
    CONSTRAINT "check_positive_total_amount" CHECK (("total_amount" > (0)::numeric)),
    CONSTRAINT "check_valid_deposit_amount" CHECK ((("deposit_amount" >= (0)::numeric) AND (("deposit_amount" IS NULL) OR ("deposit_amount" <= "total_amount")))),
    CONSTRAINT "check_valid_final_amount" CHECK ((("final_amount" IS NULL) OR ("final_amount" >= (0)::numeric))),
    CONSTRAINT "check_valid_overtime_hours" CHECK (("overtime_hours" >= (0)::numeric))
);


ALTER TABLE "public"."bookings" OWNER TO "postgres";


COMMENT ON COLUMN "public"."bookings"."contract_signed" IS 'Whether the customer has digitally signed the contract for this booking';



COMMENT ON COLUMN "public"."bookings"."contract_signed_url" IS 'URL to the signed contract PDF stored in Supabase Storage (signed-contracts bucket)';



COMMENT ON COLUMN "public"."bookings"."payment_plan" IS 'Payment plan type: full (100% upfront), deposit+3 (25% deposit + 3 monthly payments), installments (6 monthly payments)';



COMMENT ON COLUMN "public"."bookings"."payment_schedule" IS 'Array of scheduled payment objects with amount, due_date, status for installment plans';



COMMENT ON COLUMN "public"."bookings"."confirmation_email_sent" IS 'Whether the booking confirmation email has been sent';



COMMENT ON COLUMN "public"."bookings"."confirmation_email_sent_at" IS 'Timestamp when the confirmation email was sent';



COMMENT ON COLUMN "public"."bookings"."hours_booked" IS 'Number of hours for the photoshoot, calculated from event_time and event_end_time';



COMMENT ON COLUMN "public"."bookings"."package_total_cents" IS 'Package price in cents for compute.js calculations';



COMMENT ON COLUMN "public"."bookings"."package_type" IS 'Package tier name (Bronze/Silver/Gold/Platinum)';



COMMENT ON COLUMN "public"."bookings"."can_change_date" IS 'Whether customer has permission to change shoot date (purchased $50 add-on or paid $495)';



COMMENT ON COLUMN "public"."bookings"."date_change_used" IS 'Whether the one-time date change has already been used';



COMMENT ON COLUMN "public"."bookings"."date_change_method" IS 'How date change permission was obtained: included ($50 at booking) or post-booking-add-on ($495 later)';



COMMENT ON COLUMN "public"."bookings"."late_fee_applied" IS 'Indicates if $450 late booking fee was applied (for bookings within 30 days of event)';



COMMENT ON COLUMN "public"."bookings"."days_until_event" IS 'Number of days between booking creation and event date (for audit and reporting)';



COMMENT ON COLUMN "public"."bookings"."location_city" IS 'Event location city from booking flow';



COMMENT ON COLUMN "public"."bookings"."location_state" IS 'Event location state from booking flow';



COMMENT ON COLUMN "public"."bookings"."videographer_id" IS 'Optional videographer assigned to this booking - references photographers table where is_videographer = true';



CREATE TABLE IF NOT EXISTS "public"."chat_analytics" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "date" "date" DEFAULT CURRENT_DATE,
    "total_conversations" integer DEFAULT 0,
    "unique_users" integer DEFAULT 0,
    "avg_messages_per_conversation" numeric(5,2),
    "avg_response_time" numeric(5,2),
    "satisfaction_positive" integer DEFAULT 0,
    "satisfaction_neutral" integer DEFAULT 0,
    "satisfaction_negative" integer DEFAULT 0,
    "unanswered_count" integer DEFAULT 0,
    "escalated_count" integer DEFAULT 0,
    "top_intents" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."chat_analytics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."chat_conversations" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "session_id" "text" NOT NULL,
    "status" "text" DEFAULT 'active'::"text",
    "last_message" "text",
    "message_count" integer DEFAULT 0,
    "started_at" timestamp with time zone DEFAULT "now"(),
    "ended_at" timestamp with time zone,
    "satisfaction" "text",
    "flagged" boolean DEFAULT false,
    "response_time" integer,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "chat_conversations_satisfaction_check" CHECK (("satisfaction" = ANY (ARRAY['positive'::"text", 'neutral'::"text", 'negative'::"text"]))),
    CONSTRAINT "chat_conversations_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'completed'::"text", 'unanswered'::"text", 'escalated'::"text"]))),
    CONSTRAINT "check_positive_response_time" CHECK ((("response_time" IS NULL) OR ("response_time" > 0)))
);


ALTER TABLE "public"."chat_conversations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."chat_faq_cache" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "question_pattern" "text" NOT NULL,
    "intent" "text" NOT NULL,
    "response" "text" NOT NULL,
    "usage_count" integer DEFAULT 0,
    "last_used" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."chat_faq_cache" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."chat_messages" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "conversation_id" "uuid",
    "message_type" "text" NOT NULL,
    "content" "text" NOT NULL,
    "intent" "text",
    "confidence" numeric(3,2),
    "needs_response" boolean DEFAULT false,
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "chat_messages_message_type_check" CHECK (("message_type" = ANY (ARRAY['user'::"text", 'bot'::"text", 'system'::"text"]))),
    CONSTRAINT "check_valid_confidence" CHECK ((("confidence" IS NULL) OR (("confidence" >= (0)::numeric) AND ("confidence" <= (1)::numeric))))
);


ALTER TABLE "public"."chat_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."company_messages" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "title" "text" NOT NULL,
    "body" "text" NOT NULL,
    "audience" "text"[] DEFAULT ARRAY['photographer'::"text"] NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "is_active" boolean DEFAULT true
);


ALTER TABLE "public"."company_messages" OWNER TO "postgres";


COMMENT ON TABLE "public"."company_messages" IS 'Company-wide messages broadcast to talent users (photographers/videographers)';



CREATE TABLE IF NOT EXISTS "public"."contact_submissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "first_name" "text" NOT NULL,
    "last_name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "phone" "text",
    "event_type" "text",
    "message" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "status" "text" DEFAULT 'new'::"text",
    "notes" "text",
    CONSTRAINT "contact_submissions_status_check" CHECK (("status" = ANY (ARRAY['new'::"text", 'read'::"text", 'replied'::"text", 'archived'::"text"])))
);


ALTER TABLE "public"."contact_submissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contract_signatures" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "booking_id" "uuid" NOT NULL,
    "contract_version" "text" DEFAULT 'LNP-Contract-v1.0'::"text" NOT NULL,
    "contract_hash" "text" NOT NULL,
    "event_date" "text" NOT NULL,
    "location" "text" NOT NULL,
    "package_name" "text" NOT NULL,
    "price" numeric NOT NULL,
    "signer_full_name" "text",
    "signature_png_base64" "text" NOT NULL,
    "ip_address" "inet",
    "signed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "contract_signatures_price_check" CHECK (("price" >= (0)::numeric))
);


ALTER TABLE "public"."contract_signatures" OWNER TO "postgres";


COMMENT ON TABLE "public"."contract_signatures" IS 'Digital contract signatures for Love & Photos bookings with audit trail';



COMMENT ON COLUMN "public"."contract_signatures"."contract_version" IS 'Version identifier for the contract text (e.g., LNP-Contract-v1.0)';



COMMENT ON COLUMN "public"."contract_signatures"."contract_hash" IS 'SHA-256 hash of the contract text for integrity verification';



COMMENT ON COLUMN "public"."contract_signatures"."signature_png_base64" IS 'Base64 encoded PNG image of the digital signature';



COMMENT ON COLUMN "public"."contract_signatures"."ip_address" IS 'IP address of the signer for audit purposes';



CREATE TABLE IF NOT EXISTS "public"."contracts" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "booking_id" "uuid" NOT NULL,
    "client_id" "uuid" NOT NULL,
    "event_id" "uuid" NOT NULL,
    "storage_path" "text" NOT NULL,
    "filename" "text" NOT NULL,
    "file_size_bytes" bigint NOT NULL,
    "mime_type" "text" NOT NULL,
    "sha256_hash" "text" NOT NULL,
    "version" integer DEFAULT 1 NOT NULL,
    "uploaded_by" "uuid" NOT NULL,
    "uploaded_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "contracts_file_size_bytes_check" CHECK ((("file_size_bytes" > 0) AND ("file_size_bytes" <= 20971520))),
    CONSTRAINT "contracts_mime_type_check" CHECK (("mime_type" = 'application/pdf'::"text")),
    CONSTRAINT "contracts_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'signed'::"text", 'superseded'::"text"])))
);


ALTER TABLE "public"."contracts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."customer_style_preferences" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "customer_id" "uuid" NOT NULL,
    "preferred_style" "text",
    "editing_style" "text",
    "photo_focus" "text",
    "desired_feel" "text",
    "wedding_vibe" "text",
    "must_capture_moments" "text",
    "couple_vs_guests_focus" "text",
    "direction_level" "text",
    "camera_comfort_level" "text",
    "specific_shots" "text",
    "inspiration_links" "text",
    "bw_preference" "text",
    "candid_vs_polished" "text",
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."customer_style_preferences" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."declined_jobs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "talent_id" "uuid" NOT NULL,
    "booking_id" "uuid" NOT NULL,
    "customer_id" "uuid" NOT NULL,
    "declined_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "reason" "text",
    "ip_address" "inet",
    "user_agent" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."declined_jobs" OWNER TO "postgres";


COMMENT ON TABLE "public"."declined_jobs" IS 'Tracks photographer job declines. Creates permanent blacklist preventing future matches between talent and customer.';



COMMENT ON COLUMN "public"."declined_jobs"."talent_id" IS 'Photographer who declined the job';



COMMENT ON COLUMN "public"."declined_jobs"."booking_id" IS 'Specific booking that was declined';



COMMENT ON COLUMN "public"."declined_jobs"."customer_id" IS 'Customer whose jobs this photographer is blacklisted from';



COMMENT ON COLUMN "public"."declined_jobs"."reason" IS 'Optional reason for decline (future feature)';



COMMENT ON COLUMN "public"."declined_jobs"."ip_address" IS 'IP address of decline action for audit trail';



COMMENT ON COLUMN "public"."declined_jobs"."user_agent" IS 'User agent of decline action for audit trail';



CREATE TABLE IF NOT EXISTS "public"."job_queue" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "photographer_id" "uuid" NOT NULL,
    "booking_id" "uuid" NOT NULL,
    "upload_status" "public"."upload_status" DEFAULT 'pending'::"public"."upload_status",
    "files_uploaded" "jsonb" DEFAULT '[]'::"jsonb",
    "overtime_logged" numeric(4,2) DEFAULT 0,
    "overtime_approved" boolean DEFAULT false,
    "delivery_url" "text",
    "delivery_password" "text",
    "deadline" "date",
    "delivered_at" timestamp with time zone,
    "customer_approved" boolean DEFAULT false,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."job_queue" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."logistics_questionnaire" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "booking_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'not_started'::"text",
    "answers" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "logistics_questionnaire_status_check" CHECK (("status" = ANY (ARRAY['not_started'::"text", 'in_progress'::"text", 'submitted'::"text"])))
);


ALTER TABLE "public"."logistics_questionnaire" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."messages" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "booking_id" "uuid",
    "sender_id" "uuid" NOT NULL,
    "recipient_id" "uuid" NOT NULL,
    "subject" "text",
    "content" "text" NOT NULL,
    "is_read" boolean DEFAULT false,
    "read_at" timestamp with time zone,
    "parent_message_id" "uuid",
    "attachments" "jsonb" DEFAULT '[]'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."packages" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "photographer_id" "uuid",
    "title" "text" NOT NULL,
    "description" "text",
    "base_price" numeric(10,2) NOT NULL,
    "duration_minutes" integer NOT NULL,
    "deliverables" "jsonb" DEFAULT '[]'::"jsonb",
    "includes" "text"[],
    "upsells" "jsonb" DEFAULT '[]'::"jsonb",
    "max_guests" integer,
    "is_active" boolean DEFAULT true,
    "is_featured" boolean DEFAULT false,
    "booking_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "check_positive_base_price" CHECK (("base_price" > (0)::numeric)),
    CONSTRAINT "check_positive_duration" CHECK (("duration_minutes" > 0))
);


ALTER TABLE "public"."packages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pay_tiers" (
    "id" integer NOT NULL,
    "name" "text" NOT NULL,
    "hourly_rate" numeric(10,2) NOT NULL,
    "min_jobs_required" integer DEFAULT 0,
    "commission_percentage" numeric(5,2) DEFAULT 20.00,
    "badge_color" "text",
    "perks" "text"[],
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "check_positive_hourly_rate" CHECK (("hourly_rate" > (0)::numeric)),
    CONSTRAINT "check_valid_commission" CHECK ((("commission_percentage" >= (0)::numeric) AND ("commission_percentage" <= (100)::numeric)))
);


ALTER TABLE "public"."pay_tiers" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."pay_tiers_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."pay_tiers_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."pay_tiers_id_seq" OWNED BY "public"."pay_tiers"."id";



CREATE TABLE IF NOT EXISTS "public"."photographer_availability" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "photographer_id" "uuid" NOT NULL,
    "date" "date" NOT NULL,
    "time_start" time without time zone NOT NULL,
    "time_end" time without time zone NOT NULL,
    "is_booked" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."photographer_availability" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."photographer_preview_profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "display_name" "text" NOT NULL,
    "contact_email" "text" NOT NULL,
    "contact_phone" "text",
    "bio" "text",
    "specialties" "text"[],
    "languages" "text"[] DEFAULT ARRAY['English'::"text"],
    "years_experience" integer DEFAULT 1,
    "hourly_rate" numeric DEFAULT 150,
    "location_city" "text" DEFAULT 'Unknown'::"text" NOT NULL,
    "location_state" "text" DEFAULT 'Unknown'::"text" NOT NULL,
    "is_available" boolean DEFAULT true,
    "is_verified" boolean DEFAULT false,
    "average_rating" numeric DEFAULT 4.5,
    "total_reviews" integer DEFAULT 0,
    "total_bookings" integer DEFAULT 0,
    "portfolio_images" "text"[],
    "user_id" "uuid",
    "claimed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "is_love_and_photos_choice" boolean DEFAULT false,
    "acceptance_rate" double precision,
    "avg_response_time_minutes" integer,
    "total_booking_requests" integer DEFAULT 0,
    "total_accepted_bookings" integer DEFAULT 0,
    "has_minimum_data" boolean DEFAULT false,
    "location_zip" "text",
    CONSTRAINT "check_location_city_not_empty" CHECK (("location_city" <> ''::"text")),
    CONSTRAINT "check_location_state_not_empty" CHECK (("location_state" <> ''::"text")),
    CONSTRAINT "check_positive_hourly_rate_preview" CHECK ((("hourly_rate" IS NULL) OR ("hourly_rate" > (0)::numeric))),
    CONSTRAINT "check_valid_experience_preview" CHECK (("years_experience" >= 0)),
    CONSTRAINT "check_valid_rating_preview" CHECK ((("average_rating" IS NULL) OR (("average_rating" >= (0)::numeric) AND ("average_rating" <= (5)::numeric))))
);


ALTER TABLE "public"."photographer_preview_profiles" OWNER TO "postgres";


COMMENT ON COLUMN "public"."photographer_preview_profiles"."location_city" IS 'City location - never null or empty, defaults to Unknown';



COMMENT ON COLUMN "public"."photographer_preview_profiles"."location_state" IS 'State location - never null or empty, defaults to Unknown';



COMMENT ON COLUMN "public"."photographer_preview_profiles"."is_love_and_photos_choice" IS 'Indicates if this photographer is marked as Love & Photo''s Choice - a premium designation toggled via admin dashboard';



COMMENT ON COLUMN "public"."photographer_preview_profiles"."acceptance_rate" IS 'Calculated acceptance rate (accepted/total requests) - NULL if insufficient data';



COMMENT ON COLUMN "public"."photographer_preview_profiles"."avg_response_time_minutes" IS 'Average time to first response in minutes - NULL if insufficient data';



COMMENT ON COLUMN "public"."photographer_preview_profiles"."total_booking_requests" IS 'Total number of booking requests received';



COMMENT ON COLUMN "public"."photographer_preview_profiles"."total_accepted_bookings" IS 'Total number of bookings accepted';



COMMENT ON COLUMN "public"."photographer_preview_profiles"."has_minimum_data" IS 'True if photographer has at least 3 booking requests for meaningful metrics';



COMMENT ON COLUMN "public"."photographer_preview_profiles"."location_zip" IS 'ZIP code for location-based search fallback when zip_city table lookup fails';



CREATE TABLE IF NOT EXISTS "public"."portfolio_items" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "photographer_id" "uuid" NOT NULL,
    "title" "text",
    "description" "text",
    "image_url" "text" NOT NULL,
    "thumbnail_url" "text",
    "video_url" "text",
    "category" "text",
    "tags" "text"[],
    "is_featured" boolean DEFAULT false,
    "view_count" integer DEFAULT 0,
    "like_count" integer DEFAULT 0,
    "order_index" integer,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."portfolio_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."questionnaire_answers" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "questionnaire_id" "uuid" NOT NULL,
    "question_key" "text" NOT NULL,
    "answer_value" "jsonb" NOT NULL,
    "answered_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."questionnaire_answers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."questionnaires" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "booking_id" "uuid" NOT NULL,
    "client_id" "uuid" NOT NULL,
    "event_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "status" "text" DEFAULT 'not_started'::"text" NOT NULL,
    "started_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "locked_at" timestamp with time zone,
    "lock_reason" "text",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "total_questions" integer DEFAULT 0 NOT NULL,
    "answered_questions" integer DEFAULT 0 NOT NULL,
    CONSTRAINT "questionnaires_status_check" CHECK (("status" = ANY (ARRAY['not_started'::"text", 'in_progress'::"text", 'completed'::"text", 'locked'::"text"]))),
    CONSTRAINT "questionnaires_type_check" CHECK (("type" = ANY (ARRAY['style'::"text", 'wedding_info'::"text"])))
);


ALTER TABLE "public"."questionnaires" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reviews" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "booking_id" "uuid" NOT NULL,
    "reviewer_id" "uuid" NOT NULL,
    "photographer_id" "uuid" NOT NULL,
    "rating" integer NOT NULL,
    "comment" "text",
    "is_featured" boolean DEFAULT false,
    "is_verified" boolean DEFAULT true,
    "helpful_count" integer DEFAULT 0,
    "response" "text",
    "response_at" timestamp with time zone,
    "photos" "text"[],
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "is_seeded" boolean DEFAULT false,
    CONSTRAINT "check_valid_helpful_count" CHECK (("helpful_count" >= 0)),
    CONSTRAINT "reviews_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5)))
);


ALTER TABLE "public"."reviews" OWNER TO "postgres";


COMMENT ON COLUMN "public"."reviews"."is_seeded" IS 'Indicates if this review was generated via seeding script for testing/demo purposes';



CREATE TABLE IF NOT EXISTS "public"."talent_applications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "full_name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "phone" "text",
    "role" "text" NOT NULL,
    "answers" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "is_accepted" boolean DEFAULT false NOT NULL,
    "rejection_reason" "text",
    "user_id" "uuid",
    "submitted_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "ip_address" "inet",
    "user_agent" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "talent_applications_role_check" CHECK (("role" = ANY (ARRAY['photographer'::"text", 'videographer'::"text"])))
);


ALTER TABLE "public"."talent_applications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."training_modules" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "content_url" "text",
    "video_url" "text",
    "duration_minutes" integer,
    "order_index" integer NOT NULL,
    "is_required" boolean DEFAULT false,
    "category" "text",
    "passing_score" integer DEFAULT 80,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."training_modules" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."training_status" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "module_id" "uuid" NOT NULL,
    "is_complete" boolean DEFAULT false,
    "score" integer,
    "attempts" integer DEFAULT 0,
    "started_at" timestamp with time zone DEFAULT "now"(),
    "completed_at" timestamp with time zone
);


ALTER TABLE "public"."training_status" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "role" "public"."user_role" DEFAULT 'customer'::"public"."user_role" NOT NULL,
    "full_name" "text",
    "phone" "text",
    "avatar_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "is_active" boolean DEFAULT true,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "is_blacklisted" boolean DEFAULT false,
    "soft_deleted" boolean DEFAULT false,
    "deleted_at" timestamp with time zone,
    "delete_reason" "text"
);


ALTER TABLE "public"."users" OWNER TO "postgres";


COMMENT ON COLUMN "public"."users"."is_blacklisted" IS 'Immediately blocks account from login and public listings';



COMMENT ON COLUMN "public"."users"."soft_deleted" IS 'Marks account for deletion, hides from all searches';



COMMENT ON COLUMN "public"."users"."deleted_at" IS 'Timestamp when account was marked for deletion';



COMMENT ON COLUMN "public"."users"."delete_reason" IS 'Reason for account deletion (e.g., declined job, violation)';



CREATE TABLE IF NOT EXISTS "public"."zip_city" (
    "zip" "text" NOT NULL,
    "city" "text" NOT NULL,
    "state" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."zip_city" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "storage"."buckets" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "owner" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "public" boolean DEFAULT false,
    "avif_autodetection" boolean DEFAULT false,
    "file_size_limit" bigint,
    "allowed_mime_types" "text"[],
    "owner_id" "text",
    "type" "storage"."buckettype" DEFAULT 'STANDARD'::"storage"."buckettype" NOT NULL
);


ALTER TABLE "storage"."buckets" OWNER TO "supabase_storage_admin";


COMMENT ON COLUMN "storage"."buckets"."owner" IS 'Field is deprecated, use owner_id instead';



CREATE TABLE IF NOT EXISTS "storage"."buckets_analytics" (
    "id" "text" NOT NULL,
    "type" "storage"."buckettype" DEFAULT 'ANALYTICS'::"storage"."buckettype" NOT NULL,
    "format" "text" DEFAULT 'ICEBERG'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "storage"."buckets_analytics" OWNER TO "supabase_storage_admin";


CREATE TABLE IF NOT EXISTS "storage"."migrations" (
    "id" integer NOT NULL,
    "name" character varying(100) NOT NULL,
    "hash" character varying(40) NOT NULL,
    "executed_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "storage"."migrations" OWNER TO "supabase_storage_admin";


CREATE TABLE IF NOT EXISTS "storage"."objects" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "bucket_id" "text",
    "name" "text",
    "owner" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "last_accessed_at" timestamp with time zone DEFAULT "now"(),
    "metadata" "jsonb",
    "path_tokens" "text"[] GENERATED ALWAYS AS ("string_to_array"("name", '/'::"text")) STORED,
    "version" "text",
    "owner_id" "text",
    "user_metadata" "jsonb",
    "level" integer
);


ALTER TABLE "storage"."objects" OWNER TO "supabase_storage_admin";


COMMENT ON COLUMN "storage"."objects"."owner" IS 'Field is deprecated, use owner_id instead';



CREATE TABLE IF NOT EXISTS "storage"."prefixes" (
    "bucket_id" "text" NOT NULL,
    "name" "text" NOT NULL COLLATE "pg_catalog"."C",
    "level" integer GENERATED ALWAYS AS ("storage"."get_level"("name")) STORED NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "storage"."prefixes" OWNER TO "supabase_storage_admin";


CREATE TABLE IF NOT EXISTS "storage"."s3_multipart_uploads" (
    "id" "text" NOT NULL,
    "in_progress_size" bigint DEFAULT 0 NOT NULL,
    "upload_signature" "text" NOT NULL,
    "bucket_id" "text" NOT NULL,
    "key" "text" NOT NULL COLLATE "pg_catalog"."C",
    "version" "text" NOT NULL,
    "owner_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_metadata" "jsonb"
);


ALTER TABLE "storage"."s3_multipart_uploads" OWNER TO "supabase_storage_admin";


CREATE TABLE IF NOT EXISTS "storage"."s3_multipart_uploads_parts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "upload_id" "text" NOT NULL,
    "size" bigint DEFAULT 0 NOT NULL,
    "part_number" integer NOT NULL,
    "bucket_id" "text" NOT NULL,
    "key" "text" NOT NULL COLLATE "pg_catalog"."C",
    "etag" "text" NOT NULL,
    "owner_id" "text",
    "version" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "storage"."s3_multipart_uploads_parts" OWNER TO "supabase_storage_admin";


ALTER TABLE ONLY "public"."pay_tiers" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."pay_tiers_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."account_purge_queue"
    ADD CONSTRAINT "account_purge_queue_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."addons"
    ADD CONSTRAINT "addons_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."addons"
    ADD CONSTRAINT "addons_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."admin_audit_log"
    ADD CONSTRAINT "admin_audit_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."availability"
    ADD CONSTRAINT "availability_photographer_id_date_key" UNIQUE ("photographer_id", "date");



ALTER TABLE ONLY "public"."availability"
    ADD CONSTRAINT "availability_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."booking_addons"
    ADD CONSTRAINT "booking_addons_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."booking_amendments"
    ADD CONSTRAINT "booking_amendments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."chat_analytics"
    ADD CONSTRAINT "chat_analytics_date_key" UNIQUE ("date");



ALTER TABLE ONLY "public"."chat_analytics"
    ADD CONSTRAINT "chat_analytics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."chat_conversations"
    ADD CONSTRAINT "chat_conversations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."chat_faq_cache"
    ADD CONSTRAINT "chat_faq_cache_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."chat_messages"
    ADD CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."company_messages"
    ADD CONSTRAINT "company_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contact_submissions"
    ADD CONSTRAINT "contact_submissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contract_signatures"
    ADD CONSTRAINT "contract_signatures_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contracts"
    ADD CONSTRAINT "contracts_booking_id_version_key" UNIQUE ("booking_id", "version");



ALTER TABLE ONLY "public"."contracts"
    ADD CONSTRAINT "contracts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contracts"
    ADD CONSTRAINT "contracts_storage_path_key" UNIQUE ("storage_path");



ALTER TABLE ONLY "public"."customer_style_preferences"
    ADD CONSTRAINT "customer_style_preferences_customer_id_key" UNIQUE ("customer_id");



ALTER TABLE ONLY "public"."customer_style_preferences"
    ADD CONSTRAINT "customer_style_preferences_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."declined_jobs"
    ADD CONSTRAINT "declined_jobs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."declined_jobs"
    ADD CONSTRAINT "declined_jobs_talent_id_booking_id_key" UNIQUE ("talent_id", "booking_id");



ALTER TABLE ONLY "public"."job_queue"
    ADD CONSTRAINT "job_queue_booking_id_key" UNIQUE ("booking_id");



ALTER TABLE ONLY "public"."job_queue"
    ADD CONSTRAINT "job_queue_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."logistics_questionnaire"
    ADD CONSTRAINT "logistics_questionnaire_booking_id_key" UNIQUE ("booking_id");



ALTER TABLE ONLY "public"."logistics_questionnaire"
    ADD CONSTRAINT "logistics_questionnaire_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."packages"
    ADD CONSTRAINT "packages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pay_tiers"
    ADD CONSTRAINT "pay_tiers_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."pay_tiers"
    ADD CONSTRAINT "pay_tiers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."photographer_availability"
    ADD CONSTRAINT "photographer_availability_photographer_id_date_time_start_key" UNIQUE ("photographer_id", "date", "time_start");



ALTER TABLE ONLY "public"."photographer_availability"
    ADD CONSTRAINT "photographer_availability_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."photographer_preview_profiles"
    ADD CONSTRAINT "photographer_preview_profiles_contact_email_key" UNIQUE ("contact_email");



ALTER TABLE ONLY "public"."photographer_preview_profiles"
    ADD CONSTRAINT "photographer_preview_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."photographer_preview_profiles"
    ADD CONSTRAINT "photographer_preview_profiles_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."photographers"
    ADD CONSTRAINT "photographers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."photographers"
    ADD CONSTRAINT "photographers_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."portfolio_items"
    ADD CONSTRAINT "portfolio_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."questionnaire_answers"
    ADD CONSTRAINT "questionnaire_answers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."questionnaire_answers"
    ADD CONSTRAINT "questionnaire_answers_questionnaire_id_question_key_key" UNIQUE ("questionnaire_id", "question_key");



ALTER TABLE ONLY "public"."questionnaires"
    ADD CONSTRAINT "questionnaires_booking_id_type_key" UNIQUE ("booking_id", "type");



ALTER TABLE ONLY "public"."questionnaires"
    ADD CONSTRAINT "questionnaires_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_booking_id_key" UNIQUE ("booking_id");



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."talent_applications"
    ADD CONSTRAINT "talent_applications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."training_modules"
    ADD CONSTRAINT "training_modules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."training_status"
    ADD CONSTRAINT "training_status_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."training_status"
    ADD CONSTRAINT "training_status_user_id_module_id_key" UNIQUE ("user_id", "module_id");



ALTER TABLE ONLY "public"."contract_signatures"
    ADD CONSTRAINT "unique_booking_signature" UNIQUE ("booking_id");



ALTER TABLE ONLY "public"."account_purge_queue"
    ADD CONSTRAINT "unique_user_purge" UNIQUE ("user_id", "processed");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."zip_city"
    ADD CONSTRAINT "zip_city_pkey" PRIMARY KEY ("zip");



ALTER TABLE ONLY "storage"."buckets_analytics"
    ADD CONSTRAINT "buckets_analytics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "storage"."buckets"
    ADD CONSTRAINT "buckets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "storage"."migrations"
    ADD CONSTRAINT "migrations_name_key" UNIQUE ("name");



ALTER TABLE ONLY "storage"."migrations"
    ADD CONSTRAINT "migrations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "storage"."objects"
    ADD CONSTRAINT "objects_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "storage"."prefixes"
    ADD CONSTRAINT "prefixes_pkey" PRIMARY KEY ("bucket_id", "level", "name");



ALTER TABLE ONLY "storage"."s3_multipart_uploads_parts"
    ADD CONSTRAINT "s3_multipart_uploads_parts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "storage"."s3_multipart_uploads"
    ADD CONSTRAINT "s3_multipart_uploads_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_addons_active" ON "public"."addons" USING "btree" ("is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_addons_code" ON "public"."addons" USING "btree" ("code");



CREATE INDEX "idx_addons_kind" ON "public"."addons" USING "btree" ("kind");



CREATE INDEX "idx_audit_log_action" ON "public"."admin_audit_log" USING "btree" ("action");



CREATE INDEX "idx_audit_log_actor" ON "public"."admin_audit_log" USING "btree" ("actor_id");



CREATE INDEX "idx_audit_log_created" ON "public"."admin_audit_log" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_audit_log_user" ON "public"."admin_audit_log" USING "btree" ("user_id");



CREATE INDEX "idx_audit_logs_created" ON "public"."audit_logs" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_audit_logs_entity" ON "public"."audit_logs" USING "btree" ("entity_type", "entity_id");



CREATE INDEX "idx_audit_logs_user" ON "public"."audit_logs" USING "btree" ("user_id");



CREATE INDEX "idx_availability_available" ON "public"."availability" USING "btree" ("is_available");



CREATE INDEX "idx_availability_date" ON "public"."availability" USING "btree" ("date");



CREATE INDEX "idx_availability_photographer" ON "public"."availability" USING "btree" ("photographer_id");



CREATE INDEX "idx_availability_photographer_date" ON "public"."availability" USING "btree" ("photographer_id", "date");



CREATE INDEX "idx_booking_addons_addon_id" ON "public"."booking_addons" USING "btree" ("addon_id");



CREATE INDEX "idx_booking_addons_booking_id" ON "public"."booking_addons" USING "btree" ("booking_id");



CREATE INDEX "idx_booking_amendments_booking_id" ON "public"."booking_amendments" USING "btree" ("booking_id");



CREATE INDEX "idx_booking_amendments_created_at" ON "public"."booking_amendments" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_booking_amendments_payment_status" ON "public"."booking_amendments" USING "btree" ("payment_status");



CREATE INDEX "idx_bookings_booking_status" ON "public"."bookings" USING "btree" ("booking_status");



CREATE INDEX "idx_bookings_confirmation_email" ON "public"."bookings" USING "btree" ("confirmation_email_sent", "created_at") WHERE ("confirmation_email_sent" = false);



CREATE INDEX "idx_bookings_contract_signed" ON "public"."bookings" USING "btree" ("contract_signed");



CREATE INDEX "idx_bookings_contract_signed_url" ON "public"."bookings" USING "btree" ("photographer_id", "contract_signed_url") WHERE ("contract_signed_url" IS NOT NULL);



CREATE INDEX "idx_bookings_created" ON "public"."bookings" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_bookings_customer" ON "public"."bookings" USING "btree" ("customer_id");



CREATE INDEX "idx_bookings_customer_id" ON "public"."bookings" USING "btree" ("customer_id");



CREATE INDEX "idx_bookings_date_change" ON "public"."bookings" USING "btree" ("can_change_date", "date_change_used") WHERE ("can_change_date" = true);



CREATE INDEX "idx_bookings_event_date" ON "public"."bookings" USING "btree" ("event_date");



CREATE INDEX "idx_bookings_location" ON "public"."bookings" USING "btree" ("location_city", "location_state");



CREATE INDEX "idx_bookings_payment_status" ON "public"."bookings" USING "btree" ("payment_status");



CREATE INDEX "idx_bookings_photographer" ON "public"."bookings" USING "btree" ("photographer_id");



CREATE INDEX "idx_bookings_photographer_date" ON "public"."bookings" USING "btree" ("photographer_id", "event_date");



CREATE INDEX "idx_bookings_photographer_event_date" ON "public"."bookings" USING "btree" ("photographer_id", "event_date");



COMMENT ON INDEX "public"."idx_bookings_photographer_event_date" IS 'Optimizes validation of photographer unavailability when creating bookings';



CREATE INDEX "idx_bookings_photographer_id" ON "public"."bookings" USING "btree" ("photographer_id");



CREATE INDEX "idx_bookings_status" ON "public"."bookings" USING "btree" ("booking_status");



CREATE INDEX "idx_bookings_videographer_id" ON "public"."bookings" USING "btree" ("videographer_id") WHERE ("videographer_id" IS NOT NULL);



CREATE INDEX "idx_chat_analytics_date" ON "public"."chat_analytics" USING "btree" ("date" DESC);



CREATE INDEX "idx_chat_conversations_created_at" ON "public"."chat_conversations" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_chat_conversations_session_id" ON "public"."chat_conversations" USING "btree" ("session_id");



CREATE INDEX "idx_chat_conversations_status" ON "public"."chat_conversations" USING "btree" ("status");



CREATE INDEX "idx_chat_conversations_user_id" ON "public"."chat_conversations" USING "btree" ("user_id");



CREATE INDEX "idx_chat_faq_cache_intent" ON "public"."chat_faq_cache" USING "btree" ("intent");



CREATE INDEX "idx_chat_messages_conversation_id" ON "public"."chat_messages" USING "btree" ("conversation_id");



CREATE INDEX "idx_chat_messages_created_at" ON "public"."chat_messages" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_chat_messages_needs_response" ON "public"."chat_messages" USING "btree" ("needs_response") WHERE ("needs_response" = true);



CREATE INDEX "idx_company_messages_active_created" ON "public"."company_messages" USING "btree" ("is_active", "created_at" DESC);



CREATE INDEX "idx_contact_submissions_created_at" ON "public"."contact_submissions" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_contact_submissions_email" ON "public"."contact_submissions" USING "btree" ("email");



CREATE INDEX "idx_contact_submissions_status" ON "public"."contact_submissions" USING "btree" ("status");



CREATE INDEX "idx_contract_signatures_booking_id" ON "public"."contract_signatures" USING "btree" ("booking_id");



CREATE INDEX "idx_contract_signatures_contract_version" ON "public"."contract_signatures" USING "btree" ("contract_version");



CREATE INDEX "idx_contract_signatures_signed_at" ON "public"."contract_signatures" USING "btree" ("signed_at");



CREATE INDEX "idx_contracts_booking_id" ON "public"."contracts" USING "btree" ("booking_id");



CREATE INDEX "idx_contracts_client_id" ON "public"."contracts" USING "btree" ("client_id");



CREATE INDEX "idx_contracts_event_id" ON "public"."contracts" USING "btree" ("event_id");



CREATE INDEX "idx_contracts_hash" ON "public"."contracts" USING "btree" ("sha256_hash");



CREATE INDEX "idx_contracts_status" ON "public"."contracts" USING "btree" ("status") WHERE ("status" <> 'superseded'::"text");



CREATE INDEX "idx_contracts_uploaded_at" ON "public"."contracts" USING "btree" ("uploaded_at" DESC);



CREATE INDEX "idx_declined_jobs_booking_id" ON "public"."declined_jobs" USING "btree" ("booking_id");



CREATE INDEX "idx_declined_jobs_customer_id" ON "public"."declined_jobs" USING "btree" ("customer_id");



CREATE INDEX "idx_declined_jobs_talent_customer" ON "public"."declined_jobs" USING "btree" ("talent_id", "customer_id");



CREATE INDEX "idx_declined_jobs_talent_id" ON "public"."declined_jobs" USING "btree" ("talent_id");



CREATE INDEX "idx_job_queue_booking" ON "public"."job_queue" USING "btree" ("booking_id");



CREATE INDEX "idx_job_queue_deadline" ON "public"."job_queue" USING "btree" ("deadline");



CREATE INDEX "idx_job_queue_photographer" ON "public"."job_queue" USING "btree" ("photographer_id");



CREATE INDEX "idx_job_queue_status" ON "public"."job_queue" USING "btree" ("upload_status");



CREATE INDEX "idx_logistics_questionnaire_booking_id" ON "public"."logistics_questionnaire" USING "btree" ("booking_id");



CREATE INDEX "idx_logistics_questionnaire_user_id" ON "public"."logistics_questionnaire" USING "btree" ("user_id");



CREATE INDEX "idx_messages_booking" ON "public"."messages" USING "btree" ("booking_id");



CREATE INDEX "idx_messages_booking_recipient" ON "public"."messages" USING "btree" ("booking_id", "recipient_id");



CREATE INDEX "idx_messages_created" ON "public"."messages" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_messages_is_read" ON "public"."messages" USING "btree" ("is_read") WHERE ("is_read" = false);



CREATE INDEX "idx_messages_read" ON "public"."messages" USING "btree" ("is_read");



CREATE INDEX "idx_messages_recipient" ON "public"."messages" USING "btree" ("recipient_id");



CREATE INDEX "idx_messages_recipient_id" ON "public"."messages" USING "btree" ("recipient_id");



CREATE INDEX "idx_messages_sender" ON "public"."messages" USING "btree" ("sender_id");



CREATE INDEX "idx_packages_active" ON "public"."packages" USING "btree" ("is_active");



CREATE INDEX "idx_packages_is_active" ON "public"."packages" USING "btree" ("is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_packages_photographer" ON "public"."packages" USING "btree" ("photographer_id");



CREATE INDEX "idx_packages_photographer_active" ON "public"."packages" USING "btree" ("photographer_id", "is_active");



CREATE INDEX "idx_packages_price" ON "public"."packages" USING "btree" ("base_price");



CREATE INDEX "idx_photographer_availability_booked" ON "public"."photographer_availability" USING "btree" ("is_booked");



CREATE INDEX "idx_photographer_availability_date" ON "public"."photographer_availability" USING "btree" ("date");



CREATE INDEX "idx_photographer_availability_photographer" ON "public"."photographer_availability" USING "btree" ("photographer_id");



CREATE INDEX "idx_photographer_love_photos_choice" ON "public"."photographer_preview_profiles" USING "btree" ("is_love_and_photos_choice") WHERE ("is_love_and_photos_choice" = true);



CREATE INDEX "idx_photographer_preview_profiles_location_zip" ON "public"."photographer_preview_profiles" USING "btree" ("location_zip");



CREATE INDEX "idx_photographers_acceptance_rate" ON "public"."photographers" USING "btree" ("acceptance_rate");



CREATE INDEX "idx_photographers_average_rating" ON "public"."photographers" USING "btree" ("average_rating" DESC);



CREATE INDEX "idx_photographers_gear" ON "public"."photographers" USING "btree" ("gear_has_camera", "gear_has_drone", "gear_has_gimbal") WHERE ("is_videographer" = true);



CREATE INDEX "idx_photographers_has_min_data" ON "public"."photographers" USING "btree" ("has_minimum_data");



CREATE INDEX "idx_photographers_has_minimum_data" ON "public"."photographers" USING "btree" ("has_minimum_data");



CREATE INDEX "idx_photographers_is_public" ON "public"."photographers" USING "btree" ("is_public");



CREATE INDEX "idx_photographers_is_videographer" ON "public"."photographers" USING "btree" ("is_videographer") WHERE ("is_videographer" = true);



CREATE INDEX "idx_photographers_location" ON "public"."photographers" USING "gin" ("languages");



CREATE INDEX "idx_photographers_pay_tier" ON "public"."photographers" USING "btree" ("pay_tier_id");



CREATE INDEX "idx_photographers_profile_complete" ON "public"."photographers" USING "btree" ("profile_complete");



CREATE INDEX "idx_photographers_rating" ON "public"."photographers" USING "btree" ("average_rating" DESC);



CREATE INDEX "idx_photographers_response_time" ON "public"."photographers" USING "btree" ("avg_response_time_minutes");



CREATE INDEX "idx_photographers_search_visibility" ON "public"."photographers" USING "btree" ("visible_in_search", "profile_complete") WHERE (("visible_in_search" = true) AND ("profile_complete" = true));



CREATE INDEX "idx_photographers_specialties" ON "public"."photographers" USING "gin" ("specialties");



CREATE INDEX "idx_photographers_unavailable_dates" ON "public"."photographers" USING "gin" ("unavailable_dates");



CREATE INDEX "idx_photographers_user_id" ON "public"."photographers" USING "btree" ("user_id");



CREATE INDEX "idx_portfolio_category" ON "public"."portfolio_items" USING "btree" ("category");



CREATE INDEX "idx_portfolio_featured" ON "public"."portfolio_items" USING "btree" ("is_featured");



CREATE INDEX "idx_portfolio_items_is_featured" ON "public"."portfolio_items" USING "btree" ("is_featured") WHERE ("is_featured" = true);



CREATE INDEX "idx_portfolio_items_order" ON "public"."portfolio_items" USING "btree" ("photographer_id", "order_index");



CREATE INDEX "idx_portfolio_items_photographer_featured" ON "public"."portfolio_items" USING "btree" ("photographer_id", "is_featured");



CREATE INDEX "idx_portfolio_photographer" ON "public"."portfolio_items" USING "btree" ("photographer_id");



CREATE INDEX "idx_preview_profiles_is_available" ON "public"."photographer_preview_profiles" USING "btree" ("is_available") WHERE ("is_available" = true);



CREATE INDEX "idx_preview_profiles_lnp_choice" ON "public"."photographer_preview_profiles" USING "btree" ("is_love_and_photos_choice") WHERE ("is_love_and_photos_choice" = true);



CREATE INDEX "idx_preview_profiles_location" ON "public"."photographer_preview_profiles" USING "btree" ("location_city", "location_state");



CREATE INDEX "idx_preview_profiles_specialties" ON "public"."photographer_preview_profiles" USING "gin" ("specialties");



CREATE INDEX "idx_purge_queue_pending" ON "public"."account_purge_queue" USING "btree" ("purge_after") WHERE ("processed" = false);



CREATE INDEX "idx_questionnaire_answers_question_key" ON "public"."questionnaire_answers" USING "btree" ("question_key");



CREATE INDEX "idx_questionnaire_answers_questionnaire_id" ON "public"."questionnaire_answers" USING "btree" ("questionnaire_id");



CREATE INDEX "idx_questionnaire_answers_updated_at" ON "public"."questionnaire_answers" USING "btree" ("updated_at" DESC);



CREATE INDEX "idx_questionnaires_booking_id" ON "public"."questionnaires" USING "btree" ("booking_id");



CREATE INDEX "idx_questionnaires_client_id" ON "public"."questionnaires" USING "btree" ("client_id");



CREATE INDEX "idx_questionnaires_completed_at" ON "public"."questionnaires" USING "btree" ("completed_at");



CREATE INDEX "idx_questionnaires_status" ON "public"."questionnaires" USING "btree" ("status");



CREATE INDEX "idx_questionnaires_type" ON "public"."questionnaires" USING "btree" ("type");



CREATE INDEX "idx_questionnaires_type_status" ON "public"."questionnaires" USING "btree" ("type", "status");



CREATE INDEX "idx_reviews_booking" ON "public"."reviews" USING "btree" ("booking_id");



CREATE INDEX "idx_reviews_created" ON "public"."reviews" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_reviews_is_featured" ON "public"."reviews" USING "btree" ("is_featured") WHERE ("is_featured" = true);



CREATE INDEX "idx_reviews_is_seeded" ON "public"."reviews" USING "btree" ("is_seeded") WHERE ("is_seeded" = true);



CREATE INDEX "idx_reviews_photographer" ON "public"."reviews" USING "btree" ("photographer_id");



CREATE INDEX "idx_reviews_photographer_id" ON "public"."reviews" USING "btree" ("photographer_id");



CREATE INDEX "idx_reviews_rating" ON "public"."reviews" USING "btree" ("rating");



CREATE INDEX "idx_talent_applications_email" ON "public"."talent_applications" USING "btree" ("email");



CREATE UNIQUE INDEX "idx_talent_applications_email_accepted" ON "public"."talent_applications" USING "btree" ("email") WHERE ("is_accepted" = true);



CREATE INDEX "idx_talent_applications_role" ON "public"."talent_applications" USING "btree" ("role");



CREATE INDEX "idx_talent_applications_status" ON "public"."talent_applications" USING "btree" ("is_accepted");



CREATE INDEX "idx_talent_applications_user_id" ON "public"."talent_applications" USING "btree" ("user_id");



CREATE INDEX "idx_training_status_complete" ON "public"."training_status" USING "btree" ("is_complete");



CREATE INDEX "idx_training_status_module" ON "public"."training_status" USING "btree" ("module_id");



CREATE INDEX "idx_training_status_user" ON "public"."training_status" USING "btree" ("user_id");



CREATE INDEX "idx_users_blacklisted" ON "public"."users" USING "btree" ("is_blacklisted") WHERE ("is_blacklisted" = true);



CREATE INDEX "idx_users_created_at" ON "public"."users" USING "btree" ("created_at");



CREATE INDEX "idx_users_email" ON "public"."users" USING "btree" ("email");



CREATE INDEX "idx_users_role" ON "public"."users" USING "btree" ("role");



CREATE INDEX "idx_users_soft_deleted" ON "public"."users" USING "btree" ("soft_deleted") WHERE ("soft_deleted" = true);



CREATE UNIQUE INDEX "bname" ON "storage"."buckets" USING "btree" ("name");



CREATE UNIQUE INDEX "bucketid_objname" ON "storage"."objects" USING "btree" ("bucket_id", "name");



CREATE INDEX "idx_multipart_uploads_list" ON "storage"."s3_multipart_uploads" USING "btree" ("bucket_id", "key", "created_at");



CREATE UNIQUE INDEX "idx_name_bucket_level_unique" ON "storage"."objects" USING "btree" ("name" COLLATE "C", "bucket_id", "level");



CREATE INDEX "idx_objects_bucket_id_name" ON "storage"."objects" USING "btree" ("bucket_id", "name" COLLATE "C");



CREATE INDEX "idx_objects_lower_name" ON "storage"."objects" USING "btree" (("path_tokens"["level"]), "lower"("name") "text_pattern_ops", "bucket_id", "level");



CREATE INDEX "idx_prefixes_lower_name" ON "storage"."prefixes" USING "btree" ("bucket_id", "level", (("string_to_array"("name", '/'::"text"))["level"]), "lower"("name") "text_pattern_ops");



CREATE INDEX "name_prefix_search" ON "storage"."objects" USING "btree" ("name" "text_pattern_ops");



CREATE UNIQUE INDEX "objects_bucket_id_level_idx" ON "storage"."objects" USING "btree" ("bucket_id", "level", "name" COLLATE "C");



CREATE OR REPLACE TRIGGER "auto_publish_photographer_profile" BEFORE INSERT OR UPDATE OF "bio", "portfolio_images", "languages", "city", "state", "zip_code", "profile_complete" ON "public"."photographers" FOR EACH ROW EXECUTE FUNCTION "public"."auto_publish_complete_profile"();



COMMENT ON TRIGGER "auto_publish_photographer_profile" ON "public"."photographers" IS 'Auto-publishes profiles when complete. Triggers on updates to: bio, portfolio_images, languages, city, state, zip_code, profile_complete';



CREATE OR REPLACE TRIGGER "booking_amendments_completed_at" BEFORE UPDATE ON "public"."booking_amendments" FOR EACH ROW EXECUTE FUNCTION "public"."update_amendment_completed_at"();



CREATE OR REPLACE TRIGGER "check_tier_upgrade" BEFORE UPDATE OF "completed_jobs_count" ON "public"."photographers" FOR EACH ROW EXECUTE FUNCTION "public"."check_photographer_tier_upgrade"();



CREATE OR REPLACE TRIGGER "customer_style_preferences_updated_at" BEFORE UPDATE ON "public"."customer_style_preferences" FOR EACH ROW EXECUTE FUNCTION "public"."update_customer_style_preferences_updated_at"();



CREATE OR REPLACE TRIGGER "enforce_photographer_visibility" BEFORE INSERT OR UPDATE OF "is_public", "bio", "portfolio_images", "languages", "city", "state", "zip_code" ON "public"."photographers" FOR EACH ROW EXECUTE FUNCTION "public"."validate_photographer_visibility"();



CREATE OR REPLACE TRIGGER "logistics_questionnaire_updated_at" BEFORE UPDATE ON "public"."logistics_questionnaire" FOR EACH ROW EXECUTE FUNCTION "public"."update_logistics_questionnaire_updated_at"();



CREATE OR REPLACE TRIGGER "sync_display_name_to_preview" AFTER UPDATE OF "full_name" ON "public"."users" FOR EACH ROW WHEN (("old"."full_name" IS DISTINCT FROM "new"."full_name")) EXECUTE FUNCTION "public"."sync_photographer_display_name"();



CREATE OR REPLACE TRIGGER "trigger_audit_blacklist" AFTER UPDATE ON "public"."users" FOR EACH ROW WHEN (("new"."is_blacklisted" = true)) EXECUTE FUNCTION "public"."audit_account_blacklist"();



CREATE OR REPLACE TRIGGER "trigger_hide_blacklisted_photographer" AFTER UPDATE ON "public"."users" FOR EACH ROW WHEN ((("new"."soft_deleted" = true) OR ("new"."is_blacklisted" = true))) EXECUTE FUNCTION "public"."update_photographer_visibility"();



CREATE OR REPLACE TRIGGER "trigger_update_booking_contract_signed" AFTER INSERT ON "public"."contract_signatures" FOR EACH ROW EXECUTE FUNCTION "public"."update_booking_contract_signed"();



CREATE OR REPLACE TRIGGER "trigger_update_photographer_review_stats" AFTER INSERT OR DELETE OR UPDATE ON "public"."reviews" FOR EACH ROW EXECUTE FUNCTION "public"."update_photographer_review_stats"();



CREATE OR REPLACE TRIGGER "update_availability_updated_at" BEFORE UPDATE ON "public"."availability" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_bookings_updated_at" BEFORE UPDATE ON "public"."bookings" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_conversation_on_message" AFTER INSERT ON "public"."chat_messages" FOR EACH ROW EXECUTE FUNCTION "public"."update_conversation_stats"();



CREATE OR REPLACE TRIGGER "update_job_queue_updated_at" BEFORE UPDATE ON "public"."job_queue" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_packages_updated_at" BEFORE UPDATE ON "public"."packages" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_photographer_metrics_on_booking" AFTER INSERT OR UPDATE ON "public"."bookings" FOR EACH ROW EXECUTE FUNCTION "public"."update_photographer_metrics_on_booking"();



CREATE OR REPLACE TRIGGER "update_photographer_metrics_on_message" AFTER INSERT ON "public"."messages" FOR EACH ROW EXECUTE FUNCTION "public"."update_photographer_metrics_on_message"();



CREATE OR REPLACE TRIGGER "update_photographer_response_time" AFTER INSERT ON "public"."messages" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_update_photographer_response_time"();



CREATE OR REPLACE TRIGGER "update_photographer_stats_trigger" AFTER INSERT OR UPDATE ON "public"."reviews" FOR EACH ROW EXECUTE FUNCTION "public"."update_photographer_stats"();



CREATE OR REPLACE TRIGGER "update_photographers_updated_at" BEFORE UPDATE ON "public"."photographers" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_reviews_updated_at" BEFORE UPDATE ON "public"."reviews" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_users_updated_at" BEFORE UPDATE ON "public"."users" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "validate_booking_date_trigger" BEFORE INSERT OR UPDATE OF "event_date", "photographer_id" ON "public"."bookings" FOR EACH ROW EXECUTE FUNCTION "public"."validate_booking_date"();



COMMENT ON TRIGGER "validate_booking_date_trigger" ON "public"."bookings" IS 'Prevents bookings on dates marked as unavailable by the photographer. Uses inverse availability model where all dates are available unless explicitly blocked.';



CREATE OR REPLACE TRIGGER "validate_style_tags_trigger" BEFORE INSERT OR UPDATE ON "public"."photographers" FOR EACH ROW EXECUTE FUNCTION "public"."validate_videographer_style_tags"();



CREATE OR REPLACE TRIGGER "enforce_bucket_name_length_trigger" BEFORE INSERT OR UPDATE OF "name" ON "storage"."buckets" FOR EACH ROW EXECUTE FUNCTION "storage"."enforce_bucket_name_length"();



CREATE OR REPLACE TRIGGER "objects_delete_delete_prefix" AFTER DELETE ON "storage"."objects" FOR EACH ROW EXECUTE FUNCTION "storage"."delete_prefix_hierarchy_trigger"();



CREATE OR REPLACE TRIGGER "objects_insert_create_prefix" BEFORE INSERT ON "storage"."objects" FOR EACH ROW EXECUTE FUNCTION "storage"."objects_insert_prefix_trigger"();



CREATE OR REPLACE TRIGGER "objects_update_create_prefix" BEFORE UPDATE ON "storage"."objects" FOR EACH ROW WHEN ((("new"."name" <> "old"."name") OR ("new"."bucket_id" <> "old"."bucket_id"))) EXECUTE FUNCTION "storage"."objects_update_prefix_trigger"();



CREATE OR REPLACE TRIGGER "prefixes_create_hierarchy" BEFORE INSERT ON "storage"."prefixes" FOR EACH ROW WHEN (("pg_trigger_depth"() < 1)) EXECUTE FUNCTION "storage"."prefixes_insert_trigger"();



CREATE OR REPLACE TRIGGER "prefixes_delete_hierarchy" AFTER DELETE ON "storage"."prefixes" FOR EACH ROW EXECUTE FUNCTION "storage"."delete_prefix_hierarchy_trigger"();



CREATE OR REPLACE TRIGGER "update_objects_updated_at" BEFORE UPDATE ON "storage"."objects" FOR EACH ROW EXECUTE FUNCTION "storage"."update_updated_at_column"();



ALTER TABLE ONLY "public"."account_purge_queue"
    ADD CONSTRAINT "account_purge_queue_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."account_purge_queue"
    ADD CONSTRAINT "account_purge_queue_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."account_purge_queue"
    ADD CONSTRAINT "account_purge_queue_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."admin_audit_log"
    ADD CONSTRAINT "admin_audit_log_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."admin_audit_log"
    ADD CONSTRAINT "admin_audit_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."availability"
    ADD CONSTRAINT "availability_photographer_id_fkey" FOREIGN KEY ("photographer_id") REFERENCES "public"."photographers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."booking_addons"
    ADD CONSTRAINT "booking_addons_addon_id_fkey" FOREIGN KEY ("addon_id") REFERENCES "public"."addons"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."booking_addons"
    ADD CONSTRAINT "booking_addons_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."booking_amendments"
    ADD CONSTRAINT "booking_amendments_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_cancelled_by_fkey" FOREIGN KEY ("cancelled_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "public"."packages"("id");



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_photographer_id_fkey" FOREIGN KEY ("photographer_id") REFERENCES "public"."photographers"("id");



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_videographer_id_fkey" FOREIGN KEY ("videographer_id") REFERENCES "public"."photographers"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."chat_conversations"
    ADD CONSTRAINT "chat_conversations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chat_messages"
    ADD CONSTRAINT "chat_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."chat_conversations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contract_signatures"
    ADD CONSTRAINT "contract_signatures_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contracts"
    ADD CONSTRAINT "contracts_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contracts"
    ADD CONSTRAINT "contracts_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contracts"
    ADD CONSTRAINT "contracts_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."customer_style_preferences"
    ADD CONSTRAINT "customer_style_preferences_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."declined_jobs"
    ADD CONSTRAINT "declined_jobs_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."declined_jobs"
    ADD CONSTRAINT "declined_jobs_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."declined_jobs"
    ADD CONSTRAINT "declined_jobs_talent_id_fkey" FOREIGN KEY ("talent_id") REFERENCES "public"."photographers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."job_queue"
    ADD CONSTRAINT "job_queue_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id");



ALTER TABLE ONLY "public"."job_queue"
    ADD CONSTRAINT "job_queue_photographer_id_fkey" FOREIGN KEY ("photographer_id") REFERENCES "public"."photographers"("id");



ALTER TABLE ONLY "public"."logistics_questionnaire"
    ADD CONSTRAINT "logistics_questionnaire_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."logistics_questionnaire"
    ADD CONSTRAINT "logistics_questionnaire_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id");



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_parent_message_id_fkey" FOREIGN KEY ("parent_message_id") REFERENCES "public"."messages"("id");



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."packages"
    ADD CONSTRAINT "packages_photographer_id_fkey" FOREIGN KEY ("photographer_id") REFERENCES "public"."photographers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."photographer_availability"
    ADD CONSTRAINT "photographer_availability_photographer_id_fkey" FOREIGN KEY ("photographer_id") REFERENCES "public"."photographers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."photographer_preview_profiles"
    ADD CONSTRAINT "photographer_preview_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."photographers"
    ADD CONSTRAINT "photographers_pay_tier_id_fkey" FOREIGN KEY ("pay_tier_id") REFERENCES "public"."pay_tiers"("id");



ALTER TABLE ONLY "public"."photographers"
    ADD CONSTRAINT "photographers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."portfolio_items"
    ADD CONSTRAINT "portfolio_items_photographer_id_fkey" FOREIGN KEY ("photographer_id") REFERENCES "public"."photographers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."questionnaire_answers"
    ADD CONSTRAINT "questionnaire_answers_questionnaire_id_fkey" FOREIGN KEY ("questionnaire_id") REFERENCES "public"."questionnaires"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."questionnaires"
    ADD CONSTRAINT "questionnaires_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."questionnaires"
    ADD CONSTRAINT "questionnaires_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id");



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_photographer_id_fkey" FOREIGN KEY ("photographer_id") REFERENCES "public"."photographers"("id");



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."talent_applications"
    ADD CONSTRAINT "talent_applications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."training_status"
    ADD CONSTRAINT "training_status_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "public"."training_modules"("id");



ALTER TABLE ONLY "public"."training_status"
    ADD CONSTRAINT "training_status_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "storage"."objects"
    ADD CONSTRAINT "objects_bucketId_fkey" FOREIGN KEY ("bucket_id") REFERENCES "storage"."buckets"("id");



ALTER TABLE ONLY "storage"."prefixes"
    ADD CONSTRAINT "prefixes_bucketId_fkey" FOREIGN KEY ("bucket_id") REFERENCES "storage"."buckets"("id");



ALTER TABLE ONLY "storage"."s3_multipart_uploads"
    ADD CONSTRAINT "s3_multipart_uploads_bucket_id_fkey" FOREIGN KEY ("bucket_id") REFERENCES "storage"."buckets"("id");



ALTER TABLE ONLY "storage"."s3_multipart_uploads_parts"
    ADD CONSTRAINT "s3_multipart_uploads_parts_bucket_id_fkey" FOREIGN KEY ("bucket_id") REFERENCES "storage"."buckets"("id");



ALTER TABLE ONLY "storage"."s3_multipart_uploads_parts"
    ADD CONSTRAINT "s3_multipart_uploads_parts_upload_id_fkey" FOREIGN KEY ("upload_id") REFERENCES "storage"."s3_multipart_uploads"("id") ON DELETE CASCADE;



CREATE POLICY "Admins can manage addons" ON "public"."addons" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "Admins can manage analytics" ON "public"."chat_analytics" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "Admins can update applications" ON "public"."talent_applications" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "Admins can view all applications" ON "public"."talent_applications" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "Admins can view all booking addons" ON "public"."booking_addons" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "Admins can view all contract signatures" ON "public"."contract_signatures" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users" "u"
  WHERE (("u"."id" = "auth"."uid"()) AND ("u"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "Admins can view all conversations" ON "public"."chat_conversations" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "Admins can view all declined jobs" ON "public"."declined_jobs" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "Admins can view all messages" ON "public"."chat_messages" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "Allow anonymous application submissions" ON "public"."talent_applications" FOR INSERT TO "authenticated", "anon" WITH CHECK (true);



CREATE POLICY "Allow anonymous read access to photographer profiles" ON "public"."photographer_preview_profiles" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Allow anonymous read access to zip_city" ON "public"."zip_city" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Allow authenticated read access to photographer profiles" ON "public"."photographer_preview_profiles" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow checking application existence" ON "public"."talent_applications" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Allow photographers to update own preview profile" ON "public"."photographer_preview_profiles" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Anyone can create contact submissions" ON "public"."contact_submissions" FOR INSERT WITH CHECK (true);



CREATE POLICY "Anyone can view active addons" ON "public"."addons" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Anyone can view active packages" ON "public"."packages" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Anyone can view photographer availability" ON "public"."availability" FOR SELECT USING (true);



CREATE POLICY "Anyone can view portfolio items" ON "public"."portfolio_items" FOR SELECT USING (true);



CREATE POLICY "Anyone can view reviews" ON "public"."reviews" FOR SELECT USING (true);



CREATE POLICY "Anyone can view searchable photographers" ON "public"."photographers" FOR SELECT TO "authenticated", "anon" USING (("visible_in_search" = true));



CREATE POLICY "Anyone can view training modules" ON "public"."training_modules" FOR SELECT USING (true);



CREATE POLICY "Authenticated users can update contact submissions" ON "public"."contact_submissions" FOR UPDATE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated users can view contact submissions" ON "public"."contact_submissions" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Clients can purchase addons" ON "public"."booking_addons" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."bookings" "b"
  WHERE (("b"."id" = "booking_addons"."booking_id") AND ("b"."customer_id" = "auth"."uid"())))));



CREATE POLICY "Clients can view own booking addons" ON "public"."booking_addons" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."bookings" "b"
  WHERE (("b"."id" = "booking_addons"."booking_id") AND ("b"."customer_id" = "auth"."uid"())))));



CREATE POLICY "Contract signatures are immutable" ON "public"."contract_signatures" FOR UPDATE TO "authenticated" USING (false);



CREATE POLICY "Contract signatures cannot be deleted" ON "public"."contract_signatures" FOR DELETE TO "authenticated" USING (false);



CREATE POLICY "Customers can create bookings" ON "public"."bookings" FOR INSERT WITH CHECK (("customer_id" = "auth"."uid"()));



CREATE POLICY "Customers can create reviews for their bookings" ON "public"."reviews" FOR INSERT WITH CHECK ((("reviewer_id" = "auth"."uid"()) AND ("booking_id" IN ( SELECT "bookings"."id"
   FROM "public"."bookings"
  WHERE ("bookings"."customer_id" = "auth"."uid"())))));



CREATE POLICY "Customers can insert own preferences" ON "public"."customer_style_preferences" FOR INSERT WITH CHECK (("auth"."uid"() = "customer_id"));



CREATE POLICY "Customers can manage own booking amendments" ON "public"."booking_amendments" USING ((EXISTS ( SELECT 1
   FROM "public"."bookings" "b"
  WHERE (("b"."id" = "booking_amendments"."booking_id") AND ("b"."customer_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."bookings" "b"
  WHERE (("b"."id" = "booking_amendments"."booking_id") AND ("b"."customer_id" = "auth"."uid"())))));



CREATE POLICY "Customers can manage own logistics" ON "public"."logistics_questionnaire" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Customers can read own preferences" ON "public"."customer_style_preferences" FOR SELECT USING (("auth"."uid"() = "customer_id"));



CREATE POLICY "Customers can update own preferences" ON "public"."customer_style_preferences" FOR UPDATE USING (("auth"."uid"() = "customer_id"));



CREATE POLICY "Customers can view photographer availability" ON "public"."photographer_availability" FOR SELECT USING (("is_booked" = false));



CREATE POLICY "Customers can view their job status" ON "public"."job_queue" FOR SELECT USING (("booking_id" IN ( SELECT "bookings"."id"
   FROM "public"."bookings"
  WHERE ("bookings"."customer_id" = "auth"."uid"()))));



CREATE POLICY "Enable insert for photographers" ON "public"."photographers" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Enable insert for users based on user_id" ON "public"."users" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Enable read access for all photographers" ON "public"."photographers" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."users" FOR SELECT USING (true);



CREATE POLICY "Enable update for photographers based on user_id" ON "public"."photographers" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Enable update for users based on user_id" ON "public"."users" FOR UPDATE USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Involved parties can update bookings" ON "public"."bookings" FOR UPDATE USING ((("customer_id" = "auth"."uid"()) OR ("photographer_id" IN ( SELECT "photographers"."id"
   FROM "public"."photographers"
  WHERE ("photographers"."user_id" = "auth"."uid"())))));



CREATE POLICY "Photographers and admins can view pay tiers" ON "public"."pay_tiers" FOR SELECT USING (((("auth"."jwt"() ->> 'role'::"text") = 'authenticated'::"text") AND (EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = ANY (ARRAY['photographer'::"public"."user_role", 'admin'::"public"."user_role"])))))));



CREATE POLICY "Photographers can decline jobs" ON "public"."declined_jobs" FOR INSERT TO "authenticated" WITH CHECK ((("talent_id" IN ( SELECT "photographers"."id"
   FROM "public"."photographers"
  WHERE ("photographers"."user_id" = "auth"."uid"()))) AND ("booking_id" IN ( SELECT "bookings"."id"
   FROM "public"."bookings"
  WHERE ("bookings"."photographer_id" = "declined_jobs"."talent_id")))));



CREATE POLICY "Photographers can delete own availability" ON "public"."photographer_availability" FOR DELETE USING (("photographer_id" IN ( SELECT "photographers"."id"
   FROM "public"."photographers"
  WHERE ("photographers"."user_id" = "auth"."uid"()))));



CREATE POLICY "Photographers can insert own availability" ON "public"."photographer_availability" FOR INSERT WITH CHECK (("photographer_id" IN ( SELECT "photographers"."id"
   FROM "public"."photographers"
  WHERE ("photographers"."user_id" = "auth"."uid"()))));



CREATE POLICY "Photographers can manage their availability" ON "public"."availability" USING (("photographer_id" IN ( SELECT "photographers"."id"
   FROM "public"."photographers"
  WHERE ("photographers"."user_id" = "auth"."uid"()))));



CREATE POLICY "Photographers can manage their packages" ON "public"."packages" USING (("photographer_id" IN ( SELECT "photographers"."id"
   FROM "public"."photographers"
  WHERE ("photographers"."user_id" = "auth"."uid"()))));



CREATE POLICY "Photographers can manage their portfolio" ON "public"."portfolio_items" USING (("photographer_id" IN ( SELECT "photographers"."id"
   FROM "public"."photographers"
  WHERE ("photographers"."user_id" = "auth"."uid"()))));



CREATE POLICY "Photographers can read customer preferences" ON "public"."customer_style_preferences" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."bookings" "b"
     JOIN "public"."photographers" "p" ON (("p"."id" = "b"."photographer_id")))
  WHERE (("b"."customer_id" = "b"."customer_id") AND ("p"."user_id" = "auth"."uid"())))));



CREATE POLICY "Photographers can update own availability" ON "public"."photographer_availability" FOR UPDATE USING (("photographer_id" IN ( SELECT "photographers"."id"
   FROM "public"."photographers"
  WHERE ("photographers"."user_id" = "auth"."uid"()))));



CREATE POLICY "Photographers can view booking amendments" ON "public"."booking_amendments" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."bookings" "b"
     JOIN "public"."photographers" "p" ON (("p"."id" = "b"."photographer_id")))
  WHERE (("b"."id" = "booking_amendments"."booking_id") AND ("p"."user_id" = "auth"."uid"())))));



CREATE POLICY "Photographers can view booking logistics" ON "public"."logistics_questionnaire" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."bookings" "b"
     JOIN "public"."photographers" "p" ON (("p"."id" = "b"."photographer_id")))
  WHERE (("b"."id" = "logistics_questionnaire"."booking_id") AND ("p"."user_id" = "auth"."uid"())))));



CREATE POLICY "Photographers can view own availability" ON "public"."photographer_availability" FOR SELECT USING (("photographer_id" IN ( SELECT "photographers"."id"
   FROM "public"."photographers"
  WHERE ("photographers"."user_id" = "auth"."uid"()))));



CREATE POLICY "Photographers can view own profile even if incomplete" ON "public"."photographers" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Photographers can view their booking addons" ON "public"."booking_addons" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."bookings" "b"
     JOIN "public"."photographers" "p" ON (("p"."id" = "b"."photographer_id")))
  WHERE (("b"."id" = "booking_addons"."booking_id") AND ("p"."user_id" = "auth"."uid"())))));



CREATE POLICY "Photographers can view their declined jobs" ON "public"."declined_jobs" FOR SELECT TO "authenticated" USING (("talent_id" IN ( SELECT "photographers"."id"
   FROM "public"."photographers"
  WHERE ("photographers"."user_id" = "auth"."uid"()))));



CREATE POLICY "Photographers can view their jobs" ON "public"."job_queue" FOR SELECT USING (("photographer_id" IN ( SELECT "photographers"."id"
   FROM "public"."photographers"
  WHERE ("photographers"."user_id" = "auth"."uid"()))));



CREATE POLICY "Public can create conversations" ON "public"."chat_conversations" FOR INSERT TO "authenticated", "anon" WITH CHECK (true);



CREATE POLICY "Public can create messages" ON "public"."chat_messages" FOR INSERT TO "authenticated", "anon" WITH CHECK (true);



CREATE POLICY "Public can read FAQ cache" ON "public"."chat_faq_cache" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Public profiles are viewable by everyone" ON "public"."photographers" FOR SELECT USING ((("visible_in_search" = true) AND ("profile_complete" = true)));



CREATE POLICY "Service role and admins can view audit logs" ON "public"."admin_audit_log" FOR SELECT USING ((("auth"."role"() = 'service_role'::"text") OR (EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = 'admin'::"public"."user_role"))))));



CREATE POLICY "Service role can insert audit logs" ON "public"."admin_audit_log" FOR INSERT WITH CHECK (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role full access to purge queue" ON "public"."account_purge_queue" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role has full access" ON "public"."users" USING (("auth"."role"() = 'service_role'::"text")) WITH CHECK (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Talent can read company messages" ON "public"."company_messages" FOR SELECT USING ((("is_active" = true) AND (EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND (("users"."role")::"text" = ANY ("company_messages"."audience")))))));



CREATE POLICY "Users can create contract signatures for their bookings" ON "public"."contract_signatures" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."bookings" "b"
  WHERE (("b"."id" = "contract_signatures"."booking_id") AND ("b"."customer_id" = "auth"."uid"()) AND ("b"."contract_signed" = false)))));



CREATE POLICY "Users can send messages" ON "public"."messages" FOR INSERT WITH CHECK (("sender_id" = "auth"."uid"()));



CREATE POLICY "Users can update their own applications" ON "public"."talent_applications" FOR UPDATE TO "authenticated" USING (("email" = (("current_setting"('request.jwt.claims'::"text", true))::json ->> 'email'::"text"))) WITH CHECK (("email" = (("current_setting"('request.jwt.claims'::"text", true))::json ->> 'email'::"text")));



COMMENT ON POLICY "Users can update their own applications" ON "public"."talent_applications" IS 'Allows authenticated users to update applications matching their email from JWT token. Used for linking applications to user accounts.';



CREATE POLICY "Users can update their training status" ON "public"."training_status" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view own conversations" ON "public"."chat_conversations" FOR SELECT TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR ("user_id" IS NULL)));



CREATE POLICY "Users can view own messages" ON "public"."chat_messages" FOR SELECT TO "authenticated" USING (("conversation_id" IN ( SELECT "chat_conversations"."id"
   FROM "public"."chat_conversations"
  WHERE (("chat_conversations"."user_id" = "auth"."uid"()) OR ("chat_conversations"."user_id" IS NULL)))));



CREATE POLICY "Users can view their messages" ON "public"."messages" FOR SELECT USING ((("sender_id" = "auth"."uid"()) OR ("recipient_id" = "auth"."uid"())));



CREATE POLICY "Users can view their own applications" ON "public"."talent_applications" FOR SELECT TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR ("email" = (("current_setting"('request.jwt.claims'::"text", true))::json ->> 'email'::"text"))));



COMMENT ON POLICY "Users can view their own applications" ON "public"."talent_applications" IS 'Allows authenticated users to view applications matching their user_id or email from JWT token';



CREATE POLICY "Users can view their own bookings" ON "public"."bookings" FOR SELECT USING ((("customer_id" = "auth"."uid"()) OR ("photographer_id" IN ( SELECT "photographers"."id"
   FROM "public"."photographers"
  WHERE ("photographers"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view their own contract signatures" ON "public"."contract_signatures" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."bookings" "b"
  WHERE (("b"."id" = "contract_signatures"."booking_id") AND ("b"."customer_id" = "auth"."uid"())))));



CREATE POLICY "Users can view their training status" ON "public"."training_status" FOR SELECT USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."account_purge_queue" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."addons" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."admin_audit_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."audit_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."availability" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."booking_addons" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."booking_amendments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."bookings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."chat_analytics" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."chat_conversations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."chat_faq_cache" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."chat_messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."company_messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."contact_submissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."contract_signatures" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."customer_style_preferences" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."declined_jobs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."job_queue" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."logistics_questionnaire" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."packages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pay_tiers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."photographer_availability" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."photographer_preview_profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."photographers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."portfolio_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reviews" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."talent_applications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."training_modules" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."training_status" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."zip_city" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "Customers can view their signed contracts" ON "storage"."objects" FOR SELECT USING ((("bucket_id" = 'signed-contracts'::"text") AND ("auth"."uid"() IN ( SELECT "bookings"."customer_id"
   FROM "public"."bookings"
  WHERE ((('booking_'::"text" || ("bookings"."id")::"text") || '.pdf'::"text") = "objects"."name")))));



CREATE POLICY "Photographers can delete own portfolio images" ON "storage"."objects" FOR DELETE USING ((("bucket_id" = 'photographer-portfolios'::"text") AND (("auth"."uid"())::"text" = ("storage"."foldername"("name"))[1])));



CREATE POLICY "Photographers can update own portfolio images" ON "storage"."objects" FOR UPDATE USING ((("bucket_id" = 'photographer-portfolios'::"text") AND (("auth"."uid"())::"text" = ("storage"."foldername"("name"))[1])));



CREATE POLICY "Photographers can upload own portfolio images" ON "storage"."objects" FOR INSERT WITH CHECK ((("bucket_id" = 'photographer-portfolios'::"text") AND (("auth"."uid"())::"text" = ("storage"."foldername"("name"))[1])));



CREATE POLICY "Photographers can view their signed contracts" ON "storage"."objects" FOR SELECT USING ((("bucket_id" = 'signed-contracts'::"text") AND ("auth"."uid"() IN ( SELECT "p"."user_id"
   FROM ("public"."bookings" "b"
     JOIN "public"."photographers" "p" ON (("b"."photographer_id" = "p"."id")))
  WHERE ((('booking_'::"text" || ("b"."id")::"text") || '.pdf'::"text") = "objects"."name")))));



CREATE POLICY "Public can view avatars" ON "storage"."objects" FOR SELECT USING (("bucket_id" = 'avatars'::"text"));



CREATE POLICY "Public can view portfolio images" ON "storage"."objects" FOR SELECT USING (("bucket_id" = 'photographer-portfolios'::"text"));



CREATE POLICY "Service role can upload signed contracts" ON "storage"."objects" FOR INSERT WITH CHECK (("bucket_id" = 'signed-contracts'::"text"));



CREATE POLICY "Users can delete own avatar" ON "storage"."objects" FOR DELETE USING ((("bucket_id" = 'avatars'::"text") AND (SUBSTRING("name" FROM 1 FOR 36) = ("auth"."uid"())::"text")));



CREATE POLICY "Users can update own avatar" ON "storage"."objects" FOR UPDATE USING ((("bucket_id" = 'avatars'::"text") AND (SUBSTRING("name" FROM 1 FOR 36) = ("auth"."uid"())::"text")));



CREATE POLICY "Users can upload own avatar" ON "storage"."objects" FOR INSERT WITH CHECK ((("bucket_id" = 'avatars'::"text") AND (SUBSTRING("name" FROM 1 FOR 36) = ("auth"."uid"())::"text")));



ALTER TABLE "storage"."buckets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "storage"."buckets_analytics" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "storage"."migrations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "storage"."objects" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "storage"."prefixes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "storage"."s3_multipart_uploads" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "storage"."s3_multipart_uploads_parts" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT USAGE ON SCHEMA "storage" TO "postgres" WITH GRANT OPTION;
GRANT USAGE ON SCHEMA "storage" TO "anon";
GRANT USAGE ON SCHEMA "storage" TO "authenticated";
GRANT USAGE ON SCHEMA "storage" TO "service_role";
GRANT ALL ON SCHEMA "storage" TO "supabase_storage_admin";
GRANT ALL ON SCHEMA "storage" TO "dashboard_user";



GRANT ALL ON FUNCTION "public"."audit_account_blacklist"() TO "anon";
GRANT ALL ON FUNCTION "public"."audit_account_blacklist"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."audit_account_blacklist"() TO "service_role";



GRANT ALL ON FUNCTION "public"."auto_publish_complete_profile"() TO "anon";
GRANT ALL ON FUNCTION "public"."auto_publish_complete_profile"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."auto_publish_complete_profile"() TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_booking_hours"("start_time" time without time zone, "end_time" time without time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_booking_hours"("start_time" time without time zone, "end_time" time without time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_booking_hours"("start_time" time without time zone, "end_time" time without time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_daily_chat_analytics"() TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_daily_chat_analytics"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_daily_chat_analytics"() TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_photographer_acceptance_rate"("photographer_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_photographer_acceptance_rate"("photographer_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_photographer_acceptance_rate"("photographer_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_photographer_response_time"("photographer_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_photographer_response_time"("photographer_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_photographer_response_time"("photographer_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_photographer_tier_upgrade"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_photographer_tier_upgrade"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_photographer_tier_upgrade"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_application_status"("p_email" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_application_status"("p_email" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_application_status"("p_email" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_available_photographers"("event_date" "date", "search_zip" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_available_photographers"("event_date" "date", "search_zip" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_available_photographers"("event_date" "date", "search_zip" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_blacklisted_talents_for_customer"("p_customer_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_blacklisted_talents_for_customer"("p_customer_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_blacklisted_talents_for_customer"("p_customer_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_photographer_stats"("photographer_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_photographer_stats"("photographer_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_photographer_stats"("photographer_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."has_accepted_application"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."has_accepted_application"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_accepted_application"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON TABLE "public"."photographers" TO "anon";
GRANT ALL ON TABLE "public"."photographers" TO "authenticated";
GRANT ALL ON TABLE "public"."photographers" TO "service_role";



GRANT ALL ON FUNCTION "public"."is_photographer_profile_complete"("photographer_record" "public"."photographers") TO "anon";
GRANT ALL ON FUNCTION "public"."is_photographer_profile_complete"("photographer_record" "public"."photographers") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_photographer_profile_complete"("photographer_record" "public"."photographers") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_photographer_unavailable"("photographer_unavailable_dates" "date"[], "check_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."is_photographer_unavailable"("photographer_unavailable_dates" "date"[], "check_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_photographer_unavailable"("photographer_unavailable_dates" "date"[], "check_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_talent_blacklisted_for_customer"("p_talent_id" "uuid", "p_customer_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_talent_blacklisted_for_customer"("p_talent_id" "uuid", "p_customer_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_talent_blacklisted_for_customer"("p_talent_id" "uuid", "p_customer_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."scheduled_update_photographer_metrics"() TO "anon";
GRANT ALL ON FUNCTION "public"."scheduled_update_photographer_metrics"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."scheduled_update_photographer_metrics"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_photographer_display_name"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_photographer_display_name"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_photographer_display_name"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_update_photographer_metrics_on_booking"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_update_photographer_metrics_on_booking"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_update_photographer_metrics_on_booking"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_update_photographer_response_time"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_update_photographer_response_time"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_update_photographer_response_time"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_all_photographer_metrics"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_all_photographer_metrics"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_all_photographer_metrics"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_amendment_completed_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_amendment_completed_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_amendment_completed_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_booking_contract_signed"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_booking_contract_signed"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_booking_contract_signed"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_conversation_stats"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_conversation_stats"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_conversation_stats"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_customer_style_preferences_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_customer_style_preferences_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_customer_style_preferences_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_logistics_questionnaire_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_logistics_questionnaire_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_logistics_questionnaire_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_photographer_metrics"("photographer_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."update_photographer_metrics"("photographer_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_photographer_metrics"("photographer_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_photographer_metrics_on_booking"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_photographer_metrics_on_booking"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_photographer_metrics_on_booking"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_photographer_metrics_on_message"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_photographer_metrics_on_message"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_photographer_metrics_on_message"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_photographer_review_stats"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_photographer_review_stats"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_photographer_review_stats"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_photographer_stats"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_photographer_stats"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_photographer_stats"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_photographer_visibility"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_photographer_visibility"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_photographer_visibility"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_style_questionnaires_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_style_questionnaires_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_style_questionnaires_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_booking_date"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_booking_date"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_booking_date"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_photographer_visibility"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_photographer_visibility"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_photographer_visibility"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_videographer_style_tags"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_videographer_style_tags"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_videographer_style_tags"() TO "service_role";



GRANT ALL ON FUNCTION "storage"."add_prefixes"("_bucket_id" "text", "_name" "text") TO "postgres";



GRANT ALL ON FUNCTION "storage"."can_insert_object"("bucketid" "text", "name" "text", "owner" "uuid", "metadata" "jsonb") TO "postgres";



GRANT ALL ON FUNCTION "storage"."delete_prefix"("_bucket_id" "text", "_name" "text") TO "postgres";



GRANT ALL ON FUNCTION "storage"."delete_prefix_hierarchy_trigger"() TO "postgres";



GRANT ALL ON FUNCTION "storage"."enforce_bucket_name_length"() TO "postgres";



GRANT ALL ON FUNCTION "storage"."extension"("name" "text") TO "postgres";



GRANT ALL ON FUNCTION "storage"."filename"("name" "text") TO "postgres";



GRANT ALL ON FUNCTION "storage"."foldername"("name" "text") TO "postgres";



GRANT ALL ON FUNCTION "storage"."get_level"("name" "text") TO "postgres";



GRANT ALL ON FUNCTION "storage"."get_prefix"("name" "text") TO "postgres";



GRANT ALL ON FUNCTION "storage"."get_prefixes"("name" "text") TO "postgres";



GRANT ALL ON FUNCTION "storage"."get_size_by_bucket"() TO "postgres";



GRANT ALL ON FUNCTION "storage"."list_multipart_uploads_with_delimiter"("bucket_id" "text", "prefix_param" "text", "delimiter_param" "text", "max_keys" integer, "next_key_token" "text", "next_upload_token" "text") TO "postgres";



GRANT ALL ON FUNCTION "storage"."list_objects_with_delimiter"("bucket_id" "text", "prefix_param" "text", "delimiter_param" "text", "max_keys" integer, "start_after" "text", "next_token" "text") TO "postgres";



GRANT ALL ON FUNCTION "storage"."objects_insert_prefix_trigger"() TO "postgres";



GRANT ALL ON FUNCTION "storage"."objects_update_prefix_trigger"() TO "postgres";



GRANT ALL ON FUNCTION "storage"."operation"() TO "postgres";



GRANT ALL ON FUNCTION "storage"."prefixes_insert_trigger"() TO "postgres";



GRANT ALL ON FUNCTION "storage"."search"("prefix" "text", "bucketname" "text", "limits" integer, "levels" integer, "offsets" integer, "search" "text", "sortcolumn" "text", "sortorder" "text") TO "postgres";



GRANT ALL ON FUNCTION "storage"."search_legacy_v1"("prefix" "text", "bucketname" "text", "limits" integer, "levels" integer, "offsets" integer, "search" "text", "sortcolumn" "text", "sortorder" "text") TO "postgres";



GRANT ALL ON FUNCTION "storage"."search_v1_optimised"("prefix" "text", "bucketname" "text", "limits" integer, "levels" integer, "offsets" integer, "search" "text", "sortcolumn" "text", "sortorder" "text") TO "postgres";



GRANT ALL ON FUNCTION "storage"."update_updated_at_column"() TO "postgres";



GRANT ALL ON TABLE "public"."account_purge_queue" TO "anon";
GRANT ALL ON TABLE "public"."account_purge_queue" TO "authenticated";
GRANT ALL ON TABLE "public"."account_purge_queue" TO "service_role";



GRANT ALL ON TABLE "public"."addons" TO "anon";
GRANT ALL ON TABLE "public"."addons" TO "authenticated";
GRANT ALL ON TABLE "public"."addons" TO "service_role";



GRANT ALL ON TABLE "public"."admin_audit_log" TO "anon";
GRANT ALL ON TABLE "public"."admin_audit_log" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_audit_log" TO "service_role";



GRANT ALL ON TABLE "public"."audit_logs" TO "anon";
GRANT ALL ON TABLE "public"."audit_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."audit_logs" TO "service_role";



GRANT ALL ON TABLE "public"."availability" TO "anon";
GRANT ALL ON TABLE "public"."availability" TO "authenticated";
GRANT ALL ON TABLE "public"."availability" TO "service_role";



GRANT ALL ON TABLE "public"."booking_addons" TO "anon";
GRANT ALL ON TABLE "public"."booking_addons" TO "authenticated";
GRANT ALL ON TABLE "public"."booking_addons" TO "service_role";



GRANT ALL ON TABLE "public"."booking_amendments" TO "anon";
GRANT ALL ON TABLE "public"."booking_amendments" TO "authenticated";
GRANT ALL ON TABLE "public"."booking_amendments" TO "service_role";



GRANT ALL ON TABLE "public"."bookings" TO "anon";
GRANT ALL ON TABLE "public"."bookings" TO "authenticated";
GRANT ALL ON TABLE "public"."bookings" TO "service_role";



GRANT UPDATE("updated_at") ON TABLE "public"."bookings" TO "authenticated";



GRANT UPDATE("contract_signed") ON TABLE "public"."bookings" TO "authenticated";



GRANT ALL ON TABLE "public"."chat_analytics" TO "anon";
GRANT ALL ON TABLE "public"."chat_analytics" TO "authenticated";
GRANT ALL ON TABLE "public"."chat_analytics" TO "service_role";



GRANT ALL ON TABLE "public"."chat_conversations" TO "anon";
GRANT ALL ON TABLE "public"."chat_conversations" TO "authenticated";
GRANT ALL ON TABLE "public"."chat_conversations" TO "service_role";



GRANT ALL ON TABLE "public"."chat_faq_cache" TO "anon";
GRANT ALL ON TABLE "public"."chat_faq_cache" TO "authenticated";
GRANT ALL ON TABLE "public"."chat_faq_cache" TO "service_role";



GRANT ALL ON TABLE "public"."chat_messages" TO "anon";
GRANT ALL ON TABLE "public"."chat_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."chat_messages" TO "service_role";



GRANT ALL ON TABLE "public"."company_messages" TO "anon";
GRANT ALL ON TABLE "public"."company_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."company_messages" TO "service_role";



GRANT ALL ON TABLE "public"."contact_submissions" TO "anon";
GRANT ALL ON TABLE "public"."contact_submissions" TO "authenticated";
GRANT ALL ON TABLE "public"."contact_submissions" TO "service_role";



GRANT ALL ON TABLE "public"."contract_signatures" TO "anon";
GRANT ALL ON TABLE "public"."contract_signatures" TO "authenticated";
GRANT ALL ON TABLE "public"."contract_signatures" TO "service_role";



GRANT ALL ON TABLE "public"."contracts" TO "anon";
GRANT ALL ON TABLE "public"."contracts" TO "authenticated";
GRANT ALL ON TABLE "public"."contracts" TO "service_role";



GRANT ALL ON TABLE "public"."customer_style_preferences" TO "anon";
GRANT ALL ON TABLE "public"."customer_style_preferences" TO "authenticated";
GRANT ALL ON TABLE "public"."customer_style_preferences" TO "service_role";



GRANT ALL ON TABLE "public"."declined_jobs" TO "anon";
GRANT ALL ON TABLE "public"."declined_jobs" TO "authenticated";
GRANT ALL ON TABLE "public"."declined_jobs" TO "service_role";



GRANT ALL ON TABLE "public"."job_queue" TO "anon";
GRANT ALL ON TABLE "public"."job_queue" TO "authenticated";
GRANT ALL ON TABLE "public"."job_queue" TO "service_role";



GRANT ALL ON TABLE "public"."logistics_questionnaire" TO "anon";
GRANT ALL ON TABLE "public"."logistics_questionnaire" TO "authenticated";
GRANT ALL ON TABLE "public"."logistics_questionnaire" TO "service_role";



GRANT ALL ON TABLE "public"."messages" TO "anon";
GRANT ALL ON TABLE "public"."messages" TO "authenticated";
GRANT ALL ON TABLE "public"."messages" TO "service_role";



GRANT ALL ON TABLE "public"."packages" TO "anon";
GRANT ALL ON TABLE "public"."packages" TO "authenticated";
GRANT ALL ON TABLE "public"."packages" TO "service_role";



GRANT ALL ON TABLE "public"."pay_tiers" TO "anon";
GRANT ALL ON TABLE "public"."pay_tiers" TO "authenticated";
GRANT ALL ON TABLE "public"."pay_tiers" TO "service_role";



GRANT ALL ON SEQUENCE "public"."pay_tiers_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."pay_tiers_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."pay_tiers_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."photographer_availability" TO "anon";
GRANT ALL ON TABLE "public"."photographer_availability" TO "authenticated";
GRANT ALL ON TABLE "public"."photographer_availability" TO "service_role";



GRANT ALL ON TABLE "public"."photographer_preview_profiles" TO "anon";
GRANT ALL ON TABLE "public"."photographer_preview_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."photographer_preview_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."portfolio_items" TO "anon";
GRANT ALL ON TABLE "public"."portfolio_items" TO "authenticated";
GRANT ALL ON TABLE "public"."portfolio_items" TO "service_role";



GRANT ALL ON TABLE "public"."questionnaire_answers" TO "anon";
GRANT ALL ON TABLE "public"."questionnaire_answers" TO "authenticated";
GRANT ALL ON TABLE "public"."questionnaire_answers" TO "service_role";



GRANT ALL ON TABLE "public"."questionnaires" TO "anon";
GRANT ALL ON TABLE "public"."questionnaires" TO "authenticated";
GRANT ALL ON TABLE "public"."questionnaires" TO "service_role";



GRANT ALL ON TABLE "public"."reviews" TO "anon";
GRANT ALL ON TABLE "public"."reviews" TO "authenticated";
GRANT ALL ON TABLE "public"."reviews" TO "service_role";



GRANT ALL ON TABLE "public"."talent_applications" TO "anon";
GRANT ALL ON TABLE "public"."talent_applications" TO "authenticated";
GRANT ALL ON TABLE "public"."talent_applications" TO "service_role";



GRANT ALL ON TABLE "public"."training_modules" TO "anon";
GRANT ALL ON TABLE "public"."training_modules" TO "authenticated";
GRANT ALL ON TABLE "public"."training_modules" TO "service_role";



GRANT ALL ON TABLE "public"."training_status" TO "anon";
GRANT ALL ON TABLE "public"."training_status" TO "authenticated";
GRANT ALL ON TABLE "public"."training_status" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



GRANT ALL ON TABLE "public"."zip_city" TO "anon";
GRANT ALL ON TABLE "public"."zip_city" TO "authenticated";
GRANT ALL ON TABLE "public"."zip_city" TO "service_role";



GRANT ALL ON TABLE "storage"."buckets" TO "anon";
GRANT ALL ON TABLE "storage"."buckets" TO "authenticated";
GRANT ALL ON TABLE "storage"."buckets" TO "service_role";
GRANT ALL ON TABLE "storage"."buckets" TO "postgres" WITH GRANT OPTION;



GRANT ALL ON TABLE "storage"."buckets_analytics" TO "service_role";
GRANT ALL ON TABLE "storage"."buckets_analytics" TO "authenticated";
GRANT ALL ON TABLE "storage"."buckets_analytics" TO "anon";
GRANT ALL ON TABLE "storage"."buckets_analytics" TO "postgres";



GRANT ALL ON TABLE "storage"."objects" TO "anon";
GRANT ALL ON TABLE "storage"."objects" TO "authenticated";
GRANT ALL ON TABLE "storage"."objects" TO "service_role";
GRANT ALL ON TABLE "storage"."objects" TO "postgres" WITH GRANT OPTION;



GRANT ALL ON TABLE "storage"."prefixes" TO "service_role";
GRANT ALL ON TABLE "storage"."prefixes" TO "authenticated";
GRANT ALL ON TABLE "storage"."prefixes" TO "anon";
GRANT ALL ON TABLE "storage"."prefixes" TO "postgres";



GRANT ALL ON TABLE "storage"."s3_multipart_uploads" TO "service_role";
GRANT SELECT ON TABLE "storage"."s3_multipart_uploads" TO "authenticated";
GRANT SELECT ON TABLE "storage"."s3_multipart_uploads" TO "anon";
GRANT ALL ON TABLE "storage"."s3_multipart_uploads" TO "postgres";



GRANT ALL ON TABLE "storage"."s3_multipart_uploads_parts" TO "service_role";
GRANT SELECT ON TABLE "storage"."s3_multipart_uploads_parts" TO "authenticated";
GRANT SELECT ON TABLE "storage"."s3_multipart_uploads_parts" TO "anon";
GRANT ALL ON TABLE "storage"."s3_multipart_uploads_parts" TO "postgres";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON SEQUENCES TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON FUNCTIONS TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON TABLES TO "service_role";




RESET ALL;
