-- Check for unconfirmed users in auth.users
SELECT 
    id,
    email,
    created_at,
    email_confirmed_at,
    CASE 
        WHEN email_confirmed_at IS NULL THEN 'Not Confirmed'
        ELSE 'Confirmed'
    END as confirmation_status
FROM auth.users
ORDER BY created_at DESC;

-- If you want to delete unconfirmed test users, uncomment and modify this:
-- DELETE FROM auth.users 
-- WHERE email = 'your-test-email@example.com' 
-- AND email_confirmed_at IS NULL;

-- Or to confirm an existing user manually:
-- UPDATE auth.users 
-- SET email_confirmed_at = NOW()
-- WHERE email = 'your-test-email@example.com';