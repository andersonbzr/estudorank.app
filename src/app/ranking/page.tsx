// src/app/ranking/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase/client";
import Card from "@/components/ui/Card";
import MotionButton from "@/components/ui/MotionButton";
import AppShell from "@/components/shell/AppShell";
import AuthGuard from "@/components/AuthGuard";
import ChatDock from "@/components/chat/ChatDock";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Crown } from "lucide-react";

type Row = { user_id: string; email: string; total: number };

/* --------------------------- Helpers UI --------------------------- */
function initialsFrom(nameOrEmail: string) {
  const s = (nameOrEmail || "").trim();
  if (!s) return "U";
  const parts = s.replace(/@.*/, "").split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] ?? "";
  const b = parts.length > 1 ? parts[parts.length - 1][0] ?? "" : (parts[0]?.[1] ?? "");
  return (a + b).toUpperCase();
}

function RankBadge({ rank }: { rank: number }) {
  const base =
    "inline-flex items-center justify-center w-7 h-7 rounded-full text-[13px] font-bold select-none";
  if (rank === 1)
    return (
      <span className={`${base} bg-lime-400/20 text-lime-300 drop-shadow-[0_0_6px_rgba(163,230,53,0.35)]`}>
        1
      </span>
    );
  if (rank === 2) return <span className={`${base} bg-indigo-400/20 text-indigo-300`}>2</span>;
  if (rank === 3) return <span className={`${base} bg-amber-400/20 text-amber-300`}>3</span>;
  return <span className={`${base} bg-white/10 text-white/70`}>{rank}</span>;
}

function AnimatedPoints({ value }: { value: number | null | undefined }) {
  const v = Number.isFinite(Number(value)) ? Number(value) : 0;
  const useGradient = v > 0;

  return (
    <motion.span
      initial={{ y: 6, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.18 }}
      className={
        "font-semibold text-right " +
        (useGradient
          ? "bg-gradient-to-r from-lime-400 via-green-300 to-indigo-400 bg-clip-text text-transparent"
          : "text-white/90")
      }
      style={
        useGradient
          ? { WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }
          : undefined
      }
    >
      {v.toLocaleString("pt-BR")}
    </motion.span>
  );
}

