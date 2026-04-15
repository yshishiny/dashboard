-- phase4_eisenhower_recurring.sql
-- Run in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/vamludrznfnlbtyngjfo/sql/new
--
-- Adds:
--   1. Eisenhower priority fields to milestones (urgent, important)
--   2. Recurring milestone support (recurrence_rule, recurrence_parent_id)

-- ── 1. Eisenhower columns ─────────────────────────────────────────────────────
alter table public.milestones
  add column if not exists urgent    boolean not null default false,
  add column if not exists important boolean not null default false;

-- ── 2. Recurring milestone columns ───────────────────────────────────────────
alter table public.milestones
  add column if not exists recurrence_rule      text check (recurrence_rule in ('daily','weekly','monthly','quarterly')),
  add column if not exists recurrence_parent_id uuid references public.milestones(id) on delete set null;

-- ── 3. Helper: clone_recurring_milestones() ───────────────────────────────────
-- Called by the Edge Function (or manually). For every "done" milestone that
-- has a recurrence_rule and no existing pending clone, it inserts the next
-- occurrence with a future due_date.
create or replace function public.clone_recurring_milestones()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  r        record;
  interval interval;
  next_due date;
  cloned   int := 0;
begin
  for r in
    select m.*
    from public.milestones m
    where m.status = 'done'
      and m.recurrence_rule is not null
      and not exists (
        select 1 from public.milestones c
        where c.recurrence_parent_id = m.id
          and c.status <> 'done'
      )
  loop
    -- Compute next due date
    interval := case r.recurrence_rule
      when 'daily'     then '1 day'::interval
      when 'weekly'    then '7 days'::interval
      when 'monthly'   then '1 month'::interval
      when 'quarterly' then '3 months'::interval
      else '7 days'::interval
    end;

    next_due := coalesce(r.due_date, current_date) + interval;

    insert into public.milestones (
      pillar_id, name, status, due_date, notes,
      assigned_to, urgent, important,
      recurrence_rule, recurrence_parent_id
    ) values (
      r.pillar_id, r.name, 'not_started', next_due, r.notes,
      r.assigned_to, r.urgent, r.important,
      r.recurrence_rule, r.id
    );

    cloned := cloned + 1;
  end loop;
  return cloned;
end;
$$;

grant execute on function public.clone_recurring_milestones() to authenticated;

-- ── 4. Verify ─────────────────────────────────────────────────────────────────
select
  column_name, data_type, column_default
from information_schema.columns
where table_schema = 'public'
  and table_name   = 'milestones'
  and column_name in ('urgent','important','recurrence_rule','recurrence_parent_id')
order by column_name;
