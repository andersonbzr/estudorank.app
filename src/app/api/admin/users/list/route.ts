import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function requireAdminSecret() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Service Role não configurado.");
  return { url, key };
}

/**
 * GET /api/admin/users/list?q=&page=1&perPage=20
 * Usa auth.admin.listUsers para obter email + id.
 * Também tenta enriquecer com "profiles" (name/full_name).
 */
export async function GET(req: Request) {
  try {
    const { url, key } = requireAdminSecret();
    const admin = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const u = new URL(req.url);
    const q = (u.searchParams.get("q") || "").toLowerCase().trim();
    const page = Math.max(1, parseInt(u.searchParams.get("page") || "1", 10));
    const perPage = Math.min(50, Math.max(1, parseInt(u.searchParams.get("perPage") || "20", 10)));

    // Lista usuários (pagina no Auth)
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage,
    });
    if (error) throw error;

    const all = (data?.users || []).map(u => ({
      id: u.id,
      email: u.email ?? null,
      created_at: u.created_at ?? null,
    }));

    // filtro rápido por q (email/id)
    const filtered = q
      ? all.filter(it =>
          (it.email || "").toLowerCase().includes(q) || it.id.toLowerCase().includes(q)
        )
      : all;

    // Enriquecer com profiles (name/full_name)
    let enriched = filtered;
    if (filtered.length) {
      const ids = filtered.map(f => f.id);
      const { data: profs } = await admin
        .from("profiles")
        .select("id,name,full_name")
        .in("id", ids);
      const map = new Map<string, { name?: string | null; full_name?: string | null }>();
      (profs || []).forEach((p: any) => map.set(p.id, { name: p.name, full_name: p.full_name }));

      enriched = filtered.map(it => {
        const p = map.get(it.id);
        const display =
          (p?.name && String(p.name).trim()) ||
          (p?.full_name && String(p.full_name).trim()) ||
          it.email ||
          null;
        return { ...it, display_name: display };
      });
    }

    return NextResponse.json({
      ok: true,
      users: enriched,
      page,
      perPage,
      count: enriched.length,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message ?? "server_error" }, { status: 500 });
  }
}
