-- Session 7: Admin needs to identify users when assigning roles. profiles
-- didn't store email (auth.users is a protected schema, not readable from
-- the app's anon/authenticated client) — denormalize it at signup time via
-- the existing handle_new_user trigger instead of exposing service_role to
-- the app.

alter table public.profiles add column email text;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, new.raw_user_meta_data ->> 'full_name', new.email);
  return new;
end;
$$;
