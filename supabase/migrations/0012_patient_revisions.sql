-- Batch of revisions from the hospital's feedback round:
--   3. No. RM must be unique (block duplicate saves with a clear error)
--   4. "Close Pasien" — hard delete, reuses the existing admin-only
--      patients_delete_admin RLS policy (0001/0007), no new policy needed
--   5. Frekuensi Makan — general field, dropdown 2-8
--   6. Bentuk Cair gets 3 extra fields: frekuensi/kalori/ml
--   1. "Pemberitahuan Mendesak" (Permintaan Khusus on the dashboard) only
--      surfaces for a configurable window after being (re)saved, not
--      forever — needs a timestamp to measure "how recently flagged" plus
--      somewhere to configure the window length

-- 3. Unique RM. Checked first (see diagnostic in conversation) — no
-- duplicates in current data, safe to add directly.
alter table public.patients add constraint patients_medical_record_number_unique unique (medical_record_number);

-- 5 & 6. New optional fields. Frekuensi columns share the same 2-8 range
-- as the dropdown (CHECK mirrors the UI options, same pattern as the
-- master-data CHECK constraints in 0006).
alter table public.patients add column frekuensi_makan integer;
alter table public.patients add constraint patients_frekuensi_makan_check
  check (frekuensi_makan is null or frekuensi_makan between 2 and 8);

alter table public.patients add column food_form_cair_frekuensi integer;
alter table public.patients add constraint patients_food_form_cair_frekuensi_check
  check (food_form_cair_frekuensi is null or food_form_cair_frekuensi between 2 and 8);

alter table public.patients add column food_form_cair_kalori integer;
alter table public.patients add constraint patients_food_form_cair_kalori_check
  check (food_form_cair_kalori is null or food_form_cair_kalori >= 0);

alter table public.patients add column food_form_cair_ml integer;
alter table public.patients add constraint patients_food_form_cair_ml_check
  check (food_form_cair_ml is null or food_form_cair_ml >= 0);

-- 1. When this patient's special-request flag was last (re)saved as true —
-- null when not flagged. The dashboard filters on this + a configurable
-- window instead of showing every is_special_request=true row forever.
alter table public.patients add column special_request_flagged_at timestamptz;
update public.patients set special_request_flagged_at = updated_at where is_special_request;

-- Single-row app-wide settings table — just the urgent-notification window
-- for now, but a sensible place to grow into rather than adding a new
-- table per future toggle.
create table public.app_settings (
  id text primary key default 'default',
  urgent_notification_hours integer not null default 12,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id),
  constraint app_settings_single_row check (id = 'default'),
  constraint app_settings_urgent_hours_check check (urgent_notification_hours > 0)
);
insert into public.app_settings (id) values ('default');

create trigger app_settings_set_updated_at
  before update on public.app_settings
  for each row execute procedure public.set_updated_at();

alter table public.app_settings enable row level security;

create policy "app_settings_select_all"
  on public.app_settings for select
  using (auth.uid() is not null);

create policy "app_settings_update_admin"
  on public.app_settings for update
  using (public.current_role() = 'admin')
  with check (public.current_role() = 'admin');
