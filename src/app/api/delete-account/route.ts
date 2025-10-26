// app/api/account/delete/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    // quem está logado?
    const sb = await supabaseServer();
    const { data } = await sb.auth.getUser();
    const uid = data.user?.id;
    if (!uid) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      return NextResponse.json(
        { ok: false, error: "Service role indisponível no servidor." },
        { status: 500 }
      );
    }

    const admin = createClient(url, key, { auth: { persistSession: false } });

    // remove dados auxiliares que você julgar necessários (ex.: progress, messages etc.)
    // Exemplo: await admin.from("progress").delete().eq("user_id", uid);

    // excluir o próprio usuário
    const { error } = await admin.auth.admin.deleteUser(uid);
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "server_error" }, { status: 500 });
  }
}
