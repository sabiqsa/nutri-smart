// Pure role-check helpers — no Supabase/server imports, safe to use from
// both server components and client components (e.g. AppShell's nav).
import type { UserRole } from "@/types/profile";

// Perawat inputs initial/advice diet data, Ahli Gizi finalizes it — both
// write to the same patient record (see diet_history for who-changed-what).
export function canEditPatients(role: UserRole | null): boolean {
  return hasRole(role, ["perawat", "ahli_gizi", "admin"]);
}

export function canDeletePatients(role: UserRole | null): boolean {
  return hasRole(role, ["admin"]);
}

// Dashboard/Monitoring (rekap porsi metrics) — explicitly denied to Perawat
// in the spec.
export function canViewMetrics(role: UserRole | null): boolean {
  return hasRole(role, ["ahli_gizi", "produksi", "distribusi", "admin"]);
}

// QR scan + confirm delivery — Bagian Distribusi only.
export function canScanDistribution(role: UserRole | null): boolean {
  return hasRole(role, ["distribusi", "admin"]);
}

// Print label & barcode — Bagian Produksi only.
export function canPrintLabel(role: UserRole | null): boolean {
  return hasRole(role, ["produksi", "admin"]);
}

export function canViewDietHistory(role: UserRole | null): boolean {
  return hasRole(role, ["perawat", "ahli_gizi", "admin"]);
}

export function isAdmin(role: UserRole | null): boolean {
  return hasRole(role, ["admin"]);
}

/** Where to send someone right after login / when hitting "/". */
export function defaultRouteFor(role: UserRole | null): string {
  if (role === "perawat") return "/patients";
  return "/dashboard";
}

function hasRole(role: UserRole | null, allowed: UserRole[]): boolean {
  return !!role && allowed.includes(role);
}
