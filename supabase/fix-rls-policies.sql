-- Fix RLS policies for users table
-- First, drop all existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
DROP POLICY IF EXISTS "Anyone can view active photographers" ON public.users;
DROP POLICY IF EXISTS "Service role can insert users" ON public.users;

-- Create new, more permissive policies

-- 1. Allow users to create their own profile
CREATE POLICY "Enable insert for users based on user_id" ON public.users
    FOR INSERT 
    WITH CHECK (auth.uid() = id);

-- 2. Allow users to view any profile (needed for browsing photographers)
CREATE POLICY "Enable read access for all users" ON public.users
    FOR SELECT 
    USING (true);

-- 3. Allow users to update their own profile
CREATE POLICY "Enable update for users based on user_id" ON public.users
    FOR UPDATE 
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- 4. Allow service role to do anything (for triggers)
CREATE POLICY "Service role has full access" ON public.users
    FOR ALL 
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Also fix photographers table policies
DROP POLICY IF EXISTS "Anyone can view public photographers" ON public.photographers;
DROP POLICY IF EXISTS "Photographers can view their own profile" ON public.photographers;
DROP POLICY IF EXISTS "Photographers can update their own profile" ON public.photographers;
DROP POLICY IF EXISTS "Photographers can manage their packages" ON public.photographers;

-- Create photographer policies
CREATE POLICY "Enable insert for photographers" ON public.photographers
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable read access for all photographers" ON public.photographers
    FOR SELECT 
    USING (true);

CREATE POLICY "Enable update for photographers based on user_id" ON public.photographers
    FOR UPDATE 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Verify the policies are applied
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'photographers')
ORDER BY tablename, policyname;