-- Create contact_submissions table
CREATE TABLE IF NOT EXISTS public.contact_submissions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  phone text,
  event_type text,
  message text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  status text DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied', 'archived')),
  notes text -- For internal notes about the submission
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can create contact submissions" ON public.contact_submissions;
DROP POLICY IF EXISTS "Authenticated users can view contact submissions" ON public.contact_submissions;
DROP POLICY IF EXISTS "Authenticated users can update contact submissions" ON public.contact_submissions;

-- Create policy to allow inserts from anyone (for contact form submissions)
CREATE POLICY "Anyone can create contact submissions" 
  ON public.contact_submissions 
  FOR INSERT 
  WITH CHECK (true);

-- Create policy to allow authenticated users to read submissions (for admin)
CREATE POLICY "Authenticated users can view contact submissions" 
  ON public.contact_submissions 
  FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Create policy to allow authenticated users to update submissions (for admin)
CREATE POLICY "Authenticated users can update contact submissions" 
  ON public.contact_submissions 
  FOR UPDATE 
  USING (auth.role() = 'authenticated');

-- Create an index on created_at for faster queries
CREATE INDEX idx_contact_submissions_created_at ON public.contact_submissions(created_at DESC);

-- Create an index on status for filtering
CREATE INDEX idx_contact_submissions_status ON public.contact_submissions(status);

-- Create an index on email for searching
CREATE INDEX idx_contact_submissions_email ON public.contact_submissions(email);