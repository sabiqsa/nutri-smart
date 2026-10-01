import { redirect } from "next/navigation";

import { AppShell } from "@/components/AppShell/AppShell";
import { canViewMetrics, getCurrentProfile } from "@/libs/supabase/get-profile";
import { createClient } from "@/libs/supabase/server";
import type { Patient } from "@/types/patient";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Phase 2 (RBAC): proxy.ts already redirects unauthenticated requests to
  // /login before they reach this layout — this is a defensive fallback,
  // not the primary guard.
  const profile = await getCurrentProfile();
  if (!profile) {
    redirect("/login");
  }

  if (!profile.role) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
        <h1 className="text-lg font-semibold">Menunggu akses</h1>
        <p className="max-w-sm text-sm text-on-surface-variant">
          Akun kamu belum diberi role oleh admin. Hubungi admin NutriSmart untuk aktivasi akun.
        </p>
        <form action="/auth/logout" method="post">
          <button type="submit" className="mt-2 text-sm font-medium text-on-surface-variant underline">
            Logout
          </button>
        </form>
      </main>
    );
  }

  // Pemberitahuan Mendesak lives in the header bell now (every page, not
  // just Dashboard) — same gate Dashboard's metrics used to have (Perawat
  // doesn't get rekap-porsi access, so no notifications either).
  let urgentNotifications: Pick<Patient, "id" | "patient_name" | "medical_record_number" | "special_request_note">[] =
    [];
  if (canViewMetrics(profile.role)) {
    const supabase = await createClient();
    const { data: settings } = await supabase
      .from("app_settings")
      .select("urgent_notification_hours")
      .eq("id", "default")
      .single();
    const urgentHours = settings?.urgent_notification_hours ?? 12;
    const cutoffIso = new Date(new Date().getTime() - urgentHours * 60 * 60 * 1000).toISOString();

    const { data } = await supabase
      .from("patients")
      .select("id, patient_name, medical_record_number, special_request_note")
      .eq("is_special_request", true)
      .gte("special_request_flagged_at", cutoffIso)
      .order("special_request_flagged_at", { ascending: false });
    urgentNotifications = data ?? [];
  }

  return (
    <AppShell fullName={profile.full_name} role={profile.role} urgentNotifications={urgentNotifications}>
      {children}
    </AppShell>
  );
}
