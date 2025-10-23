// src/lib/supabase/admin.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // cuidado: só no server

if (!supabaseUrl || !serviceRoleKey) {
  // Log apenas em dev para não vazar em prod
  if (process.env.NODE_ENV !== "production") {
    console.warn("[supabaseAdmin] Missing env vars NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }
}

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});
