-- FIX FOR INFINITE RECURSION in Supabase RLS
-- Drop the recursive select policy on collaborators
DROP POLICY IF EXISTS "collaborators readable by owner or collaborator" ON public.pillar_collaborators;

-- Create a non-recursive select policy
CREATE POLICY "collaborators readable by authenticated users"
ON public.pillar_collaborators FOR SELECT
TO authenticated
USING (true);

-- Also ensure the admin bypass for pillars is cleanly set, just in case.
DROP POLICY IF EXISTS "admin global manage pillars" ON public.pillars;
CREATE POLICY "admin global manage pillars"
ON public.pillars FOR ALL
TO authenticated
USING (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
)
WITH CHECK (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);
