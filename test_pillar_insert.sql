-- ============================================================
-- PILLAR INSERT DIAGNOSTIC
-- Run in Supabase SQL Editor — uses service role (bypasses RLS)
-- to isolate whether the issue is schema/constraint vs RLS
-- ============================================================

-- 1. Get shishiny's actual UUID
SELECT id, email, role FROM public.profiles WHERE email = 'shishiny@gmail.com';

-- 2. Check pillars table column structure (look for NOT NULL constraints etc.)
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'pillars'
ORDER BY ordinal_position;

-- 3. Test a direct insert AS the admin user (paste their UUID from step 1 below)
-- This uses the service role so bypasses RLS — tells us if schema is the blocker
-- REPLACE the UUID below with the actual id from step 1
DO $$
DECLARE
  admin_id UUID;
  new_pillar_id UUID;
BEGIN
  SELECT id INTO admin_id FROM public.profiles WHERE email = 'shishiny@gmail.com';
  
  INSERT INTO public.pillars (title, objective, target, due_date, owner_id)
  VALUES (
    'SQL Test Pillar',
    'Testing direct insert',
    'Confirm insert works',
    CURRENT_DATE + 30,
    admin_id
  )
  RETURNING id INTO new_pillar_id;
  
  RAISE NOTICE 'INSERT SUCCEEDED — new pillar id: %', new_pillar_id;
  
  -- Clean up test row
  DELETE FROM public.pillars WHERE id = new_pillar_id;
  RAISE NOTICE 'Test pillar deleted — schema is fine, issue is RLS';

EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'INSERT FAILED — Error: % %', SQLERRM, SQLSTATE;
END $$;

-- 4. Show all active policies on pillars right now
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'pillars'
ORDER BY cmd;
