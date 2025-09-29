-- LOVEP Marketplace Database Schema
-- Supabase PostgreSQL Schema with RLS policies

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
CREATE TYPE user_role AS ENUM ('customer', 'photographer', 'admin');
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'refunded', 'failed');
CREATE TYPE upload_status AS ENUM ('pending', 'in_progress', 'completed', 'approved');

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    role user_role NOT NULL DEFAULT 'customer',
    full_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for users
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_created_at ON public.users(created_at);

-- Pay tiers table
CREATE TABLE public.pay_tiers (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    hourly_rate DECIMAL(10,2) NOT NULL,
    min_jobs_required INTEGER DEFAULT 0,
    commission_percentage DECIMAL(5,2) DEFAULT 20.00,
    badge_color TEXT,
    perks TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default pay tiers
INSERT INTO public.pay_tiers (name, hourly_rate, min_jobs_required, badge_color, perks) VALUES
('Bronze', 150.00, 0, '#CD7F32', ARRAY['Basic listing', 'Standard support']),
('Silver', 225.00, 10, '#C0C0C0', ARRAY['Priority listing', 'Enhanced support', 'Featured badge']),
('Gold', 350.00, 25, '#FFD700', ARRAY['Top listing', 'Premium support', 'Gold badge', 'Analytics dashboard']),
('Platinum', 500.00, 50, '#E5E4E2', ARRAY['VIP listing', 'Dedicated support', 'Platinum badge', 'Full analytics', 'Custom branding']);

-- Photographers table
CREATE TABLE public.photographers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    bio TEXT,
    camera_type TEXT[],
    equipment_list JSONB DEFAULT '[]'::jsonb,
    pay_tier_id INTEGER REFERENCES public.pay_tiers(id) DEFAULT 1,
    portfolio_url TEXT,
    website_url TEXT,
    instagram_handle TEXT,
    experience_years INTEGER DEFAULT 0,
    completed_jobs_count INTEGER DEFAULT 0,
    languages TEXT[] DEFAULT ARRAY['English'],
    specialties TEXT[],
    travel_radius_miles INTEGER DEFAULT 25,
    trust_badges TEXT[] DEFAULT ARRAY[]::TEXT[],
    is_public BOOLEAN DEFAULT false,
    is_verified BOOLEAN DEFAULT false,
    average_rating DECIMAL(3,2) DEFAULT 0.00,
    total_reviews INTEGER DEFAULT 0,
    response_time_hours INTEGER,
    cancellation_rate DECIMAL(5,2) DEFAULT 0.00,
    onboarding_completed BOOLEAN DEFAULT false,
    onboarding_step INTEGER DEFAULT 1,
    stripe_account_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for photographers
CREATE INDEX idx_photographers_user_id ON public.photographers(user_id);
CREATE INDEX idx_photographers_pay_tier ON public.photographers(pay_tier_id);
CREATE INDEX idx_photographers_is_public ON public.photographers(is_public);
CREATE INDEX idx_photographers_rating ON public.photographers(average_rating DESC);
CREATE INDEX idx_photographers_location ON public.photographers USING GIN(languages);

-- Availability table
CREATE TABLE public.availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    photographer_id UUID NOT NULL REFERENCES public.photographers(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    is_available BOOLEAN DEFAULT true,
    time_slots JSONB DEFAULT '[]'::jsonb, -- Array of {start: "09:00", end: "17:00", booked: false}
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(photographer_id, date)
);

-- Create indexes for availability
CREATE INDEX idx_availability_photographer ON public.availability(photographer_id);
CREATE INDEX idx_availability_date ON public.availability(date);
CREATE INDEX idx_availability_available ON public.availability(is_available);

-- Packages table
CREATE TABLE public.packages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    photographer_id UUID REFERENCES public.photographers(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    base_price DECIMAL(10,2) NOT NULL,
    duration_minutes INTEGER NOT NULL,
    deliverables JSONB DEFAULT '[]'::jsonb,
    includes TEXT[],
    upsells JSONB DEFAULT '[]'::jsonb, -- Array of {name, price, description}
    max_guests INTEGER,
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    booking_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for packages
CREATE INDEX idx_packages_photographer ON public.packages(photographer_id);
CREATE INDEX idx_packages_active ON public.packages(is_active);
CREATE INDEX idx_packages_price ON public.packages(base_price);

-- Bookings table
CREATE TABLE public.bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES public.users(id),
    photographer_id UUID NOT NULL REFERENCES public.photographers(id),
    package_id UUID REFERENCES public.packages(id),
    event_date DATE NOT NULL,
    event_time TIME NOT NULL,
    event_end_time TIME,
    event_type TEXT,
    venue_name TEXT,
    venue_address JSONB, -- {street, city, state, zip, country}
    guest_count INTEGER,
    total_amount DECIMAL(10,2) NOT NULL,
    deposit_amount DECIMAL(10,2),
    payment_status payment_status DEFAULT 'pending',
    booking_status booking_status DEFAULT 'pending',
    personalization_data JSONB DEFAULT '{}'::jsonb, -- Quiz results and preferences
    special_requests TEXT,
    stripe_session_id TEXT,
    stripe_payment_intent_id TEXT,
    contract_url TEXT,
    contract_signed_at TIMESTAMPTZ,
    cancellation_reason TEXT,
    cancelled_at TIMESTAMPTZ,
    cancelled_by UUID REFERENCES public.users(id),
    overtime_hours DECIMAL(4,2) DEFAULT 0,
    final_amount DECIMAL(10,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for bookings
CREATE INDEX idx_bookings_customer ON public.bookings(customer_id);
CREATE INDEX idx_bookings_photographer ON public.bookings(photographer_id);
CREATE INDEX idx_bookings_event_date ON public.bookings(event_date);
CREATE INDEX idx_bookings_status ON public.bookings(booking_status);
CREATE INDEX idx_bookings_payment_status ON public.bookings(payment_status);
CREATE INDEX idx_bookings_created ON public.bookings(created_at DESC);

-- Training modules table
CREATE TABLE public.training_modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    content_url TEXT,
    video_url TEXT,
    duration_minutes INTEGER,
    order_index INTEGER NOT NULL,
    is_required BOOLEAN DEFAULT false,
    category TEXT,
    passing_score INTEGER DEFAULT 80,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Training status table
CREATE TABLE public.training_status (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES public.training_modules(id),
    is_complete BOOLEAN DEFAULT false,
    score INTEGER,
    attempts INTEGER DEFAULT 0,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    UNIQUE(user_id, module_id)
);

-- Create indexes for training
CREATE INDEX idx_training_status_user ON public.training_status(user_id);
CREATE INDEX idx_training_status_module ON public.training_status(module_id);
CREATE INDEX idx_training_status_complete ON public.training_status(is_complete);

-- Job queue table
CREATE TABLE public.job_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    photographer_id UUID NOT NULL REFERENCES public.photographers(id),
    booking_id UUID NOT NULL UNIQUE REFERENCES public.bookings(id),
    upload_status upload_status DEFAULT 'pending',
    files_uploaded JSONB DEFAULT '[]'::jsonb,
    overtime_logged DECIMAL(4,2) DEFAULT 0,
    overtime_approved BOOLEAN DEFAULT false,
    delivery_url TEXT,
    delivery_password TEXT,
    deadline DATE,
    delivered_at TIMESTAMPTZ,
    customer_approved BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for job queue
CREATE INDEX idx_job_queue_photographer ON public.job_queue(photographer_id);
CREATE INDEX idx_job_queue_booking ON public.job_queue(booking_id);
CREATE INDEX idx_job_queue_status ON public.job_queue(upload_status);
CREATE INDEX idx_job_queue_deadline ON public.job_queue(deadline);

-- Reviews table
CREATE TABLE public.reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL UNIQUE REFERENCES public.bookings(id),
    reviewer_id UUID NOT NULL REFERENCES public.users(id),
    photographer_id UUID NOT NULL REFERENCES public.photographers(id),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    is_featured BOOLEAN DEFAULT false,
    is_verified BOOLEAN DEFAULT true,
    helpful_count INTEGER DEFAULT 0,
    response TEXT,
    response_at TIMESTAMPTZ,
    photos TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for reviews
CREATE INDEX idx_reviews_photographer ON public.reviews(photographer_id);
CREATE INDEX idx_reviews_booking ON public.reviews(booking_id);
CREATE INDEX idx_reviews_rating ON public.reviews(rating);
CREATE INDEX idx_reviews_created ON public.reviews(created_at DESC);

-- Portfolio items table
CREATE TABLE public.portfolio_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    photographer_id UUID NOT NULL REFERENCES public.photographers(id) ON DELETE CASCADE,
    title TEXT,
    description TEXT,
    image_url TEXT NOT NULL,
    thumbnail_url TEXT,
    video_url TEXT,
    category TEXT,
    tags TEXT[],
    is_featured BOOLEAN DEFAULT false,
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    order_index INTEGER,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for portfolio
CREATE INDEX idx_portfolio_photographer ON public.portfolio_items(photographer_id);
CREATE INDEX idx_portfolio_featured ON public.portfolio_items(is_featured);
CREATE INDEX idx_portfolio_category ON public.portfolio_items(category);

-- Messages table for internal communication
CREATE TABLE public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES public.bookings(id),
    sender_id UUID NOT NULL REFERENCES public.users(id),
    recipient_id UUID NOT NULL REFERENCES public.users(id),
    subject TEXT,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    parent_message_id UUID REFERENCES public.messages(id),
    attachments JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for messages
CREATE INDEX idx_messages_sender ON public.messages(sender_id);
CREATE INDEX idx_messages_recipient ON public.messages(recipient_id);
CREATE INDEX idx_messages_booking ON public.messages(booking_id);
CREATE INDEX idx_messages_read ON public.messages(is_read);
CREATE INDEX idx_messages_created ON public.messages(created_at DESC);

-- Audit log table
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for audit logs
CREATE INDEX idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created ON public.audit_logs(created_at DESC);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_photographers_updated_at BEFORE UPDATE ON public.photographers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_availability_updated_at BEFORE UPDATE ON public.availability
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_packages_updated_at BEFORE UPDATE ON public.packages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_queue_updated_at BEFORE UPDATE ON public.job_queue
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON public.reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update photographer stats after review
CREATE OR REPLACE FUNCTION update_photographer_stats()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Trigger for updating photographer stats
CREATE TRIGGER update_photographer_stats_trigger
AFTER INSERT OR UPDATE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION update_photographer_stats();

-- Function to update photographer tier based on completed jobs
CREATE OR REPLACE FUNCTION check_photographer_tier_upgrade()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Trigger for tier upgrade check
CREATE TRIGGER check_tier_upgrade
BEFORE UPDATE OF completed_jobs_count ON public.photographers
FOR EACH ROW EXECUTE FUNCTION check_photographer_tier_upgrade();

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photographers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Anyone can view active photographers" ON public.users
    FOR SELECT USING (role = 'photographer' AND is_active = true);

-- Photographers table policies
CREATE POLICY "Anyone can view public photographers" ON public.photographers
    FOR SELECT USING (is_public = true);

CREATE POLICY "Photographers can view their own profile" ON public.photographers
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Photographers can update their own profile" ON public.photographers
    FOR UPDATE USING (user_id = auth.uid());

-- Availability policies
CREATE POLICY "Anyone can view photographer availability" ON public.availability
    FOR SELECT USING (true);

CREATE POLICY "Photographers can manage their availability" ON public.availability
    FOR ALL USING (
        photographer_id IN (
            SELECT id FROM public.photographers WHERE user_id = auth.uid()
        )
    );

-- Packages policies
CREATE POLICY "Anyone can view active packages" ON public.packages
    FOR SELECT USING (is_active = true);

CREATE POLICY "Photographers can manage their packages" ON public.packages
    FOR ALL USING (
        photographer_id IN (
            SELECT id FROM public.photographers WHERE user_id = auth.uid()
        )
    );

-- Bookings policies
CREATE POLICY "Users can view their own bookings" ON public.bookings
    FOR SELECT USING (
        customer_id = auth.uid() OR 
        photographer_id IN (
            SELECT id FROM public.photographers WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Customers can create bookings" ON public.bookings
    FOR INSERT WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Involved parties can update bookings" ON public.bookings
    FOR UPDATE USING (
        customer_id = auth.uid() OR 
        photographer_id IN (
            SELECT id FROM public.photographers WHERE user_id = auth.uid()
        )
    );

-- Reviews policies
CREATE POLICY "Anyone can view reviews" ON public.reviews
    FOR SELECT USING (true);

CREATE POLICY "Customers can create reviews for their bookings" ON public.reviews
    FOR INSERT WITH CHECK (
        reviewer_id = auth.uid() AND
        booking_id IN (
            SELECT id FROM public.bookings WHERE customer_id = auth.uid()
        )
    );

-- Messages policies
CREATE POLICY "Users can view their messages" ON public.messages
    FOR SELECT USING (sender_id = auth.uid() OR recipient_id = auth.uid());

CREATE POLICY "Users can send messages" ON public.messages
    FOR INSERT WITH CHECK (sender_id = auth.uid());

-- Training policies
CREATE POLICY "Anyone can view training modules" ON public.training_modules
    FOR SELECT USING (true);

CREATE POLICY "Users can view their training status" ON public.training_status
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their training status" ON public.training_status
    FOR ALL USING (user_id = auth.uid());

-- Portfolio policies
CREATE POLICY "Anyone can view portfolio items" ON public.portfolio_items
    FOR SELECT USING (true);

CREATE POLICY "Photographers can manage their portfolio" ON public.portfolio_items
    FOR ALL USING (
        photographer_id IN (
            SELECT id FROM public.photographers WHERE user_id = auth.uid()
        )
    );

-- Job queue policies
CREATE POLICY "Photographers can view their jobs" ON public.job_queue
    FOR SELECT USING (
        photographer_id IN (
            SELECT id FROM public.photographers WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Customers can view their job status" ON public.job_queue
    FOR SELECT USING (
        booking_id IN (
            SELECT id FROM public.bookings WHERE customer_id = auth.uid()
        )
    );

-- Create storage buckets (run in Supabase dashboard)
-- INSERT INTO storage.buckets (id, name, public) VALUES 
-- ('avatars', 'avatars', true),
-- ('portfolios', 'portfolios', true),
-- ('contracts', 'contracts', false),
-- ('deliveries', 'deliveries', false);

-- Sample data for training modules
INSERT INTO public.training_modules (title, description, content_url, is_required, order_index, category) VALUES
('Platform Overview', 'Introduction to the LoveP marketplace platform', '/training/platform-overview', true, 1, 'Onboarding'),
('Professional Photography Standards', 'Quality standards and best practices', '/training/standards', true, 2, 'Technical'),
('Client Communication', 'How to communicate effectively with clients', '/training/communication', true, 3, 'Soft Skills'),
('Contract and Legal', 'Understanding contracts and legal requirements', '/training/legal', true, 4, 'Legal'),
('Equipment Guidelines', 'Minimum equipment requirements and recommendations', '/training/equipment', false, 5, 'Technical');

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, role, created_at)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'role', 'customer')::user_role,
        NOW()
    );
    
    -- If photographer, create photographer profile
    IF COALESCE(NEW.raw_user_meta_data->>'role', 'customer') = 'photographer' THEN
        INSERT INTO public.photographers (user_id)
        VALUES (NEW.id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;
