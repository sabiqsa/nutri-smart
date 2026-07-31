-- Auth model correction: login is optional, only for Ahli Gizi/Admin (to
-- edit diet data). Distribution staff/PPM use the app as anonymous guests,
-- read-only. Grant the Postgres/Supabase built-in `anon` role SELECT on
-- patients — write access (insert/update/delete) stays Ahli Gizi/Admin-only
-- via the policies from 0001.

create policy "patients_select_guest"
  on public.patients for select
  to anon
  using (true);
