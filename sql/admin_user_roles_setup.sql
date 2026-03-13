-- User designation setup compatible with existing public.user_roles(app_role)
-- Run once in Supabase SQL editor

create table if not exists public.user_designations (
  user_id uuid primary key references auth.users(id) on delete cascade,
  designation text not null check (
    designation in (
      'Super Admin',
      'President',
      'Zone Coordinator',
      'District Coordinator',
      'University Coordinator',
      'Madadgar Team Coordinator',
      'Department Head',
      'Viewer'
    )
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_user_designations_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_user_designations_updated_at on public.user_designations;
create trigger trg_user_designations_updated_at
before update on public.user_designations
for each row
execute function public.set_user_designations_updated_at();

alter table public.user_designations enable row level security;

drop policy if exists user_designations_select_own on public.user_designations;
create policy user_designations_select_own
on public.user_designations
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists user_designations_admin_manage on public.user_designations;
create policy user_designations_admin_manage
on public.user_designations
for all
to authenticated
using (
  exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role in ('admin', 'moderator')
  )
)
with check (
  exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role in ('admin', 'moderator')
  )
);
