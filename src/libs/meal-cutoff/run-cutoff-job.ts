import { APP_TIMEZONE, CUTOFF_GRACE_MINUTES, MEAL_PERIOD_ORDER } from "@/config/meal-cutoff";
import { createAdminClient } from "@/libs/supabase/admin";
import type { MealCutoffRow, MealPeriod } from "@/types/meal-cutoff";

type CutoffAction = { period: MealPeriod; action: "locked" | "snapshot" };

/**
 * Runs on a schedule tighter than the actual cutoffs (see vercel.json) and,
 * for each meal period, idempotently:
 *  1. Locks today's kebutuhan-makan rekap once its data_cutoff_time has
 *     passed (a row in meal_period_locks = locked; nothing deletes/edits
 *     patient data, only future edits stop counting toward this period).
 *  2. Generates today's distribution snapshot once its
 *     evaluation_cutoff_time has passed (a frozen count in
 *     distribution_snapshots, computed from live meal_deliveries status).
 *
 * Safe to call more than once for the same moment — every write is
 * guarded by a "does today's row already exist" check first, so a cron
 * that fires more often than the cutoffs themselves (intentional, for
 * resilience against a missed run) doesn't double-lock or double-snapshot.
 */
export async function runMealCutoffJob(now: Date = new Date()): Promise<CutoffAction[]> {
  const supabase = createAdminClient();
  const actions: CutoffAction[] = [];

  const { data: cutoffs, error: cutoffsError } = await supabase
    .from("meal_cutoffs")
    .select("*")
    .returns<MealCutoffRow[]>();
  if (cutoffsError || !cutoffs) {
    throw new Error(`Gagal baca meal_cutoffs: ${cutoffsError?.message ?? "no data"}`);
  }

  const today = formatDateInTz(now, APP_TIMEZONE);
  const nowMinutes = getMinuteOfDay(now, APP_TIMEZONE);

  for (const period of MEAL_PERIOD_ORDER) {
    const row = cutoffs.find((c) => c.period === period);
    if (!row) continue;

    if (isPastCutoff(nowMinutes, row.data_cutoff_time)) {
      const locked = await lockPeriodIfNeeded(supabase, today, period);
      if (locked) actions.push({ period, action: "locked" });
    }

    if (isPastCutoff(nowMinutes, row.evaluation_cutoff_time)) {
      const snapshotted = await snapshotPeriodIfNeeded(supabase, today, period);
      if (snapshotted) actions.push({ period, action: "snapshot" });
    }
  }

  return actions;
}

function isPastCutoff(nowMinutes: number, cutoffTime: string): boolean {
  const cutoffMinutes = toMinutes(cutoffTime);
  // Grace window bounds it on both sides — only fire for a cutoff that just
  // passed, not every period whose cutoff was hours ago (those already got
  // handled by an earlier run).
  return nowMinutes >= cutoffMinutes && nowMinutes <= cutoffMinutes + CUTOFF_GRACE_MINUTES;
}

async function lockPeriodIfNeeded(
  supabase: ReturnType<typeof createAdminClient>,
  date: string,
  period: MealPeriod,
): Promise<boolean> {
  const { data: existing } = await supabase
    .from("meal_period_locks")
    .select("id")
    .eq("lock_date", date)
    .eq("period", period)
    .maybeSingle();
  if (existing) return false;

  const { error } = await supabase.from("meal_period_locks").insert({ lock_date: date, period });
  if (error) throw new Error(`Gagal lock rekap ${period}: ${error.message}`);
  return true;
}

async function snapshotPeriodIfNeeded(
  supabase: ReturnType<typeof createAdminClient>,
  date: string,
  period: MealPeriod,
): Promise<boolean> {
  const { data: existing } = await supabase
    .from("distribution_snapshots")
    .select("id")
    .eq("snapshot_date", date)
    .eq("period", period)
    .maybeSingle();
  if (existing) return false;

  // Simplification, flagged deliberately: meal_deliveries is one row per
  // patient (current status), not per (patient, period) — see 0004's note
  // that multi-session/day tracking was deferred. A snapshot is a freeze of
  // whatever the live counts are at this period's evaluation cut-off, not
  // a period-scoped recompute. Revisit alongside that table if per-period
  // delivery rows get built later.
  const { data: deliveries, error } = await supabase.from("meal_deliveries").select("status");
  if (error) throw new Error(`Gagal baca meal_deliveries: ${error.message}`);

  const rows = deliveries ?? [];
  const berhasil = rows.filter((r) => r.status === "delivered").length;
  const tidakDibagikan = rows.filter((r) => r.status === "not_distributed").length;
  const pending = rows.length - berhasil - tidakDibagikan;

  const { error: insertError } = await supabase.from("distribution_snapshots").insert({
    snapshot_date: date,
    period,
    berhasil_count: berhasil,
    pending_count: pending,
    tidak_dibagikan_count: tidakDibagikan,
    total_count: rows.length,
  });
  if (insertError) throw new Error(`Gagal simpan snapshot ${period}: ${insertError.message}`);
  return true;
}

function toMinutes(hhmmss: string): number {
  const [h, m] = hhmmss.split(":").map((n) => Number(n));
  return h * 60 + (m || 0);
}

function getMinuteOfDay(date: Date, timeZone: string): number {
  const { hour, minute } = getDateParts(date, timeZone);
  return hour * 60 + minute;
}

function formatDateInTz(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;
  return `${year}-${month}-${day}`;
}

function getDateParts(date: Date, timeZone: string): { hour: number; minute: number } {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  return {
    hour: Number(parts.find((p) => p.type === "hour")?.value ?? "0"),
    minute: Number(parts.find((p) => p.type === "minute")?.value ?? "0"),
  };
}
