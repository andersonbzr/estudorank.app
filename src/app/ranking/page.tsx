"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AuthGuard from "@/components/AuthGuard";
import AppShell from "@/components/shell/AppShell";
import { motion } from "framer-motion";
import {
  Trophy,
  Medal,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Search,
  MessageSquare,
  X,
} from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase/client";
import ChatDock from "@/components/chat/ChatDock";

type Item = {
  user_id: string;
  name?: string | null;
  email?: string | null;
  points: number;
  total: number;
};

type ApiResp = {
  ok: boolean;
  leaderboard: Item[];
  page: number;
  pageSize: number;
  total: number;
  pages: number;
  via?: string;
  adminClient?: boolean;
  error?: string;
};

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs bg-white/5 border border-white/10 text-white/80">
      {children}
    </span>
  );
}

function SkeletonRow() {
  return (
    <div className="grid grid-cols-[72px,1fr,220px,120px] md:grid-cols-[80px,1fr,260px,130px] gap-3 px-5 py-4 animate-pulse">
      <div className="h-4 w-10 rounded bg-white/10" />
      <div className="h-4 w-48 rounded bg-white/10" />
      <div className="h-2.5 w-40 rounded bg-white/10 self-center" />
      <div className="h-4 w-14 rounded bg-white/10 justify-self-end" />
    </div>
  );
}

function RelativeBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="w-full h-2.5 rounded-full bg-white/8 overflow-hidden">
      <div className="h-full bg-lime-400/80" style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function RankingPage() {
  return (
    <AuthGuard>
      <AppShell>
        <Content />
      </AppShell>
    </AuthGuard>
  );
}

