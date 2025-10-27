"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

type Props = {
  confirmLabel: string;      // texto que o usuário precisa digitar (ex.: DELETAR)
  endpoint: string;          // /api/account/delete
  redirectTo?: string;       // /login
};

// Tenta extrair access_token de um valor bruto guardado no localStorage
function extractTokenFromRaw(raw: string | null): string | null {
  if (!raw) return null;

  // 1) tentar JSON
  try {
    const parsed = JSON.parse(raw);
    const t =
      parsed?.access_token ||
      parsed?.currentSession?.access_token ||
      parsed?.session?.access_token ||
      null;
    if (t) return t;
  } catch {
    // 2) se não for JSON, pode ser o próprio JWT
    if (raw.includes(".")) return raw;
  }
  return null;
}

// Procura a chave do supabase no localStorage (sb-<ref>-auth-token)
function findSupabaseTokenInLocalStorage(): string | null {
  try {
    const keys = Object.keys(localStorage);
    const key = keys.find((k) => /sb-.*-auth-token$/.test(k));
    if (!key) return null;
    const raw = localStorage.getItem(key);
    return extractTokenFromRaw(raw);
  } catch {
    return null;
  }
}

export default function DangerZone({ confirmLabel, endpoint, redirectTo = "/login" }: Props) {
  const router = useRouter();
  const [confirmText, setConfirmText] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function handleDelete() {
    setMsg(null);
    if (confirmText.trim().toLowerCase() !== (confirmLabel ?? "").trim().toLowerCase()) {
      setMsg("Digite corretamente para confirmar.");
      return;
    }

    try {
      setBusy(true);
      const sb = supabaseBrowser();

      // 1) tenta getSession normalmente
      let { data: s1 } = await sb.auth.getSession();

      // 2) se não houver sessão (muito comum quando o supabase guarda em localStorage),
      // tenta extrair direto do localStorage
      let token = s1.session?.access_token ?? null;
      if (!token) {
        token = findSupabaseTokenInLocalStorage();
      }

      // 3) último recurso: tenta refresh
      if (!token) {
        const { data: s2, error: refreshErr } = await sb.auth.refreshSession();
        if (!refreshErr) token = s2.session?.access_token ?? null;
      }

      if (!token) {
        throw new Error("Não foi possível obter o token da sessão. Faça login novamente.");
      }

      // Envia por 3 vias: querystring + header + body
      const url = `${endpoint}?token=${encodeURIComponent(token)}`;
      const res = await fetch(url, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ access_token: token }),
      });

      const isJson = res.headers.get("content-type")?.includes("application/json");
      const json = isJson ? await res.json() : null;

      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || `Falha ${res.status}`);
      }

      await sb.auth.signOut();
      router.replace(redirectTo);
    } catch (e: any) {
      setMsg(e?.message ?? "Erro ao excluir conta.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-red-500/30 bg-red-500/[0.07] p-5">
      <h2 className="text-red-300 font-semibold text-lg">Zona de perigo</h2>
      <p className="text-sm text-red-200/80 mt-1">
        Excluir sua conta é permanente e não pode ser desfeito.
      </p>

      <div className="mt-4 grid gap-3">
        <label className="text-sm">
          Para confirmar, digite: <span className="font-semibold">{confirmLabel}</span>
        </label>
        <input
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder={confirmLabel}
          className="h-10 rounded-lg bg-white/5 border border-white/10 px-3 outline-none focus:ring-2 focus:ring-red-400/30"
        />

        {msg && <div className="text-sm text-red-200/90 whitespace-pre-wrap">{msg}</div>}

        <button
          onClick={handleDelete}
          disabled={busy}
          className="h-10 px-3 rounded-lg bg-red-500/15 border border-red-400/40 text-red-300 hover:bg-red-500/25 disabled:opacity-50"
        >
          {busy ? "Excluindo…" : "Excluir conta permanentemente"}
        </button>
      </div>
    </section>
  );
}
