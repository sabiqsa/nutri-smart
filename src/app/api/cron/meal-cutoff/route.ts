import { NextResponse, type NextRequest } from "next/server";

import { runMealCutoffJob } from "@/libs/meal-cutoff/run-cutoff-job";

// Hit by Vercel Cron (see vercel.json) — Vercel signs these requests with
// `Authorization: Bearer $CRON_SECRET` automatically when CRON_SECRET is
// set as an env var, so this doubles as auth. If CRON_SECRET isn't set
// (e.g. local dev), the check is skipped — don't leave it unset in prod.
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  try {
    const actions = await runMealCutoffJob();
    return NextResponse.json({ ok: true, actions });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
