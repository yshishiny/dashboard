-- Run this in Supabase SQL Editor to verify what policies are ACTUALLY active right now

-- 1. Check active policies on pillars
SELECT policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'pillars'
ORDER BY cmd;

-- 2. Test: Can auth user insert a pillar? (simulate the RLS check for shishiny@gmail.com)
-- Replace the UUID below with the actual ID from the results above
SELECT id, email, role FROM public.profiles WHERE email = 'shishiny@gmail.com';

-- 3. Check if RLS is actually ENABLED on the pillars table
SELECT relname, relrowsecurity, relforcerowsecurity
FROM pg_class
WHERE relname IN ('pillars', 'profiles', 'milestones', 'pillar_collaborators');
