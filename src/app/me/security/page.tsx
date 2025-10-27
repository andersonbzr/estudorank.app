"use client";

import { useEffect, useState } from "react";
import ChangePasswordForm from "@/components/auth/ChangePasswordForm";
import AuthGuard from "@/components/AuthGuard";
import AppShell from "@/components/shell/AppShell";
import DangerZone from "@/components/settings/DangerZone";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function SecurityPage() {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const sb = supabaseBrowser();
    sb.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
  }, []);

  return (
    <AuthGuard>
      <AppShell>
        <div className="max-w-2xl mx-auto px-5 md:px-8 py-8">
          <h1 className="text-2xl font-semibold mb-2">Segurança</h1>
          <p className="text-sm opacity-70 mb-6">
            Atualize sua senha. Por segurança, pediremos sua senha atual para confirmar.
          </p>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 mb-10">
            <ChangePasswordForm />
          </div>

          <DangerZone
            confirmLabel={email ?? "confirmar"}
            endpoint="/api/account/delete"
            redirectTo="/login"
          />
        </div>
      </AppShell>
    </AuthGuard>
  );
}
