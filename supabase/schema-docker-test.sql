
\restrict hT2U7DCGIQzyW66OnFtXMDcGIclodgBImCpBaVrOseyi3dZIadnOy3itLvrcpr8


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


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."booking_status" AS ENUM (
    'pending',
    'confirmed',
    'completed',
    'cancelled'
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


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


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


CREATE TABLE IF NOT EXISTS "public"."bookings" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "customer_id" "uuid" NOT NULL,
    "photographer_id" "uuid" NOT NULL,
    "package_id" "uuid",
    "event_date" "date" NOT NULL,
    "event_time" time without time zone NOT NULL,
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
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."bookings" OWNER TO "postgres";


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
    "updated_at" timestamp with time zone DEFAULT "now"()
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
    "created_at" timestamp with time zone DEFAULT "now"()
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
    "is_public" boolean DEFAULT false,
    "is_verified" boolean DEFAULT false,
    "average_rating" numeric(3,2) DEFAULT 0.00,
    "total_reviews" integer DEFAULT 0,
    "response_time_hours" integer,
    "cancellation_rate" numeric(5,2) DEFAULT 0.00,
    "onboarding_completed" boolean DEFAULT false,
    "onboarding_step" integer DEFAULT 1,
    "stripe_account_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."photographers" OWNER TO "postgres";


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
    CONSTRAINT "reviews_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5)))
);


ALTER TABLE "public"."reviews" OWNER TO "postgres";


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
    "metadata" "jsonb" DEFAULT '{}'::"jsonb"
);


ALTER TABLE "public"."users" OWNER TO "postgres";


ALTER TABLE ONLY "public"."pay_tiers" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."pay_tiers_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."availability"
    ADD CONSTRAINT "availability_photographer_id_date_key" UNIQUE ("photographer_id", "date");



ALTER TABLE ONLY "public"."availability"
    ADD CONSTRAINT "availability_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contact_submissions"
    ADD CONSTRAINT "contact_submissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."job_queue"
    ADD CONSTRAINT "job_queue_booking_id_key" UNIQUE ("booking_id");



