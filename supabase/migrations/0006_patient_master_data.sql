-- Phase 1 of the RBAC/master-data rework: convert free-text patient fields
-- to controlled dropdowns/multi-selects backed by master data. Master data
-- itself lives as TS constants in src/constants/patient-options.ts (not a
-- DB-editable reference table — no admin UI was requested for editing these
-- lists, so a single source-controlled file is simpler to keep in sync).
-- CHECK constraints below mirror those constants; update both together.

-- The 3 existing patient rows are test/junk data (room "1"/"Nep"/"Sat", bed
-- "kucing", diet "DJ 19000") that predate this master data and don't match
-- any real option — clearing the fields that would violate the new
-- constraints rather than guessing a mapping.
update public.patients set room = 'ICU DEWASA' where room not in (
  'ICU DEWASA','CVC','IW MEDIK','IW BEDAH','PAV SUKAMAN','SILVER-VENTRIKEL',
  'RAWAT ANAK','ICU ANAK','IW ANAK','GP 2 LT 3','GP 2 LT 4','GP 2 LT 5','IGD','HD','ODC'
);
update public.patients set diet_type = null where diet_type is not null;
update public.patients set allergies = null;
update public.patients set food_restrictions = null;
update public.patients set food_form = null where food_form not in ('CAIR','SARING','BUBUR','TIM','BIASA','BIASA ANAK');

alter table public.patients
  add constraint patients_room_check check (room in (
    'ICU DEWASA','CVC','IW MEDIK','IW BEDAH','PAV SUKAMAN','SILVER-VENTRIKEL',
    'RAWAT ANAK','ICU ANAK','IW ANAK','GP 2 LT 3','GP 2 LT 4','GP 2 LT 5','IGD','HD','ODC'
  ));

alter table public.patients
  add constraint patients_diet_type_check check (diet_type is null or diet_type in (
    'Diet Jantung 900 KKAL','Diet Jantung 1000 KKAL','Diet Jantung 1100 KKAL',
    'Diet Jantung 1200 KKAL','Diet Jantung 1300 KKAL','Diet Jantung 1400 KKAL',
    'Diet Jantung 1500 KKAL','Diet Jantung 1600 KKAL','Diet Jantung 1700 KKAL',
    'Diet Jantung 1800 KKAL','Diet Jantung 1900 KKAL','Diet Jantung 2000 KKAL',
    'Diet Jantung 2100 KKAL','Diet Jantung 2200 KKAL','Diet Jantung 2300 KKAL',
    'ETPT 2300 KKAL','Diet Jantung 2400 KKAL','ETPT 2400 KKAL'
  ));

alter table public.patients
  add constraint patients_food_form_check check (food_form is null or food_form in (
    'CAIR','SARING','BUBUR','TIM','BIASA','BIASA ANAK'
  ));

-- special_diet: single text -> multi-select (text[])
alter table public.patients alter column special_diet drop default;
alter table public.patients
  alter column special_diet type text[] using case when special_diet is null then null else array[special_diet] end;

-- allergies: single text -> jsonb array of {type, detail}, e.g.
-- [{"type": "IKAN", "detail": "gatal-gatal ringan"}]
alter table public.patients
  alter column allergies type jsonb using case when allergies is null then null else to_jsonb(allergies) end;
alter table public.patients alter column allergies set default '[]'::jsonb;
update public.patients set allergies = '[]'::jsonb where allergies is null;
alter table public.patients alter column allergies set not null;

-- food_restrictions: single text -> multi-select (text[]), same catalogue as allergies
alter table public.patients
  alter column food_restrictions type text[] using case when food_restrictions is null then null else array[food_restrictions] end;

-- "Permintaan Khusus" checkbox — surfaces in the urgent-alerts panel when set.
alter table public.patients add column is_special_request boolean not null default false;
alter table public.patients add column special_request_note text;
alter table public.patients add constraint patients_special_request_note_check
  check (not is_special_request or special_request_note is not null);
