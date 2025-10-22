"use client";

import { useState, useMemo } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import clsx from "clsx";

type Props = { className?: string };

function scorePassword(pwd: string) {
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[a-z]/.test(pwd)) score++;
  if (/\d/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  return Math.min(score, 5);
}

export default function ChangePasswordForm({ className }: Props) {
  const [oldPwd, setOldPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error" | null; text: string }>({ type: null, text: "" });

  const strength = useMemo(() => scorePassword(newPwd), [newPwd]);
  const strengthLabel = ["Muito fraca", "Fraca", "Ok", "Forte", "Muito forte"][Math.max(0, strength - 1)] ?? "Muito fraca";

  const disabled =
    loading ||
    !oldPwd ||
    !newPwd ||
    !confirm ||
    newPwd !== confirm ||
    newPwd.length < 8;

  async function handleChange() {
    setMsg({ type: null, text: "" });

    if (newPwd !== confirm) {
      setMsg({ type: "error", text: "As senhas não coincidem." });
      return;
    }
    if (newPwd.length < 8) {
      setMsg({ type: "error", text: "A nova senha deve ter pelo menos 8 caracteres." });
      return;
    }

    setLoading(true);
    try {
      const supabase = supabaseBrowser();

      const { data: userData, error: getUserErr } = await supabase.auth.getUser();
      if (getUserErr || !userData?.user?.email) {
        setMsg({ type: "error", text: "Sessão inválida. Faça login novamente." });
        return;
      }

      // Reautentica com a senha atual
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: userData.user.email,
        password: oldPwd,
      });
      if (signInErr) {
        setMsg({ type: "error", text: "Senha atual incorreta." });
        return;
      }

      // Atualiza a senha
      const { error } = await supabase.auth.updateUser({ password: newPwd });
      if (error) {
        setMsg({ type: "error", text: "Erro ao atualizar senha: " + error.message });
        return;
      }

      setMsg({ type: "success", text: "Senha alterada com sucesso!" });
      setOldPwd(""); setNewPwd(""); setConfirm("");
    } catch (e: any) {
      setMsg({ type: "error", text: "Erro inesperado. Tente novamente." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={clsx("w-full max-w-md space-y-4 p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800", className)}>
      <h2 className="text-lg font-semibold">Alterar senha</h2>

      {/* Senha atual */}
      <div className="space-y-1">
        <label className="text-sm opacity-80">Senha atual</label>
        <div className="flex items-center gap-2">
          <input
            className="flex-1 rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-2 outline-none focus:border-zinc-600"
            type={showOld ? "text" : "password"}
            placeholder="Sua senha atual"
            value={oldPwd}
            onChange={(e) => setOldPwd(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowOld((s) => !s)}
            className="text-sm px-2 py-2 rounded-lg border border-zinc-800 hover:bg-zinc-800/50"
          >
            {showOld ? "Ocultar" : "Mostrar"}
          </button>
        </div>
      </div>

      {/* Nova senha */}
      <div className="space-y-1">
        <label className="text-sm opacity-80">Nova senha</label>
        <div className="flex items-center gap-2">
          <input
            className="flex-1 rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-2 outline-none focus:border-zinc-600"
            type={showNew ? "text" : "password"}
            placeholder="Nova senha"
            value={newPwd}
            onChange={(e) => setNewPwd(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowNew((s) => !s)}
            className="text-sm px-2 py-2 rounded-lg border border-zinc-800 hover:bg-zinc-800/50"
          >
            {showNew ? "Ocultar" : "Mostrar"}
          </button>
        </div>

        {/* Medidor de força */}
        <div className="mt-2">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <div
                key={n}
                className={clsx("h-1 flex-1 rounded", n <= strength ? "bg-emerald-500" : "bg-zinc-800")}
              />
            ))}
          </div>
          <p className="text-xs mt-1 opacity-70">Força: {strengthLabel}</p>
          <p className="text-xs opacity-60">Use 8+ caracteres, misture letras, números e símbolos.</p>
        </div>
      </div>

      {/* Confirmar nova senha */}
      <div className="space-y-1">
        <label className="text-sm opacity-80">Confirmar nova senha</label>
        <div className="flex items-center gap-2">
          <input
            className="flex-1 rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-2 outline-none focus:border-zinc-600"
            type={showConfirm ? "text" : "password"}
            placeholder="Repita a nova senha"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowConfirm((s) => !s)}
            className="text-sm px-2 py-2 rounded-lg border border-zinc-800 hover:bg-zinc-800/50"
          >
            {showConfirm ? "Ocultar" : "Mostrar"}
          </button>
        </div>
      </div>

      {/* Mensagens */}
      {msg.type && (
        <div
          className={clsx(
            "text-sm rounded-xl px-3 py-2 border",
            msg.type === "success"
              ? "bg-emerald-500/10 border-emerald-600 text-emerald-300"
              : "bg-rose-500/10 border-rose-600 text-rose-300"
          )}
          role="status"
          aria-live="polite"
        >
          {msg.text}
        </div>
      )}

      {/* Ações */}
      <button
        type="button"
        onClick={handleChange}
        disabled={disabled}
        className={clsx(
          "w-full h-11 rounded-xl font-medium transition",
          disabled
            ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
            : "bg-gradient-to-r from-emerald-500 to-indigo-500 text-white hover:opacity-90"
        )}
      >
        {loading ? "Salvando..." : "Salvar nova senha"}
      </button>

      <p className="text-xs opacity-60 text-center">
        Por segurança, podemos pedir sua senha atual para confirmar a alteração.
      </p>
    </div>
  );
}
