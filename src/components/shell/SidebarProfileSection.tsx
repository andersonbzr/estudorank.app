// src/components/shell/SidebarProfileSection.tsx
"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Monitor, Settings, LogOut } from "lucide-react";

type UserInfo = {
  name?: string | null;
  email?: string | null;
};

export default function SidebarProfileSection() {
  const supabase = supabaseBrowser();
  const router = useRouter();

  const [user, setUser] = useState<UserInfo | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      setUser({
        name: data.user?.user_metadata?.name ?? null,
        email: data.user?.email ?? null,
      });
    })();
  }, [supabase]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  return (
    <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-3">
      {/* Cabeçalho (avatar simples) */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 border border-white/10">
          <span className="text-sm font-semibold">
            {user?.name?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? "?"}
          </span>
        </div>
        <div className="truncate">
          <div className="truncate text-sm font-medium">{user?.name ?? "Usuário"}</div>
          <div className="truncate text-xs opacity-70">{user?.email}</div>
        </div>
      </div>

      {/* Ações */}
      <div className="mt-3 space-y-2">
        {/* Exemplo de ação “Tema” apenas ilustrativa/disabled (sem troca de tema) */}
        <button
          type="button"
          disabled
          className="flex w-full items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left text-sm opacity-60"
          title="Tema fixo: Dark"
        >
          <Monitor className="h-4 w-4" />
          Tema (Dark)
        </button>

        <Link
          href="/config"
          className="flex w-full items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm transition hover:bg-white/10"
        >
          <Settings className="h-4 w-4" />
          Configurações
        </Link>

        <button
          type="button"
          onClick={handleSignOut}
          className="flex w-full items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left text-sm transition hover:bg-white/10"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </button>
      </div>
    </div>
  );
}
