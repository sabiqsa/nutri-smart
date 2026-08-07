"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { DIET_KHUSUS_OPTIONS, DIET_UTAMA_OPTIONS, ROOM_OPTIONS } from "@/constants/patient-options";

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "ready", label: "Ready" },
  { value: "delivered", label: "Delivered" },
  { value: "not_distributed", label: "Tidak Dibagikan" },
] as const;

export function DashboardFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(searchParams.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.push(`${pathname}?${next.toString()}`);
  }

  const hasFilters = ["room", "diet_type", "special_diet", "status"].some((k) => searchParams.get(k));

  return (
    <div className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-1">
      <FilterSelect
        label="Ruangan"
        value={searchParams.get("room") ?? ""}
        options={ROOM_OPTIONS}
        onChange={(v) => setParam("room", v)}
      />
      <FilterSelect
        label="Diet Utama"
        value={searchParams.get("diet_type") ?? ""}
        options={DIET_UTAMA_OPTIONS}
        onChange={(v) => setParam("diet_type", v)}
      />
      <FilterSelect
        label="Diet Khusus"
        value={searchParams.get("special_diet") ?? ""}
        options={DIET_KHUSUS_OPTIONS}
        onChange={(v) => setParam("special_diet", v)}
      />
      <select
        value={searchParams.get("status") ?? ""}
        onChange={(e) => setParam("status", e.target.value)}
        className="shrink-0 rounded-full border border-outline-variant bg-surface-container-lowest px-3 py-1.5 text-xs"
      >
        <option value="">Status: Semua</option>
        {STATUS_OPTIONS.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
      {hasFilters ? (
        <button
          type="button"
          onClick={() => router.push(pathname)}
          className="shrink-0 rounded-full bg-surface-container-high px-3 py-1.5 text-xs text-on-surface-variant"
        >
          Reset
        </button>
      ) : null}
    </div>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="shrink-0 rounded-full border border-outline-variant bg-surface-container-lowest px-3 py-1.5 text-xs"
    >
      <option value="">{label}: Semua</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}
