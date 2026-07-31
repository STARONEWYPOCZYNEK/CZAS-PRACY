-- Rozliczenia zatwierdzane (wypłaty) + blokada rozliczonych wpisów

create table if not exists settlements (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees(id) on delete restrict,
  period_from date not null,
  period_to date not null,
  rows jsonb not null,
  total_hours numeric(10, 2) not null,
  total_amount numeric(10, 2) not null,
  approved_at timestamptz not null default now(),
  approved_by uuid references admins(id)
);

create index if not exists settlements_employee_idx on settlements(employee_id, period_from);

alter table time_entries
  add column if not exists settlement_id uuid references settlements(id) on delete restrict;

create index if not exists time_entries_settlement_idx on time_entries(settlement_id);

alter table settlements enable row level security;

drop policy if exists settlements_admin_all on settlements;
create policy settlements_admin_all on settlements
  for all using (is_admin()) with check (is_admin());
