-- "Riwayat diet" (diet history) — Perawat gets read-only access, Ahli Gizi
-- gets full (still read-only in the UI sense; "full access" per spec means
-- unrestricted read, there's no write path for anyone, entries are
-- system-generated). Simplification flagged: this logs WHO changed WHAT and
-- WHEN, not a full "Awal/Advis Dokter -> Definitif" approval workflow —
-- that would need a status field + state machine the spec implies but
-- doesn't fully define; deferred rather than guessed.

create table public.diet_history (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  changed_by uuid references public.profiles (id),
  changed_by_role text,
  summary text not null,
  created_at timestamptz not null default now()
);

create index diet_history_patient_id_idx on public.diet_history (patient_id, created_at desc);

create function public.log_diet_history()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  changes text[] := '{}';
begin
  if TG_OP = 'INSERT' then
    insert into public.diet_history (patient_id, changed_by, changed_by_role, summary)
    values (new.id, auth.uid(), public.current_role(), 'Data pasien dibuat');
    return new;
  end if;

  if new.diet_type is distinct from old.diet_type then
    changes := changes || format('Diet Utama: %s -> %s', coalesce(old.diet_type, '-'), coalesce(new.diet_type, '-'));
  end if;
  if new.special_diet is distinct from old.special_diet then
    changes := changes || 'Diet Khusus diubah';
  end if;
  if new.food_form is distinct from old.food_form then
    changes := changes || format('Bentuk Makanan: %s -> %s', coalesce(old.food_form, '-'), coalesce(new.food_form, '-'));
  end if;
  if new.food_form_detail is distinct from old.food_form_detail then
    changes := changes || 'Detail Bentuk Makanan diubah';
  end if;
  if new.allergies is distinct from old.allergies then
    changes := changes || 'Alergi diubah';
  end if;
  if new.food_restrictions is distinct from old.food_restrictions then
    changes := changes || 'Pantangan Makanan diubah';
  end if;
  if new.is_special_request is distinct from old.is_special_request
     or new.special_request_note is distinct from old.special_request_note then
    changes := changes || 'Permintaan Khusus diubah';
  end if;

  if array_length(changes, 1) > 0 then
    insert into public.diet_history (patient_id, changed_by, changed_by_role, summary)
    values (new.id, auth.uid(), public.current_role(), array_to_string(changes, '; '));
  end if;

  return new;
end;
$$;

create trigger patients_log_diet_history
  after insert or update on public.patients
  for each row execute procedure public.log_diet_history();

alter table public.diet_history enable row level security;

create policy "diet_history_select_perawat_ahligizi_admin"
  on public.diet_history for select
  using (public.current_role() in ('perawat', 'ahli_gizi', 'admin'));

-- No insert/update/delete policies for any client role — only the trigger
-- (security definer) writes here.
