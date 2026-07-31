-- Ewidencja godzin pracy: schemat początkowy

create table if not exists admins (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists employees (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  pin_hash text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists work_types (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  hourly_rate numeric(10, 2) not null check (hourly_rate >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists time_entries (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees(id) on delete cascade,
  work_type_id uuid not null references work_types(id) on delete restrict,
  work_date date not null,
  start_time time not null,
  end_time time not null,
  description text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists time_entries_employee_idx on time_entries(employee_id, work_date);
create index if not exists time_entries_work_type_idx on time_entries(work_type_id);

create table if not exists pin_attempts (
  id bigint generated always as identity primary key,
  employee_id uuid references employees(id) on delete cascade,
  ip_address text,
  success boolean not null,
  attempted_at timestamptz not null default now()
);

create index if not exists pin_attempts_employee_idx on pin_attempts(employee_id, attempted_at);
create index if not exists pin_attempts_ip_idx on pin_attempts(ip_address, attempted_at);

-- updated_at trigger for time_entries
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists time_entries_set_updated_at on time_entries;
create trigger time_entries_set_updated_at
  before update on time_entries
  for each row
  execute function set_updated_at();

-- is_admin(): sprawdza czy zalogowany użytkownik Supabase Auth jest administratorem
create or replace function is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from admins where id = auth.uid());
$$;

alter table admins enable row level security;
alter table employees enable row level security;
alter table work_types enable row level security;
alter table time_entries enable row level security;
alter table pin_attempts enable row level security;

-- admins: użytkownik może sprawdzić tylko własny wpis (bez rekurencji)
drop policy if exists admins_select_own on admins;
create policy admins_select_own on admins
  for select using (id = auth.uid());

-- Pozostałe tabele: pełny dostęp tylko dla adminów przez Supabase Auth.
-- Przepływ pracownika (PIN) omija RLS przez klienta z rolą serwisową (server-only),
-- więc te tabele NIE mają polityk dla anon/authenticated-nie-admin — brak wpisu = brak dostępu.
drop policy if exists employees_admin_all on employees;
create policy employees_admin_all on employees
  for all using (is_admin()) with check (is_admin());

drop policy if exists work_types_admin_all on work_types;
create policy work_types_admin_all on work_types
  for all using (is_admin()) with check (is_admin());

drop policy if exists time_entries_admin_all on time_entries;
create policy time_entries_admin_all on time_entries
  for all using (is_admin()) with check (is_admin());

drop policy if exists pin_attempts_admin_select on pin_attempts;
create policy pin_attempts_admin_select on pin_attempts
  for select using (is_admin());
