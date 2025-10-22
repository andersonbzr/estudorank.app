"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import { Menu, LogOut, Shield } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { I18nProvider } from "@/components/I18nProvider";

export default function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(true);              // desktop: expandida (true) / rail (false)
  const [mobileOpen, setMobileOpen] = useState(false); // mobile drawer
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

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

  async function signOut() {
    const supabase = supabaseBrowser();
    await supabase.auth.signOut();
    router.replace("/login");
  }

  function handleNavigate() {
    setMobileOpen(false);
  }

  // Largura da 1ª coluna no desktop: 18rem (aberta) / 4rem (rail colapsada)
  const desktopCol = open ? "18rem" : "4rem";

  return (
    <I18nProvider>
      <div
        className="min-h-screen w-full grid"
        style={{ gridTemplateColumns: `${desktopCol} 1fr` }}
      >
        {/* Sidebar Desktop */}
        <div className="hidden lg:block border-r border-white/10 bg-[var(--surface)]/70 backdrop-blur-xl">
          <Sidebar isAdmin={isAdmin} collapsed={!open} />
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
              <Link href="/me/security" className="btn btn-outline" title="Segurança da conta">
                <Shield size={16} />
                <span className="hidden sm:inline">Segurança</span>
              </Link>

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
            <div className="absolute left-0 top-0 h-full w-72 bg-[var(--surface)]/90 border-r border-white/10 shadow-xl">
              <Sidebar isAdmin={isAdmin} onNavigate={handleNavigate} />
            </div>
          </div>
        )}
      </div>
    </I18nProvider>
  );
}
