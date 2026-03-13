-- Full SQL for admin user management (compatible with existing app_role enum)
-- app_role enum expected values in public.user_roles.role: admin, moderator, user
-- Business roles are stored in public.user_designations.designation

-- 1) Ensure user_roles exists and references auth users
create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  role app_role not null default 'user',
  created_at timestamptz not null default now()
);

-- 2) Business-level role/designation table
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

-- 3) RLS
alter table public.user_roles enable row level security;
alter table public.user_designations enable row level security;

-- user_roles policies
-- own read
 drop policy if exists user_roles_select_own on public.user_roles;
create policy user_roles_select_own
on public.user_roles
for select
to authenticated
using (user_id = auth.uid());

-- admin/moderator manage
 drop policy if exists user_roles_admin_manage on public.user_roles;
create policy user_roles_admin_manage
on public.user_roles
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

-- user_designations policies
-- own read
 drop policy if exists user_designations_select_own on public.user_designations;
create policy user_designations_select_own
on public.user_designations
for select
to authenticated
using (user_id = auth.uid());

-- admin/moderator manage
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

-- 4) Optional bootstrap helper: promote one existing auth user to admin + Super Admin designation
-- Replace the email before running this block.
do $$
declare
  v_user_id uuid;
  v_admin_role app_role;
begin
  -- Pick best available elevated enum value from this project's app_role.
  select e.enumlabel::app_role into v_admin_role
  from pg_type t
  join pg_enum e on e.enumtypid = t.oid
  where t.typname = 'app_role'
    and e.enumlabel in ('admin', 'moderator', 'user')
  order by case e.enumlabel when 'admin' then 1 when 'moderator' then 2 else 3 end
  limit 1;

  select id into v_user_id
  from auth.users
  where email = 'admin@msl.pk'
  limit 1;

  if v_user_id is not null and v_admin_role is not null then
    insert into public.user_roles (user_id, role)
    values (v_user_id, v_admin_role)
    on conflict (user_id) do update set role = excluded.role;

    insert into public.user_designations (user_id, designation)
    values (v_user_id, 'Super Admin')
    on conflict (user_id) do update set designation = excluded.designation;
  end if;
end $$;