ALTER TABLE ONLY "public"."job_queue"
    ADD CONSTRAINT "job_queue_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."packages"
    ADD CONSTRAINT "packages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pay_tiers"
    ADD CONSTRAINT "pay_tiers_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."pay_tiers"
    ADD CONSTRAINT "pay_tiers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."photographers"
    ADD CONSTRAINT "photographers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."photographers"
    ADD CONSTRAINT "photographers_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."portfolio_items"
    ADD CONSTRAINT "portfolio_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_booking_id_key" UNIQUE ("booking_id");



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."training_modules"
    ADD CONSTRAINT "training_modules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."training_status"
    ADD CONSTRAINT "training_status_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."training_status"
    ADD CONSTRAINT "training_status_user_id_module_id_key" UNIQUE ("user_id", "module_id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_audit_logs_created" ON "public"."audit_logs" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_audit_logs_entity" ON "public"."audit_logs" USING "btree" ("entity_type", "entity_id");



CREATE INDEX "idx_audit_logs_user" ON "public"."audit_logs" USING "btree" ("user_id");



CREATE INDEX "idx_availability_available" ON "public"."availability" USING "btree" ("is_available");



CREATE INDEX "idx_availability_date" ON "public"."availability" USING "btree" ("date");



CREATE INDEX "idx_availability_photographer" ON "public"."availability" USING "btree" ("photographer_id");



CREATE INDEX "idx_bookings_created" ON "public"."bookings" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_bookings_customer" ON "public"."bookings" USING "btree" ("customer_id");



CREATE INDEX "idx_bookings_event_date" ON "public"."bookings" USING "btree" ("event_date");



CREATE INDEX "idx_bookings_payment_status" ON "public"."bookings" USING "btree" ("payment_status");



CREATE INDEX "idx_bookings_photographer" ON "public"."bookings" USING "btree" ("photographer_id");



CREATE INDEX "idx_bookings_status" ON "public"."bookings" USING "btree" ("booking_status");



CREATE INDEX "idx_contact_submissions_created_at" ON "public"."contact_submissions" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_contact_submissions_email" ON "public"."contact_submissions" USING "btree" ("email");



CREATE INDEX "idx_contact_submissions_status" ON "public"."contact_submissions" USING "btree" ("status");



CREATE INDEX "idx_job_queue_booking" ON "public"."job_queue" USING "btree" ("booking_id");



CREATE INDEX "idx_job_queue_deadline" ON "public"."job_queue" USING "btree" ("deadline");



CREATE INDEX "idx_job_queue_photographer" ON "public"."job_queue" USING "btree" ("photographer_id");



CREATE INDEX "idx_job_queue_status" ON "public"."job_queue" USING "btree" ("upload_status");



CREATE INDEX "idx_messages_booking" ON "public"."messages" USING "btree" ("booking_id");



CREATE INDEX "idx_messages_created" ON "public"."messages" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_messages_read" ON "public"."messages" USING "btree" ("is_read");



CREATE INDEX "idx_messages_recipient" ON "public"."messages" USING "btree" ("recipient_id");



CREATE INDEX "idx_messages_sender" ON "public"."messages" USING "btree" ("sender_id");



CREATE INDEX "idx_packages_active" ON "public"."packages" USING "btree" ("is_active");



CREATE INDEX "idx_packages_photographer" ON "public"."packages" USING "btree" ("photographer_id");



CREATE INDEX "idx_packages_price" ON "public"."packages" USING "btree" ("base_price");



CREATE INDEX "idx_photographers_is_public" ON "public"."photographers" USING "btree" ("is_public");



CREATE INDEX "idx_photographers_location" ON "public"."photographers" USING "gin" ("languages");



CREATE INDEX "idx_photographers_pay_tier" ON "public"."photographers" USING "btree" ("pay_tier_id");



CREATE INDEX "idx_photographers_rating" ON "public"."photographers" USING "btree" ("average_rating" DESC);



CREATE INDEX "idx_photographers_user_id" ON "public"."photographers" USING "btree" ("user_id");



CREATE INDEX "idx_portfolio_category" ON "public"."portfolio_items" USING "btree" ("category");



CREATE INDEX "idx_portfolio_featured" ON "public"."portfolio_items" USING "btree" ("is_featured");



CREATE INDEX "idx_portfolio_photographer" ON "public"."portfolio_items" USING "btree" ("photographer_id");



CREATE INDEX "idx_reviews_booking" ON "public"."reviews" USING "btree" ("booking_id");



CREATE INDEX "idx_reviews_created" ON "public"."reviews" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_reviews_photographer" ON "public"."reviews" USING "btree" ("photographer_id");



CREATE INDEX "idx_reviews_rating" ON "public"."reviews" USING "btree" ("rating");



CREATE INDEX "idx_training_status_complete" ON "public"."training_status" USING "btree" ("is_complete");



CREATE INDEX "idx_training_status_module" ON "public"."training_status" USING "btree" ("module_id");



CREATE INDEX "idx_training_status_user" ON "public"."training_status" USING "btree" ("user_id");



CREATE INDEX "idx_users_created_at" ON "public"."users" USING "btree" ("created_at");



CREATE INDEX "idx_users_email" ON "public"."users" USING "btree" ("email");



CREATE INDEX "idx_users_role" ON "public"."users" USING "btree" ("role");



CREATE OR REPLACE TRIGGER "check_tier_upgrade" BEFORE UPDATE OF "completed_jobs_count" ON "public"."photographers" FOR EACH ROW EXECUTE FUNCTION "public"."check_photographer_tier_upgrade"();



CREATE OR REPLACE TRIGGER "update_availability_updated_at" BEFORE UPDATE ON "public"."availability" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_bookings_updated_at" BEFORE UPDATE ON "public"."bookings" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_job_queue_updated_at" BEFORE UPDATE ON "public"."job_queue" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_packages_updated_at" BEFORE UPDATE ON "public"."packages" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_photographer_stats_trigger" AFTER INSERT OR UPDATE ON "public"."reviews" FOR EACH ROW EXECUTE FUNCTION "public"."update_photographer_stats"();



CREATE OR REPLACE TRIGGER "update_photographers_updated_at" BEFORE UPDATE ON "public"."photographers" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_reviews_updated_at" BEFORE UPDATE ON "public"."reviews" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_users_updated_at" BEFORE UPDATE ON "public"."users" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."availability"
    ADD CONSTRAINT "availability_photographer_id_fkey" FOREIGN KEY ("photographer_id") REFERENCES "public"."photographers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_cancelled_by_fkey" FOREIGN KEY ("cancelled_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "public"."packages"("id");



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_photographer_id_fkey" FOREIGN KEY ("photographer_id") REFERENCES "public"."photographers"("id");



ALTER TABLE ONLY "public"."job_queue"
    ADD CONSTRAINT "job_queue_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id");



ALTER TABLE ONLY "public"."job_queue"
    ADD CONSTRAINT "job_queue_photographer_id_fkey" FOREIGN KEY ("photographer_id") REFERENCES "public"."photographers"("id");



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



ALTER TABLE ONLY "public"."photographers"
    ADD CONSTRAINT "photographers_pay_tier_id_fkey" FOREIGN KEY ("pay_tier_id") REFERENCES "public"."pay_tiers"("id");



ALTER TABLE ONLY "public"."photographers"
    ADD CONSTRAINT "photographers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."portfolio_items"
    ADD CONSTRAINT "portfolio_items_photographer_id_fkey" FOREIGN KEY ("photographer_id") REFERENCES "public"."photographers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id");



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_photographer_id_fkey" FOREIGN KEY ("photographer_id") REFERENCES "public"."photographers"("id");



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."training_status"
    ADD CONSTRAINT "training_status_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "public"."training_modules"("id");



