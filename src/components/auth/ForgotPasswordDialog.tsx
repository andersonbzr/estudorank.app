"use client";

import { useState } from "react";

type Props = { onClose?: () => void };

export default function ForgotPasswordDialog({ onClose }: Props) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [loading, setLoading] = useState(false);

  async function submit() {
    const isValid = /^\S+@\S+\.\S+$/.test(email);
    if (!isValid) return;

    setLoading(true);
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setSent(true);
      // cooldown 45s
      setCooldown(45);
      const id = setInterval(() => setCooldown((c) => {
        if (c <= 1) { clearInterval(id); return 0; }
        return c - 1;
      }), 1000);
    } finally {
      setLoading(false);
    }
  }

  const masked = email ? email.replace(/^(.{2}).+(@.+)$/, (_, a, b) => `${a}*****${b}`) : "";

  return (
    <div className="fixed inset-0 z-50 grid place-items-center">
      <button className="absolute inset-0 bg-black/50" onClick={onClose} aria-label="Fechar" />
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[var(--surface)]/90 p-6">
        {!sent ? (
          <>
            <h2 className="text-lg font-semibold mb-2">Recuperar acesso</h2>
            <p className="text-sm opacity-70 mb-4">
              Informe seu e-mail. Enviaremos um link para redefinir sua senha.
            </p>

            <input
              type="email"
              placeholder="seuemail@dominio.com"
              className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-2 outline-none focus:border-zinc-600"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <div className="mt-4 flex items-center gap-2">
              <button
                className="btn rounded-xl bg-emerald-600 text-white px-4 py-2 disabled:opacity-60"
                onClick={submit}
                disabled={!/^\S+@\S+\.\S+$/.test(email) || loading}
              >
                {loading ? "Enviando..." : "Enviar link de recuperação"}
              </button>
              <button className="btn btn-outline px-4 py-2" onClick={onClose}>Cancelar</button>
            </div>

            <p className="text-xs opacity-60 mt-3">
              Se o e-mail existir, você receberá o link em alguns minutos.
            </p>
          </>
        ) : (
          <>
            <h2 className="text-lg font-semibold mb-2">Verifique seu e-mail</h2>
            <p className="text-sm opacity-80">
              Se <span className="font-medium">{masked}</span> existir, enviamos um link para redefinir sua senha.
              Verifique sua caixa de entrada e o spam.
            </p>

            <div className="mt-4 flex items-center gap-2">
              <a
                className="btn btn-outline px-3 py-2"
                href="https://mail.google.com" target="_blank" rel="noreferrer"
              >
                Abrir Gmail
              </a>
              <a
                className="btn btn-outline px-3 py-2"
                href="https://outlook.live.com/mail/0/inbox" target="_blank" rel="noreferrer"
              >
                Abrir Outlook
              </a>
              <button
                className="btn px-3 py-2 rounded-xl bg-emerald-600 text-white disabled:opacity-60"
                onClick={submit}
                disabled={cooldown > 0}
              >
                {cooldown > 0 ? `Reenviar em ${String(cooldown).padStart(2, "0")}s` : "Reenviar"}
              </button>
            </div>

            <div className="mt-4">
              <button className="text-sm opacity-70 hover:opacity-100" onClick={() => setSent(false)}>
                Trocar e-mail
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
