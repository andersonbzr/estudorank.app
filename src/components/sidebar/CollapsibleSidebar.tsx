"use client";

import { useState } from "react";
import AvatarPopover from "./AvatarPopover";

type User = {
  name: string;
  handle?: string;
  email?: string;
  avatarUrl?: string | null;
};

type Community = {
  name: string;
  handle?: string;
  href?: string;
  avatarUrl?: string | null;
};

type Account = { id: string; name: string; email: string; active?: boolean };

type Props = {
  user: User;
  community?: Community | null;
  accounts?: Account[];
};

export default function CollapsibleSidebar({ user, community, accounts = [] }: Props) {
  const [open, setOpen] = useState(false);

  // ✅ Handlers agora vivem no Client Component
  const handleSignOut = async () => {
    try {
      // Ex.: POST para sua rota de signout e redireciona
      // await fetch("/api/auth/signout", { method: "POST" });
      window.location.href = "/auth/signout"; // ajuste conforme sua app
    } catch (e) {
      console.error(e);
    }
  };

  const handleSwitchAccount = async (id: string) => {
    try {
      // Ex.: POST para trocar conta
      // await fetch("/api/auth/switch", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ id }) });
      console.log("switch account ->", id);
      // window.location.reload();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <aside
      className={`transition-[width] duration-300 ease-out rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl overflow-hidden ${
        open ? "w-[300px]" : "w-[80px]"
      }`}
    >
      {/* Topo */}
      <div className="flex items-center gap-3 px-3 py-3 border-b border-white/10">
        <button
          onClick={() => setOpen((v) => !v)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] hover:bg-white/[0.12] transition"
          aria-label="Alternar sidebar"
        >
          {/* ícone menu simples */}
          <div className="h-4 w-4 grid gap-1">
            <span className="block h-[2px] w-4 bg-white/80" />
            <span className="block h-[2px] w-4 bg-white/80" />
            <span className="block h-[2px] w-4 bg-white/80" />
          </div>
        </button>
        {open && (
          <div className="min-w-0">
            <div className="text-sm font-semibold leading-tight truncate">EstudoRank</div>
            <div className="text-xs text-white/60 truncate">Plataforma</div>
          </div>
        )}
      </div>

      {/* Navegação */}
      <nav className="p-2 space-y-2">
        {[
          { href: "/me", label: "Meu Painel", icon: "🏠" },
          { href: "/ranking", label: "Ranking", icon: "🏆" },
          { href: "/settings", label: "Configurações", icon: "⚙️" },
          { href: "/security", label: "Segurança", icon: "🛡️" },
          { href: "/admin", label: "Administração", icon: "🧰" },
        ].map((i) => (
          <a
            key={i.href}
            href={i.href}
            className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] px-2 py-2.5 transition"
          >
            <span className="shrink-0 text-lg leading-none">{i.icon}</span>
            {open && <span className="text-sm">{i.label}</span>}
          </a>
        ))}
      </nav>

      {/* Rodapé: popover com avatar */}
      <div className="mt-auto p-2 border-t border-white/10">
        <AvatarPopover
          user={user}
          community={community ?? undefined}
          accounts={accounts}
          onSignOut={handleSignOut}
          onSwitchAccount={handleSwitchAccount}
          expanded={open}
        />
      </div>
    </aside>
  );
}
