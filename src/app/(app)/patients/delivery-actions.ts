"use server";

import { revalidatePath } from "next/cache";

import { getCurrentProfile } from "@/libs/supabase/get-profile";
import { createClient } from "@/libs/supabase/server";
import { canScanDistribution } from "@/utils/roles";

export async function markNotDistributed(
  deliveryId: string,
  patientId: string,
  _prevState: string | void | null,
  formData: FormData,
) {
  const profile = await getCurrentProfile();
  if (!canScanDistribution(profile?.role ?? null)) {
    return "Butuh login Bagian Distribusi/Admin.";
  }

  const note = String(formData.get("reason") ?? "").trim();
  if (!note) {
    return "Isi alasan tidak dibagikan.";
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("meal_deliveries")
    .update({ status: "not_distributed", mismatch_note: note })
    .eq("id", deliveryId);

  if (error) {
    return error.message;
  }

  revalidatePath(`/patients/${patientId}`);
  revalidatePath("/patients");
  revalidatePath("/dashboard");
}
