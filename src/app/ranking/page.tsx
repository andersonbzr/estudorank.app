"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase/client";
import Card from "@/components/ui/Card";
import MotionButton from "@/components/ui/MotionButton";
import AppShell from "@/components/shell/AppShell";
import AuthGuard from "@/components/AuthGuard";
import { Trophy } from "lucide-react";
import ChatDock from "@/components/chat/ChatDock"; // chat (client component)

type Row = { user_id: string; email: string; total: number };

export default function RankingPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [names, setNames] = useState<Record<string, string>>({}); // user_id -> display name

  const supabase = useMemo(() => supabaseBrowser(), []);
  const abortRef = useRef<AbortController | null>(null);

  async function load(p = page) {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      setErr(null);
      const res = await fetch(`/api/ranking?page=${p}&pageSize=${pageSize}`, {
        cache: "no-store",
        signal: ctrl.signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const list: Row[] = json.leaderboard ?? [];

      setRows(list);
      setPages(json.pages ?? 1);
      setTotal(json.total ?? 0);

      // Buscar nomes dos perfis para exibir no lugar do e-mail quando houver
      const ids = list.map((r) => r.user_id).filter(Boolean);
      if (ids.length) {
        const { data: prof, error } = await supabase
          .from("profiles")
          .select("id, full_name, name")
          .in("id", ids);

        if (!error && prof) {
          const map: Record<string, string> = {};
          for (const p of prof as any[]) {
            const disp =
              (p.full_name && String(p.full_name).trim()) ||
              (p.name && String(p.name).trim()) ||
              "";
            if (disp) map[p.id] = disp;
          }
          setNames(map);
        }
      }
    } catch (e: any) {
      if (e.name !== "AbortError") setErr(e.message ?? "Falha ao carregar ranking.");
    } finally {
      if (!ctrl.signal.aborted) setLoading(false);
    }
  }

  useEffect(() => {
    setLoading(true);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, pageSize]);

  return (
    <AuthGuard>
      <AppShell>
        <div className="max-w-6xl mx-auto px-4 lg:px-6 py-6 lg:py-8">
          {/* Cabeçalho da página */}
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
              <Trophy size={20} className="opacity-80" />
              Ranking
            </h1>
            <div className="flex gap-2">
              <MotionButton
                onClick={() => {
                  setLoading(true);
                  load(page);
                }}
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

          {/* Layout em duas colunas: ranking + chat */}
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Coluna Ranking */}
            <div className="lg:col-span-8">
              <Card className="overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="text-left px-4 py-3">Posição</th>
                      <th className="text-left px-4 py-3">Usuário</th>
                      <th className="text-right px-4 py-3">Pontos</th>
                    </tr>
                  </thead>
                </table>

                <div className="divide-y divide-white/5">
                  {loading ? (
                    <div className="px-4 py-6 text-center opacity-80">
                      Carregando ranking...
                    </div>
                  ) : err ? (
                    <div className="px-4 py-6 text-center opacity-80">{err}</div>
                  ) : rows.length === 0 ? (
                    <div className="px-4 py-6 text-center opacity-80">
                      Sem dados ainda.
                    </div>
                  ) : (
                    rows.map((r, i) => {
                      const pos = (page - 1) * pageSize + (i + 1);
                      const display =
                        (names[r.user_id] && names[r.user_id].trim()) ||
                        r.email ||
                        `User ${r.user_id.slice(0, 4)}`;
                      return (
                        <div
                          key={r.user_id}
                          className="grid grid-cols-12 items-center px-4 py-3"
                        >
                          <div className="col-span-2">{pos}</div>
                          <div className="col-span-7 break-words">{display}</div>
                          <div className="col-span-3 text-right font-semibold">
                            {r.total}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </Card>

              {/* Controles de paginação */}
              <div className="mt-4 flex items-center justify-between text-sm">
                <div className="opacity-80">
                  {total} usuários • página {page} de {pages}
                </div>
                <div className="flex gap-2">
                  <MotionButton
                    disabled={page <= 1}
                    onClick={() => {
                      const next = Math.max(1, page - 1);
                      setPage(next);
                      setLoading(true);
                      load(next);
                    }}
                    className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition disabled:opacity-60"
                  >
                    Anterior
                  </MotionButton>
                  <MotionButton
                    disabled={page >= pages}
                    onClick={() => {
                      const next = Math.min(pages, page + 1);
                      setPage(next);
                      setLoading(true);
                      load(next);
                    }}
                    className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition disabled:opacity-60"
                  >
                    Próxima
                  </MotionButton>
                </div>
              </div>
            </div>

            {/* Coluna Chat */}
            <div className="lg:col-span-4">
              <Card className="p-0 overflow-hidden bg-white/[0.03] backdrop-blur-xl border-white/10">
                <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold">Chat do Ranking</div>
                    <div className="text-xs opacity-70">
                      Conectado a <code>ranking-global</code>
                    </div>
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
