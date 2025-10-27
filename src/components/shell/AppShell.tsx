// src/components/shell/AppShell.tsx
"use client";

import { ReactNode, useEffect, useState, Fragment } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { supabaseBrowser } from "@/lib/supabase/client";
import { I18nProvider } from "@/components/I18nProvider";
import { Menu as UiMenu, Transition } from "@headlessui/react";
import clsx from "clsx";
import { Menu, ShieldCheck, LogOut } from "lucide-react";

/** Mapeia pathname -> título do header */
const titleMap: Record<string, string> = {
  "/me": "Meu Painel",
  "/ranking": "Ranking",
  "/config": "Configurações",
  "/me/security": "Segurança",
  "/admin/courses": "Administração",
};

export default function AppShell({ children }: { children: ReactNode }) {
  /** layout */
  const [open, setOpen] = useState(true); // desktop: aberta/rail
  const [mobileOpen, setMobileOpen] = useState(false);

  /** usuário */
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const supabase = supabaseBrowser();
    supabase.auth.getUser().then(async ({ data }) => {
      const u = data.user;
      if (!u) {
        setIsAdmin(false);
        setDisplayName(null);
        return;
      }
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

  const desktopCol = open ? "18rem" : "4rem";
  const headerTitle =
    titleMap[pathname] ??
    (pathname?.startsWith("/u/") ? "Perfil" : "EstudoRank");

  const initial =
    (displayName?.trim()?.charAt(0)?.toUpperCase() as string) || "U";

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

              {/* Título da página */}
              <span className="text-sm opacity-90 font-medium">
                {headerTitle}
              </span>
            </div>

            {/* Menu do usuário (apenas Administração + Sair) */}
            <UiMenu as="div" className="relative">
              <UiMenu.Button className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2.5 h-9 hover:bg-white/10 transition">
                <span className="inline-grid place-items-center h-6 w-6 rounded-full bg-white/10 border border-white/15 text-xs">
                  {initial}
                </span>
                <span className="max-w-[160px] truncate text-sm">
                  {displayName ?? "Conta"}
                </span>
                <svg
                  aria-hidden
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  className="opacity-70"
                >
                  <path
                    fill="currentColor"
                    d="M7 10l5 5 5-5z"
                  />
                </svg>
              </UiMenu.Button>

              <Transition
                as={Fragment}
                enter="transition ease-out duration-120"
                enterFrom="opacity-0 translate-y-1"
                enterTo="opacity-100 translate-y-0"
                leave="transition ease-in duration-100"
                leaveFrom="opacity-100 translate-y-0"
                leaveTo="opacity-0 translate-y-1"
              >
                <UiMenu.Items className="absolute right-0 mt-2 w-56 origin-top-right rounded-xl border border-white/10 bg-[var(--surface)]/98 backdrop-blur shadow-2xl focus:outline-none p-1">
                  {isAdmin && (
                    <UiMenu.Item>
                      {({ active }) => (
                        <Link
                          href="/admin/courses"
                          className={clsx(
                            "flex items-center gap-2 rounded-lg px-3 py-2 text-sm",
                            active ? "bg-white/10" : "bg-transparent"
                          )}
                        >
                          <ShieldCheck size={16} className="text-lime-300" />
                          Administração
                        </Link>
                      )}
                    </UiMenu.Item>
                  )}

                  <div className="my-1 h-px bg-white/10" />

                  <UiMenu.Item>
                    {({ active }) => (
                      <button
                        onClick={signOut}
                        className={clsx(
                          "w-full flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm",
                          active ? "bg-white/10" : "bg-transparent"
                        )}
                      >
                        <LogOut size={16} />
                        Sair
                      </button>
                    )}
                  </UiMenu.Item>
                </UiMenu.Items>
              </Transition>
            </UiMenu>
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
