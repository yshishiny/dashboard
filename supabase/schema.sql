create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text,
  role text not null check (role in ('admin', 'contributor')),
  timezone text default 'UTC',
  phone_number text,
  notify_time_pref time default '09:00:00',
  created_at timestamptz not null default now()
);

create table if not exists public.pillars (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  objective text not null,
  target text not null,
  due_date date not null,
  owner_id uuid references public.profiles(id) on delete cascade default auth.uid(),
  progress_override integer,
  created_at timestamptz not null default now()
);

create table if not exists public.pillar_collaborators (
  id uuid primary key default gen_random_uuid(),
  pillar_id uuid not null references public.pillars(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  access_level text not null check (access_level in ('read', 'write')),
  created_at timestamptz not null default now(),
  unique(pillar_id, profile_id)
);

create table if not exists public.milestones (
  id uuid primary key default gen_random_uuid(),
  pillar_id uuid not null references public.pillars(id) on delete cascade,
  name text not null,
  status text not null check (status in ('upcoming', 'in-progress', 'done')),
  due_date date,
  notes text default '',
  assigned_to uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.pillars enable row level security;
alter table public.pillar_collaborators enable row level security;
alter table public.milestones enable row level security;

-- Profiles: readable by all, writable by self
create policy "profiles readable by authenticated users"
on public.profiles for select
to authenticated
using (true);

create policy "profiles upsert self"
on public.profiles for insert
to authenticated
with check (auth.uid() = id);

create policy "profiles update self"
on public.profiles for update
to authenticated
using (auth.uid() = id);

-- Pillars: Strictly multi-tenant (own pillars only)
create policy "pillars readable by owners"
on public.pillars for select
to authenticated
using (owner_id = auth.uid() or exists (
  select 1 from public.pillar_collaborators pc where pc.pillar_id = id and pc.profile_id = auth.uid()
));

create policy "pillars manage own"
on public.pillars for all
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

-- Collaborators RLS
create policy "collaborators readable by authenticated users"
on public.pillar_collaborators for select
to authenticated
using (true);

create policy "collaborators insert by owner or admin"
on public.pillar_collaborators for insert
to authenticated
with check (
  exists (select 1 from public.pillars p where p.id = pillar_id and p.owner_id = auth.uid())
  or exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.role = 'admin')
);

create policy "collaborators update by owner or admin"
on public.pillar_collaborators for update
to authenticated
using (
  exists (select 1 from public.pillars p where p.id = pillar_id and p.owner_id = auth.uid())
  or exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.role = 'admin')
)
with check (
  exists (select 1 from public.pillars p where p.id = pillar_id and p.owner_id = auth.uid())
  or exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.role = 'admin')
);

create policy "collaborators delete by owner or admin"
on public.pillar_collaborators for delete
to authenticated
using (
  exists (select 1 from public.pillars p where p.id = pillar_id and p.owner_id = auth.uid())
  or exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.role = 'admin')
);

-- Milestones: Access controlled by parent pillar ownership OR collaborator status
create policy "milestones readable by pillar owners"
on public.milestones for select
to authenticated
using (
  exists (
    select 1 from public.pillars p
    where p.id = milestones.pillar_id and p.owner_id = auth.uid()
  ) or exists (
    select 1 from public.pillar_collaborators pc
    where pc.pillar_id = milestones.pillar_id and pc.profile_id = auth.uid()
  )
);

create policy "milestones manage own pillar milestones"
on public.milestones for all
to authenticated
using (
  exists (
    select 1 from public.pillars p
    where p.id = milestones.pillar_id and p.owner_id = auth.uid()
  ) or exists (
    select 1 from public.pillar_collaborators pc
    where pc.pillar_id = milestones.pillar_id and pc.profile_id = auth.uid() and pc.access_level = 'write'
  )
)
with check (
  exists (
    select 1 from public.pillars p
    where p.id = milestones.pillar_id and p.owner_id = auth.uid()
  ) or exists (
    select 1 from public.pillar_collaborators pc
    where pc.pillar_id = milestones.pillar_id and pc.profile_id = auth.uid() and pc.access_level = 'write'
  )
);

-- Admin Global Manage Pillars (Bypass) based on role
create policy "admin global manage pillars"
on public.pillars for all
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

-- Admin Global Manage Milestones
create policy "admin global manage milestones"
on public.milestones for all
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    case when lower(new.email) = 'shishiny@gmail.com' then 'admin' else 'contributor' end
  )
  on conflict (id) do update
  set email = excluded.email,
      full_name = excluded.full_name;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  milestone_id uuid not null references public.milestones(id) on delete cascade,
  message text not null,
  status text not null check (status in ('pending', 'sent', 'failed')),
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.notifications enable row level security;

create policy "notifications readable by owner"
on public.notifications for select
to authenticated
using (profile_id = auth.uid());
