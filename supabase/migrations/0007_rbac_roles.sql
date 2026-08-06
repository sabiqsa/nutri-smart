-- Phase 2: replace the guest-first model (sesi 4) with 5 required-login
-- roles. Every screen now requires an account — anon/guest access to
-- patients and meal_deliveries is fully revoked.
--
-- Spec calls for 4 operational roles: Perawat, Ahli Gizi, Bagian Produksi
-- (Dapur), Bagian Distribusi. `admin` is NOT one of the 4 — kept as a 5th
-- role purely for bootstrapping/user management (something has to assign
-- roles to new accounts; see get-profile.ts canManageUsers).

-- Drop everything that's being rebuilt below.
drop policy if exists "patients_select_authenticated" on public.patients;
drop policy if exists "patients_select_guest" on public.patients;
drop policy if exists "patients_insert_ahli_gizi_or_admin" on public.patients;
drop policy if exists "patients_update_ahli_gizi_or_admin" on public.patients;
drop policy if exists "patients_delete_admin" on public.patients;

drop policy if exists "meal_deliveries_select_all" on public.meal_deliveries;
drop policy if exists "meal_deliveries_update_all" on public.meal_deliveries;
drop policy if exists "meal_deliveries_delete_admin" on public.meal_deliveries;
revoke update on public.meal_deliveries from anon, authenticated;

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
drop policy if exists "profiles_update_admin" on public.profiles;

drop policy if exists "patients_import_write_ahli_gizi_or_admin" on public.patients_import;

drop function if exists public.current_role();

-- profiles.role: enum -> text + CHECK. Easier to extend later than a
-- Postgres enum (ALTER TYPE ADD VALUE can't run in the same transaction as
-- using the new value). 'ppm' (the old guest-adjacent role) is retired.
alter table public.profiles alter column role drop default;
alter table public.profiles alter column role type text using role::text;
drop type public.user_role;
alter table public.profiles add constraint profiles_role_check
  check (role in ('perawat', 'ahli_gizi', 'produksi', 'distribusi', 'admin'));

create function public.current_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- profiles
create policy "profiles_select_own_or_admin"
  on public.profiles for select
  using (id = auth.uid() or public.current_role() = 'admin');

create policy "profiles_update_admin"
  on public.profiles for update
  using (public.current_role() = 'admin');

-- patients: any logged-in role can read (all 5 need at least list/filter
-- visibility per spec). Perawat inputs initial/advice diet data, Ahli Gizi
-- finalizes — both write to the same row; who-changed-what is captured by
-- diet_history (0008), not by field-level RLS. Produksi/Distribusi are
-- read-only here — they work off meal_deliveries instead.
create policy "patients_select_all_roles"
  on public.patients for select
  using (public.current_role() is not null);

create policy "patients_insert_perawat_ahligizi_admin"
  on public.patients for insert
  with check (public.current_role() in ('perawat', 'ahli_gizi', 'admin'));

create policy "patients_update_perawat_ahligizi_admin"
  on public.patients for update
  using (public.current_role() in ('perawat', 'ahli_gizi', 'admin'));

create policy "patients_delete_admin"
  on public.patients for delete
  using (public.current_role() = 'admin');

-- patients_import CSV staging: unchanged access (ahli_gizi/admin).
create policy "patients_import_write_ahli_gizi_or_admin"
  on public.patients_import for all
  using (public.current_role() in ('ahli_gizi', 'admin'))
  with check (public.current_role() in ('ahli_gizi', 'admin'));

-- meal_deliveries: any logged-in role can read (produksi/distribusi need
-- real-time porsi tracking; perawat/ahli_gizi need status context). Only
-- Distribusi (the scan-and-confirm role) + Admin can update status — this
-- used to be anon-writable (guest scan flow); now requires a Distribusi
-- account.
grant update (status, delivered_at, mismatch, mismatch_note) on public.meal_deliveries to authenticated;

create policy "meal_deliveries_select_all_roles"
  on public.meal_deliveries for select
  using (public.current_role() is not null);

create policy "meal_deliveries_update_distribusi_or_admin"
  on public.meal_deliveries for update
  using (public.current_role() in ('distribusi', 'admin'));

create policy "meal_deliveries_delete_admin"
  on public.meal_deliveries for delete
  using (public.current_role() = 'admin');
