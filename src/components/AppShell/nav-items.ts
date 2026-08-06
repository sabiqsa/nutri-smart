import type { UserRole } from "@/types/profile";
import { canViewMetrics } from "@/utils/roles";

const ALL_NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard", metricsGated: true },
  { href: "/patients", label: "Distribution", icon: "qr_code_scanner", metricsGated: false },
  { href: "/analytics", label: "Monitoring", icon: "monitoring", metricsGated: true },
] as const;

/** Dashboard/Monitoring (rekap porsi) are hidden from Perawat per spec. */
export function getNavItems(role: UserRole | null) {
  const canMetrics = canViewMetrics(role);
  return ALL_NAV_ITEMS.filter((item) => !item.metricsGated || canMetrics);
}
