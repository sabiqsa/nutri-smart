"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { Icon } from "@/components/Icon/Icon";

type PageHeaderProps = {
  title: string;
  /** Small line under the title, e.g. RM number or a short hint. */
  subtitle?: React.ReactNode;
  /** If set, back navigates to this path. Otherwise falls back to browser history, needed because installed PWAs (standalone display mode) have no browser back button. */
  backHref?: string;
  /** Right-aligned actions (links/buttons). */
  actions?: React.ReactNode;
};

const backClass =
  "-ml-2 flex size-10 shrink-0 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface";

export function PageHeader({ title, subtitle, backHref, actions }: PageHeaderProps) {
  const router = useRouter();

  return (
    <div className="border-b border-outline-variant bg-surface-container-lowest">
      <div className="mx-auto flex w-full max-w-4xl flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 md:px-6">
        {backHref ? (
          <Link href={backHref} aria-label="Kembali" className={backClass}>
            <Icon name="arrow_back" />
          </Link>
        ) : (
          <button type="button" onClick={() => router.back()} aria-label="Kembali" className={backClass}>
            <Icon name="arrow_back" />
          </button>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-bold">{title}</h1>
          {subtitle ? <p className="truncate text-sm text-on-surface-variant">{subtitle}</p> : null}
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}
