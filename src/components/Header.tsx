// src/components/HeaderMinimal.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { Menu, PanelLeft } from "lucide-react";
import { motion } from "framer-motion";

export default function HeaderMinimal() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const supabase = supabaseBrowser();
    supabase.auth.getUser().then(async ({ data }) => {
      const u = data.user;
      setEmail(u?.email ?? null);
      if (u) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("is_admin")
          .eq("id", u.id)
          .single();
        setIsAdmin(!!prof?.is_admin);
      }
    });
  }, []);

  // Emite um evento global para o AppShell ouvir e alternar a sidebar
  const toggleSidebar = useCallback(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("estudorank:sidebar", { detail: "toggle" })
      );
    }
  }, []);

  async function handleSignOut() {
    const supabase = supabaseBrowser();
    await supabase.auth.signOut();
    router.replace("/login");
  }

  return (
    <header className="w-full border-b border-white/10 bg-[var(--surface)]/60 backdrop-blur sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {/* Botão: colapsar/expandir sidebar */}
          <button
            onClick={toggleSidebar}
            className="h-9 w-9 grid place-items-center rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition"
            aria-label="Alternar menu lateral"
          >
            <motion.span
              initial={false}
              animate={{ rotate: [0, 10, 0] }}
              transition={{ duration: 0.4 }}
              className="inline-flex"
            >
              {/* Usar Menu no mobile e PanelLeft no desktop é um detalhe visual; ambos funcionam */}
              <PanelLeft size={18} className="hidden sm:block" />
              <Menu size={18} className="sm:hidden" />
            </motion.span>
          </button>

          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Image
              src="/logo.png"
              alt="EstudoRank"
              width={100}
              height={100}
              priority
              className="rounded-sm hover:opacity-90 transition"
            />
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {isAdmin && (
            <Link
              href="/admin/courses"
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition"
            >
              Admin
            </Link>
          )}
          {email && <span className="text-sm opacity-80">{email}</span>}
          <button
            onClick={handleSignOut}
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition"
          >
            Sair
          </button>
        </div>
      </div>
    </header>
  );
}
