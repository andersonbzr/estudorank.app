import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

/** Extrai access_token dos cookies do Supabase (sb-<ref>-auth-token) */
function tokenFromSupabaseCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  try {
    // procura por qualquer cookie do tipo sb-*-auth-token
    const parts = cookieHeader.split(/;\s*/);
    const kv = parts.find((p) => /^sb-[^.=]+-auth-token=/.test(p));
    if (!kv) return null;

    const raw = decodeURIComponent(kv.split("=").slice(1).join("="));
    // esse cookie geralmente é um JSON com access_token dentro
    try {
      const j = JSON.parse(raw);
      return (
        j?.access_token ||
        j?.currentSession?.access_token ||
        j?.session?.access_token ||
        null
      );
    } catch {
      // em alguns setups pode vir o próprio JWT
      return raw.includes(".") ? raw : null;
    }
  } catch {
    return null;
  }
}

/** Extrai token do header Authorization: Bearer x */
function tokenFromAuthHeader(req: NextRequest): string | null {
  const h =
    req.headers.get("authorization") || req.headers.get("Authorization");
  if (!h) return null;
  return h.startsWith("Bearer ") ? h.slice(7).trim() : null;
}

export async function POST(req: NextRequest) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !anon || !serviceRole) {
      return NextResponse.json(
        { ok: false, error: "supabase_env_missing" },
        { status: 500 }
      );
    }

    // 1) tenta Authorization
    let token = tokenFromAuthHeader(req);

    // 2) tenta querystring ?token=
    if (!token) token = req.nextUrl.searchParams.get("token");

    // 3) tenta body JSON { access_token }
    if (!token) {
      try {
        const body = await req.json().catch(() => null);
        token = body?.access_token ?? null;
      } catch {
        /* ignore */
      }
    }

    // 4) tenta cookies do Supabase (sb-<ref>-auth-token)
    if (!token) token = tokenFromSupabaseCookie(req.headers.get("cookie"));

    if (!token) {
      return NextResponse.json(
        { ok: false, error: "unauthorized_no_token" },
        { status: 401 }
      );
    }

    // Valida o token com cliente "anon" + Authorization
    const userClient = createClient(url, anon, {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: userData, error: userErr } = await userClient.auth.getUser();
    const uid = userData?.user?.id;
    if (userErr || !uid) {
      return NextResponse.json(
        { ok: false, error: "unauthorized_bad_token" },
        { status: 401 }
      );
    }

    // Admin client (service role) para deletar dados + usuário
    const admin = createClient(url, serviceRole, { auth: { persistSession: false } });

    // (Opcional) limpezas de dados do usuário antes
    // await admin.from("progress").delete().eq("user_id", uid);
    // await admin.from("points").delete().eq("user_id", uid);
    // ...adicione outras tabelas se quiser

    const { error: delErr } = await admin.auth.admin.deleteUser(uid);
    if (delErr) {
      return NextResponse.json(
        { ok: false, error: delErr.message || "delete_failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "server_error" },
      { status: 500 }
    );
  }
}
