import { AppShell } from "@/components/AppShell/AppShell";
import { createClient } from "@/libs/supabase/server";
import { getCurrentProfile } from "@/libs/supabase/get-profile";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Guest (distribution staff / PPM) — no account needed, read-only access.
    return (
      <AppShell fullName={null} role={null}>
        {children}
      </AppShell>
    );
  }

  const profile = await getCurrentProfile();

  if (!profile?.role) {
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
