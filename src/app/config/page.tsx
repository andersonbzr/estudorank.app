// src/app/config/page.tsx
"use client";

import AuthGuard from "@/components/AuthGuard";
import AppShell from "@/components/shell/AppShell";
import MotionButton from "@/components/ui/MotionButton";
import Spinner from "@/components/ui/Spinner";
import { useToast } from "@/components/Toast";
import { supabaseBrowser } from "@/lib/supabase/client";
import { applyTheme, ThemeMode } from "@/lib/theme";
import { useEffect, useMemo, useState } from "react";
import { User, SlidersHorizontal, Check, Loader2, ShieldAlert, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

/** Apenas o que editamos aqui: nome + tema */
type Profile = {
  full_name: string | null;
  theme: ThemeMode | null;
};

const THEMES = [
  { value: "system", label: "Sistema" },
  { value: "light", label: "Claro" },
  { value: "dark", label: "Escuro" },
] as const;

export default function ConfigPage() {
  return (
    <AuthGuard>
      <AppShell>
        <Content />
      </AppShell>
    </AuthGuard>
  );
}

function Content() {
  const supabase = useMemo(() => supabaseBrowser(), []);
  const toast = useToast();
  const router = useRouter();

  const [email, setEmail] = useState<string>("");
  const [profile, setProfile] = useState<Profile>({
    full_name: "",
    theme: "system",
  });

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  // estados visuais de salvar
  const [saveState, setSaveState] = useState<"idle" | "saving" | "success" | "error">("idle");

  // Danger Zone
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setMsg(null);

      const { data: udata } = await supabase.auth.getUser();
      const user = udata.user;
      if (!user) {
        setLoading(false);
        return;
      }
      setEmail(user.email ?? "");

      const { data: p } = await supabase
        .from("profiles")
        .select("full_name, theme")
        .eq("id", user.id)
        .single();

      const next: Profile = {
        full_name: p?.full_name ?? "",
        theme: (p?.theme as ThemeMode) ?? "system",
      };

      setProfile(next);
      applyTheme(next.theme || "system");
      setLoading(false);
    })();
  }, [supabase]);

  function handleThemeChange(newTheme: ThemeMode) {
    setProfile((p) => ({ ...p, theme: newTheme }));
    applyTheme(newTheme);
    try {
      localStorage.setItem("theme", String(newTheme));
      window.dispatchEvent(new Event("theme-change"));
    } catch {}
  }

  async function save() {
    setBusy("save");
    setSaveState("saving");
    setMsg(null);

    try {
      const { data: udata } = await supabase.auth.getUser();
      const uid = udata.user?.id;
      if (!uid) throw new Error("Sessão inválida.");

      const payload = {
        full_name: (profile.full_name ?? "").trim() || null,
        theme: profile.theme ?? "system",
      };

      const { error } = await supabase.from("profiles").update(payload).eq("id", uid);
      if (error) throw error;

      applyTheme(payload.theme as ThemeMode);
      localStorage.setItem("theme", String(payload.theme));
      window.dispatchEvent(new Event("theme-change"));

      setSaveState("success");
      toast.push("Configurações salvas.");
      setTimeout(() => setSaveState("idle"), 1400);
    } catch (e: any) {
      setMsg(e.message ?? "Não foi possível salvar.");
      toast.push("Erro ao salvar");
      setSaveState("error");
    } finally {
      setBusy(null);
    }
  }

  // Badge “Ativo”
  const themeBadge =
    (profile.theme ?? "system") !== "system" ? (
      <span className="ml-2 inline-flex items-center rounded-full border border-white/10 bg-[var(--accent)]/15 px-2 py-0.5 text-xs text-[var(--accent)]">
        Ativo
      </span>
    ) : null;

  async function deleteAccount() {
    if (confirmText !== "DELETAR") return;
    setDeleting(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("Sessão inválida.");

      const res = await fetch("/api/delete-account", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || `HTTP ${res.status}`);
      }

      toast.push("Conta excluída.");
      // encerra a sessão local e redireciona
      await supabase.auth.signOut();
      router.replace("/login");
    } catch (e: any) {
      toast.push(e.message ?? "Falha ao excluir conta.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 lg:py-8">
      {/* Título com accent gradient */}
      <h1 className="text-2xl font-semibold bg-gradient-to-r from-lime-400 to-indigo-500 bg-clip-text text-transparent">
        Configurações
      </h1>
      <p className="mt-2 text-sm opacity-80">Personalize seu perfil e preferências.</p>

      {msg && (
        <div className="mt-4 p-3 rounded-xl border border-white/10 bg-white/10 text-sm">
          {msg}
        </div>
      )}

      {/* Perfil */}
      <section className="mt-6 rounded-2xl border border-white/10 bg-[var(--surface)]/70 p-4 transition-all duration-200 ease-out relative">
        <div className="absolute left-0 right-0 top-0 h-[2px] bg-[var(--accent)]/60 rounded-t-2xl" />
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <User size={16} className="opacity-80" />
          Perfil
        </h2>

        {loading ? (
          <div className="mt-3">
            <Spinner label="Carregando..." />
          </div>
        ) : (
          <div className="mt-3 grid gap-4">
            <div>
              <label className="block text-sm mb-1">E-mail</label>
              <input value={email} disabled className="w-full field opacity-70 transition-all duration-200 ease-out" />
            </div>

            <div>
              <label className="block text-sm mb-1">Nome de exibição</label>
              <input
                value={profile.full_name ?? ""}
                onChange={(e) => setProfile((p) => ({ ...p, full_name: e.target.value }))}
                placeholder="Como você quer aparecer"
                className="w-full field transition-all duration-200 ease-out"
              />
            </div>
          </div>
        )}
      </section>

      {/* Preferências */}
      <section className="mt-6 rounded-2xl border border-white/10 bg-[var(--surface)]/70 p-4 transition-all duration-200 ease-out relative">
        <div className="absolute left-0 right-0 top-0 h-[2px] bg-[var(--accent)]/60 rounded-t-2xl" />
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <SlidersHorizontal size={16} className="opacity-80" />
          Preferências
        </h2>

        {loading ? (
          <div className="mt-3">
            <Spinner label="Carregando..." />
          </div>
        ) : (
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm mb-1">
                Tema {themeBadge}
              </label>
              <select
                value={profile.theme ?? "system"}
                onChange={(e) => handleThemeChange(e.target.value as ThemeMode)}
                className="w-full field transition-all duration-200 ease-out"
              >
                {THEMES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs opacity-70">“Sistema” segue o tema do seu dispositivo.</p>
            </div>
            <div className="hidden sm:block" />
          </div>
        )}
      </section>

      {/* Ações */}
      <div className="mt-6 flex items-center justify-end gap-3">
        <MotionButton
          onClick={save}
          disabled={busy === "save" || loading || saveState === "success"}
          aria-busy={busy === "save"}
          className="btn px-4 py-2 transition-all duration-200 ease-out"
        >
          {saveState === "saving" ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 size={16} className="animate-spin" />
              Salvando…
            </span>
          ) : saveState === "success" ? (
            <span className="inline-flex items-center gap-2 animate-[fadeout_1.2s_ease-in_forwards]">
              <Check size={16} />
              Salvo com sucesso!
            </span>
          ) : (
            "Salvar alterações"
          )}
        </MotionButton>
      </div>

      {/* ZONA DE PERIGO */}
      <section className="mt-10 rounded-2xl border border-red-500/30 bg-red-500/[0.06] p-4 relative">
        <div className="absolute left-0 right-0 top-0 h-[2px] bg-red-500/70 rounded-t-2xl" />
        <h3 className="text-base font-semibold flex items-center gap-2 text-red-300">
          <ShieldAlert size={16} />
          Zona de perigo
        </h3>
        <p className="mt-1 text-sm opacity-80">
          Excluir sua conta é <span className="font-semibold">irreversível</span>. Todos os seus dados
          pessoais poderão ser removidos.
        </p>

        <div className="mt-3 grid sm:grid-cols-[1fr_auto] gap-3 items-center">
          <input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder='Digite "DELETAR" para confirmar'
            className="field w-full"
          />
          <button
            onClick={deleteAccount}
            disabled={confirmText !== "DELETAR" || deleting}
            className="btn-danger px-4 py-2 inline-flex items-center gap-2"
            title="Excluir definitivamente sua conta"
          >
            {deleting ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Excluindo…
              </>
            ) : (
              <>
                <Trash2 size={16} /> Excluir conta
              </>
            )}
          </button>
        </div>
      </section>

      {/* keyframes p/ fade-out do texto de sucesso */}
      <style jsx>{`
        @keyframes fadeout {
          0% { opacity: 1; transform: translateY(0); }
          60% { opacity: 1; }
          100% { opacity: 0; transform: translateY(-4px); }
        }
      `}</style>
    </div>
  );
}
