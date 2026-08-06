"use server";

import { redirect } from "next/navigation";

import { defaultRouteFor } from "@/libs/supabase/get-profile";
import { createClient } from "@/libs/supabase/server";
import type { Profile } from "@/types/profile";

export async function login(_prevState: string | null, formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    return "Email atau password salah.";
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single<Pick<Profile, "role">>();

  redirect(defaultRouteFor(profile?.role ?? null));
}
