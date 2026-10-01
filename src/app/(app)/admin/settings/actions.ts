"use server";

import { revalidatePath } from "next/cache";

import { getCurrentProfile, isAdmin } from "@/libs/supabase/get-profile";
import { createClient } from "@/libs/supabase/server";

export async function updateUrgentNotificationHours(_prevState: string | void | null, formData: FormData) {
  const profile = await getCurrentProfile();
  if (!isAdmin(profile?.role ?? null)) {
    return "Butuh login Admin.";
  }

  const hours = Number(formData.get("urgent_notification_hours"));
  if (!Number.isFinite(hours) || hours <= 0) {
    return "Durasi harus angka lebih dari 0.";
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("app_settings")
    .update({ urgent_notification_hours: Math.trunc(hours), updated_by: profile!.id })
    .eq("id", "default");
  if (error) {
    return error.message;
  }

  revalidatePath("/admin/settings");
  revalidatePath("/dashboard");
  return null;
}
