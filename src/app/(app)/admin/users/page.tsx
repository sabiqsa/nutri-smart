import { redirect } from "next/navigation";

import { PageHeader } from "@/components/PageHeader/PageHeader";
import { UserRoleForm } from "@/components/UserRoleForm/UserRoleForm";
import { getCurrentProfile, isAdmin } from "@/libs/supabase/get-profile";
import { createClient } from "@/libs/supabase/server";
import type { Profile } from "@/types/profile";

import { updateProfileRole } from "./actions";

export default async function AdminUsersPage() {
  const profile = await getCurrentProfile();
  if (!isAdmin(profile)) {
    redirect("/login");
  }

  const supabase = await createClient();
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, created_at")
    .order("created_at")
    .returns<Profile[]>();

  return (
    <div>
      <PageHeader title="Kelola User" backHref="/dashboard" />

      <div className="flex flex-col gap-2 p-4">
        {(profiles ?? []).map((user) => (
          <div
            key={user.id}
            className="rounded-card flex items-center justify-between border border-outline-variant bg-surface-container-lowest p-3"
          >
            <div className="flex flex-col">
              <span className="text-sm font-medium">{user.full_name ?? "(tanpa nama)"}</span>
              <span className="text-xs text-on-surface-variant">{user.email ?? "-"}</span>
            </div>
            <UserRoleForm action={updateProfileRole.bind(null, user.id)} currentRole={user.role} />
          </div>
        ))}
      </div>
    </div>
  );
}
