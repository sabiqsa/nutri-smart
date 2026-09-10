import { redirect } from "next/navigation";

import { CreateUserForm } from "@/components/CreateUserForm/CreateUserForm";
import { PageHeader } from "@/components/PageHeader/PageHeader";
import { UserRoleForm } from "@/components/UserRoleForm/UserRoleForm";
import { getCurrentProfile, isAdmin } from "@/libs/supabase/get-profile";
import { createClient } from "@/libs/supabase/server";
import type { Profile } from "@/types/profile";

import { createUser, updateProfileRole } from "./actions";

export default async function AdminUsersPage() {
  const profile = await getCurrentProfile();
  if (!isAdmin(profile?.role ?? null)) {
    redirect("/login");
  }

  const supabase = await createClient();
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, created_at")
    // Admin is a single bootstrapped superuser account, not a role assigned
    // through this screen — don't list it here so it can't get reassigned.
    // (.neq alone would also drop unassigned/null-role rows — SQL NULL
    // fails "!= 'admin'" too — so explicitly keep those.)
    .or("role.neq.admin,role.is.null")
    .order("created_at")
    .returns<Profile[]>();

  return (
    <div>
      <PageHeader title="Kelola User" backHref="/dashboard" />

      <div className="flex flex-col gap-2 p-4">
        <CreateUserForm action={createUser} />

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
