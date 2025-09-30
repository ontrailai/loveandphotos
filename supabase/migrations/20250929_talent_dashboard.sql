-- Add new columns to photographers table for talent dashboard
ALTER TABLE public.photographers
ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('female', 'male', 'prefer_not_to_say')),
ADD COLUMN IF NOT EXISTS style_tags TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS is_videographer BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS lnp_choice BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS portfolio_images TEXT[] DEFAULT ARRAY[]::TEXT[]; -- Store Supabase storage URLs

-- Create photographer_availability table
CREATE TABLE IF NOT EXISTS public.photographer_availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    photographer_id UUID NOT NULL REFERENCES public.photographers(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    time_start TIME NOT NULL,
    time_end TIME NOT NULL,
    is_booked BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(photographer_id, date, time_start)
);

-- Create indexes for photographer_availability
CREATE INDEX IF NOT EXISTS idx_photographer_availability_photographer ON public.photographer_availability(photographer_id);
CREATE INDEX IF NOT EXISTS idx_photographer_availability_date ON public.photographer_availability(date);
CREATE INDEX IF NOT EXISTS idx_photographer_availability_booked ON public.photographer_availability(is_booked);

-- Create storage bucket for photographer portfolios
INSERT INTO storage.buckets (id, name, public)
VALUES ('photographer-portfolios', 'photographer-portfolios', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for photographer_availability
ALTER TABLE public.photographer_availability ENABLE ROW LEVEL SECURITY;

-- Photographers can view and manage their own availability
CREATE POLICY "Photographers can view own availability"
ON public.photographer_availability FOR SELECT
USING (
    photographer_id IN (
        SELECT id FROM public.photographers WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Photographers can insert own availability"
ON public.photographer_availability FOR INSERT
WITH CHECK (
    photographer_id IN (
        SELECT id FROM public.photographers WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Photographers can update own availability"
ON public.photographer_availability FOR UPDATE
USING (
    photographer_id IN (
        SELECT id FROM public.photographers WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Photographers can delete own availability"
ON public.photographer_availability FOR DELETE
USING (
    photographer_id IN (
        SELECT id FROM public.photographers WHERE user_id = auth.uid()
    )
);

-- Customers can view photographer availability
CREATE POLICY "Customers can view photographer availability"
ON public.photographer_availability FOR SELECT
USING (is_booked = false);

-- Storage policies for photographer portfolios
CREATE POLICY "Photographers can upload own portfolio images"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'photographer-portfolios' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Photographers can update own portfolio images"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'photographer-portfolios' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Photographers can delete own portfolio images"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'photographer-portfolios' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Public can view portfolio images"
ON storage.objects FOR SELECT
USING (bucket_id = 'photographer-portfolios');