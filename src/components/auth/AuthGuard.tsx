"use client";

import { useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function AuthGuard({ children }: { children: ReactNode }) {
  const [checking, setChecking] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = supabaseBrowser();
      const { data } = await supabase.auth.getSession();
      if (!data?.session) {
        router.replace("/login"); // redireciona se não estiver logado
      } else {
        setChecking(false);
      }
    };
    checkAuth();
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm opacity-70">
        Verificando autenticação...
      </div>
    );
  }

  return <>{children}</>;
}
