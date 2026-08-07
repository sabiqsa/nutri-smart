import { createClient } from "@/libs/supabase/server";

/** Most recent Ahli Gizi who touched this patient's diet data — used as the
 * "Diverifikasi oleh" line on printed meal labels. No dedicated
 * "verified by" field exists; diet_history (0008) is the closest real
 * signal we have. */
export async function getLatestVerifier(patientId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("diet_history")
    .select("profiles(full_name, email)")
    .eq("patient_id", patientId)
    .eq("changed_by_role", "ahli_gizi")
    .order("created_at", { ascending: false })
    .limit(1)
    .single<{ profiles: { full_name: string | null; email: string | null } | null }>();

  return data?.profiles?.full_name ?? data?.profiles?.email ?? null;
}
