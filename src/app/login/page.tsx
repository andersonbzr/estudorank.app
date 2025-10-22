// src/app/login/page.tsx
"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import MotionButton from "@/components/ui/MotionButton";
import Spinner from "@/components/ui/Spinner";
import { useToast } from "@/components/Toast";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/* ------------------------------ Helpers ------------------------------ */
function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

const fadeSlide = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.2, ease: "easeOut" },
};

/* ------------------------------- Page -------------------------------- */
export default function LoginPage() {
  const router = useRouter();
  const supabase = useMemo(() => supabaseBrowser(), []);
  const toast = useToast();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [showPass, setShowPass] = useState(false);

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState<null | "ok">(null);

  const emailRef = useRef<HTMLInputElement | null>(null);
  const passRef = useRef<HTMLInputElement | null>(null);

  /* --- Forgot Password modal state --- */
  const [openForgot, setOpenForgot] = useState(false);
  const [emailForgot, setEmailForgot] = useState("");
  const [fpStatus, setFpStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [cooldown, setCooldown] = useState(0);

  // cooldown do botão "Reenviar"
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  /* 1) Redireciona se já estiver logado ao montar */
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) router.replace("/me");
      else emailRef.current?.focus();
    });
  }, [router, supabase]);

  /* 2) Redireciona quando o Supabase autenticar "ao vivo" (ex.: magic link / recovery) */
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      // ✅ trata link de recuperação que possa abrir na /login
      if (event === "PASSWORD_RECOVERY") {
        const qs =
          typeof window !== "undefined" && window.location.search
            ? window.location.search
            : "";
        router.replace(`/reset-password${qs}`);
        return;
      }

      if (event === "SIGNED_IN") router.replace("/me");
    });
    return () => {
      try {
        sub.subscription.unsubscribe();
      } catch {}
    };
  }, [router, supabase]);

  /* Autofocus inteligente ao trocar a aba (signin/signup) */
  useEffect(() => {
    setMsg(null);
    setPass("");
    emailRef.current?.focus();
  }, [mode]);

  /* Submit ao pressionar Enter no campo de senha */
  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") submit();
  }

  const emailInvalid = email.length > 0 && !isValidEmail(email);
  const passInvalid =
    pass.length > 0 && (mode === "signup" ? pass.length < 6 : pass.length === 0);

  const disabled =
    busy ||
    email.length === 0 ||
    pass.length === 0 ||
    emailInvalid ||
    (mode === "signup" && pass.length < 6);

  /* ----------------------------- Actions ----------------------------- */
  async function submit() {
    if (disabled) return;
    setBusy(true);
    setMsg(null);
    setJustSaved(null);

    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: pass,
        });
        if (error) throw error;

        setJustSaved("ok");
        toast.push("Bem-vindo de volta!");
        router.replace("/me");
      } else {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password: pass,
        });
        if (error) throw error;

        setJustSaved("ok");
        toast.push("Conta criada com sucesso. Você já pode entrar.");
        setMode("signin");
        setPass("");
        passRef.current?.focus();
      }
    } catch (e: any) {
      setMsg(e.message ?? "Falha na autenticação. Verifique os dados e tente novamente.");
      toast.push("Erro de autenticação");
    } finally {
      setBusy(false);
      setTimeout(() => setJustSaved(null), 1400);
    }
  }

  /* Forgot Password: chama o endpoint /api/auth/forgot-password */
  async function onForgotPassword() {
    if (!isValidEmail(emailForgot)) {
      toast.push("Informe um e-mail válido.");
      return;
    }
    setFpStatus("sending");
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailForgot.trim() }),
      });
      // resposta sempre neutra
      setFpStatus("sent");
      setCooldown(45);
    } catch {
      setFpStatus("sent");
      setCooldown(45);
    }
  }

  /* ------------------------------- UI -------------------------------- */
  return (
    <main className="min-h-screen grid lg:grid-cols-2 overflow-hidden">
      {/* Painel esquerdo — branding/atmosfera */}
      <div className="hidden lg:flex relative items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(1200px_600px_at_-10%_-20%,rgba(163,230,53,0.12),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(1000px_500px_at_120%_110%,rgba(99,102,241,0.10),transparent_60%)]" />
        <motion.div
          className="absolute inset-0"
          initial={{ opacity: 0.4 }}
          animate={{ opacity: [0.35, 0.6, 0.35], scale: [1, 1.03, 1] }}
          transition={{ duration: 8, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
          style={{
            background:
              "linear-gradient(120deg, rgba(163,230,53,0.10), transparent 40%, rgba(99,102,241,0.10))",
            filter: "blur(6px)",
          }}
        />
        <div className="relative z-10 text-center px-10">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: [0, -6, 0], scale: [1, 1.01, 1] }}
            transition={{ duration: 4, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
          >
            <Image
              src="/logo.png"
              alt="EstudoRank"
              width={190}
              height={190}
              priority
              className="mx-auto mb-6 drop-shadow-[0_0_28px_rgba(163,230,53,0.25)]"
            />
          </motion.div>
          <motion.h2
            className="text-[15px] opacity-85 font-light tracking-wide"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            Transforme seus estudos em uma jornada — suba no ranking.
          </motion.h2>
        </div>
      </div>

      {/* Formulário / Card */}
      <div className="flex items-center justify-center p-6 sm:p-8 md:p-10">
        <motion.div
          {...fadeSlide}
          className="relative w-full max-w-sm rounded-2xl bg-white/[0.04] border border-white/10 p-6 backdrop-blur-md shadow-[0_0_40px_-15px_rgba(163,230,53,0.25)] transition-all duration-300 ease-out hover:shadow-[0_0_50px_-12px_rgba(163,230,53,0.38)]"
        >
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-lime-400 via-green-300 to-indigo-500 rounded-t-2xl" />

          <h1 className="text-center text-xl font-semibold">
            <span className="bg-gradient-to-r from-lime-400 via-green-300 to-indigo-400 bg-clip-text text-transparent">
              Acesse sua conta
            </span>
          </h1>

          {/* Abas */}
          <div className="mt-4 relative flex rounded-xl bg-white/5 p-1 border border-white/10">
            <button
              className={`relative flex-1 py-2 rounded-lg transition-all duration-200 ease-out ${
                mode === "signin" ? "text-white" : "opacity-75 hover:opacity-100"
              }`}
              onClick={() => setMode("signin")}
            >
              Entrar
              {mode === "signin" && (
                <motion.span
                  layoutId="loginTab"
                  className="absolute inset-0 -z-10 rounded-lg bg-white/10"
                  transition={{ type: "spring", stiffness: 500, damping: 40 }}
                />
              )}
            </button>
            <button
              className={`relative flex-1 py-2 rounded-lg transition-all duration-200 ease-out ${
                mode === "signup" ? "text-white" : "opacity-75 hover:opacity-100"
              }`}
              onClick={() => setMode("signup")}
            >
              Criar conta
              {mode === "signup" && (
                <motion.span
                  layoutId="loginTab"
                  className="absolute inset-0 -z-10 rounded-lg bg-white/10"
                  transition={{ type: "spring", stiffness: 500, damping: 40 }}
                />
              )}
            </button>
          </div>

          {/* Mensagens de erro */}
          <AnimatePresence mode="wait">
            {msg && (
              <motion.div
                {...fadeSlide}
                className="mt-3 flex items-center gap-2 p-3 rounded-lg bg-red-500/12 border border-red-400/25 text-sm text-red-200"
              >
                {msg}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Email */}
          <label className="block text-sm mb-1 mt-4 font-medium">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" aria-hidden />
            <input
              ref={emailRef}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              inputMode="email"
              placeholder="voce@email.com"
              className="w-full rounded-lg bg-black/20 border border-white/10 pl-10 pr-3 py-2 outline-none transition-all duration-200 ease-out focus:ring-2 focus:ring-[var(--accent)]/40"
            />
          </div>
          {emailInvalid && <div className="mt-1 text-xs text-red-300/90">E-mail inválido.</div>}

          {/* Senha */}
          <div className="mt-4">
            <div className="flex items-center justify-between">
              <label className="block text-sm mb-1 font-medium">Senha</label>
              {mode === "signin" && (
                <button
                  type="button"
                  onClick={() => {
                    setEmailForgot(email || "");
                    setFpStatus("idle");
                    setOpenForgot(true);
                  }}
                  className="text-xs font-medium text-[var(--accent)] hover:underline underline-offset-4 transition"
                  title="Enviar link para redefinir sua senha"
                >
                  Esqueci minha senha
                </button>
              )}
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" aria-hidden />
              <input
                ref={passRef}
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                onKeyDown={onKeyDown}
                type={showPass ? "text" : "password"}
                placeholder={mode === "signup" ? "Mínimo 6 caracteres" : "Sua senha"}
                className="w-full rounded-lg bg-black/20 border border-white/10 pl-10 pr-10 py-2 outline-none transition-all duration-200 ease-out focus:ring-2 focus:ring-[var(--accent)]/40"
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-transform hover:scale-110"
                title={showPass ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {passInvalid && (
              <div className="mt-1 text-xs text-red-300/90">
                {mode === "signup" ? "A senha deve ter no mínimo 6 caracteres." : "Informe sua senha."}
              </div>
            )}
          </div>

          {/* Botão principal com feedback embutido */}
          <MotionButton
            onClick={submit}
            disabled={disabled}
            aria-busy={busy}
            className={[
              "w-full mt-6 rounded-xl py-2 font-semibold text-black transition-all duration-200 ease-out",
              "bg-gradient-to-r from-lime-400 via-green-300 to-indigo-500 hover:brightness-110",
              "disabled:opacity-60 active:scale-[0.98]",
            ].join(" ")}
          >
            {busy ? (
              <Spinner label={mode === "signin" ? "Entrando..." : "Criando..."} />
            ) : justSaved === "ok" ? (
              "Salvo com sucesso!"
            ) : mode === "signin" ? (
              "Entrar"
            ) : (
              "Criar conta"
            )}
          </MotionButton>

          {/* Alternância */}
          <div className="mt-5 text-center text-sm opacity-85">
            {mode === "signin" ? (
              <>
                Não tem conta?{" "}
                <button
                  className="underline underline-offset-4 hover:opacity-100 transition-colors"
                  onClick={() => setMode("signup")}
                >
                  Crie agora
                </button>
              </>
            ) : (
              <>
                Já é cadastrado?{" "}
                <button
                  className="underline underline-offset-4 hover:opacity-100 transition-colors"
                  onClick={() => setMode("signin")}
                >
                  Entrar
                </button>
              </>
            )}
          </div>
        </motion.div>
      </div>

      {/* -------- Modal: Esqueci minha senha -------- */}
      {openForgot && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="w-full max-w-md rounded-xl bg-neutral-900 p-6 shadow-xl border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Recuperar acesso</h2>
              <button
                className="opacity-70 hover:opacity-100"
                onClick={() => setOpenForgot(false)}
                aria-label="Fechar"
              >
                ✕
              </button>
            </div>

            {fpStatus !== "sent" ? (
              <>
                <label className="text-sm block mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
                  <input
                    type="email"
                    className="w-full rounded-lg bg-neutral-800 border border-neutral-700 px-3 py-2 pl-10 outline-none focus:border-neutral-500"
                    placeholder="seuemail@dominio.com"
                    value={emailForgot}
                    onChange={(e) => setEmailForgot(e.target.value)}
                  />
                </div>

                <button
                  className="mt-4 w-full rounded-lg px-3 py-2 font-medium bg-gradient-to-r from-lime-400 via-green-300 to-indigo-500 disabled:opacity-60"
                  disabled={fpStatus === "sending" || !isValidEmail(emailForgot)}
                  onClick={onForgotPassword}
                >
                  {fpStatus === "sending" ? "Enviando..." : "Enviar link de recuperação"}
                </button>

                <p className="mt-3 text-xs opacity-70">
                  Você receberá um link para criar uma nova senha. Se o e-mail existir, chegará em alguns minutos.
                </p>
              </>
            ) : (
              <>
                <div className="rounded-lg bg-neutral-800 border border-neutral-700 p-3">
                  <p className="text-sm">
                    Se o e-mail existir, enviamos o link para redefinir sua senha.
                    Verifique sua caixa de entrada e a pasta de spam.
                  </p>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <a
                    className="rounded-lg px-3 py-2 text-center bg-neutral-800 border border-neutral-700 hover:bg-neutral-700"
                    href="https://mail.google.com" target="_blank" rel="noreferrer"
                  >
                    Abrir Gmail
                  </a>
                  <a
                    className="rounded-lg px-3 py-2 text-center bg-neutral-800 border border-neutral-700 hover:bg-neutral-700"
                    href="https://outlook.live.com" target="_blank" rel="noreferrer"
                  >
                    Abrir Outlook
                  </a>
                </div>

                <button
                  className="mt-3 w-full rounded-lg px-3 py-2 bg-neutral-800 border border-neutral-700 hover:bg-neutral-700 disabled:opacity-60"
                  disabled={cooldown > 0}
                  onClick={() => {
                    setFpStatus("idle");
                    setTimeout(onForgotPassword, 0);
                  }}
                >
                  {cooldown > 0 ? `Reenviar em ${String(cooldown).padStart(2, "0")}s` : "Reenviar"}
                </button>

                <button
                  className="mt-2 w-full text-sm underline opacity-80 hover:opacity-100"
                  onClick={() => setFpStatus("idle")}
                >
                  Trocar e-mail
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
