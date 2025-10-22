// src/app/api/ranking/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

/**
 * Ranking endpoint
 * - Tries to query materialized aggregation view `user_points_view`
 *   (created via supabase/sql/001_user_points_view.sql)
 * - Falls back to in-app aggregation to avoid breaking if view missing
 */
export async function GET() {
  const supabase = await supabaseServer();

  // Try optimized view first
  const fromView = await supabase
    .from("user_points_view")
    .select("*")
    .limit(200);

  if (!fromView.error && fromView.data) {
    const leaderboard = fromView.data.map((r: any) => ({
      user_id: r.user_id,
      name: r.name,
      points: r.total_points,
      weeks: r.weeks_count ?? null,
    }));
    return NextResponse.json({ leaderboard });
  }

  // Fallback: aggregate from progress + profiles in JS
  const { data: progress, error: progressErr } = await supabase
    .from("progress")
    .select("user_id, points");

  const { data: profiles, error: profilesErr } = await supabase
    .from("profiles")
    .select("id, name");

  if (progressErr || profilesErr || !progress || !profiles) {
    return NextResponse.json({ error: "Failed to compute ranking" }, { status: 500 });
  }

  const map = new Map<string, { points: number; name: string }>();
  for (const p of progress as any[]) {
    const id = p.user_id as string;
    const prev = map.get(id) ?? { points: 0, name: "" };
    prev.points += p.points ?? 0;
    map.set(id, prev);
  }
  for (const prof of profiles as any[]) {
    const prev = map.get(prof.id);
    if (prev) prev.name = prof.name ?? "";
  }

  const leaderboard = Array.from(map.entries())
    .map(([user_id, v]) => ({ user_id, name: v.name, points: v.points }))
    .sort((a, b) => b.points - a.points)
    .slice(0, 200);

  return NextResponse.json({ leaderboard });
}
