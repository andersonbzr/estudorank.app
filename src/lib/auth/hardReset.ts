"use client";
import { supabaseBrowser } from "@/lib/supabase/client";

export async function hardResetAuth() {
  const sb = supabaseBrowser();
  // Limpa apenas no client (sem invalidar no servidor)
  await sb.auth.signOut({ scope: "local" }).catch(() => {});
  try {
    // Remove quaisquer chaves antigas do supabase-js
    Object.keys(localStorage)
      .filter((k) => k.includes("-auth-token"))
      .forEach((k) => localStorage.removeItem(k));
  } catch {}
}
