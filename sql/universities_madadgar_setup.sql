-- Universities Department + Madadgar Team schema
-- Run in Supabase SQL editor

create extension if not exists pgcrypto;

-- Universities
create table if not exists public.universities (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  province text not null,
  city text not null,
  status text not null default 'Active' check (status in ('Active', 'Inactive')),
  created_date date not null default current_date,
  current_coordinator_id uuid
);

create table if not exists public.university_coordinators (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  address text,
  education text,
  joining_date date not null default current_date,
  end_date date,
  university_id uuid not null references public.universities(id) on delete cascade,
  university_name text,
  status text not null default 'Active' check (status in ('Active', 'Expired')),
  total_activities integer default 0,
  attendance_rate numeric(5,2) default 0
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'universities_current_coordinator_fk'
  ) then
    alter table public.universities
      add constraint universities_current_coordinator_fk
      foreign key (current_coordinator_id)
      references public.university_coordinators(id)
      on delete set null;
  end if;
end
$$;

create table if not exists public.university_goals (
  id uuid primary key default gen_random_uuid(),
  month text not null,
  university_id uuid not null references public.universities(id) on delete cascade,
  university_name text not null,
  activity_id uuid references public.activities(id) on delete set null,
  activity_name text not null,
  target_number integer not null default 0,
  completed_number integer default 0,
  notes text,
  status text default 'Pending' check (status in ('Pending', 'Completed', 'Partially Completed', 'Not Completed'))
);

create table if not exists public.university_tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  university_id uuid not null references public.universities(id) on delete cascade,
  university_name text,
  start_date date not null default current_date,
  deadline date not null,
  priority text not null default 'Medium' check (priority in ('Low', 'Medium', 'High', 'Critical')),
  status text not null default 'Pending' check (status in ('Pending', 'In Progress', 'Completed', 'Delayed'))
);

create table if not exists public.university_meetings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  month text not null,
  meeting_date date not null,
  agenda text,
  notes text,
  scope text not null default 'All' check (scope in ('All', 'Selected'))
);

create table if not exists public.university_meeting_links (
  meeting_id uuid not null references public.university_meetings(id) on delete cascade,
  university_id uuid not null references public.universities(id) on delete cascade,
  primary key (meeting_id, university_id)
);

create table if not exists public.university_meeting_records (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references public.university_meetings(id) on delete cascade,
  university_id uuid not null references public.universities(id) on delete cascade,
  university_name text not null,
  meeting_title text,
  month text,
  meeting_date date,
  status text not null default 'Empty' check (status in ('Empty', 'Completed')),
  notes text,
  attendance text check (attendance in ('Present', 'Absent', 'Late')),
  unique (meeting_id, university_id)
);

-- Madadgar Teams
create table if not exists public.madadgar_teams (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  district_id uuid references public.districts(id) on delete set null,
  district_name text,
  zone text,
  status text not null default 'Active' check (status in ('Active', 'Inactive')),
  created_date date not null default current_date,
  current_coordinator_id uuid
);

create table if not exists public.madadgar_coordinators (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  address text,
  joining_date date not null default current_date,
  end_date date,
  team_id uuid not null references public.madadgar_teams(id) on delete cascade,
  team_name text,
  status text not null default 'Active' check (status in ('Active', 'Expired')),
  total_activities integer default 0,
  attendance_rate numeric(5,2) default 0
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'madadgar_current_coordinator_fk'
  ) then
    alter table public.madadgar_teams
      add constraint madadgar_current_coordinator_fk
      foreign key (current_coordinator_id)
      references public.madadgar_coordinators(id)
      on delete set null;
  end if;
end
$$;

create table if not exists public.madadgar_goals (
  id uuid primary key default gen_random_uuid(),
  month text not null,
  team_id uuid not null references public.madadgar_teams(id) on delete cascade,
  team_name text not null,
  activity_id uuid references public.activities(id) on delete set null,
  activity_name text not null,
  target_number integer not null default 0,
  completed_number integer default 0,
  notes text,
  status text default 'Pending' check (status in ('Pending', 'Completed', 'Partially Completed', 'Not Completed'))
);

create table if not exists public.madadgar_tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  team_id uuid not null references public.madadgar_teams(id) on delete cascade,
  team_name text,
  start_date date not null default current_date,
  deadline date not null,
  priority text not null default 'Medium' check (priority in ('Low', 'Medium', 'High', 'Critical')),
  status text not null default 'Pending' check (status in ('Pending', 'In Progress', 'Completed', 'Delayed'))
);

create table if not exists public.madadgar_meetings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  month text not null,
  meeting_date date not null,
  agenda text,
  notes text,
  scope text not null default 'All' check (scope in ('All', 'Selected'))
);

