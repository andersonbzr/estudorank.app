// app/api/ranking/route.ts
import { NextResponse } from "next/server";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type LeaderboardItem = {
  user_id: string;
  name?: string | null;
  email?: string | null;
  points: number;
  total: number;
};

type ViewRow = {
  user_id: string | null;
  total?: number | null;
  points?: number | null;
  name?: string | null;
  full_name?: string | null;
  email?: string | null;
};

type ProgressRow = { user_id: string | null; points: number | null };
type PointsRow   = { user_id: string | null; value:  number | null };

function parseIntSafe(v: string | null | undefined, def: number) {
  if (!v) return def;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) && n > 0 ? n : def;
}

async function getServerClient(): Promise<{ client: SupabaseClient; isAdmin: boolean }> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url && serviceKey) {
    const client = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    return { client, isAdmin: true };
  }
  const client = await supabaseServer();
  // @ts-expect-error helper retorna SupabaseClient
  return { client, isAdmin: false };
}

function paginate<T>(arr: T[], page: number, pageSize: number) {
  const total = arr.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = (page - 1) * pageSize;
  const to = from + pageSize;
  const slice = arr.slice(from, to);
  return { slice, total, pages };
}

function chooseName(p: any): string | null {
  return (
    (p?.full_name && String(p.full_name).trim()) ||
    (p?.name && String(p.name).trim()) ||
    p?.email ||
    null
  );
}

async function fillNames(
  supabase: SupabaseClient,
  ids: string[],
  opts: { isAdmin: boolean }
): Promise<Map<string, { name: string | null; email: string | null }>> {
  const map = new Map<string, { name: string | null; email: string | null }>();
  if (!ids.length) return map;

  // 1) profiles (somente colunas existentes)
  try {
    const { data: profs } = await supabase
      .from("profiles")
      .select("id,full_name,name,email")
      .in("id", ids);

    if (Array.isArray(profs)) {
      for (const p of profs) {
        if (!p?.id) continue;
        map.set(p.id, { name: chooseName(p), email: p?.email ?? null });
      }
    }
  } catch {
    // RLS pode bloquear; seguimos para fallback se houver service role
  }

  const missing = ids.filter((id) => !map.has(id));
  if (!missing.length) return map;

  // 2) auth.users (somente se houver service role)
  if (opts.isAdmin) {
    try {
      const { data: users } = await supabase
        .schema("auth")
        .from("users")
        .select("id, email, raw_user_meta_data")
        .in("id", missing);

      if (Array.isArray(users)) {
        for (const u of users) {
          const meta = (u as any)?.raw_user_meta_data || {};
          const nm =
            chooseName({ full_name: meta.full_name, name: meta.name, email: u?.email }) ||
            u?.email || null;
          if (u?.id) map.set(u.id, { name: nm, email: u?.email ?? null });
        }
      }
    } catch {
      // ignora
    }
  }

  return map;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const page = Math.max(1, parseIntSafe(url.searchParams.get("page"), 1));
  const pageSize = Math.min(100, Math.max(1, parseIntSafe(url.searchParams.get("pageSize"), 25)));

  try {
    const { client: supabase, isAdmin } = await getServerClient();

    // 1) VIEW
    try {
      const { data, error, count } = await supabase
        .from("user_points_view")
        .select("user_id,total,points,name,full_name,email", { count: "exact" })
        .order("total", { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

      if (!error && Array.isArray(data)) {
        let leaderboard: LeaderboardItem[] = (data as ViewRow[])
          .filter((r) => !!r.user_id)
          .map((r) => {
            const pts =
              (typeof r.total === "number" && Number.isFinite(r.total) ? r.total : null) ??
              (typeof r.points === "number" && Number.isFinite(r.points) ? r.points : 0);
            const display = chooseName(r);

            return {
              user_id: r.user_id!,
              name: display,
              email: r.email ?? null,
              points: pts,
              total: pts,
            };
          });

        // backfill nomes faltantes
        const missingIds = leaderboard.filter((i) => !i.name).map((i) => i.user_id);
        if (missingIds.length) {
          const names = await fillNames(supabase, missingIds, { isAdmin });
          leaderboard = leaderboard.map((row) =>
            row.name
              ? row
              : {
                  ...row,
                  name: names.get(row.user_id)?.name ?? row.name ?? null,
                  email: names.get(row.user_id)?.email ?? row.email ?? null,
                }
          );
        }

        return NextResponse.json(
          {
            ok: true,
            leaderboard,
            page,
            pageSize,
            total: typeof count === "number" ? count : leaderboard.length,
            pages: typeof count === "number" ? Math.max(1, Math.ceil(count / pageSize)) : 1,
            via: "view",
            adminClient: isAdmin,
          },
          { headers: { "Cache-Control": "no-store" } }
        );
      }
    } catch {}

    // 2) Fallback progress
    try {
      const { data, error } = await supabase
        .from("progress")
        .select("user_id,points")
        .returns<ProgressRow[]>();

      if (!error && Array.isArray(data)) {
        const totals = new Map<string, number>();
        for (const r of data) {
          if (!r.user_id) continue;
          totals.set(r.user_id, (totals.get(r.user_id) ?? 0) + (Number(r.points) || 0));
        }

        const rows = [...totals.entries()]
          .map(([user_id, total]) => ({ user_id, total }))
          .sort((a, b) => b.total - a.total);

        const { slice, total, pages } = paginate(rows, page, pageSize);
        const ids = slice.map((r) => r.user_id);
        const names = await fillNames(supabase, ids, { isAdmin });

        const leaderboard: LeaderboardItem[] = slice.map((r) => {
          const p = names.get(r.user_id);
          const val = r.total ?? 0;
          return { user_id: r.user_id, name: p?.name ?? null, email: p?.email ?? null, points: val, total: val };
        });

        return NextResponse.json(
          { ok: true, leaderboard, page, pageSize, total, pages, via: "progress", adminClient: isAdmin },
          { headers: { "Cache-Control": "no-store" } }
        );
      }
    } catch {}

    // 3) Fallback points
    const { data: pointsRows, error: pointsErr } = await supabase
      .from("points")
      .select("user_id,value")
      .returns<PointsRow[]>();
    if (pointsErr) throw pointsErr;

    const totals = new Map<string, number>();
    for (const r of pointsRows ?? []) {
      if (!r.user_id) continue;
      totals.set(r.user_id, (totals.get(r.user_id) ?? 0) + (Number(r.value) || 0));
    }

    const rows = [...totals.entries()]
      .map(([user_id, total]) => ({ user_id, total }))
      .sort((a, b) => b.total - a.total);

    const { slice, total, pages } = paginate(rows, page, pageSize);
    const ids = slice.map((r) => r.user_id);
    const names = await fillNames(supabase, ids, { isAdmin });

    const leaderboard: LeaderboardItem[] = slice.map((r) => {
      const p = names.get(r.user_id);
      const val = r.total ?? 0;
      return { user_id: r.user_id, name: p?.name ?? null, email: p?.email ?? null, points: val, total: val };
    });

    return NextResponse.json(
      { ok: true, leaderboard, page, pageSize, total, pages, via: "points", adminClient: isAdmin },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err: any) {
    console.error("[/api/ranking] error:", err?.message || err);
    return NextResponse.json({ ok: false, error: err?.message ?? "server_error" }, { status: 500 });
  }
}
