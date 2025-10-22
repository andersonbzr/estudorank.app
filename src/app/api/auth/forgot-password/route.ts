import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

/**
 * POST /api/auth/forgot-password
 * Body: { email: string }
 * Envia o e-mail de recuperação com redirect para /reset-password
 * Responde de forma NEUTRA (não revela se o email existe).
 */
export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    const isValid = typeof email === "string" && /^\S+@\S+\.\S+$/.test(email);
    if (!isValid) return NextResponse.json({ error: "invalid_email" }, { status: 400 });

    const supabase = await supabaseServer();
    const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`;

    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) {
      console.error("resetPasswordForEmail:", error); // log apenas
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: true }); // resposta neutra mesmo em erro
  }
}
