// src/app/settings/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import AuthGuard from "@/components/AuthGuard";
import AppShell from "@/components/shell/AppShell";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useToast } from "@/components/Toast";
import {
  ShieldAlert,
  Trash2,
  Eye,
  EyeOff,
  LockKeyhole,
} from "lucide-react";

/* ---------- helpers ---------- */
function scorePassword(pw: string) {
  // medidor simples: tamanho + variedade
  let score = 0;
  if (!pw) return 0;
  const letters: Record<string, number> = {};
  for (let i = 0; i < pw.length; i++) {
    letters[pw[i]] = (letters[pw[i]] || 0) + 1;
    score += 5.0 / letters[pw[i]];
  }
  const variations = {
    digits: /\d/.test(pw),
    lower: /[a-z]/.test(pw),
    upper: /[A-Z]/.test(pw),
    nonWords: /[^a-zA-Z0-9]/.test(pw),
  };
  const variationCount = Object.values(variations).filter(Boolean).length;
  score += (variationCount - 1) * 10;
  score = Math.min(100, Math.round(score));
  return score;
}
function strengthLabel(score: number) {
  if (score >= 80) return "forte";
  if (score >= 60) return "boa";
  if (score >= 40) return "média";
  if (score > 0) return "fraca";
  return "—";
}

type Profile = { id: string; name?: string | null; full_name?: string | null; email?: string | null };

