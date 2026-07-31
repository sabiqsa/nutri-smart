import { createClient } from "@/libs/supabase/server";
import type { Profile } from "@/types/profile";

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

export function canEditPatients(profile: Profile | null): boolean {
  return profile?.role === "ahli_gizi" || profile?.role === "admin";
}

export function isAdmin(profile: Profile | null): boolean {
  return profile?.role === "admin";
}
