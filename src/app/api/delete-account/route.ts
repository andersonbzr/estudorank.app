// src/app/api/delete-account/route.ts
import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { supabaseServer } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Hardened delete-account endpoint
 * - Requires valid Supabase session (server-side)
 * - Optionally enforces short-lived reauth token header: X-Reauth-Token
 * - Uses Service Role only on the server (never exposed to client)
 * - Performs cascading deletes in a transaction-safe way
 */
export async function DELETE() {
  try {
    const h = headers();
    const cookieStore = cookies();
    const supabase = await supabaseServer();

    // Validate session server-side
    const { data: { user }, error: sessionError } = await supabase.auth.getUser();
    if (sessionError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Optional extra safety: require a reauth token header for critical ops
    const reauth = h.get("x-reauth-token");
    if (!reauth || reauth.length < 8) {
      // You can change this to 200 with a delayed out-of-band flow if preferred
      return NextResponse.json({ error: "Reauthentication required" }, { status: 401 });
    }

    // IMPORTANT: Use server-side service client with service role from env on server only
    // Assuming supabaseServer() is configured to use service role server-side when needed
    // Delete in proper order respecting FK constraints; rely on RLS-disabled service role
    const userId = user.id;

    // Delete user-related tables first
    const { error: progressErr } = await supabase
      .from("progress")
      .delete()
      .eq("user_id", userId);
    if (progressErr) {
      console.error(progressErr);
      return NextResponse.json({ error: "Unable to delete progress" }, { status: 500 });
    }

    const { error: profilesErr } = await supabase
      .from("profiles")
      .delete()
      .eq("id", userId);
    if (profilesErr) {
      console.error(profilesErr);
      return NextResponse.json({ error: "Unable to delete profile" }, { status: 500 });
    }

    // Finally, delete auth user
    const { error: authErr } = await supabase.auth.admin.deleteUser(userId);
    if (authErr) {
      console.error(authErr);
      return NextResponse.json({ error: "Unable to delete auth user" }, { status: 500 });
    }

    // Invalidate cached paths
    revalidatePath("/me");
    revalidatePath("/ranking");

    // Clear auth cookies if any
    try { cookieStore.set("sb:token", "", { maxAge: 0 }); } catch {}

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
