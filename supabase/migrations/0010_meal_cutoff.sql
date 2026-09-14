-- Meal period cut-off config + the two artifacts the scheduled cutoff job
-- produces: a lock marking "kebutuhan makan" rekap for a session as closed,
-- and a snapshot of distribution counts taken at the evaluation cut-off.
--
-- Deliberately additive, not a redesign of meal_deliveries: that table
-- stays "current status of today's meal" as-is (see 0004's note that
-- multi-session/day tracking was deferred) — these new tables layer
-- per-session timing/config/snapshots on top instead of restructuring the
-- live distribution-status table teams already depend on.

create table public.meal_cutoffs (
  period text primary key check (period in ('pagi', 'siang', 'sore')),
  -- Kebutuhan makan changes up to and including this time count toward
  -- this period's rekap; after it, changes roll to the next period.
  data_cutoff_time time not null,
  distribution_start_time time not null,
  distribution_end_time time not null,
  -- When the cron job auto-generates this period's distribution snapshot.
  -- Usually equal to distribution_end_time but kept separate in case ops
  -- wants a buffer.
  evaluation_cutoff_time time not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id)
);

create trigger meal_cutoffs_set_updated_at
  before update on public.meal_cutoffs
  for each row execute procedure public.set_updated_at();

-- Seed defaults from the spec (pagi fully specified; siang/sore
-- distribution windows are placeholders — Admin can adjust via the config
-- screen, that's the whole point of this being a table and not a constant).
insert into public.meal_cutoffs
  (period, data_cutoff_time, distribution_start_time, distribution_end_time, evaluation_cutoff_time)
values
  ('pagi', '04:00', '06:00', '07:00', '07:00'),
  ('siang', '10:00', '11:30', '12:30', '12:30'),
  ('sore', '14:00', '17:00', '18:00', '18:00');

-- One row per (date, period) once that session's kebutuhan-makan rekap is
-- locked by the cutoff cron. Presence of a row = locked; absence = still
-- open. Doesn't touch patients/diet data — that stays editable always, only
-- which rekap a past edit counts toward is what's frozen.
create table public.meal_period_locks (
  id uuid primary key default gen_random_uuid(),
  lock_date date not null,
  period text not null check (period in ('pagi', 'siang', 'sore')),
  locked_at timestamptz not null default now(),
  unique (lock_date, period)
);

-- One row per (date, period) generated automatically at evaluation
-- cut-off — a frozen count, not a live query, so "what did we report at
-- 07:00" stays answerable even as meal_deliveries keeps changing after.
create table public.distribution_snapshots (
  id uuid primary key default gen_random_uuid(),
  snapshot_date date not null,
  period text not null check (period in ('pagi', 'siang', 'sore')),
  berhasil_count integer not null default 0,
  pending_count integer not null default 0,
  tidak_dibagikan_count integer not null default 0,
  total_count integer not null default 0,
  generated_at timestamptz not null default now(),
  unique (snapshot_date, period)
);

alter table public.meal_cutoffs enable row level security;
alter table public.meal_period_locks enable row level security;
alter table public.distribution_snapshots enable row level security;

-- Config needs to be readable by anyone logged in — Perawat/Ahli Gizi need
-- it client-side for the "masuk ke sesi X" indicator while editing, not
-- just the metrics-gated roles.
create policy "meal_cutoffs_select_all"
  on public.meal_cutoffs for select
  using (auth.uid() is not null);

create policy "meal_cutoffs_update_admin"
  on public.meal_cutoffs for update
  using (public.current_role() = 'admin')
  with check (public.current_role() = 'admin');

create policy "meal_period_locks_select_metrics_roles"
  on public.meal_period_locks for select
  using (public.current_role() in ('ahli_gizi', 'produksi', 'distribusi', 'admin'));

create policy "distribution_snapshots_select_metrics_roles"
  on public.distribution_snapshots for select
  using (public.current_role() in ('ahli_gizi', 'produksi', 'distribusi', 'admin'));

-- No insert/update policies for meal_period_locks/distribution_snapshots —
-- only the cron route writes these, via the service-role client (bypasses
-- RLS), same pattern as createUser in admin/users/actions.ts.
