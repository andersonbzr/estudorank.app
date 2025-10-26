import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function requireAdminSecret() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Service Role não configurado (SUPABASE_SERVICE_ROLE_KEY).");
  }
  return { url, key };
}

/**
 * POST /api/admin/chat/clear
 * body: { channel?: string, all?: boolean }
 * - channel: nome do canal do chat (ex.: "ranking-global")
 * - all: se true, apaga todas as mensagens (cautela!)
 */
export async function POST(req: Request) {
  try {
    const { url, key } = requireAdminSecret();
    const admin = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const body = await req.json().catch(() => ({}));
    const channel = typeof body?.channel === "string" ? body.channel.trim() : "";
    const all = !!body?.all;

    if (!all && !channel) {
      return NextResponse.json(
        { ok: false, error: "Envie 'channel' ou use 'all: true'." },
        { status: 400 }
      );
    }

    if (all) {
      const { error } = await admin.from("messages").delete().neq("id", "");
      if (error) throw error;
      return NextResponse.json({ ok: true, cleared: "all" });
    }

    const { error } = await admin.from("messages").delete().eq("channel", channel);
    if (error) throw error;
    return NextResponse.json({ ok: true, cleared: channel });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message ?? "server_error" },
      { status: 500 }
    );
  }
}
