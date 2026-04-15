-- ============================================================
-- NUCLEAR RESET — drops EVERY policy on EVERY public table
-- regardless of name, then rebuilds cleanly.
-- Run this entire script in Supabase SQL Editor.
-- ============================================================

-- ════════════════════════════╕
-- STEP 1: DYNAMIC DROP ALL
-- Drops literally every policy across all tables in public schema
-- ════════════════════════════╛
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON %I.%I',
      r.policyname, r.schemaname, r.tablename
    );
    RAISE NOTICE 'Dropped policy "%" on %.%', r.policyname, r.schemaname, r.tablename;
  END LOOP;
END $$;

-- Confirm: should now return 0 rows
SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public';


-- ════════════════════════════╕
-- STEP 2: REBUILD — PROFILES
-- ════════════════════════════╛
CREATE POLICY "profiles select"
ON public.profiles FOR SELECT TO authenticated
USING (true);

CREATE POLICY "profiles insert"
ON public.profiles FOR INSERT TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles update"
ON public.profiles FOR UPDATE TO authenticated
USING (auth.uid() = id);


-- ════════════════════════════╕
-- STEP 3: REBUILD — PILLAR_COLLABORATORS
-- Simple, no recursion
-- ════════════════════════════╛
CREATE POLICY "collaborators select"
ON public.pillar_collaborators FOR SELECT TO authenticated
USING (true);

CREATE POLICY "collaborators insert"
ON public.pillar_collaborators FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM public.pillars p WHERE p.id = pillar_id AND p.owner_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.profiles pr WHERE pr.id = auth.uid() AND pr.role = 'admin')
);

CREATE POLICY "collaborators update"
ON public.pillar_collaborators FOR UPDATE TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.pillars p WHERE p.id = pillar_id AND p.owner_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.profiles pr WHERE pr.id = auth.uid() AND pr.role = 'admin')
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.pillars p WHERE p.id = pillar_id AND p.owner_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.profiles pr WHERE pr.id = auth.uid() AND pr.role = 'admin')
);

CREATE POLICY "collaborators delete"
ON public.pillar_collaborators FOR DELETE TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.pillars p WHERE p.id = pillar_id AND p.owner_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.profiles pr WHERE pr.id = auth.uid() AND pr.role = 'admin')
);


-- ════════════════════════════╕
-- STEP 4: REBUILD — PILLARS
-- ════════════════════════════╛
CREATE POLICY "pillars select"
ON public.pillars FOR SELECT TO authenticated
USING (
  owner_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.pillar_collaborators pc
    WHERE pc.pillar_id = public.pillars.id AND pc.profile_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.profiles pr WHERE pr.id = auth.uid() AND pr.role = 'admin'
  )
);

CREATE POLICY "pillars insert"
ON public.pillars FOR INSERT TO authenticated
WITH CHECK (
  owner_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.profiles pr WHERE pr.id = auth.uid() AND pr.role = 'admin')
);

CREATE POLICY "pillars update"
ON public.pillars FOR UPDATE TO authenticated
USING (
  owner_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.profiles pr WHERE pr.id = auth.uid() AND pr.role = 'admin')
)
WITH CHECK (
  owner_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.profiles pr WHERE pr.id = auth.uid() AND pr.role = 'admin')
);

CREATE POLICY "pillars delete"
ON public.pillars FOR DELETE TO authenticated
USING (
  owner_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.profiles pr WHERE pr.id = auth.uid() AND pr.role = 'admin')
);


-- ════════════════════════════╕
-- STEP 5: REBUILD — MILESTONES
-- ════════════════════════════╛
CREATE POLICY "milestones select"
ON public.milestones FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.pillars p
    WHERE p.id = milestones.pillar_id AND p.owner_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.pillar_collaborators pc
    WHERE pc.pillar_id = milestones.pillar_id AND pc.profile_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.profiles pr WHERE pr.id = auth.uid() AND pr.role = 'admin'
  )
);

CREATE POLICY "milestones insert"
ON public.milestones FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.pillars p
    WHERE p.id = pillar_id AND p.owner_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.pillar_collaborators pc
    WHERE pc.pillar_id = pillar_id AND pc.profile_id = auth.uid() AND pc.access_level = 'write'
  )
  OR EXISTS (
    SELECT 1 FROM public.profiles pr WHERE pr.id = auth.uid() AND pr.role = 'admin'
  )
);

CREATE POLICY "milestones update"
ON public.milestones FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.pillars p
    WHERE p.id = milestones.pillar_id AND p.owner_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.pillar_collaborators pc
    WHERE pc.pillar_id = milestones.pillar_id AND pc.profile_id = auth.uid() AND pc.access_level = 'write'
  )
  OR EXISTS (
    SELECT 1 FROM public.profiles pr WHERE pr.id = auth.uid() AND pr.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.pillars p
    WHERE p.id = pillar_id AND p.owner_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.pillar_collaborators pc
    WHERE pc.pillar_id = pillar_id AND pc.profile_id = auth.uid() AND pc.access_level = 'write'
  )
  OR EXISTS (
    SELECT 1 FROM public.profiles pr WHERE pr.id = auth.uid() AND pr.role = 'admin'
  )
);

CREATE POLICY "milestones delete"
ON public.milestones FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.pillars p
    WHERE p.id = milestones.pillar_id AND p.owner_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.profiles pr WHERE pr.id = auth.uid() AND pr.role = 'admin'
  )
);


-- ════════════════════════════╕
-- STEP 6: REBUILD — NOTIFICATIONS
-- ════════════════════════════╛
CREATE POLICY "notifications select"
ON public.notifications FOR SELECT TO authenticated
USING (profile_id = auth.uid());

CREATE POLICY "notifications insert"
ON public.notifications FOR INSERT TO authenticated
WITH CHECK (profile_id = auth.uid());

CREATE POLICY "notifications update"
ON public.notifications FOR UPDATE TO authenticated
USING (profile_id = auth.uid());


-- ════════════════════════════╕
-- STEP 7: VERIFY — should show exactly 4 policies per table
-- ════════════════════════════╛
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd;
