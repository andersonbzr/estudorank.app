// app/api/ranking/route.ts
import { NextResponse } from "next/server";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/** ======= Tipos ======= */
type LeaderboardItem = {
  user_id: string;
  name?: string | null;
  email?: string | null;
  points: number;
  total: number; // alias de points para compat
};

type ViewRow = {
  user_id: string | null;
  total?: number | null;
  points?: number | null;
  name?: string | null;
  display_name?: string | null;
  username?: string | null;
  email?: string | null;
};

type ProgressRow = { user_id: string | null; points: number | null };
type PointsRow = { user_id: string | null; value: number | null };

function parseIntSafe(v: string | null | undefined, def: number): number {
  if (!v) return def;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) && n > 0 ? n : def;
}

/** Preferimos um client admin (service role) para evitar RLS na listagem global. */
async function getServerClient(): Promise<{ client: SupabaseClient; isAdmin: boolean }> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (url && serviceKey) {
    const client = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    return { client, isAdmin: true };
  }

  // fallback: cookie-based (pode sofrer com RLS dependendo das policies)
  const client = await supabaseServer();
  // @ts-expect-error: nosso helper retorna SupabaseClient
  return { client, isAdmin: false };
}

/** Utilitário para ordenar/recortar página em memória. */
function paginate<T>(arr: T[], page: number, pageSize: number) {
  const total = arr.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = (page - 1) * pageSize;
  const to = from + pageSize;
  const slice = arr.slice(from, to);
  return { slice, total, pages };
}

/** ======= Handlers ======= */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const page = Math.max(1, parseIntSafe(url.searchParams.get("page"), 1));
  const pageSize = Math.min(100, Math.max(1, parseIntSafe(url.searchParams.get("pageSize"), 25)));

  try {
    const { client: supabase, isAdmin } = await getServerClient();

    /** ---------- 1) Tenta pela VIEW 'user_points_view' ---------- */
    try {
      const { data, error, count } = await supabase
        .from("user_points_view")
        .select("user_id,total,points,name,display_name,username,email", { count: "exact" })
        .order("total", { ascending: false })
        .range((page - 1) * pageSize, (page * pageSize) - 1);

      if (!error && Array.isArray(data)) {
        const leaderboard: LeaderboardItem[] = (data as ViewRow[])
          .filter((r) => !!r.user_id)
          .map((r) => {
            const val =
              (typeof r.total === "number" && Number.isFinite(r.total)) ? r.total! :
              (typeof r.points === "number" && Number.isFinite(r.points)) ? r.points! : 0;
            const display =
              r.display_name || r.username || r.name || r.email || null;

            return {
              user_id: r.user_id!,
              name: display,
              email: r.email ?? null,
              points: val,
              total: val,
            };
          });

        return NextResponse.json({
          ok: true,
          leaderboard,
          page,
          pageSize,
          total: typeof count === "number" ? count : leaderboard.length,
          pages: typeof count === "number" ? Math.max(1, Math.ceil(count / pageSize)) : 1,
          via: "view",
          adminClient: isAdmin,
        }, { headers: { "Cache-Control": "no-store" } });
      }
      // cai para fallback
    } catch {
      // segue para fallback
    }

    /** ---------- 2) Fallback: agrega a partir de 'progress' ---------- */
    try {
      const { data, error } = await supabase
        .from("progress")
        .select("user_id,points")
        .returns<ProgressRow[]>();

      if (!error && Array.isArray(data)) {
        const totals = new Map<string, number>();
        for (const r of data) {
          if (!r.user_id) continue;
          const add = Number.isFinite(r.points as number) ? (r.points as number) : 0;
          totals.set(r.user_id, (totals.get(r.user_id) ?? 0) + add);
        }

        // Ordena por pontos desc
        const rows = [...totals.entries()]
          .map(([user_id, total]) => ({ user_id, total }))
          .sort((a, b) => b.total - a.total);

        // Pagina em memória
        const { slice, total, pages } = paginate(rows, page, pageSize);

        // Busca perfis só dos usuários da página
        const ids = slice.map((r) => r.user_id);
        let profiles = new Map<string, { name?: string | null; email?: string | null }>();
        if (ids.length) {
          const { data: profs } = await supabase
            .from("profiles")
            .select("id,display_name,username,name,email")
            .in("id", ids);

          if (Array.isArray(profs)) {
            profiles = new Map(
              profs.map((p: any) => [
                p.id,
                {
                  name: p.display_name || p.username || p.name || p.email || null,
                  email: p.email ?? null,
                },
              ]),
            );
          }
        }

        const leaderboard: LeaderboardItem[] = slice.map((r) => {
          const p = profiles.get(r.user_id);
          const val = r.total ?? 0;
          return {
            user_id: r.user_id,
            name: p?.name ?? null,
            email: p?.email ?? null,
            points: val,
            total: val,
          };
        });

        return NextResponse.json({
          ok: true,
          leaderboard,
          page,
          pageSize,
          total,
          pages,
          via: "progress",
          adminClient: isAdmin,
        }, { headers: { "Cache-Control": "no-store" } });
      }
      // cai para 3º fallback
    } catch {
      // segue
    }

    /** ---------- 3) Último fallback: agrega a partir de 'points' ---------- */
    const { data: pointsRows, error: pointsErr } = await supabase
      .from("points")
      .select("user_id,value")
      .returns<PointsRow[]>();

    if (pointsErr) throw pointsErr;

    const totals = new Map<string, number>();
    for (const r of pointsRows ?? []) {
      if (!r.user_id) continue;
      const add = Number.isFinite(r.value as number) ? (r.value as number) : 0;
      totals.set(r.user_id, (totals.get(r.user_id) ?? 0) + add);
    }

    const rows = [...totals.entries()]
      .map(([user_id, total]) => ({ user_id, total }))
      .sort((a, b) => b.total - a.total);

    const { slice, total, pages } = paginate(rows, page, pageSize);

    const ids = slice.map((r) => r.user_id);
    let profiles = new Map<string, { name?: string | null; email?: string | null }>();
    if (ids.length) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id,display_name,username,name,email")
        .in("id", ids);

      if (Array.isArray(profs)) {
        profiles = new Map(
          profs.map((p: any) => [
            p.id,
            {
              name: p.display_name || p.username || p.name || p.email || null,
              email: p.email ?? null,
            },
          ]),
        );
      }
    }

    const leaderboard: LeaderboardItem[] = slice.map((r) => {
      const p = profiles.get(r.user_id);
      const val = r.total ?? 0;
      return {
        user_id: r.user_id,
        name: p?.name ?? null,
        email: p?.email ?? null,
        points: val,
        total: val,
      };
    });

    return NextResponse.json({
      ok: true,
      leaderboard,
      page,
      pageSize,
      total,
      pages,
      via: "points",
      adminClient: isAdmin,
    }, { headers: { "Cache-Control": "no-store" } });

  } catch (err: any) {
    console.error("[/api/ranking] error:", err?.message || err);
    return NextResponse.json(
      { ok: false, error: err?.message ?? "server_error" },
      { status: 500 },
    );
  }
}
