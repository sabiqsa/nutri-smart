import { redirect } from "next/navigation";

import { AppShell } from "@/components/AppShell/AppShell";
import { getCurrentProfile } from "@/libs/supabase/get-profile";

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

  return (
    <AppShell fullName={profile.full_name} role={profile.role}>
      {children}
    </AppShell>
  );
}
