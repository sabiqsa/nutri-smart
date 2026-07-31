"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Icon } from "@/components/Icon/Icon";
import { cn } from "@/utils/cn";

import styles from "./AppShell.module.css";
import { NAV_ITEMS } from "./nav-items";

type AppShellProps = {
  children: React.ReactNode;
  fullName: string | null;
  role: string | null;
};

export function AppShell({ children, fullName, role }: AppShellProps) {
  const pathname = usePathname();

  return (
    <div className="flex flex-1 flex-col md:flex-row">
      <aside
        className={cn(
          styles.sidebar,
          "hidden w-56 flex-col gap-1 bg-surface-container-lowest p-4 md:flex",
        )}
      >
        <div className="mb-4 flex items-center gap-2 px-2">
          <span className="flex size-8 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
            <Icon name="account_circle" size={20} />
          </span>
          <span className="font-bold text-primary">NutriSmart</span>
        </div>
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.href} item={item} active={pathname.startsWith(item.href)} />
        ))}
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-outline-variant bg-surface px-4">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container md:hidden">
              <Icon name="account_circle" size={22} />
            </span>
            <div className="flex flex-col">
              <span className="font-bold text-primary">NutriSmart</span>
              <span className="text-xs text-on-surface-variant">{fullName ?? "Guest"}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="flex size-10 items-center justify-center rounded-full text-primary transition-colors hover:bg-surface-container"
            >
              <Icon name="notifications" />
            </button>
            {role ? (
              <div className="flex items-center gap-3 text-sm">
                {role === "admin" ? (
                  <Link href="/admin/users" className="font-medium text-on-surface-variant hover:text-on-surface">
                    Kelola User
                  </Link>
                ) : null}
                <form action="/auth/logout" method="post">
                  <button type="submit" className="font-medium text-on-surface-variant hover:text-on-surface">
                    Logout
                  </button>
                </form>
              </div>
            ) : (
              <Link href="/login" className="text-sm font-medium text-primary">
                Login
              </Link>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto pb-24 md:pb-0">{children}</main>
      </div>

      <nav
        className={cn(
          styles.bottomNav,
          "fixed inset-x-0 bottom-0 z-50 flex items-center justify-around rounded-t-xl border-t border-outline-variant bg-surface px-2 py-2 shadow-lg md:hidden",
        )}
      >
        {NAV_ITEMS.map((item) => (
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
  item: (typeof NAV_ITEMS)[number];
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