function Content() {
  const [data, setData] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize] = useState(25);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const [q, setQ] = useState("");
  const [orderDesc, setOrderDesc] = useState(true);

  const [chatOpen, setChatOpen] = useState(false);

  const [meId, setMeId] = useState<string | null>(null);
  useEffect(() => {
    const sb = supabaseBrowser();
    sb.auth.getUser().then(({ data }) => setMeId(data.user?.id ?? null));
  }, []);

  async function load(p = page) {
    try {
      setLoading(true);
      setErr(null);
      const res = await fetch(`/api/ranking?page=${p}&pageSize=${pageSize}`, {
        cache: "no-store",
      });
      const json: ApiResp = await res.json();
      if (!res.ok || !json.ok) throw new Error(json?.error || "Erro ao carregar ranking");
      setData(json.leaderboard || []);
      setPages(json.pages || 1);
      setTotal(json.total || 0);
      setLastUpdate(new Date());
    } catch (e: any) {
      setErr(e.message || "Falha ao carregar");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { filtered, maxPoints } = useMemo(() => {
    const arr = (data || []).filter((it) => {
      const cand = `${it.name ?? ""} ${it.email ?? ""}`.toLowerCase();
      return q.trim() ? cand.includes(q.trim().toLowerCase()) : true;
    });
    arr.sort((a, b) => (orderDesc ? b.points - a.points : a.points - b.points));
    const max = arr.reduce((m, it) => Math.max(m, it.points), 0);
    return { filtered: arr, maxPoints: max };
  }, [data, q, orderDesc]);

  const updatedText = useMemo(() => {
    if (!lastUpdate) return "—";
    const diff = Math.floor((Date.now() - lastUpdate.getTime()) / 1000);
    if (diff < 5) return "Atualizado agora";
    if (diff < 60) return `Há ${diff}s`;
    const m = Math.floor(diff / 60);
    return `Há ${m}min`;
  }, [lastUpdate]);

  return (
    <div className="max-w-[1200px] mx-auto px-5 md:px-8 py-8 md:py-10">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-b from-neutral-900 to-black shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]"
      >
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-white/10 p-3">
              <Trophy size={22} className="text-lime-300" />
            </div>
            <div>
              <div className="text-xl font-semibold">Ranking Geral</div>
              <div className="text-sm text-white/70">Veja quem está subindo no topo</div>
            </div>
          </div>

        <div className="flex items-center gap-2">
            <Pill>{updatedText}</Pill>
            <Pill>{total} participantes</Pill>
            <button
              onClick={() => load(page)}
              className="ml-1 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm bg-white/10 hover:bg-white/15 border border-white/10"
              aria-label="Atualizar ranking"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              Atualizar
            </button>

            <button
              onClick={() => setChatOpen(true)}
              className="md:hidden inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm bg-white/10 hover:bg-white/15 border border-white/10"
              aria-label="Abrir chat"
            >
              <MessageSquare size={16} />
              Chat
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-col md:flex-row gap-3">
          <label className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar usuário…"
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/5 border border-white/10 outline-none focus:border-white/20"
              aria-label="Buscar no ranking"
            />
          </label>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setOrderDesc((v) => !v)}
              className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm hover:bg-white/10"
              title="Alternar ordenação"
            >
              Ordenar por pontos {orderDesc ? "↓" : "↑"}
            </button>

            <div className="flex items-center">
              <button
                onClick={() => {
                  const p = Math.max(1, page - 1);
                  setPage(p);
                  load(p);
                }}
                disabled={page <= 1 || loading}
                className="px-2 py-2 rounded-l-lg bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-40"
                aria-label="Página anterior"
              >
                <ChevronLeft size={16} />
              </button>
              <div className="px-3 py-2 text-sm bg-white/5 border-t border-b border-white/10">
                {page}/{pages}
              </div>
              <button
                onClick={() => {
                  const p = Math.min(pages, page + 1);
                  setPage(p);
                  load(p);
                }}
                disabled={page >= pages || loading}
                className="px-2 py-2 rounded-r-lg bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-40"
                aria-label="Próxima página"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="mt-6 grid md:grid-cols-[1fr,380px] gap-6">
        <div className="rounded-2xl overflow-hidden bg-white/[0.03] border border-white/10">
          <div className="sticky top-0 z-10 grid grid-cols-[72px,1fr,220px,120px] md:grid-cols-[80px,1fr,260px,130px] gap-3 px-5 py-3 text-xs uppercase tracking-wide text-white/60 border-b border-white/10 bg-black/60 backdrop-blur">
            <div>Posição</div>
            <div>Usuário</div>
            <div>Progresso relativo</div>
            <div className="justify-self-end">Pontos</div>
          </div>

          {err ? (
            <div className="p-6 text-sm text-red-300">
              {err}{" "}
              <button onClick={() => load(page)} className="underline decoration-dotted ml-2">
                Tentar novamente
              </button>
            </div>
          ) : loading ? (
            <div className="divide-y divide-white/10">
              {Array.from({ length: 8 }).map((_, i) => (
                <SkeletonRow key={i} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-sm text-white/70">Nenhum participante encontrado.</div>
          ) : (
            <div className="divide-y divide-white/10">
              {filtered.map((it, idx) => {
                const pos = (page - 1) * pageSize + (idx + 1);
                const showMedal = pos <= 3;
                const isMe = meId && it.user_id === meId;
                const label = it.name || it.email || "Usuário";

                // 👇 Passa nome e email como hints para o perfil (fallback)
                const href = `/u/${encodeURIComponent(it.user_id)}?n=${encodeURIComponent(
                  label
                )}${it.email ? `&e=${encodeURIComponent(it.email)}` : ""}`;

                return (
                  <Link
                    href={href}
                    key={`${it.user_id}-${pos}`}
                    className={`grid grid-cols-[72px,1fr,220px,120px] md:grid-cols-[80px,1fr,260px,130px] gap-3 px-5 py-4 transition-colors hover:bg-white/[0.04] focus:outline-none focus:ring-2 focus:ring-lime-400/30 ${
                      isMe ? "bg-lime-400/[0.06]" : ""
                    }`}
                    aria-label={`Abrir perfil de ${label}`}
                  >
                    <div className="flex items-center gap-2">
                      {showMedal ? (
                        <Medal
                          size={18}
                          className={
                            pos === 1
                              ? "text-yellow-300"
                              : pos === 2
                              ? "text-slate-300"
                              : "text-amber-600"
                          }
                          aria-hidden
                        />
                      ) : (
                        <span className="w-5 text-right opacity-70">{pos}</span>
                      )}
                      <span className="sr-only">Posição {pos}</span>
                    </div>

                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-xs text-white/70 border border-white/10">
                        {(label || "U").slice(0, 1).toUpperCase()}
                      </div>
                      <div className="truncate">
                        <div className="font-medium text-white/90 truncate flex items-center gap-2">
                          <span className="truncate">{label}</span>
                          {/* {isMe && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-lime-400/10 text-lime-300 border border-lime-400/30">
                              você
                            </span>
                          )} */}
                        </div>
                        <div className="text-xs text-white/50 truncate">
                          {it.email || "—"}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-center">
                      <RelativeBar value={it.points} max={maxPoints} />
                    </div>

                    <div className="justify-self-end font-semibold text-white/90">
                      {it.points.toLocaleString("pt-BR")}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <aside className="hidden md:block rounded-2xl overflow-hidden bg-white/[0.03] border border-white/10">
          <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between">
            <div className="font-medium">Chat do Ranking</div>
            <Pill>canal: ranking-global</Pill>
          </div>
          <div className="h-[560px]">
            <ChatDock channel="ranking-global" height="560px" />
          </div>
        </aside>
      </div>

      {chatOpen && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setChatOpen(false)}
            aria-hidden
          />
          <div className="absolute bottom-0 left-0 right-0 rounded-t-2xl bg-neutral-900 border-t border-white/10 shadow-2xl">
            <div className="px-5 py-3 flex items-center justify-between border-b border-white/10">
              <div className="font-medium">Chat do Ranking</div>
              <button
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10"
                onClick={() => setChatOpen(false)}
                aria-label="Fechar chat"
              >
                <X size={18} />
              </button>
            </div>
            <div className="h-[70vh]">
              <ChatDock channel="ranking-global" height="70vh" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
