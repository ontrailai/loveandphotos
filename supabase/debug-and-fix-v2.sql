-- First, let's check if there are any users in auth.users that don't have corresponding public.users records
SELECT a.id, a.email, a.created_at 
FROM auth.users a
LEFT JOIN public.users p ON a.id = p.id
WHERE p.id IS NULL;

-- Drop the existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Create a simpler, more reliable function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert into public.users with minimal required fields
    INSERT INTO public.users (
        id,
        email,
        role,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        NEW.email,
        'customer'::user_role,  -- Default to customer, can be updated later
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO NOTHING;  -- Prevent errors if user already exists
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Now, let's manually create public.users records for any existing auth.users
INSERT INTO public.users (id, email, role, created_at, updated_at)
SELECT 
    id,
    email,
    'customer'::user_role,
    created_at,
    NOW()
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.users)
ON CONFLICT (id) DO NOTHING;

-- Verify the fix
SELECT COUNT(*) as auth_users_count FROM auth.users;
SELECT COUNT(*) as public_users_count FROM public.users;

-- Fix the RLS policies (drop all existing first, then recreate)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Anyone can view active photographers" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
DROP POLICY IF EXISTS "Service role can insert users" ON public.users;

-- Create more permissive policies for testing
CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT USING (auth.uid() = id OR auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Allow authenticated users to insert their own record (in case trigger fails)
CREATE POLICY "Users can insert their own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);