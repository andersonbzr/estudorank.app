// src/app/page.tsx
"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const supabase = supabaseBrowser();

    // Escuta eventos de auth que podem acontecer ao abrir links do e-mail
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      // Quando o link é de recuperação de senha
      if (event === "PASSWORD_RECOVERY") {
        const qs =
          typeof window !== "undefined" && window.location.search
            ? window.location.search
            : "";
        router.replace(`/reset-password${qs}`);
      }
      // Se já autenticou (ex.: magic link), manda direto pro app
      if (event === "SIGNED_IN") {
        router.replace("/me");
      }
    });

    return () => {
      try {
        sub.subscription.unsubscribe();
      } catch {}
    };
  }, [router]);

  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="bg-[var(--surface)]/90 p-8 rounded-2xl shadow-lg border border-white/5 text-center">
        <h1 className="text-2xl font-semibold">EstudoRank</h1>
        <p className="mt-2 opacity-80">Setup ok.</p>

        <div className="mt-6 flex items-center justify-center gap-3">
          <Link
            href="/login"
            className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition"
          >
            Entrar / Criar conta
          </Link>
          <Link
            href="/me"
            className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition"
          >
            Meu painel
          </Link>
          <Link
            href="/ranking"
            className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition"
          >
            Ranking
          </Link>
        </div>
      </div>
    </main>
  );
}