/* ------------------------ Skeleton Components ------------------------ */
function SkeletonRow() {
  return (
    <div className="grid grid-cols-[88px_1fr_160px] md:grid-cols-[120px_1fr_180px] items-center px-4 py-3">
      {/* posição + medalha */}
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-white/10 animate-pulse" />
        <div className="w-4 h-4 rounded bg-white/10 animate-pulse" />
      </div>
      {/* usuário (avatar + nome) */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-full bg-white/10 border border-white/10 animate-pulse" />
        <div className="flex-1 min-w-0">
          <div className="h-3 w-40 max-w-[60%] bg-white/10 rounded animate-pulse" />
          <div className="mt-1 h-2 w-16 bg-white/5 rounded animate-pulse" />
        </div>
      </div>
      {/* pontos */}
      <div className="flex justify-end">
        <div className="h-3 w-16 bg-white/10 rounded animate-pulse" />
      </div>
    </div>
  );
}

function SkeletonRows({ count = 6 }: { count?: number }) {
  return (
    <div className="divide-y divide-white/10">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </div>
  );
}

/* ----------------------------- Page ------------------------------ */
export default function RankingPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [names, setNames] = useState<Record<string, string>>({});
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const supabase = useMemo(() => supabaseBrowser(), []);
  const abortRef = useRef<AbortController | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  async function load(p = 1, { append = false } = {}) {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      setErr(null);
      setLoading(true);

      // usuário atual
      const { data: auth } = await supabase.auth.getUser();
      setCurrentUserId(auth.user?.id ?? null);

      const res = await fetch(`/api/ranking?page=${p}&pageSize=${pageSize}`, {
        cache: "no-store",
        signal: ctrl.signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();

      const list: Row[] = (json.leaderboard ?? []).map((r: any) => ({
        user_id: r.user_id,
        email: r.email,
        total: Number(r.total ?? r.points ?? r.sum ?? 0), // normaliza
      }));

      setPages(json.pages ?? 1);
      setTotal(json.total ?? list.length);
      setRows((prev) => (append ? [...prev, ...list] : list));
      setPage(p);

      // nomes
      const ids = list.map((r) => r.user_id).filter(Boolean);
      if (ids.length) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("id, full_name, name")
          .in("id", ids);

        const map: Record<string, string> = {};
        (prof ?? []).forEach((p: any) => {
          const disp =
            (p.full_name && String(p.full_name).trim()) ||
            (p.name && String(p.name).trim()) ||
            "";
          if (disp) map[p.id] = disp;
        });
        setNames((prev) => ({ ...prev, ...map }));
      }
    } catch (e: any) {
      if (e.name !== "AbortError") setErr(e.message ?? "Falha ao carregar ranking.");
    } finally {
      if (!ctrl.signal.aborted) setLoading(false);
    }
  }

  useEffect(() => {
    load(1);
    const channel = supabase
      .channel("ranking-progress")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "progress" },
        () => load(1)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      abortRef.current?.abort();
    };
  }, [supabase, pageSize]);

  // Auto-load ao chegar no fim (scroll infinito)
  useEffect(() => {
    if (!sentinelRef.current) return;
    const el = sentinelRef.current;

    const obs = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && page < pages && !loading && !err) {
          load(page + 1, { append: true });
        }
      },
      { rootMargin: "200px" }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [page, pages, loading, err]);

  const isInitialLoading = loading && rows.length === 0;
  const isAppending = loading && rows.length > 0;

  return (
    <AuthGuard>
      <AppShell>
        <div className="max-w-6xl mx-auto px-4 lg:px-6 py-6 lg:py-8">
          {/* Cabeçalho */}
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-white/10 border border-white/10">
                <Trophy size={18} />
              </span>
              Ranking
            </h1>
            <div className="flex gap-2">
              <MotionButton
                onClick={() => load(1)}
                className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition"
              >
                Atualizar
              </MotionButton>
              <Link
                href="/me"
                className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition"
              >
                Meu Painel
              </Link>
            </div>
          </div>

          {/* Grid: ranking + chat */}
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Coluna Ranking */}
            <div className="lg:col-span-8">
              <Card className="overflow-hidden p-0">
                {/* Cabeçalho tabela */}
                <div className="grid grid-cols-[88px_1fr_160px] md:grid-cols-[120px_1fr_180px] items-center px-4 py-3 text-xs uppercase tracking-wider bg-gradient-to-r from-white/10 via-white/5 to-transparent text-white/60">
                  <span>Posição</span>
                  <span>Usuário</span>
                  <span className="text-right">Pontos</span>
                </div>

                {/* Linhas */}
                <div className="divide-y divide-white/10">
                  {isInitialLoading ? (
                    <SkeletonRows count={7} />
                  ) : err && rows.length === 0 ? (
                    <div className="px-4 py-6 text-center opacity-80">{err}</div>
                  ) : rows.length === 0 ? (
                    <div className="px-4 py-6 text-center opacity-80">Sem dados ainda.</div>
                  ) : (
                    <>
                      <AnimatePresence initial={false}>
                        {rows.map((r, i) => {
                          const pos = i + 1;
                          const display =
                            (names[r.user_id] && names[r.user_id].trim()) ||
                            r.email ||
                            `User ${r.user_id.slice(0, 4)}`;
                          const isMe = currentUserId && r.user_id === currentUserId;

                          const rowBg =
                            pos === 1
                              ? "bg-gradient-to-r from-lime-400/10 to-green-400/10"
                              : pos === 2
                              ? "bg-gradient-to-r from-indigo-400/10 to-blue-400/10"
                              : pos === 3
                              ? "bg-gradient-to-r from-amber-400/10 to-orange-400/10"
                              : "hover:bg-white/5";

                          return (
                            <motion.div
                              key={`${r.user_id}-${pos}`}
                              layout
                              initial={{ opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -6 }}
                              transition={{ duration: 0.18 }}
                              className={`grid grid-cols-[88px_1fr_160px] md:grid-cols-[120px_1fr_180px] items-center px-4 py-3 ${rowBg}`}
                            >
                              <div className="flex items-center gap-2">
                                <RankBadge rank={pos} />
                                {pos === 1 && <Crown size={16} className="text-lime-300" />}
                              </div>

                              <div className="flex items-center gap-3 min-w-0">
                                <div
                                  className={`w-8 h-8 rounded-full border border-white/10 grid place-items-center text-[11px] font-semibold select-none ${
                                    isMe ? "ring-2 ring-lime-400/40" : ""
                                  } bg-white/10`}
                                >
                                  {initialsFrom(display)}
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <span className={`truncate ${isMe ? "font-semibold" : ""}`}>
                                    {display}
                                  </span>
                                  {isMe && (
                                    <span className="text-[11px] text-lime-300/80">você</span>
                                  )}
                                </div>
                              </div>

                              <div className="flex justify-end">
                                <AnimatedPoints value={r.total} />
                              </div>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>

                      {/* skeletons de append (carregando próxima página) */}
                      {isAppending && <SkeletonRows count={4} />}
                    </>
                  )}
                </div>

                {/* Rodapé */}
                <div className="px-4 py-3 flex items-center justify-between text-sm">
                  <div className="opacity-80">
                    Mostrando {rows.length} de {total} usuário{total !== 1 ? "s" : ""}
                  </div>
                  {page < pages && (
                    <MotionButton
                      onClick={() => load(page + 1, { append: true })}
                      disabled={loading}
                      className="px-3 h-9 rounded-xl bg-white/10 hover:bg-white/20 transition disabled:opacity-60"
                    >
                      {loading ? "Carregando..." : "Carregar mais"}
                    </MotionButton>
                  )}
                </div>
                <div ref={sentinelRef} className="h-2 w-full" />
              </Card>
            </div>

            {/* Coluna Chat */}
            <div className="lg:col-span-4">
              <Card className="p-0 overflow-hidden bg-white/[0.03] backdrop-blur-xl border-white/10">
                <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold">Chat do Ranking</div>
                    <div className="text-xs opacity-70">Conectado a <code>ranking-global</code></div>
                  </div>
                </div>
                <div className="text-[13px] leading-5">
                  <ChatDock channel="ranking-global" />
                </div>
              </Card>
            </div>
          </div>
        </div>
      </AppShell>
    </AuthGuard>
  );
}
