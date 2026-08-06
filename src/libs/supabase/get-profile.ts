import { createClient } from "@/libs/supabase/server";
import type { Profile } from "@/types/profile";

// Re-exported for convenience so existing call sites don't need two import
// lines — but these are pure functions with no server dependency, defined
// in utils/roles.ts (also imported directly by client components like
// AppShell's nav, which can't pull in this server-only file).
export {
  canDeletePatients,
  canEditPatients,
  canPrintLabel,
  canScanDistribution,
  canViewDietHistory,
  canViewMetrics,
  defaultRouteFor,
  isAdmin,
} from "@/utils/roles";

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, created_at")
    .eq("id", user.id)
    .single<Profile>();

  return profile ?? null;
}
