"use server";

import { revalidatePath } from "next/cache";

import { getCurrentProfile, isAdmin } from "@/libs/supabase/get-profile";
import { createClient } from "@/libs/supabase/server";

export async function updateProfileRole(id: string, _prevState: string | void | null, formData: FormData) {
  const profile = await getCurrentProfile();
  if (!isAdmin(profile?.role ?? null)) {
    return "Butuh login Admin.";
  }

  const role = String(formData.get("role") ?? "");
  const validRoles = ["perawat", "ahli_gizi", "produksi", "distribusi", "admin"];
  const nextRole = validRoles.includes(role) ? role : null;

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ role: nextRole }).eq("id", id);
  if (error) {
    return error.message;
  }

  revalidatePath("/admin/users");
  return null;
}
