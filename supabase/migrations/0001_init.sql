-- NutriSmart initial schema: roles, profiles, patients.
-- Run in Supabase SQL Editor (or `supabase db push` once linked).

create type public.user_role as enum ('admin', 'ahli_gizi', 'ppm');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  role public.user_role,
  created_at timestamptz not null default now()
);

-- Auto-create a profile row (role unset) whenever a new auth user is created.
-- Admin assigns the actual role afterwards from the admin dashboard (session 7).
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- security definer helper so patient RLS policies can read the caller's role
-- without recursively hitting profiles' own RLS.
create function public.current_role()
returns public.user_role
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.profiles where id = auth.uid();
$$;

create table public.patients (
  id uuid primary key default gen_random_uuid(),
  room text not null, -- Ruangan
  bed text, -- BED
  medical_record_number text not null, -- RM
  date_of_birth date, -- Tanggal lahir
  diet_type text, -- DIET
  special_diet text, -- Diet Khusus
  food_form text, -- BENTUK MAKANAN
  food_form_detail text, -- Food Form Options (Liquid/Strained)
  allergies text, -- ALERGI
  food_restrictions text, -- PANTANGAN MAKANAN
  notes text, -- KETERANGAN
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index patients_medical_record_number_idx on public.patients (medical_record_number);
create index patients_room_idx on public.patients (room);

create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger patients_set_updated_at
  before update on public.patients
  for each row execute procedure public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.patients enable row level security;

-- profiles: everyone can read their own row; admin reads/writes all.
create policy "profiles_select_own_or_admin"
  on public.profiles for select
  using (id = auth.uid() or public.current_role() = 'admin');

create policy "profiles_update_admin"
  on public.profiles for update
  using (public.current_role() = 'admin');

-- patients: all 3 roles can read; ahli_gizi/admin can write; admin only can delete.
-- ppm is read-only by design (monitoring role) — revisit in session 7 if wrong.
create policy "patients_select_authenticated"
  on public.patients for select
  using (public.current_role() is not null);

create policy "patients_insert_ahli_gizi_or_admin"
  on public.patients for insert
  with check (public.current_role() in ('ahli_gizi', 'admin'));

create policy "patients_update_ahli_gizi_or_admin"
  on public.patients for update
  using (public.current_role() in ('ahli_gizi', 'admin'));

create policy "patients_delete_admin"
  on public.patients for delete
  using (public.current_role() = 'admin');
