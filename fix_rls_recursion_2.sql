-- FIX FOR INFINITE RECURSION in Supabase RLS (Part 2)
-- The issue is the "FOR ALL" policy on pillar_collaborators which applies to SELECTs and queries pillars.

DROP POLICY IF EXISTS "collaborators manage by owner or admin" ON public.pillar_collaborators;

-- Create explicit INSERT/UPDATE/DELETE policies to prevent SELECT recursion
CREATE POLICY "collaborators insert by owner or admin"
ON public.pillar_collaborators FOR INSERT
TO authenticated
WITH CHECK (
  exists (select 1 from public.pillars p where p.id = pillar_id and p.owner_id = auth.uid())
  or exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.role = 'admin')
);

CREATE POLICY "collaborators update by owner or admin"
ON public.pillar_collaborators FOR UPDATE
TO authenticated
USING (
  exists (select 1 from public.pillars p where p.id = pillar_id and p.owner_id = auth.uid())
  or exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.role = 'admin')
)
WITH CHECK (
  exists (select 1 from public.pillars p where p.id = pillar_id and p.owner_id = auth.uid())
  or exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.role = 'admin')
);

CREATE POLICY "collaborators delete by owner or admin"
ON public.pillar_collaborators FOR DELETE
TO authenticated
USING (
  exists (select 1 from public.pillars p where p.id = pillar_id and p.owner_id = auth.uid())
  or exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.role = 'admin')
);
