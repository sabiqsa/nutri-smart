-- Fix a real bug in 0008's log_diet_history(): `changes || 'Diet Khusus
-- diubah'` (and 4 other plain-string branches) appends an untyped string
-- literal to a text[] with `||`. Postgres' operator resolution picked the
-- anyarray||anyarray overload for those (vs anyarray||anyelement for the
-- format()-based lines, which return an explicit text type and don't hit
-- this ambiguity) and tried to parse the literal AS an array, failing with
-- "malformed array literal: ..." — which aborted the whole UPDATE. Any
-- change to special_diet, food_form_detail, allergies, food_restrictions,
-- or is_special_request/special_request_note failed to save because of
-- this, not because of the patient form itself.
--
-- Fix: cast each literal to text explicitly so `||` resolves to
-- anyarray||anyelement (append one element) like the format() lines already do.

create or replace function public.log_diet_history()
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
    changes := changes || 'Diet Khusus diubah'::text;
  end if;
  if new.food_form is distinct from old.food_form then
    changes := changes || format('Bentuk Makanan: %s -> %s', coalesce(old.food_form, '-'), coalesce(new.food_form, '-'));
  end if;
  if new.food_form_detail is distinct from old.food_form_detail then
    changes := changes || 'Detail Bentuk Makanan diubah'::text;
  end if;
  if new.allergies is distinct from old.allergies then
    changes := changes || 'Alergi diubah'::text;
  end if;
  if new.food_restrictions is distinct from old.food_restrictions then
    changes := changes || 'Pantangan Makanan diubah'::text;
  end if;
  if new.is_special_request is distinct from old.is_special_request
     or new.special_request_note is distinct from old.special_request_note then
    changes := changes || 'Permintaan Khusus diubah'::text;
  end if;

  if array_length(changes, 1) > 0 then
    insert into public.diet_history (patient_id, changed_by, changed_by_role, summary)
    values (new.id, auth.uid(), public.current_role(), array_to_string(changes, '; '));
  end if;

  return new;
end;
$$;
