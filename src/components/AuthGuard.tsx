"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

/**
 * Bloqueia acesso de quem não está autenticado.
 * Mostra um fallback simples enquanto verifica a sessão.
 */
export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = supabaseBrowser();

  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    let unsub: (() => void) | null = null;
    (async () => {
      const { data } = await supabase.auth.getSession();
      setAuthed(!!data.session);
      setReady(true);

      const sub = supabase.auth.onAuthStateChange((_event, session) => {
        setAuthed(!!session);
        if (!session) {
          // Se deslogar, volta ao login
          router.replace("/login");
        }
      });
      unsub = () => sub.data.subscription.unsubscribe();
    })();

    return () => {
      if (unsub) unsub();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  if (!ready) {
    return (
      <div className="min-h-[50vh] grid place-items-center text-white/70">
        Carregando…
      </div>
    );
  }

  if (!authed) return null;

  return <>{children}</>;
}
