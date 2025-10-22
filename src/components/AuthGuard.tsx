"use client";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import Spinner from "@/components/ui/Spinner";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      const supabase = supabaseBrowser();
      const { data } = await supabase.auth.getSession();
      if (!isMounted) return;
      setAuthed(!!data.session);
      setReady(true);
      if (!data.session) {
        // sem sessão => manda pro login
        window.location.replace("/login");
      }
    })();
    return () => { isMounted = false; };
  }, []);

  if (!ready) {
    return (
      <div className="min-h-[40vh] grid place-items-center">
        <Spinner label="Verificando sessão..." />
      </div>
    );
  }

  return authed ? <>{children}</> : null;
}
