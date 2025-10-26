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
 * POST /api/admin/users/delete
 * body: { user_id: string, hard?: boolean }
 *
 * - hard: se true, além de auth, também apaga dados auxiliares (profiles/messages/points/progress).
 *   ⚠️ Tenha certeza de ter FKs com ON DELETE CASCADE ou faça deletes aqui.
 */
export async function POST(req: Request) {
  try {
    const { url, key } = requireAdminSecret();
    const admin = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const body = await req.json();
    const user_id = String(body?.user_id || "").trim();
    const hard = !!body?.hard;

    if (!user_id) {
      return NextResponse.json({ ok: false, error: "user_id é obrigatório" }, { status: 400 });
    }

    // opcional: limpeza de dados relacionados (se não houver CASCADE)
    if (hard) {
      // apaga dados “do usuário” nas tabelas do seu app
      await admin.from("progress").delete().eq("user_id", user_id);
      await admin.from("points").delete().eq("user_id", user_id);
      await admin.from("messages").delete().eq("user_id", user_id);
      await admin.from("profiles").delete().eq("id", user_id);
    }

    // Apaga no Auth
    const { error } = await admin.auth.admin.deleteUser(user_id);
    if (error) throw error;

    return NextResponse.json({ ok: true, user_id, hard });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message ?? "server_error" }, { status: 500 });
  }
}