export default function SettingsPage() {
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

  // perfil
  const [me, setMe] = useState<{ id: string; email: string | null } | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedTick, setSavedTick] = useState(0);

  // segurança (troca de senha)
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showCur, setShowCur] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConf, setShowConf] = useState(false);
  const [changing, setChanging] = useState(false);

  // danger zone
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  /* load */
  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoading(true);
      const { data: u } = await supabase.auth.getUser();
      const uid = u.user?.id ?? null;
      const mail = u.user?.email ?? null;
      if (!uid) { setLoading(false); return; }
      if (!cancel) setMe({ id: uid, email: mail });

      const { data: p } = await supabase
        .from("profiles")
        .select("id,name,full_name,email")
        .eq("id", uid)
        .single();

      const name =
        (p?.name && String(p.name)) ||
        (p?.full_name && String(p.full_name)) ||
        "";

      if (!cancel) {
        setDisplayName(name);
        setEmail(mail ?? p?.email ?? "");
        setLoading(false);
      }
    })();
    return () => { cancel = true; };
  }, [supabase]);

  /* salvar perfil (nome) */
  async function onSave() {
    if (!me?.id) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("profiles").update({ name: displayName || null }).eq("id", me.id);
      if (error) throw error;
      toast.push("Alterações salvas.");
      setSavedTick((t) => t + 1);
    } catch (e: any) {
      toast.push(e?.message ?? "Falha ao salvar alterações.");
    } finally {
      setSaving(false);
    }
  }

  /* trocar senha */
  async function changePassword() {
    if (!me?.email) {
      toast.push("Sessão inválida. Faça login novamente.");
      return;
    }
    if (!currentPw) { toast.push("Informe sua senha atual."); return; }
    if (newPw.length < 8) { toast.push("A nova senha deve ter pelo menos 8 caracteres."); return; }
    if (newPw !== confirmPw) { toast.push("A confirmação não confere."); return; }
    const score = scorePassword(newPw);
    if (score < 40) { toast.push("A nova senha está muito fraca."); return; }

    setChanging(true);
    try {
      // valida a senha atual tentando autenticar
      const { error: signErr } = await supabase.auth.signInWithPassword({
        email: me.email,
        password: currentPw,
      });
      if (signErr) {
        toast.push("Senha atual incorreta.");
        setChanging(false);
        return;
      }

      // troca
      const { error: updErr } = await supabase.auth.updateUser({ password: newPw });
      if (updErr) throw updErr;

      toast.push("Senha alterada com sucesso.");
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
    } catch (e: any) {
      toast.push(e?.message ?? "Falha ao alterar senha.");
    } finally {
      setChanging(false);
    }
  }

  /* excluir conta */
  async function onDelete() {
    if (confirmText !== "DELETAR") {
      toast.push('Digite "DELETAR" para confirmar.');
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch("/api/account/delete", { method: "POST" });
      const json = await res.json();
      if (!json?.ok) throw new Error(json?.error || "Erro ao excluir conta.");
      toast.push("Conta excluída.");
      await supabase.auth.signOut();
      window.location.href = "/login";
    } catch (e: any) {
      toast.push(e?.message ?? "Falha ao excluir conta.");
    } finally {
      setDeleting(false);
    }
  }

  const newScore = scorePassword(newPw);
  const strength = strengthLabel(newScore);

  return (
    <motion.main
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="px-5 md:px-8 py-8 text-white"
    >
      <div className="max-w-3xl mx-auto">
        <div
          className="
            relative overflow-hidden rounded-3xl p-6 md:p-8
            bg-gradient-to-b from-neutral-900/95 to-black/90
            backdrop-blur-md
            shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]
            border border-white/10
          "
        >
          {/* aurora */}
          <motion.div
            className="pointer-events-none absolute -top-28 left-1/2 -translate-x-1/2 h-72 w-72 rounded-full blur-3xl"
            style={{ background: "radial-gradient(circle, rgba(163,230,53,0.22), transparent)" }}
            initial={{ opacity: 0.25 }}
            animate={{ opacity: [0.25, 0.4, 0.25], scale: [0.95, 1.05, 0.95] }}
            transition={{ duration: 6, repeat: Infinity }}
          />

          {/* header */}
          <div className="relative z-10">
            <h1 className="text-2xl font-semibold tracking-tight text-lime-300 drop-shadow-[0_0_10px_rgba(163,230,53,0.25)]">
              Configurações
            </h1>
            <p className="mt-1 text-sm text-white/70">Perfil, segurança e preferências.</p>
          </div>

          {/* Perfil */}
          <div className="relative z-10 border-t border-white/5 mt-6 pt-6">
            <h2 className="text-lime-300/90 font-semibold text-base mb-4">Perfil</h2>
            <div className="grid gap-4">
              <div>
                <label htmlFor="email" className="block text-sm opacity-70 mb-1">E-mail</label>
                <input
                  id="email"
                  value={email}
                  readOnly
                  className="w-full h-11 text-[14px] rounded-xl bg-white/5 border border-white/10 px-3
                             opacity-70 cursor-not-allowed"
                />
              </div>

              <div>
                <label htmlFor="displayName" className="block text-sm opacity-70 mb-1">Nome de exibição</label>
                <div className="relative">
                  <input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Como você quer aparecer"
                    className="w-full h-11 text-[14px] rounded-xl bg-white/5 border border-white/10 outline-none
                               focus:border-lime-400 focus:ring-2 focus:ring-lime-400/25 px-3 transition"
                  />
                </div>
              </div>
            </div>

            {/* ações à direita */}
            <div className="mt-5 flex items-center justify-end">
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={onSave}
                disabled={saving}
                className={`inline-flex items-center justify-center h-10 px-4 rounded-xl text-sm
                  ${saving
                    ? "bg-white/5 text-white/50"
                    : "bg-lime-400/10 text-lime-300 hover:bg-lime-400/20 hover:shadow-[0_0_10px_rgba(163,230,53,0.25)] hover:scale-[1.02] transition"
                  }`}
              >
                {saving ? "Salvando..." : savedTick > 0 ? "Salvo ✓" : "Salvar alterações"}
              </motion.button>
            </div>
          </div>

          {/* Segurança */}
          <div className="relative z-10 border-t border-white/5 mt-6 pt-6">
            <h2 className="text-lime-300/90 font-semibold text-base mb-4 flex items-center gap-2">
              <LockKeyhole size={18} className="text-lime-300" />
              Segurança
            </h2>

            <div className="grid gap-4">
              {/* senha atual */}
              <div>
                <label htmlFor="curPass" className="block text-sm opacity-70 mb-1">Senha atual</label>
                <div className="relative">
                  <input
                    id="curPass"
                    type={showCur ? "text" : "password"}
                    value={currentPw}
                    onChange={(e) => setCurrentPw(e.target.value)}
                    className="w-full h-11 text-[14px] rounded-xl bg-white/5 border border-white/10 outline-none
                               focus:border-lime-400 focus:ring-2 focus:ring-lime-400/25 px-3 pr-11 transition"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCur((s) => !s)}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 p-2 rounded-md text-white/70 hover:text-white
                               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                    aria-label={showCur ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showCur ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* nova senha */}
              <div>
                <label htmlFor="newPass" className="block text-sm opacity-70 mb-1">Nova senha</label>
                <div className="relative">
                  <input
                    id="newPass"
                    type={showNew ? "text" : "password"}
                    value={newPw}
                    onChange={(e) => setNewPw(e.target.value)}
                    className="w-full h-11 text-[14px] rounded-xl bg-white/5 border border-white/10 outline-none
                               focus:border-lime-400 focus:ring-2 focus:ring-lime-400/25 px-3 pr-11 transition"
                    autoComplete="new-password"
                    placeholder="Mínimo de 8 caracteres"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew((s) => !s)}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 p-2 rounded-md text-white/70 hover:text-white
                               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                    aria-label={showNew ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {/* medidor de força – pílulas */}
                <div className="mt-2">
                  <div className="flex gap-1.5">
                    {Array.from({ length: 4 }).map((_, i) => {
                      const on = newScore >= (i + 1) * 25;
                      const cls = on
                        ? newScore >= 75
                          ? "bg-lime-400"
                          : newScore >= 50
                          ? "bg-yellow-300"
                          : "bg-orange-300"
                        : "bg-white/12";
                      return <div key={i} className={`h-2.5 w-12 rounded-full transition-colors ${cls}`} />;
                    })}
                  </div>
                  <div className="text-xs opacity-70 mt-1">
                    Força: <span className="capitalize">{strength}</span>
                  </div>
                </div>
              </div>

              {/* confirmar senha */}
              <div>
                <label htmlFor="confPass" className="block text-sm opacity-70 mb-1">Confirmar nova senha</label>
                <div className="relative">
                  <input
                    id="confPass"
                    type={showConf ? "text" : "password"}
                    value={confirmPw}
                    onChange={(e) => setConfirmPw(e.target.value)}
                    className="w-full h-11 text-[14px] rounded-xl bg-white/5 border border-white/10 outline-none
                               focus:border-lime-400 focus:ring-2 focus:ring-lime-400/25 px-3 pr-11 transition"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConf((s) => !s)}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 p-2 rounded-md text-white/70 hover:text-white
                               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                    aria-label={showConf ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showConf ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {confirmPw && confirmPw !== newPw && (
                  <div className="text-xs text-red-400 mt-1">As senhas não conferem.</div>
                )}
              </div>
            </div>

            {/* ações à direita */}
            <div className="mt-5 flex items-center justify-end">
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={changePassword}
                disabled={changing}
                className={`inline-flex items-center justify-center h-10 px-4 rounded-xl text-sm
                  ${changing
                    ? "bg-white/5 text-white/50"
                    : "bg-lime-400/10 text-lime-300 hover:bg-lime-400/20 hover:shadow-[0_0_10px_rgba(163,230,53,0.25)] hover:scale-[1.02] transition"
                  }`}
              >
                {changing ? "Alterando..." : "Alterar senha"}
              </motion.button>
            </div>
          </div>

          {/* Danger zone */}
          <div className="relative z-10 border-t border-white/5 mt-6 pt-6">
            <h2 className="text-lime-300/90 font-semibold text-base mb-3">Zona de perigo</h2>
            <div className="rounded-2xl bg-red-950/35 border border-red-900/25 p-4 shadow-inner">
              <div className="flex items-start gap-3">
                <ShieldAlert className="text-red-400 mt-0.5" size={18} />
                <div className="flex-1">
                  <p className="text-sm text-red-200/90">
                    Excluir sua conta é <span className="font-semibold">irreversível</span>. Todos os seus dados pessoais poderão ser removidos.
                  </p>
                  <div className="mt-3 flex flex-col sm:flex-row gap-2">
                    <input
                      value={confirmText}
                      onChange={(e) => setConfirmText(e.target.value)}
                      placeholder='Digite "DELETAR" para confirmar'
                      className="flex-1 h-10 rounded-xl bg-white/5 border border-white/10 px-3 text-sm outline-none focus:ring-2 focus:ring-red-500/30"
                    />
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={onDelete}
                      disabled={deleting || confirmText !== "DELETAR"}
                      className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-red-600/85 hover:bg-red-500 text-white text-sm transition disabled:opacity-60"
                    >
                      <Trash2 size={16} />
                      {deleting ? "Excluindo..." : "Excluir conta"}
                    </motion.button>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </motion.main>
  );
}
