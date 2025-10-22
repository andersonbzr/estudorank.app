// src/components/HeaderMinimal.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function HeaderMinimal() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const supabase = supabaseBrowser();
    supabase.auth.getUser().then(async ({ data }) => {
      const u = data.user;
      setEmail(u?.email ?? null);
      if (u) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("is_admin")
          .eq("id", u.id)
          .single();
        setIsAdmin(!!prof?.is_admin);
      }
    });
  }, []);

  async function handleSignOut() {
    const supabase = supabaseBrowser();
    await supabase.auth.signOut();
    router.replace("/login");
  }

  return (
    <header className="w-full border-b border-white/10 bg-[var(--surface)]/60 backdrop-blur sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo simples — sem texto */}
        <Link href="/" className="flex items-center">
          <Image
            src="/logo.png"
            alt="EstudoRank"
            width={100}
            height={100}
            priority
            className="rounded-sm hover:opacity-90 transition"
          />
        </Link>

        <div className="flex items-center gap-3">
          {isAdmin && (
            <Link
              href="/admin/courses"
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition"
            >
              Admin
            </Link>
          )}
          {email && <span className="text-sm opacity-80">{email}</span>}
          <button
            onClick={handleSignOut}
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition"
          >
            Sair
          </button>
        </div>
      </div>
    </header>
  );
}