ALTER TABLE ONLY "public"."training_status"
    ADD CONSTRAINT "training_status_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Anyone can create contact submissions" ON "public"."contact_submissions" FOR INSERT WITH CHECK (true);



CREATE POLICY "Anyone can view active packages" ON "public"."packages" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Anyone can view photographer availability" ON "public"."availability" FOR SELECT USING (true);



CREATE POLICY "Anyone can view portfolio items" ON "public"."portfolio_items" FOR SELECT USING (true);



CREATE POLICY "Anyone can view reviews" ON "public"."reviews" FOR SELECT USING (true);



CREATE POLICY "Anyone can view training modules" ON "public"."training_modules" FOR SELECT USING (true);



CREATE POLICY "Authenticated users can update contact submissions" ON "public"."contact_submissions" FOR UPDATE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated users can view contact submissions" ON "public"."contact_submissions" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Customers can create bookings" ON "public"."bookings" FOR INSERT WITH CHECK (("customer_id" = "auth"."uid"()));



CREATE POLICY "Customers can create reviews for their bookings" ON "public"."reviews" FOR INSERT WITH CHECK ((("reviewer_id" = "auth"."uid"()) AND ("booking_id" IN ( SELECT "bookings"."id"
   FROM "public"."bookings"
  WHERE ("bookings"."customer_id" = "auth"."uid"())))));



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



CREATE POLICY "Photographers can manage their availability" ON "public"."availability" USING (("photographer_id" IN ( SELECT "photographers"."id"
   FROM "public"."photographers"
  WHERE ("photographers"."user_id" = "auth"."uid"()))));



CREATE POLICY "Photographers can manage their packages" ON "public"."packages" USING (("photographer_id" IN ( SELECT "photographers"."id"
   FROM "public"."photographers"
  WHERE ("photographers"."user_id" = "auth"."uid"()))));



