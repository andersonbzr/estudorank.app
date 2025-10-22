// src/lib/supabase/session.ts
import { supabaseBrowser } from "./client";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

export async function ensureSession(router?: AppRouterInstance) {
  const supabase = supabaseBrowser();
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) {
    // não há sessão => manda para login
    try {
      await supabase.auth.signOut({ scope: "local" });
      localStorage.removeItem("supabase.auth.token");
    } catch {}
    if (router) router.replace("/login");
    throw new Error("No active session");
  }
  return data.session;
}

/**
 * Envolve qualquer chamada ao Supabase que possa disparar o erro “Invalid Refresh Token”.
 * Se detectar o caso, limpa local e redireciona para login.
 */
export async function withAuthGuard<T>(
  fn: () => Promise<T>,
  router?: AppRouterInstance
): Promise<T> {
  try {
    return await fn();
  } catch (err: any) {
    const msg = String(err?.message || "");
    const name = String(err?.name || "");
    const looksLikeRefreshError =
      name === "AuthApiError" || /Invalid Refresh Token/i.test(msg);

    if (looksLikeRefreshError) {
      const supabase = supabaseBrowser();
      try {
        await supabase.auth.signOut({ scope: "local" });
        localStorage.removeItem("supabase.auth.token");
      } catch {}
      if (router) router.replace("/login");
      throw new Error("Auth: invalid/expired refresh token");
    }
    throw err;
  }
}
