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
  const users = profiles ?? [];

  return (
    <div>
      <PageHeader title="Kelola User" backHref="/dashboard" />

      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-6 md:px-6">
        <CreateUserForm action={createUser} />

        <section className="rounded-xl border border-outline-variant bg-surface-container-lowest">
          <h2 className="px-5 pt-4 pb-3 text-base font-semibold">
            Daftar User <span className="text-on-surface-variant tabular-nums">({users.length})</span>
          </h2>
          {users.length === 0 ? (
            <p className="border-t border-outline-variant px-5 py-6 text-sm text-on-surface-variant">Belum ada user.</p>
          ) : (
            <ul className="divide-y divide-outline-variant border-t border-outline-variant">
              {users.map((user) => (
                <li key={user.id} className="flex flex-col gap-3 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-sm font-semibold">{user.full_name ?? "(tanpa nama)"}</span>
                    <span className="truncate text-xs text-on-surface-variant">{user.email ?? "-"}</span>
                  </div>
                  <UserRoleForm action={updateProfileRole.bind(null, user.id)} currentRole={user.role} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