CREATE POLICY "Photographers can manage their portfolio" ON "public"."portfolio_items" USING (("photographer_id" IN ( SELECT "photographers"."id"
   FROM "public"."photographers"
  WHERE ("photographers"."user_id" = "auth"."uid"()))));



CREATE POLICY "Photographers can view their jobs" ON "public"."job_queue" FOR SELECT USING (("photographer_id" IN ( SELECT "photographers"."id"
   FROM "public"."photographers"
  WHERE ("photographers"."user_id" = "auth"."uid"()))));



CREATE POLICY "Service role has full access" ON "public"."users" USING (("auth"."role"() = 'service_role'::"text")) WITH CHECK (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Users can send messages" ON "public"."messages" FOR INSERT WITH CHECK (("sender_id" = "auth"."uid"()));



CREATE POLICY "Users can update their training status" ON "public"."training_status" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view their messages" ON "public"."messages" FOR SELECT USING ((("sender_id" = "auth"."uid"()) OR ("recipient_id" = "auth"."uid"())));



CREATE POLICY "Users can view their own bookings" ON "public"."bookings" FOR SELECT USING ((("customer_id" = "auth"."uid"()) OR ("photographer_id" IN ( SELECT "photographers"."id"
   FROM "public"."photographers"
  WHERE ("photographers"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view their training status" ON "public"."training_status" FOR SELECT USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."audit_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."availability" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."bookings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."job_queue" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."packages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."photographers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."portfolio_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reviews" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."training_modules" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."training_status" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."check_photographer_tier_upgrade"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_photographer_tier_upgrade"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_photographer_tier_upgrade"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_photographer_stats"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_photographer_stats"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_photographer_stats"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";


















GRANT ALL ON TABLE "public"."audit_logs" TO "anon";
GRANT ALL ON TABLE "public"."audit_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."audit_logs" TO "service_role";



GRANT ALL ON TABLE "public"."availability" TO "anon";
GRANT ALL ON TABLE "public"."availability" TO "authenticated";
GRANT ALL ON TABLE "public"."availability" TO "service_role";



GRANT ALL ON TABLE "public"."bookings" TO "anon";
GRANT ALL ON TABLE "public"."bookings" TO "authenticated";
GRANT ALL ON TABLE "public"."bookings" TO "service_role";



GRANT ALL ON TABLE "public"."contact_submissions" TO "anon";
GRANT ALL ON TABLE "public"."contact_submissions" TO "authenticated";
GRANT ALL ON TABLE "public"."contact_submissions" TO "service_role";



GRANT ALL ON TABLE "public"."job_queue" TO "anon";
GRANT ALL ON TABLE "public"."job_queue" TO "authenticated";
GRANT ALL ON TABLE "public"."job_queue" TO "service_role";



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



GRANT ALL ON TABLE "public"."photographers" TO "anon";
GRANT ALL ON TABLE "public"."photographers" TO "authenticated";
GRANT ALL ON TABLE "public"."photographers" TO "service_role";



GRANT ALL ON TABLE "public"."portfolio_items" TO "anon";
GRANT ALL ON TABLE "public"."portfolio_items" TO "authenticated";
GRANT ALL ON TABLE "public"."portfolio_items" TO "service_role";



GRANT ALL ON TABLE "public"."reviews" TO "anon";
GRANT ALL ON TABLE "public"."reviews" TO "authenticated";
GRANT ALL ON TABLE "public"."reviews" TO "service_role";



GRANT ALL ON TABLE "public"."training_modules" TO "anon";
GRANT ALL ON TABLE "public"."training_modules" TO "authenticated";
GRANT ALL ON TABLE "public"."training_modules" TO "service_role";



GRANT ALL ON TABLE "public"."training_status" TO "anon";
GRANT ALL ON TABLE "public"."training_status" TO "authenticated";
GRANT ALL ON TABLE "public"."training_status" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";









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






























\unrestrict hT2U7DCGIQzyW66OnFtXMDcGIclodgBImCpBaVrOseyi3dZIadnOy3itLvrcpr8

RESET ALL;
