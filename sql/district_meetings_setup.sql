-- District Meetings setup
-- Creates the district meeting tables used by the React app:
-- meetings, meeting_districts, and district_meeting_records.

create extension if not exists pgcrypto;

create table if not exists public.meetings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  month text not null,
  meeting_date date not null,
  agenda text,
  notes text,
  scope text not null default 'All' check (scope in ('All', 'Zone', 'Selected')),
  scope_value text
);

create table if not exists public.meeting_districts (
  meeting_id uuid not null references public.meetings(id) on delete cascade,
  district_id uuid not null references public.districts(id) on delete cascade,
  primary key (meeting_id, district_id)
);

create table if not exists public.district_meeting_records (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references public.meetings(id) on delete cascade,
  district_id uuid not null references public.districts(id) on delete cascade,
  district_name text not null,
  meeting_title text,
  month text,
  meeting_date date,
  status text not null default 'Empty' check (status in ('Empty', 'Completed')),
  notes text,
  attendance text check (attendance in ('Present', 'Absent', 'Late')),
  unique (meeting_id, district_id)
);

create index if not exists idx_meeting_districts_district_id on public.meeting_districts(district_id);
create index if not exists idx_district_meeting_records_district_id on public.district_meeting_records(district_id);
create index if not exists idx_district_meeting_records_meeting_id on public.district_meeting_records(meeting_id);

create or replace function public.sync_district_meeting_record()
returns trigger
language plpgsql
as $$
begin
  insert into public.district_meeting_records (
    meeting_id,
    district_id,
    district_name,
    meeting_title,
    month,
    meeting_date,
    status
  )
  select
    new.meeting_id,
    d.id,
    d.name,
    m.title,
    m.month,
    m.meeting_date,
    'Empty'
  from public.districts d
  join public.meetings m on m.id = new.meeting_id
  where d.id = new.district_id
  on conflict (meeting_id, district_id) do update
    set district_name = excluded.district_name,
        meeting_title = excluded.meeting_title,
        month = excluded.month,
        meeting_date = excluded.meeting_date;

  return new;
end;
$$;

drop trigger if exists trg_sync_district_meeting_record on public.meeting_districts;
create trigger trg_sync_district_meeting_record
after insert on public.meeting_districts
for each row
execute function public.sync_district_meeting_record();

alter table public.meetings enable row level security;
alter table public.meeting_districts enable row level security;
alter table public.district_meeting_records enable row level security;

drop policy if exists meetings_select_authenticated on public.meetings;
create policy meetings_select_authenticated
on public.meetings
for select
to authenticated
using (true);

drop policy if exists meetings_manage_authenticated on public.meetings;
create policy meetings_manage_authenticated
on public.meetings
for all
to authenticated
using (true)
with check (true);

drop policy if exists meeting_districts_select_authenticated on public.meeting_districts;
create policy meeting_districts_select_authenticated
on public.meeting_districts
for select
to authenticated
using (true);

drop policy if exists meeting_districts_manage_authenticated on public.meeting_districts;
create policy meeting_districts_manage_authenticated
on public.meeting_districts
for all
to authenticated
using (true)
with check (true);

drop policy if exists district_meeting_records_select_authenticated on public.district_meeting_records;
create policy district_meeting_records_select_authenticated
on public.district_meeting_records
for select
to authenticated
using (true);

drop policy if exists district_meeting_records_manage_authenticated on public.district_meeting_records;
create policy district_meeting_records_manage_authenticated
on public.district_meeting_records
for all
to authenticated
using (true)
with check (true);