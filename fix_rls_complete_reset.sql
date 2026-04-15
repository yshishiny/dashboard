-- ============================================================
-- COMPLETE RLS POLICY RESET FOR MARIUM DASHBOARD
-- Run this entire script in Supabase SQL Editor
-- ============================================================

-- ---- PROFILES ----
DROP POLICY IF EXISTS "profiles readable by authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "profiles upsert self" ON public.profiles;
DROP POLICY IF EXISTS "profiles insert self" ON public.profiles;
DROP POLICY IF EXISTS "profiles update self" ON public.profiles;
DROP POLICY IF EXISTS "profiles manage self" ON public.profiles;
DROP POLICY IF EXISTS "admin manage profiles" ON public.profiles;

CREATE POLICY "profiles readable by authenticated users"
ON public.profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "profiles insert self"
ON public.profiles FOR INSERT TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles update self"
ON public.profiles FOR UPDATE TO authenticated
USING (auth.uid() = id);

-- ---- PILLAR COLLABORATORS ---- (fix first, before pillars, to break the cycle)
DROP POLICY IF EXISTS "collaborators readable by owner or collaborator" ON public.pillar_collaborators;
DROP POLICY IF EXISTS "collaborators readable by authenticated users" ON public.pillar_collaborators;
DROP POLICY IF EXISTS "collaborators manage by owner or admin" ON public.pillar_collaborators;
DROP POLICY IF EXISTS "collaborators insert by owner or admin" ON public.pillar_collaborators;
DROP POLICY IF EXISTS "collaborators update by owner or admin" ON public.pillar_collaborators;
DROP POLICY IF EXISTS "collaborators delete by owner or admin" ON public.pillar_collaborators;

-- Simple non-recursive SELECT: anyone authenticated can read collaborators
CREATE POLICY "collaborators select"
ON public.pillar_collaborators FOR SELECT TO authenticated
USING (true);

-- For write ops, we check pillars ownership (no sub-query into pillar_collaborators, so no recursion)
CREATE POLICY "collaborators insert"
ON public.pillar_collaborators FOR INSERT TO authenticated
WITH CHECK (
  exists (SELECT 1 FROM public.pillars p WHERE p.id = pillar_id AND p.owner_id = auth.uid())
  OR exists (SELECT 1 FROM public.profiles pr WHERE pr.id = auth.uid() AND pr.role = 'admin')
);

CREATE POLICY "collaborators update"
ON public.pillar_collaborators FOR UPDATE TO authenticated
USING (
  exists (SELECT 1 FROM public.pillars p WHERE p.id = pillar_id AND p.owner_id = auth.uid())
  OR exists (SELECT 1 FROM public.profiles pr WHERE pr.id = auth.uid() AND pr.role = 'admin')
)
WITH CHECK (
  exists (SELECT 1 FROM public.pillars p WHERE p.id = pillar_id AND p.owner_id = auth.uid())
  OR exists (SELECT 1 FROM public.profiles pr WHERE pr.id = auth.uid() AND pr.role = 'admin')
);

CREATE POLICY "collaborators delete"
ON public.pillar_collaborators FOR DELETE TO authenticated
USING (
  exists (SELECT 1 FROM public.pillars p WHERE p.id = pillar_id AND p.owner_id = auth.uid())
  OR exists (SELECT 1 FROM public.profiles pr WHERE pr.id = auth.uid() AND pr.role = 'admin')
);

-- ---- PILLARS ----
DROP POLICY IF EXISTS "pillars readable by owners" ON public.pillars;
DROP POLICY IF EXISTS "pillars manage own" ON public.pillars;
DROP POLICY IF EXISTS "admin global manage pillars" ON public.pillars;
DROP POLICY IF EXISTS "pillars select" ON public.pillars;
DROP POLICY IF EXISTS "pillars insert" ON public.pillars;
DROP POLICY IF EXISTS "pillars update" ON public.pillars;
DROP POLICY IF EXISTS "pillars delete" ON public.pillars;

-- SELECT: own pillars OR shared pillars (queries pillar_collaborators SELECT = true, no loop)
CREATE POLICY "pillars select"
ON public.pillars FOR SELECT TO authenticated
USING (
  owner_id = auth.uid()
  OR exists (SELECT 1 FROM public.pillar_collaborators pc WHERE pc.pillar_id = id AND pc.profile_id = auth.uid())
  OR exists (SELECT 1 FROM public.profiles pr WHERE pr.id = auth.uid() AND pr.role = 'admin')
);

