-- Staging table for raw CSV export from the nutrition sheet.
-- Column names match the sheet header exactly so Supabase's Table Editor
-- CSV import auto-maps every column — no manual mapping step.
--
-- NOTE: "Food Form Options (Liquid)" / "(Strained)" and the date format below
-- are best guesses from a partial sheet read. If the real CSV headers or the
-- date format (assumed DD/MM/YYYY) differ, adjust with ALTER TABLE / the
-- to_date() call below — don't rebuild this from scratch.

create table public.patients_import (
  "Ruangan" text,
  "BED" text,
  "RM" text,
  "Tanggal lahir" text,
  "DIET" text,
  "Diet Khusus" text,
  "BENTUK MAKANAN" text,
  "Food Form Options (Liquid)" text,
  "Food Form Options (Strained)" text,
  "ALERGI" text,
  "PANTANGAN MAKANAN" text,
  "KETERANGAN" text
);

alter table public.patients_import enable row level security;

create policy "patients_import_write_ahli_gizi_or_admin"
  on public.patients_import for all
  using (public.current_role() in ('ahli_gizi', 'admin'))
  with check (public.current_role() in ('ahli_gizi', 'admin'));

-- Run after each CSV import (SQL Editor):
--   select public.sync_patients_from_import();
-- Moves staged rows into `patients` with proper types, then clears staging.
create function public.sync_patients_from_import()
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  moved_count integer;
begin
  insert into public.patients (
    room, bed, medical_record_number, date_of_birth,
    diet_type, special_diet, food_form, food_form_detail,
    allergies, food_restrictions, notes
  )
  select
    "Ruangan",
    "BED",
    "RM",
    to_date(nullif("Tanggal lahir", ''), 'DD/MM/YYYY'),
    "DIET",
    "Diet Khusus",
    "BENTUK MAKANAN",
    nullif(trim(both ' / ' from concat_ws(' / ', "Food Form Options (Liquid)", "Food Form Options (Strained)")), ''),
    "ALERGI",
    "PANTANGAN MAKANAN",
    "KETERANGAN"
  from public.patients_import
  where "RM" is not null;

  get diagnostics moved_count = row_count;
  truncate public.patients_import;
  return moved_count;
end;
$$;
