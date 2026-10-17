import { redirect } from "next/navigation";

import { PageHeader } from "@/components/PageHeader/PageHeader";
import { UrgentNotificationForm } from "@/components/UrgentNotificationForm/UrgentNotificationForm";
import { getCurrentProfile, isAdmin } from "@/libs/supabase/get-profile";
import { createClient } from "@/libs/supabase/server";

import { updateUrgentNotificationHours } from "./actions";

export default async function AdminSettingsPage() {
  const profile = await getCurrentProfile();
  if (!isAdmin(profile?.role ?? null)) {
    redirect("/login");
  }

  const supabase = await createClient();
  const { data: settings } = await supabase
    .from("app_settings")
    .select("urgent_notification_hours")
    .eq("id", "default")
    .single();

  return (
    <div>
      <PageHeader title="Pengaturan" backHref="/dashboard" />

      <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-4 py-6 md:px-6">
        <UrgentNotificationForm
          currentHours={settings?.urgent_notification_hours ?? 12}
          action={updateUrgentNotificationHours}
        />
      </div>
    </div>
  );
}
