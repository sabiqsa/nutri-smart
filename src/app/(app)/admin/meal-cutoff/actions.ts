"use server";

import { revalidatePath } from "next/cache";

import { getCurrentProfile, isAdmin } from "@/libs/supabase/get-profile";
import { createClient } from "@/libs/supabase/server";
import type { MealPeriod } from "@/types/meal-cutoff";

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

export async function updateMealCutoff(period: MealPeriod, _prevState: string | void | null, formData: FormData) {
  const profile = await getCurrentProfile();
  if (!isAdmin(profile?.role ?? null)) {
    return "Butuh login Admin.";
  }

  const fields = {
    data_cutoff_time: String(formData.get("data_cutoff_time") ?? ""),
    distribution_start_time: String(formData.get("distribution_start_time") ?? ""),
    distribution_end_time: String(formData.get("distribution_end_time") ?? ""),
    evaluation_cutoff_time: String(formData.get("evaluation_cutoff_time") ?? ""),
  };

  for (const [key, value] of Object.entries(fields)) {
    if (!TIME_RE.test(value)) {
      return `${key.replace(/_/g, " ")} harus format HH:MM.`;
    }
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("meal_cutoffs")
    .update({ ...fields, updated_by: profile!.id })
    .eq("period", period);
  if (error) {
    return error.message;
  }

  revalidatePath("/admin/meal-cutoff");
  return null;
}
