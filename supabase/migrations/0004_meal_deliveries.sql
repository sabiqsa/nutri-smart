-- Session 5: Patient List (Meal Distribution) needs two things the original
-- sheet-derived schema didn't have:
--   1. A human-readable patient name (sheet only had RM/medical_record_number).
--   2. Per-patient distribution status (Pending/Ready/Delivered) that GUEST
--      users (distribution staff, no login) progress via QR scan/confirm —
--      that's their actual job, unlike editing diet data which stays
--      ahli_gizi/admin-only.

alter table public.patients add column patient_name text;

create type public.distribution_status as enum ('pending', 'ready', 'delivered');

create table public.meal_deliveries (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  status public.distribution_status not null default 'pending',
  delivered_at timestamptz,
  mismatch boolean not null default false,
  mismatch_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index meal_deliveries_patient_id_idx on public.meal_deliveries (patient_id);

create trigger meal_deliveries_set_updated_at
  before update on public.meal_deliveries
  for each row execute procedure public.set_updated_at();

-- Every new patient starts with one pending delivery row — keeps this
-- session's scope to patient CRUD + status display, not a separate
-- "start distribution" flow. Revisit if multiple meals/day need independent
-- tracking (breakfast/lunch/dinner) later.
create function public.create_meal_delivery_for_patient()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.meal_deliveries (patient_id) values (new.id);
  return new;
end;
$$;

create trigger on_patient_created
  after insert on public.patients
  for each row execute procedure public.create_meal_delivery_for_patient();

alter table public.meal_deliveries enable row level security;

-- Everyone (guest + logged in) can see distribution status.
create policy "meal_deliveries_select_all"
  on public.meal_deliveries for select
  using (true);

-- Guest (distribution staff) progresses status via scan — narrow to just the
-- columns the scan flow touches, not patient_id/id/created_at.
revoke update on public.meal_deliveries from anon, authenticated;
grant update (status, delivered_at, mismatch, mismatch_note) on public.meal_deliveries to anon, authenticated;

create policy "meal_deliveries_update_all"
  on public.meal_deliveries for update
  using (true)
  with check (true);

-- No INSERT policy for anon/authenticated — rows are only created via the
-- trigger above (security definer bypasses RLS).

create policy "meal_deliveries_delete_admin"
  on public.meal_deliveries for delete
  using (public.current_role() = 'admin');