create table if not exists public.madadgar_meeting_links (
  meeting_id uuid not null references public.madadgar_meetings(id) on delete cascade,
  team_id uuid not null references public.madadgar_teams(id) on delete cascade,
  primary key (meeting_id, team_id)
);

create table if not exists public.madadgar_meeting_records (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references public.madadgar_meetings(id) on delete cascade,
  team_id uuid not null references public.madadgar_teams(id) on delete cascade,
  team_name text not null,
  meeting_title text,
  month text,
  meeting_date date,
  status text not null default 'Empty' check (status in ('Empty', 'Completed')),
  notes text,
  attendance text check (attendance in ('Present', 'Absent', 'Late')),
  unique (meeting_id, team_id)
);

create index if not exists idx_university_goals_university_id on public.university_goals(university_id);
create index if not exists idx_university_tasks_university_id on public.university_tasks(university_id);
create index if not exists idx_university_links_university_id on public.university_meeting_links(university_id);
create index if not exists idx_madadgar_goals_team_id on public.madadgar_goals(team_id);
create index if not exists idx_madadgar_tasks_team_id on public.madadgar_tasks(team_id);
create index if not exists idx_madadgar_links_team_id on public.madadgar_meeting_links(team_id);

-- Seed Universities (Pakistan)
insert into public.universities (name, province, city, status)
values
  ('Quaid-i-Azam University', 'Federal (Islamabad)', 'Islamabad', 'Active'),
  ('National University of Sciences and Technology (NUST)', 'Federal (Islamabad)', 'Islamabad', 'Active'),
  ('COMSATS University Islamabad', 'Federal (Islamabad)', 'Islamabad', 'Active'),
  ('University of the Punjab', 'Punjab', 'Lahore', 'Active'),
  ('Lahore University of Management Sciences (LUMS)', 'Punjab', 'Lahore', 'Active'),
  ('University of Engineering and Technology (UET) Lahore', 'Punjab', 'Lahore', 'Active'),
  ('Government College University Lahore', 'Punjab', 'Lahore', 'Active'),
  ('University of Agriculture Faisalabad', 'Punjab', 'Faisalabad', 'Active'),
  ('Bahauddin Zakariya University', 'Punjab', 'Multan', 'Active'),
  ('Islamia University of Bahawalpur', 'Punjab', 'Bahawalpur', 'Active'),
  ('University of Sargodha', 'Punjab', 'Sargodha', 'Active'),
  ('University of Karachi', 'Sindh', 'Karachi', 'Active'),
  ('NED University of Engineering and Technology', 'Sindh', 'Karachi', 'Active'),
  ('Institute of Business Administration (IBA) Karachi', 'Sindh', 'Karachi', 'Active'),
  ('Mehran University of Engineering and Technology', 'Sindh', 'Jamshoro', 'Active'),
  ('University of Sindh', 'Sindh', 'Jamshoro', 'Active'),
  ('Shah Abdul Latif University', 'Sindh', 'Khairpur', 'Active'),
  ('University of Peshawar', 'Khyber Pakhtunkhwa', 'Peshawar', 'Active'),
  ('University of Engineering and Technology Peshawar', 'Khyber Pakhtunkhwa', 'Peshawar', 'Active'),
  ('Abdul Wali Khan University Mardan', 'Khyber Pakhtunkhwa', 'Mardan', 'Active'),
  ('Gomal University', 'Khyber Pakhtunkhwa', 'Dera Ismail Khan', 'Active'),
  ('University of Balochistan', 'Balochistan', 'Quetta', 'Active'),
  ('Balochistan University of Information Technology, Engineering and Management Sciences (BUITEMS)', 'Balochistan', 'Quetta', 'Active'),
  ('Sardar Bahadur Khan Women University', 'Balochistan', 'Quetta', 'Active'),
  ('University of Azad Jammu and Kashmir', 'Azad Jammu and Kashmir', 'Muzaffarabad', 'Active'),
  ('Karakoram International University', 'Gilgit-Baltistan', 'Gilgit', 'Active')
on conflict (name) do nothing;

-- Seed Madadgar Teams from all Districts (1 team per district)
insert into public.madadgar_teams (
  name,
  district_id,
  district_name,
  zone,
  status,
  created_date
)
select
  d.name || ' Madadgar Team' as name,
  d.id as district_id,
  d.name as district_name,
  d.zone as zone,
  case when d.status = 'Inactive' then 'Inactive' else 'Active' end as status,
  coalesce(d.created_date, current_date) as created_date
from public.districts d
on conflict (name) do nothing;
