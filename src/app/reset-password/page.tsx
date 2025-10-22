"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

/**
 * /reset-password
 * - Troca o code/token do link por sessão
 * - Exibe formulário para definir a nova senha
 * - Redireciona para /me no sucesso
 */
export default function ResetPasswordPage() {
  const [stage, setStage] = useState<"checking" | "ready" | "error">("checking");
  const [err, setErr] = useState<string | null>(null);
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const router = useRouter();
  const search = useSearchParams();

  useEffect(() => {
    (async () => {
      try {
        const supabase = supabaseBrowser();

        // 1) Novo formato (GoTrue v2): ?code=...
        const code = search.get("code");
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (!error) { setStage("ready"); return; }
        }

        // 2) Antigo: ?token_hash=...&type=recovery
        const token_hash = search.get("token_hash");
        const type = search.get("type");
        if (token_hash && type === "recovery") {
          const { error } = await supabase.auth.verifyOtp({ token_hash, type: "recovery" });
          if (!error) { setStage("ready"); return; }
        }

        // 3) Fallback: já logou automaticamente?
        const { data } = await supabase.auth.getSession();
        if (data.session) { setStage("ready"); return; }

        setErr("Link inválido ou expirado. Solicite um novo.");
        setStage("error");
      } catch (e) {
        setErr("Falha ao validar o link. Tente novamente.");
        setStage("error");
      }
    })();
  }, [search]);

  async function submitNewPassword() {
    if (!pwd || pwd.length < 8 || pwd !== pwd2) return;
    const supabase = supabaseBrowser();
    const { error } = await supabase.auth.updateUser({ password: pwd });
    if (error) { setErr(error.message); return; }
    router.replace("/me");
  }

  if (stage === "checking") {
    return <div className="min-h-[50vh] flex items-center justify-center">Validando link...</div>;
  }

  if (stage === "error") {
    return (
      <div className="max-w-md mx-auto p-6">
        <h1 className="text-xl font-semibold mb-2">Redefinir senha</h1>
        <p className="text-sm text-rose-300 mb-4">{err}</p>
        <p className="text-sm opacity-70">Volte ao login e use “Esqueci minha senha” para gerar um novo link.</p>
      </div>
    );
  }

  // stage === "ready"
  return (
    <div className="max-w-md mx-auto p-6 space-y-4">
      <h1 className="text-xl font-semibold">Definir nova senha</h1>

      <input
        type="password"
        placeholder="Nova senha"
        className="input w-full rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-2 outline-none focus:border-zinc-600"
        value={pwd}
        onChange={(e) => setPwd(e.target.value)}
      />
      <input
        type="password"
        placeholder="Confirmar senha"
        className="input w-full rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-2 outline-none focus:border-zinc-600"
        value={pwd2}
        onChange={(e) => setPwd2(e.target.value)}
      />

      <button
        className="btn w-full h-11 rounded-xl font-medium bg-gradient-to-r from-emerald-500 to-indigo-500 text-white hover:opacity-90 disabled:bg-zinc-800 disabled:text-zinc-500"
        onClick={submitNewPassword}
        disabled={!pwd || pwd.length < 8 || pwd !== pwd2}
      >
        Salvar nova senha
      </button>

      <p className="text-xs opacity-60">Use 8+ caracteres, misture letras, números e símbolos.</p>
    </div>
  );
}
