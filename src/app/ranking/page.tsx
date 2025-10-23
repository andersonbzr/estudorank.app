// src/app/ranking/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import Card from "@/components/ui/Card";
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
    "inline-flex items-center justify-center w-7 h-7 rounded-full text-[13px] font-bold select-none ring-1 ring-inset ring-white/15";
  if (rank === 1)
    return (
      <span className={`${base} bg-lime-400/25 text-lime-100 drop-shadow-[0_0_10px_rgba(132,204,22,0.45)]`}>
        1
      </span>
    );
  if (rank === 2) return <span className={`${base} bg-indigo-400/20 text-indigo-100`}>2</span>;
  if (rank === 3) return <span className={`${base} bg-amber-400/20 text-amber-100`}>3</span>;
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
        "font-semibold text-right tabular-nums " +
        (useGradient
          ? "bg-gradient-to-r from-lime-300 via-green-300 to-indigo-300 bg-clip-text text-transparent"
          : "text-white/90")
      }
      style={useGradient ? { WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" } : undefined}
    >
      {v.toLocaleString("pt-BR")}
    </motion.span>
  );
}

/* ------------------------ Skeleton Components ------------------------ */
function SkeletonRow() {
  return (
    <div className="grid grid-cols-[88px_1fr_160px] md:grid-cols-[120px_1fr_180px] items-center px-4 py-3">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-white/10 animate-pulse" />
        <div className="w-4 h-4 rounded bg-white/10 animate-pulse" />
      </div>
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-full bg-white/10 border border-white/10 animate-pulse" />
        <div className="flex-1 min-w-0">
          <div className="h-3 w-40 max-w-[60%] bg-white/10 rounded animate-pulse" />
          <div className="mt-1 h-2 w-16 bg-white/5 rounded animate-pulse" />
        </div>
      </div>
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

  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [flashUpdate, setFlashUpdate] = useState(false);

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
        total: Number(r.total ?? r.points ?? r.sum ?? 0),
      }));

      setPages(json.pages ?? 1);
      setTotal(json.total ?? (append ? rows.length + list.length : list.length));
      setRows((prev) => (append ? [...prev, ...list] : list));
      setPage(p);

      setLastUpdated(new Date());
      setFlashUpdate(true);
      setTimeout(() => setFlashUpdate(false), 1800);

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

  const updatedText = lastUpdated
    ? new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" }).format(
        Math.round((lastUpdated.getTime() - Date.now()) / 60000),
        "minute"
      )
    : "agora";

  return (
    <AuthGuard>
      <AppShell>
        <div className="max-w-6xl mx-auto px-4 lg:px-6 py-6 lg:py-8">
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl grid place-items-center bg-gradient-to-br from-lime-400/20 to-green-300/15 ring-1 ring-inset ring-lime-300/20">
                <Trophy size={22} className="text-lime-300" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">Ranking Geral</h1>
                <p className="text-sm text-white/60">Veja quem está subindo no topo</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span
                className={[
                  "inline-flex items-center gap-2 h-8 px-3 rounded-xl text-xs bg-white/5 border border-white/10 transition",
                  flashUpdate ? "ring-2 ring-lime-300/40 shadow-[0_0_0_6px_rgba(132,204,22,0.08)]" : "ring-0",
                ].join(" ")}
              >
                <span
                  className={[
                    "inline-block w-1.5 h-1.5 rounded-full",
                    flashUpdate ? "bg-lime-300 animate-pulse" : "bg-emerald-400",
                  ].join(" ")}
                />
                Atualizado {updatedText}
              </span>

              <span className="inline-flex items-center gap-2 h-8 px-3 rounded-xl text-xs bg-white/5 border border-white/10">
                <span className="w-1.5 h-1.5 rounded-full bg-lime-400" />
                {total} participante{total !== 1 ? "s" : ""}
              </span>
            </div>
          </div>

          {/* Ranking + Chat */}
          <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-7 items-start">
            {/* Ranking */}
            <Card className="overflow-hidden p-0 rounded-2xl border-white/10 bg-gradient-to-b from-white/[0.04] to-white/[0.02] shadow-[0_10px_30px_-15px_rgba(0,0,0,0.6)]">
              <div className="grid grid-cols-[88px_1fr_160px] md:grid-cols-[120px_1fr_180px] items-center px-4 py-3 text-[11px] uppercase tracking-wider bg-gradient-to-r from-white/10 via-white/5 to-transparent text-white/60">
                <span>Posição</span>
                <span>Usuário</span>
                <span className="text-right">Pontos</span>
              </div>

              <div className="divide-y divide-white/10">
                {loading && rows.length === 0 ? (
                  <SkeletonRows count={7} />
                ) : err && rows.length === 0 ? (
                  <div className="px-4 py-8 text-center opacity-80">{err}</div>
                ) : rows.length === 0 ? (
                  <div className="px-4 py-8 text-center opacity-80">Sem dados ainda.</div>
                ) : (
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
                            {pos === 1 && (
                              <Crown size={16} className="text-lime-300 drop-shadow-[0_0_8px_rgba(132,204,22,0.5)]" />
                            )}
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
                              <span className={`truncate ${isMe ? "font-semibold" : ""}`}>{display}</span>
                              {isMe && <span className="text-[11px] text-lime-300/80">você</span>}
                            </div>
                          </div>

                          <div className="flex justify-end">
                            <AnimatedPoints value={r.total} />
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                )}
              </div>
            </Card>

            {/* Chat */}
            <Card className="p-0 overflow-hidden rounded-2xl bg-white/[0.035] backdrop-blur-xl border-white/10 shadow-[0_10px_30px_-18px_rgba(0,0,0,0.7)]">
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
      </AppShell>
    </AuthGuard>
  );
}
