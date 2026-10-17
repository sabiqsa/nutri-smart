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

const ADMIN_LINKS = [
  { href: "/admin/users", label: "Kelola User", icon: "group" },
  { href: "/admin/meal-cutoff", label: "Cut-off", icon: "schedule" },
  { href: "/admin/settings", label: "Pengaturan", icon: "settings" },
] as const;

function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function AppShell({ children, fullName, role, urgentNotifications }: AppShellProps) {
  const pathname = usePathname();
  const navItems = getNavItems(role);
  const displayName = fullName ?? ROLE_LABEL[role];

  return (
    <div className="flex flex-1 flex-col md:flex-row">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-outline-variant bg-surface-container-lowest md:sticky md:top-0 md:flex md:h-dvh print:hidden">
        <div className="flex h-16 items-center px-5">
          <BrandMark />
        </div>
        <nav className="flex flex-col gap-1 px-3 pt-2" aria-label="Navigasi utama">
          {navItems.map((item) => (
            <NavLink key={item.href} href={item.href} label={item.label} icon={item.icon} active={pathname.startsWith(item.href)} />
          ))}
        </nav>
        {role === "admin" ? (
          <nav className="mt-6 flex flex-col gap-1 px-3" aria-label="Admin">
            <p className="px-3 pb-1 text-xs font-semibold text-on-surface-variant">Admin</p>
            {ADMIN_LINKS.map((item) => (
              <NavLink key={item.href} {...item} active={pathname.startsWith(item.href)} />
            ))}
          </nav>
        ) : null}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-outline-variant bg-surface/90 px-4 backdrop-blur-md md:px-6 print:hidden">
          <div className="md:hidden">
            <BrandMark />
          </div>
          <div className="hidden md:block" />

          <div className="flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="relative rounded-full text-on-surface-variant hover:text-primary"
                  aria-label="Pemberitahuan Mendesak"
                >
                  <Icon name="notifications" filled={urgentNotifications.length > 0} />
                  {urgentNotifications.length > 0 ? (
                    <span className="absolute top-1 right-1 flex min-w-4 items-center justify-center rounded-full bg-error px-1 text-[10px] leading-4 font-bold text-on-error tabular-nums ring-2 ring-surface">
                      {urgentNotifications.length > 9 ? "9+" : urgentNotifications.length}
                    </span>
                  ) : null}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>Pemberitahuan Mendesak</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {urgentNotifications.length === 0 ? (
                  <p className="px-2 py-3 text-sm text-on-surface-variant">Gak ada pemberitahuan mendesak saat ini.</p>
                ) : (
                  urgentNotifications.map((patient) => (
                    <DropdownMenuItem key={patient.id} asChild className="flex-col items-start gap-0.5 py-2">
                      <Link href={`/patients/${patient.id}`}>
                        <span className="text-sm font-semibold">
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

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-11 gap-2.5 rounded-full pr-2 pl-1.5 md:pr-3"
                  aria-label="Menu akun"
                >
                  <span className="flex size-8 items-center justify-center rounded-full bg-primary-fixed text-xs font-bold text-on-primary-fixed-variant">
                    {initialsOf(displayName) || <Icon name="person" size={18} />}
                  </span>
                  <span className="hidden flex-col items-start leading-tight md:flex">
                    <span className="max-w-40 truncate text-sm font-semibold text-on-surface">{displayName}</span>
                    {fullName ? <span className="text-xs text-on-surface-variant">{ROLE_LABEL[role]}</span> : null}
                  </span>
                  <Icon name="expand_more" size={18} className="hidden text-on-surface-variant md:inline-block" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="flex flex-col">
                  <span className="truncate text-sm font-semibold">{displayName}</span>
                  <span className="text-xs font-normal text-on-surface-variant">{ROLE_LABEL[role]}</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {/* Desktop has these in the sidebar; mobile has no sidebar. */}
                {role === "admin" ? (
                  <>
                    {ADMIN_LINKS.map((item) => (
                      <DropdownMenuItem key={item.href} asChild className="md:hidden">
                        <Link href={item.href}>
                          <Icon name={item.icon} size={18} />
                          {item.label}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator className="md:hidden" />
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

        <main className="flex flex-1 flex-col pb-24 md:pb-0">{children}</main>
      </div>

      <nav
        aria-label="Navigasi utama"
        className="fixed inset-x-0 bottom-0 z-40 flex items-stretch justify-around border-t border-outline-variant bg-surface-container-lowest/95 px-2 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-floating backdrop-blur-md md:hidden print:hidden"
      >
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            active={pathname.startsWith(item.href)}
            compact
          />
        ))}
      </nav>
    </div>
  );
}

function BrandMark() {
  return (
    <span className="flex items-center gap-2.5">
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-on-primary">
        <Icon name="nutrition" filled size={20} />
      </span>
      <span className="text-base font-black tracking-tight text-primary">NutriSmart</span>
    </span>
  );
}

function NavLink({
  href,
  label,
  icon,
  active,
  compact,
}: {
  href: string;
  label: string;
  icon: string;
  active: boolean;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex min-w-18 flex-col items-center gap-0.5 rounded-lg px-3 py-1 text-xs font-medium transition-colors active:scale-95",
          active ? "text-primary" : "text-on-surface-variant",
        )}
      >
        <span
          className={cn(
            "flex h-7 w-12 items-center justify-center rounded-full transition-colors",
            active ? "bg-primary-fixed" : "",
          )}
        >
          <Icon name={icon} filled={active} size={22} />
        </span>
        {label}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-primary-fixed text-on-primary-fixed-variant"
          : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface",
      )}
    >
      <Icon name={icon} filled={active} size={20} />
      {label}
    </Link>
  );
}
