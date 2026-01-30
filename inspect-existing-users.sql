-- Script to inspect your existing users table structure
-- Run this first to see what columns you have

-- Check if you have a custom users table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'users'
ORDER BY ordinal_position;

-- Also check the Supabase auth.users table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'auth' 
AND table_name = 'users'
ORDER BY ordinal_position;

-- Preview some sample data from your users table (if it exists)
-- Uncomment the appropriate line based on your setup:

-- If you have a custom public.users table:
-- SELECT * FROM public.users LIMIT 5;

-- If you're using Supabase's auth.users:
-- SELECT id, email, created_at, raw_user_meta_data FROM auth.users LIMIT 5;
