import { describe, expect, it } from "vitest";

import { getMealPeriodForTimestamp, type MealCutoffTimes } from "./meal-period";

// All timestamps are UTC ISO strings picked so that, converted to
// Asia/Jakarta (UTC+7), the wall-clock time is the one named in the test —
// keeps the test data unambiguous regardless of the machine's local TZ.
const WIB_OFFSET_HOURS = 7;
function wib(dateIso: string, hh: number, mm: number): string {
  const utcHour = hh - WIB_OFFSET_HOURS;
  const d = new Date(`${dateIso}T00:00:00.000Z`);
  d.setUTCHours(utcHour, mm, 0, 0);
  return d.toISOString();
}

const CUTOFFS: MealCutoffTimes = { pagi: "04:00", siang: "10:00", sore: "14:00" };

describe("getMealPeriodForTimestamp", () => {
  it("before the first cutoff of the day -> pagi, same day", () => {
    const result = getMealPeriodForTimestamp(wib("2026-01-15", 0, 0), CUTOFFS);
    expect(result).toEqual({ period: "pagi", rolledToNextDay: false });
  });

  it("exactly at pagi cutoff (04:00) is inclusive -> still pagi", () => {
    const result = getMealPeriodForTimestamp(wib("2026-01-15", 4, 0), CUTOFFS);
    expect(result).toEqual({ period: "pagi", rolledToNextDay: false });
  });

  it("one minute after pagi cutoff -> siang", () => {
    const result = getMealPeriodForTimestamp(wib("2026-01-15", 4, 1), CUTOFFS);
    expect(result).toEqual({ period: "siang", rolledToNextDay: false });
  });

  it("mid-morning before siang cutoff -> siang", () => {
    const result = getMealPeriodForTimestamp(wib("2026-01-15", 8, 30), CUTOFFS);
    expect(result).toEqual({ period: "siang", rolledToNextDay: false });
  });

  it("exactly at siang cutoff (10:00) is inclusive -> still siang", () => {
    const result = getMealPeriodForTimestamp(wib("2026-01-15", 10, 0), CUTOFFS);
    expect(result).toEqual({ period: "siang", rolledToNextDay: false });
  });

  it("one minute after siang cutoff -> sore", () => {
    const result = getMealPeriodForTimestamp(wib("2026-01-15", 10, 1), CUTOFFS);
    expect(result).toEqual({ period: "sore", rolledToNextDay: false });
  });

  it("exactly at sore cutoff (14:00) is inclusive -> still sore", () => {
    const result = getMealPeriodForTimestamp(wib("2026-01-15", 14, 0), CUTOFFS);
    expect(result).toEqual({ period: "sore", rolledToNextDay: false });
  });

  it("one minute after sore cutoff -> rolls to besok pagi", () => {
    const result = getMealPeriodForTimestamp(wib("2026-01-15", 14, 1), CUTOFFS);
    expect(result).toEqual({ period: "pagi", rolledToNextDay: true });
  });

  it("late night (23:59) still rolls to besok pagi", () => {
    const result = getMealPeriodForTimestamp(wib("2026-01-15", 23, 59), CUTOFFS);
    expect(result).toEqual({ period: "pagi", rolledToNextDay: true });
  });

  it("uses the app default config when no cutoffTimes given", () => {
    // Default pagi cutoff is 04:00 too — exercise the parameter default.
    const result = getMealPeriodForTimestamp(wib("2026-01-15", 3, 0));
    expect(result.period).toBe("pagi");
  });

  it("respects a custom cutoff config (admin-edited times)", () => {
    const custom: MealCutoffTimes = { pagi: "05:30", siang: "11:00", sore: "15:00" };
    expect(getMealPeriodForTimestamp(wib("2026-01-15", 5, 0), custom).period).toBe("pagi");
    expect(getMealPeriodForTimestamp(wib("2026-01-15", 5, 30), custom).period).toBe("pagi");
    expect(getMealPeriodForTimestamp(wib("2026-01-15", 5, 31), custom).period).toBe("siang");
  });

  it("accepts a Date object and a numeric epoch, not just ISO strings", () => {
    const iso = wib("2026-01-15", 2, 0);
    expect(getMealPeriodForTimestamp(new Date(iso), CUTOFFS).period).toBe("pagi");
    expect(getMealPeriodForTimestamp(new Date(iso).getTime(), CUTOFFS).period).toBe("pagi");
  });
});
