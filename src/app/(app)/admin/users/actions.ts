"use server";

import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/libs/supabase/admin";
import { getCurrentProfile, isAdmin } from "@/libs/supabase/get-profile";
import { createClient } from "@/libs/supabase/server";
import type { UserRole } from "@/types/profile";

export async function createUser(_prevState: string | void | null, formData: FormData) {
  const profile = await getCurrentProfile();
  if (!isAdmin(profile?.role ?? null)) {
    return "Butuh login Admin.";
  }

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("full_name") ?? "").trim();
  const role = String(formData.get("role") ?? "");
  // Admin is bootstrapped once and not offered here (single-admin policy) —
  // exclude it even if someone tampers with the form's posted value.
  const validRoles = ["perawat", "ahli_gizi", "produksi", "distribusi"];

  if (!email || !password) {
    return "Email dan password wajib diisi.";
  }
  if (password.length < 6) {
    return "Password minimal 6 karakter.";
  }

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: fullName ? { full_name: fullName } : undefined,
  });

  if (error) {
    return error.message;
  }

  // handle_new_user trigger already inserted the profiles row (role null,
  // full_name/email denormalized) — assign the role now if one was picked.
  if (validRoles.includes(role) && data.user) {
    const supabase = await createClient();
    const { error: roleError } = await supabase
      .from("profiles")
      .update({ role: role as UserRole })
      .eq("id", data.user.id);
    if (roleError) {
      return `User dibuat, tapi gagal set role: ${roleError.message}`;
    }
  }

  revalidatePath("/admin/users");
  return null;
}

export async function updateProfileRole(id: string, _prevState: string | void | null, formData: FormData) {
  const profile = await getCurrentProfile();
  if (!isAdmin(profile?.role ?? null)) {
    return "Butuh login Admin.";
  }

  const role = String(formData.get("role") ?? "");
  // Same single-admin policy as createUser — admin isn't assignable from
  // this form even if the posted value is tampered with.
  const validRoles = ["perawat", "ahli_gizi", "produksi", "distribusi"];
  const nextRole = validRoles.includes(role) ? role : null;

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ role: nextRole }).eq("id", id);
  if (error) {
    return error.message;
  }

  revalidatePath("/admin/users");
  return null;
}