-- INSERT: only set owner as self (or admin)
CREATE POLICY "pillars insert"
ON public.pillars FOR INSERT TO authenticated
WITH CHECK (
  owner_id = auth.uid()
  OR exists (SELECT 1 FROM public.profiles pr WHERE pr.id = auth.uid() AND pr.role = 'admin')
);

-- UPDATE: own pillar or admin
CREATE POLICY "pillars update"
ON public.pillars FOR UPDATE TO authenticated
USING (
  owner_id = auth.uid()
  OR exists (SELECT 1 FROM public.profiles pr WHERE pr.id = auth.uid() AND pr.role = 'admin')
)
WITH CHECK (
  owner_id = auth.uid()
  OR exists (SELECT 1 FROM public.profiles pr WHERE pr.id = auth.uid() AND pr.role = 'admin')
);

-- DELETE: own pillar or admin
CREATE POLICY "pillars delete"
ON public.pillars FOR DELETE TO authenticated
USING (
  owner_id = auth.uid()
  OR exists (SELECT 1 FROM public.profiles pr WHERE pr.id = auth.uid() AND pr.role = 'admin')
);

-- ---- MILESTONES ----
DROP POLICY IF EXISTS "milestones readable by pillar owners" ON public.milestones;
DROP POLICY IF EXISTS "milestones manage own pillar milestones" ON public.milestones;
DROP POLICY IF EXISTS "admin global manage milestones" ON public.milestones;
DROP POLICY IF EXISTS "milestones select" ON public.milestones;
DROP POLICY IF EXISTS "milestones insert" ON public.milestones;
DROP POLICY IF EXISTS "milestones update" ON public.milestones;
DROP POLICY IF EXISTS "milestones delete" ON public.milestones;

CREATE POLICY "milestones select"
ON public.milestones FOR SELECT TO authenticated
USING (
  exists (SELECT 1 FROM public.pillars p WHERE p.id = milestones.pillar_id AND p.owner_id = auth.uid())
  OR exists (SELECT 1 FROM public.pillar_collaborators pc WHERE pc.pillar_id = milestones.pillar_id AND pc.profile_id = auth.uid())
  OR exists (SELECT 1 FROM public.profiles pr WHERE pr.id = auth.uid() AND pr.role = 'admin')
);

CREATE POLICY "milestones insert"
ON public.milestones FOR INSERT TO authenticated
WITH CHECK (
  exists (SELECT 1 FROM public.pillars p WHERE p.id = pillar_id AND p.owner_id = auth.uid())
  OR exists (SELECT 1 FROM public.pillar_collaborators pc WHERE pc.pillar_id = pillar_id AND pc.profile_id = auth.uid() AND pc.access_level = 'write')
  OR exists (SELECT 1 FROM public.profiles pr WHERE pr.id = auth.uid() AND pr.role = 'admin')
);

CREATE POLICY "milestones update"
ON public.milestones FOR UPDATE TO authenticated
USING (
  exists (SELECT 1 FROM public.pillars p WHERE p.id = milestones.pillar_id AND p.owner_id = auth.uid())
  OR exists (SELECT 1 FROM public.pillar_collaborators pc WHERE pc.pillar_id = milestones.pillar_id AND pc.profile_id = auth.uid() AND pc.access_level = 'write')
  OR exists (SELECT 1 FROM public.profiles pr WHERE pr.id = auth.uid() AND pr.role = 'admin')
)
WITH CHECK (
  exists (SELECT 1 FROM public.pillars p WHERE p.id = pillar_id AND p.owner_id = auth.uid())
  OR exists (SELECT 1 FROM public.pillar_collaborators pc WHERE pc.pillar_id = pillar_id AND pc.profile_id = auth.uid() AND pc.access_level = 'write')
  OR exists (SELECT 1 FROM public.profiles pr WHERE pr.id = auth.uid() AND pr.role = 'admin')
);

CREATE POLICY "milestones delete"
ON public.milestones FOR DELETE TO authenticated
USING (
  exists (SELECT 1 FROM public.pillars p WHERE p.id = milestones.pillar_id AND p.owner_id = auth.uid())
  OR exists (SELECT 1 FROM public.profiles pr WHERE pr.id = auth.uid() AND pr.role = 'admin')
);

-- Done! All policies rebuilt cleanly.
SELECT 'RLS policies rebuilt successfully' as status;
