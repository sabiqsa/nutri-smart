"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { Icon } from "@/components/Icon/Icon";

type PageHeaderProps = {
  title: string;
  /** If set, back navigates to this path. Otherwise falls back to browser history — needed because installed PWAs (standalone display mode) have no browser back button. */
  backHref?: string;
};

export function PageHeader({ title, backHref }: PageHeaderProps) {
  const router = useRouter();

  return (
    <header className="flex items-center gap-3 border-b border-outline-variant bg-surface px-4 py-3">
      {backHref ? (
        <Link href={backHref} aria-label="Kembali" className="text-on-surface-variant hover:text-on-surface">
          <Icon name="arrow_back" />
        </Link>
      ) : (
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Kembali"
          className="text-on-surface-variant hover:text-on-surface"
        >
          <Icon name="arrow_back" />
        </button>
      )}
      <h1 className="text-base font-semibold">{title}</h1>
    </header>
  );
}
