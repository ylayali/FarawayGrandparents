-- Migration script to copy existing users data into the new profiles table
-- This preserves your existing user data and adds the new fields with defaults

-- First, let's see what columns exist in your users table
-- (You may need to adjust the column names based on your actual table structure)

-- Basic migration using Supabase's auth.users table
INSERT INTO public.profiles (id, email, full_name, credits, subscription_tier, created_at, updated_at)
SELECT 
    id,
    email,
    COALESCE(
        raw_user_meta_data->>'full_name',
        raw_user_meta_data->>'name', 
        email
    ) as full_name,  -- Extract full_name from user metadata, fallback to email
    10 as credits,  -- Give all existing users 10 credits
    'free' as subscription_tier,  -- Set all existing users to free tier
    created_at,
    NOW() as updated_at
FROM auth.users  -- This references Supabase's built-in users table
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    updated_at = NOW();

-- Alternative: If you have a custom "users" table instead of using auth.users:
-- Uncomment and modify this section based on your table structure:
/*
INSERT INTO public.profiles (id, email, full_name, credits, subscription_tier, created_at, updated_at)
SELECT 
    id,
    email,
    COALESCE(full_name, name, email) as full_name,
    10 as credits,
    'free' as subscription_tier,
    COALESCE(created_at, NOW()) as created_at,
    NOW() as updated_at
FROM public.users  -- Your custom users table
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    updated_at = NOW();
*/

-- If you want to give certain users premium status or more credits, 
-- you can run additional updates after the migration:
/*
-- Example: Give specific users premium status
UPDATE public.profiles 
SET subscription_tier = 'premium', credits = 50 
WHERE email IN ('premium-user1@example.com', 'premium-user2@example.com');

-- Example: Give admin users pro status  
UPDATE public.profiles 
SET subscription_tier = 'pro', credits = 100 
WHERE email LIKE '%@yourdomain.com';
*/
