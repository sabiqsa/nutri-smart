"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Icon } from "@/components/Icon/Icon";
import { LogoutButton } from "@/components/LogoutButton/LogoutButton";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Patient } from "@/types/patient";
import type { UserRole } from "@/types/profile";
import { cn } from "@/lib/utils";

import styles from "./AppShell.module.css";
import { getNavItems } from "./nav-items";

type UrgentNotification = Pick<Patient, "id" | "patient_name" | "medical_record_number" | "special_request_note">;

type AppShellProps = {
  children: React.ReactNode;
  fullName: string | null;
  role: UserRole;
  urgentNotifications: UrgentNotification[];
};

const ROLE_LABEL: Record<UserRole, string> = {
  perawat: "Perawat",
  ahli_gizi: "Ahli Gizi",
  produksi: "Bagian Produksi",
  distribusi: "Bagian Distribusi",
  admin: "Admin",
};

export function AppShell({ children, fullName, role, urgentNotifications }: AppShellProps) {
  const pathname = usePathname();
  const navItems = getNavItems(role);

  return (
    <div className="flex flex-1 flex-col md:flex-row">
      <aside
        className={cn(
          styles.sidebar,
          "hidden w-56 flex-col gap-1 bg-surface-container-lowest p-4 md:flex print:hidden",
        )}
      >
        <div className="mb-4 flex items-center gap-2 px-2">
          <span className="flex size-8 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
            <Icon name="account_circle" size={20} />
          </span>
          <span className="font-bold text-primary">NutriSmart</span>
        </div>
        {navItems.map((item) => (
          <NavLink key={item.href} item={item} active={pathname.startsWith(item.href)} />
        ))}
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-outline-variant bg-surface px-4 print:hidden">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container md:hidden">
              <Icon name="account_circle" size={22} />
            </span>
            <div className="flex flex-col">
              <span className="font-bold text-primary">NutriSmart</span>
              {/* Only show the separate role badge when there's a name to
                  pair it with — otherwise this repeated ROLE_LABEL[role]
                  as both the fallback name and the badge ("Admin ADMIN"). */}
              <span className="text-xs text-on-surface-variant">
                {fullName ? (
                  <>
                    {fullName}
                    <span className="ml-2 text-[10px] text-on-surface-variant uppercase">{ROLE_LABEL[role]}</span>
                  </>
                ) : (
                  ROLE_LABEL[role]
                )}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="relative rounded-full text-primary"
                  aria-label="Pemberitahuan Mendesak"
                >
                  <Icon name="notifications" />
                  {urgentNotifications.length > 0 ? (
                    <span className="absolute top-1.5 right-1.5 flex size-4 items-center justify-center rounded-full bg-error text-[10px] font-bold text-on-error">
                      {urgentNotifications.length > 9 ? "9+" : urgentNotifications.length}
                    </span>
                  ) : null}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72">
                <DropdownMenuLabel>Pemberitahuan Mendesak</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {urgentNotifications.length === 0 ? (
                  <p className="px-1.5 py-2 text-sm text-on-surface-variant">
                    Gak ada pemberitahuan mendesak saat ini.
                  </p>
                ) : (
                  urgentNotifications.map((patient) => (
                    <DropdownMenuItem key={patient.id} asChild className="flex-col items-start gap-0.5">
                      <Link href={`/patients/${patient.id}`}>
                        <span className="text-sm font-medium">
                          {patient.patient_name ?? patient.medical_record_number}
                        </span>
                        <span className="line-clamp-2 text-xs text-on-surface-variant">
                          {patient.special_request_note}
                        </span>
                      </Link>
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Desktop: plain links. Mobile: collapsed into the hamburger
                below — this row was overflowing/cramped next to the bell
                on narrow screens. */}
            <div className="hidden items-center gap-3 md:flex">
              {role === "admin" ? (
                <>
                  <Link
                    href="/admin/users"
                    className="text-sm font-medium text-on-surface-variant hover:text-on-surface"
                  >
                    Kelola User
                  </Link>
                  <Link
                    href="/admin/meal-cutoff"
                    className="text-sm font-medium text-on-surface-variant hover:text-on-surface"
                  >
                    Cut-off
                  </Link>
                  <Link
                    href="/admin/settings"
                    className="text-sm font-medium text-on-surface-variant hover:text-on-surface"
                  >
                    Pengaturan
                  </Link>
                </>
              ) : null}
              <form action="/auth/logout" method="post">
                <LogoutButton className="text-sm font-medium text-on-surface-variant hover:text-on-surface" />
              </form>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="rounded-full text-primary md:hidden"
                  aria-label="Menu"
                >
                  <Icon name="menu" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {role === "admin" ? (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/admin/users">Kelola User</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/admin/meal-cutoff">Cut-off</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/admin/settings">Pengaturan</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                ) : null}
                <form action="/auth/logout" method="post">
                  <DropdownMenuItem asChild variant="destructive">
                    <LogoutButton className="w-full text-left" />
                  </DropdownMenuItem>
                </form>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto pb-24 md:pb-0">{children}</main>
      </div>

      <nav
        className={cn(
          styles.bottomNav,
          "fixed inset-x-0 bottom-0 z-50 flex items-center justify-around rounded-t-xl border-t border-outline-variant bg-surface px-2 py-2 shadow-lg md:hidden print:hidden",
        )}
      >
        {navItems.map((item) => (
          <NavLink key={item.href} item={item} active={pathname.startsWith(item.href)} compact />
        ))}
      </nav>
    </div>
  );
}

function NavLink({
  item,
  active,
  compact,
}: {
  item: ReturnType<typeof getNavItems>[number];
  active: boolean;
  compact?: boolean;
}) {
  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-2 rounded-xl px-4 py-1.5 text-sm transition-all active:scale-95",
        active
          ? "bg-secondary-container text-on-secondary-container"
          : "text-on-surface-variant hover:bg-surface-container-high",
        compact ? "flex-col gap-0.5 px-3 py-1 text-xs" : "",
      )}
    >
      <Icon name={item.icon} filled={active} size={compact ? 22 : 20} />
      {item.label}
    </Link>
  );
}
