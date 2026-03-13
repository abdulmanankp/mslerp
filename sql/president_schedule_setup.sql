-- President Schedule setup
-- Adds a scheduling table where President can assign Daily/Weekly/Monthly schedules
-- to Zone, District, or University.

create extension if not exists pgcrypto;

create table if not exists public.president_schedules (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  frequency text not null check (frequency in ('Daily', 'Weekly', 'Monthly')),
  schedule_date date not null,
  target_type text not null check (target_type in ('Zone', 'District', 'University')),
  zone_id uuid references public.zones(id) on delete cascade,
  district_id uuid references public.districts(id) on delete cascade,
  university_id uuid references public.universities(id) on delete cascade,
  target_name text not null,
  status text not null default 'Active' check (status in ('Active', 'Inactive')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint president_schedules_one_target_check check (
    (
      (case when zone_id is not null then 1 else 0 end) +
      (case when district_id is not null then 1 else 0 end) +
      (case when university_id is not null then 1 else 0 end)
    ) = 1
  )
);

create index if not exists idx_president_schedules_schedule_date
  on public.president_schedules(schedule_date);

create index if not exists idx_president_schedules_target_type
  on public.president_schedules(target_type);

create or replace function public.set_president_schedules_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_president_schedules_updated_at on public.president_schedules;
create trigger trg_president_schedules_updated_at
before update on public.president_schedules
for each row
execute function public.set_president_schedules_updated_at();

alter table public.president_schedules enable row level security;

drop policy if exists president_schedules_select_authenticated on public.president_schedules;
create policy president_schedules_select_authenticated
on public.president_schedules
for select
to authenticated
using (true);

drop policy if exists president_schedules_manage_admin_moderator on public.president_schedules;
create policy president_schedules_manage_admin_moderator
on public.president_schedules
for all
to authenticated
using (
  exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role::text in ('admin', 'moderator')
  )
)
with check (
  exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role::text in ('admin', 'moderator')
  )
);

-- Optional: allow users designated as President to create/update schedules
-- Requires public.user_designations from admin role setup SQL.
drop policy if exists president_schedules_manage_president_designation on public.president_schedules;
create policy president_schedules_manage_president_designation
on public.president_schedules
for all
to authenticated
using (
  exists (
    select 1
    from public.user_designations ud
    where ud.user_id = auth.uid()
      and ud.designation = 'President'
  )
)
with check (
  exists (
    select 1
    from public.user_designations ud
    where ud.user_id = auth.uid()
      and ud.designation = 'President'
  )
);
