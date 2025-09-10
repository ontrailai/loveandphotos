-- Fix for user creation trigger
-- Drop the existing trigger and function first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create improved function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert into public.users table
    INSERT INTO public.users (id, email, role, full_name, created_at)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'customer'::user_role),
        NEW.raw_user_meta_data->>'full_name',
        NOW()
    );
    
    -- If photographer role, create photographer profile
    IF COALESCE((NEW.raw_user_meta_data->>'role')::text, 'customer') = 'photographer' THEN
        INSERT INTO public.photographers (user_id, created_at)
        VALUES (NEW.id, NOW());
    END IF;
    
    RETURN NEW;
EXCEPTION 
    WHEN OTHERS THEN
        -- Log error but don't block user creation
        RAISE LOG 'Error in handle_new_user: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Also ensure the users table policies allow inserts
DROP POLICY IF EXISTS "Service role can insert users" ON public.users;
CREATE POLICY "Service role can insert users" ON public.users
    FOR INSERT WITH CHECK (true);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;