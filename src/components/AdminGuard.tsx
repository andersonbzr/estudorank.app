"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const supabase = useMemo(() => supabaseBrowser(), []);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function check() {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) {
        router.replace("/login");
        return;
      }
      const { data: prof, error } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .single();

      if (error || !prof?.is_admin) {
        router.replace("/forbidden");
        return;
      }
      setChecking(false);
    }
    check();
  }, [router, supabase]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-[var(--surface)] p-6 rounded-2xl border border-white/10">
          Verificando permissões...
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
