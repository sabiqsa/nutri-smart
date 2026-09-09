import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Service-role client — bypasses RLS entirely. Server-only: never import
// this from a Client Component or expose SUPABASE_SERVICE_ROLE_KEY to the
// browser. Used for admin-only operations the anon/authenticated client
// can't do, like creating auth users directly (admin/users "Tambah User").
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
