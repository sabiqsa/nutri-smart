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

      <div className="flex flex-col gap-4 p-4">
        <UrgentNotificationForm
          currentHours={settings?.urgent_notification_hours ?? 12}
          action={updateUrgentNotificationHours}
        />
      </div>
    </div>
  );
}
