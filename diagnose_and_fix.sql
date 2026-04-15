-- ============================================================
-- STEP 1: DIAGNOSE — Run this first and read the results
-- ============================================================

-- Check what auth users exist
SELECT id, email, created_at
FROM auth.users
ORDER BY created_at;

-- Check what profile rows exist
SELECT id, email, role, full_name
FROM public.profiles
ORDER BY email;

-- Find auth users who are MISSING a profile row (this is the root cause)
SELECT u.id, u.email, u.created_at
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;

-- Check active RLS policies on pillars table
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'pillars'
ORDER BY cmd;


-- ============================================================
-- STEP 2: FIX — Backfill missing profile rows for ALL auth users
-- ============================================================
-- This inserts a profile row for every auth user that doesn't have one.
-- Safe to run multiple times (ON CONFLICT DO NOTHING).

INSERT INTO public.profiles (id, email, full_name, role)
SELECT
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', u.email),
  CASE WHEN LOWER(u.email) = 'shishiny@gmail.com' THEN 'admin' ELSE 'contributor' END
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Confirm all users now have profiles
SELECT
  u.email AS auth_email,
  p.email AS profile_email,
  p.role,
  CASE WHEN p.id IS NULL THEN '❌ MISSING' ELSE '✅ OK' END AS status
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
ORDER BY u.email;
