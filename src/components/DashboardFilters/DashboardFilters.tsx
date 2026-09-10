"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DIET_KHUSUS_OPTIONS, DIET_UTAMA_OPTIONS, ROOM_OPTIONS } from "@/constants/patient-options";

// Radix Select items can't have an empty-string value — stands in for
// "Semua" (no filter) and gets translated back to "" before touching the
// URL search params.
const ALL = "__all__";

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
      <Select
        value={searchParams.get("status") || ALL}
        onValueChange={(v) => setParam("status", v === ALL ? "" : v)}
      >
        <SelectTrigger size="sm" className="shrink-0 rounded-full">
          <SelectValue placeholder="Status: Semua" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Status: Semua</SelectItem>
          {STATUS_OPTIONS.map((s) => (
            <SelectItem key={s.value} value={s.value}>
              {s.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {hasFilters ? (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="shrink-0 rounded-full"
          onClick={() => router.push(pathname)}
        >
          Reset
        </Button>
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
    <Select value={value || ALL} onValueChange={(v) => onChange(v === ALL ? "" : v)}>
      <SelectTrigger size="sm" className="shrink-0 rounded-full">
        <SelectValue placeholder={`${label}: Semua`} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>{label}: Semua</SelectItem>
        {options.map((o) => (
          <SelectItem key={o} value={o}>
            {o}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
