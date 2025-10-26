// src/components/shell/AppShell.tsx
"use client";

import { ReactNode, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import { Menu, LogOut } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { I18nProvider } from "@/components/I18nProvider";

const LS_KEY = "ui.sidebar.open"; // "1" = aberta | "0" = rail

export default function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(true);              // desktop: expandida (true) / rail (false)
  const [mobileOpen, setMobileOpen] = useState(false); // mobile drawer
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  // carregar perfil + flag admin
  useEffect(() => {
    const supabase = supabaseBrowser();
    supabase.auth.getUser().then(async ({ data }) => {
      const u = data.user;
      if (u) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("is_admin, full_name, name")
          .eq("id", u.id)
          .single();

        setIsAdmin(!!prof?.is_admin);
        const name =
          (prof?.full_name && String(prof.full_name).trim()) ||
          (prof?.name && String(prof.name).trim()) ||
          u.email ||
          null;
        setDisplayName(name);
      } else {
        setIsAdmin(false);
        setDisplayName(null);
      }
    });
  }, []);

  // carregar preferência da sidebar
  useEffect(() => {
    try {
      const v = localStorage.getItem(LS_KEY);
      if (v === "0") setOpen(false);
      if (v === "1") setOpen(true);
    } catch {}
  }, []);

  // salvar preferência
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, open ? "1" : "0");
    } catch {}
  }, [open]);

  // ouve evento global para alternar/open/close (ex.: disparado pelo HeaderMinimal)
  useEffect(() => {
    function onEvt(e: Event) {
      const detail = (e as CustomEvent<string>).detail;
      setOpen((cur) => {
        if (detail === "toggle") return !cur;
        if (detail === "open") return true;
        if (detail === "close") return false;
        return cur;
      });
    }
    window.addEventListener("estudorank:sidebar" as any, onEvt);
    return () => window.removeEventListener("estudorank:sidebar" as any, onEvt);
  }, []);

  // atalho de teclado: Ctrl/Cmd + B
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const isMod = e.metaKey || e.ctrlKey;
      if (isMod && (e.key === "b" || e.key === "B")) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  async function signOut() {
    const supabase = supabaseBrowser();
    await supabase.auth.signOut();
    router.replace("/login");
  }

  const handleNavigate = useCallback(() => setMobileOpen(false), []);

  // Largura da 1ª coluna no desktop
  const desktopCol = open ? "18rem" : "4rem";

  return (
    <I18nProvider>
      <div
        className="min-h-screen w-full grid"
        style={{ gridTemplateColumns: `${desktopCol} 1fr` }}
      >
        {/* Sidebar Desktop */}
        <div className="hidden lg:block border-r border-white/10 bg-[var(--surface)]/70 backdrop-blur-xl">
          <div
            // container para animar largura suavemente
            className="h-screen sticky top-0 transition-[width] duration-300 ease-out"
            style={{ width: desktopCol }}
            aria-hidden
          />
          <div className="h-screen sticky top-0 -mt-[100vh]">
            <Sidebar isAdmin={isAdmin} collapsed={!open} />
          </div>
        </div>

        {/* Conteúdo */}
        <div className="min-h-screen flex flex-col">
          {/* Topbar */}
          <header className="sticky top-0 z-30 h-14 border-b border-white/10 bg-[var(--surface)]/70 backdrop-blur flex items-center justify-between px-3 sm:px-4 lg:px-6">
            <div className="flex items-center gap-2">
              {/* Toggle Mobile Drawer */}
              <button
                className="btn-icon lg:hidden"
                onClick={() => setMobileOpen(true)}
                aria-label="Abrir menu"
              >
                <Menu size={18} />
              </button>

              {/* Toggle largura sidebar (desktop) */}
              <button
                className="btn-icon hidden lg:inline-flex"
                onClick={() => setOpen((v) => !v)}
                aria-label={open ? "Recolher menu" : "Expandir menu"}
                aria-pressed={open}
                title={open ? "Recolher menu" : "Expandir menu"}
              >
                <Menu size={18} />
              </button>

              <span className="text-sm opacity-80 hidden sm:block">
                {displayName ? `Bem-vindo, ${displayName}` : "Bem-vindo"}
              </span>
            </div>

            {/* Ações à direita */}
            <div className="flex items-center gap-2">
              {/* Removido: link de Segurança (já está dentro de Configurações) */}
              <button onClick={signOut} className="btn btn-outline" title="Sair">
                <LogOut size={16} />
                <span className="hidden sm:inline">Sair</span>
              </button>
            </div>
          </header>

          <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
        </div>

        {/* Drawer Mobile */}
        {mobileOpen && (
          <div className="lg:hidden fixed inset-0 z-40">
            {/* overlay */}
            <button
              className="absolute inset-0 bg-black/50"
              onClick={() => setMobileOpen(false)}
              aria-label="Fechar menu"
            />
            <div
              className="absolute left-0 top-0 h-full w-72 bg-[var(--surface)]/90 border-r border-white/10 shadow-xl"
              role="dialog"
              aria-modal="true"
              aria-label="Menu lateral"
            >
              <Sidebar isAdmin={isAdmin} onNavigate={handleNavigate} />
            </div>
          </div>
        )}
      </div>
    </I18nProvider>
  );
}
