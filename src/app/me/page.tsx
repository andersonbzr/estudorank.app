"use client";

import AuthGuard from "@/components/AuthGuard";
import AppShell from "@/components/shell/AppShell";
import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useToast } from "@/components/Toast";
import Card from "@/components/ui/Card";
import Spinner from "@/components/ui/Spinner";
import MotionButton from "@/components/ui/MotionButton";
import Collapse from "@/components/ui/Collapse";
import CircularProgress from "@/components/ui/CircularProgress";
import { Trophy, CheckCircle2, Circle } from "lucide-react";
import { motion } from "framer-motion";

/* Tipos */
type Course = { id: string; title: string; description: string | null; is_active?: boolean };
type Module = { id: string; course_id: string; title: string; sort_order: number; is_active?: boolean };
type Prog = { id: string; module_id: string; completed: boolean; points: number; completed_at: string | null };

/* Helpers (semana) – não usados agora, mas mantidos se for evoluir metas semanais */
function startOfWeek(d = new Date()) {
  const date = new Date(d);
  const day = (date.getDay() + 6) % 7;
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - day);
  return date;
}
function endOfWeek(d = new Date()) {
  const s = startOfWeek(d);
  const e = new Date(s);
  e.setDate(s.getDate() + 7);
  return e;
}

export default function MePage() {
  return (
    <AuthGuard>
      <AppShell>
        <Content />
      </AppShell>
    </AuthGuard>
  );
}

function Content() {
  const supabase = useMemo(() => supabaseBrowser(), []);
  const toast = useToast();

  const [courses, setCourses] = useState<Course[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [progress, setProgress] = useState<Prog[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setMsg(null);

      const [c1, m1, p1] = await Promise.all([
        supabase.from("courses").select("id, title, description, is_active").eq("is_active", true),
        supabase
          .from("modules")
          .select("id, course_id, title, sort_order, is_active")
          .eq("is_active", true)
          .order("sort_order", { ascending: true }),
        supabase.from("progress").select("id, module_id, completed, points, completed_at"),
      ]);

      if (c1.error) setMsg(c1.error.message);
      if (m1.error) setMsg(m1.error.message);
      if (p1.error) setMsg(p1.error.message);

      setCourses((c1.data as Course[]) ?? []);
      setModules((m1.data as Module[]) ?? []);
      setProgress((p1.data as Prog[]) ?? []);
      setLoading(false);
    }
    load();
  }, [supabase]);

  const progByModule = useMemo(() => {
    const map = new Map<string, Prog>();
    for (const p of progress) map.set(p.module_id, p);
    return map;
  }, [progress]);

  const totalPoints = useMemo(() => progress.reduce((acc, p) => acc + (p.points ?? 0), 0), [progress]);
  const activeModules = useMemo(() => modules.filter((m) => m.is_active !== false), [modules]);
  const completedCount = useMemo(
    () => activeModules.filter((m) => progByModule.get(m.id)?.completed).length,
    [activeModules, progByModule]
  );
  const totalCount = activeModules.length || 1;
  const percent = Math.min(100, Math.round((completedCount / totalCount) * 100));
  const level = Math.floor(totalPoints / 100) + 1; // 100 pts por nível

  /* Ação: alternar conclusão de módulo */
  async function toggleModule(moduleId: string) {
    setBusy(moduleId);
    setMsg(null);
    try {
      const current = progByModule.get(moduleId);

      if (!current) {
        const { data, error } = await supabase
          .from("progress")
          .insert([{ module_id: moduleId, completed: true, points: 10, completed_at: new Date().toISOString() }])
          .select()
          .single();
        if (error) throw error;
        setProgress((s) => [...s, data as Prog]);
      } else {
        const newCompleted = !current.completed;
        const newPoints = newCompleted ? 10 : 0;
        const newCompletedAt = newCompleted ? new Date().toISOString() : null;
        const { data, error } = await supabase
          .from("progress")
          .update({ completed: newCompleted, points: newPoints, completed_at: newCompletedAt })
          .eq("id", current.id)
          .select()
          .single();
        if (error) throw error;
        setProgress((s) => s.map((p) => (p.id === current.id ? (data as Prog) : p)));
      }
      toast.push("Atualizando...");
    } catch (e: any) {
      setMsg(e.message ?? "Falha ao atualizar progresso.");
      toast.push("Erro ao atualizar progresso");
    } finally {
      setBusy(null);
    }
  }

  /* UI */
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* HERO — pontos, progresso e nível */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#1E3A8A]/50 via-[#0b0f1a]/40 to-[#A3E635]/20 p-6">
        {/* auroras suaves */}
        <motion.div
          className="pointer-events-none absolute -top-24 -left-16 h-64 w-64 rounded-full"
          style={{ background: "radial-gradient(closest-side, rgba(163,230,53,0.18), transparent)" }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
        />
        <motion.div
          className="pointer-events-none absolute -bottom-24 -right-16 h-72 w-72 rounded-full"
          style={{ background: "radial-gradient(closest-side, rgba(30,58,138,0.25), transparent)" }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.1 }}
        />

        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* Pontos totais */}
          <div className="flex items-center gap-5">
            <div className="rounded-2xl bg-white/10 p-4 shadow-inner">
              <Trophy size={42} />
            </div>
            <div>
              <div className="opacity-80 text-sm">Seus pontos:</div>
              <div className="text-4xl md:text-5xl font-bold tracking-tight text-accent">
                {totalPoints}
              </div>
            </div>
          </div>

          {/* Progresso geral — donut */}
          <div className="flex md:justify-center">
            <div className="flex items-center gap-4">
              <CircularProgress value={percent} size={96} strokeWidth={10} />
              <div>
                <div className="text-2xl font-semibold text-accent leading-none">{percent}%</div>
                <div className="opacity-80 text-sm mt-1">
                  {completedCount}/{totalCount} módulos concluídos
                </div>
              </div>
            </div>
          </div>

          {/* Nível do Usuário */}
          <div className="md:justify-end flex">
            <div className="text-right">
              <div className="font-semibold text-accent text-lg">Nível {level}</div>
              <div className="text-xs opacity-75">Próximo: {level * 100} pts</div>
            </div>
          </div>
        </div>
      </div>

      {msg && (
        <div className="mt-4 p-3 rounded-xl border border-white/10 bg-white/10 text-sm">
          {msg}
        </div>
      )}

      {/* Cursos ativos */}
      <h2 className="mt-10 mb-3 text-lg font-semibold opacity-80">Cursos ativos</h2>

      <div className="grid grid-cols-1 gap-5">
        {loading ? (
          <>
            <Card className="h-32 bg-white/[0.03] border-white/5" />
            <Card className="h-32 bg-white/[0.03] border-white/5" />
          </>
        ) : courses.length === 0 ? (
          <Card className="p-4">Nenhum curso ativo. Use “Popular demo” em Admin.</Card>
        ) : (
          courses.map((c) => {
            const courseModules = modules.filter((m) => m.course_id === c.id);
            const doneCount = courseModules.filter((m) => progByModule.get(m.id)?.completed).length;

            return (
              <Card
                key={c.id}
                className="p-0 overflow-hidden bg-white/[0.03] border-white/5 shadow-[0_0_6px_rgba(255,255,255,0.04)]"
              >
                <Collapse
                  defaultOpen
                  title={
                    <div className="w-full flex items-center justify-between p-4 text-left">
                      <div>
                        <div className="font-semibold tracking-tight">{c.title}</div>
                        {c.description && (
                          <div className="text-xs opacity-70 mt-0.5">{c.description}</div>
                        )}
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-md bg-white/10 border border-white/10">
                        {doneCount}/{courseModules.length}
                      </span>
                    </div>
                  }
                >
                  <div className="p-2">
                    {courseModules.length === 0 ? (
                      <div className="opacity-70 text-sm px-2 py-3">
                        Carregando módulos...
                      </div>
                    ) : (
                      courseModules.map((m) => {
                        const st = progByModule.get(m.id);
                        const done = !!st?.completed;
                        return (
                          <div
                            key={m.id}
                            className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-white/5 transition"
                          >
                            <div className="flex items-center gap-2">
                              {done ? (
                                <CheckCircle2 size={16} className="text-accent" />
                              ) : (
                                <Circle size={16} className="opacity-60" />
                              )}
                              <div>
                                <div className="font-medium text-sm">{m.title}</div>
                                <div className="text-xs opacity-70">
                                  {done ? "Concluído (+10 pts)" : "Pendente"}
                                </div>
                              </div>
                            </div>

                            <MotionButton
                              onClick={() => toggleModule(m.id)}
                              disabled={busy === m.id}
                              aria-busy={busy === m.id}
                              className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs"
                            >
                              {busy === m.id ? "Atualizando..." : done ? "Desfazer" : "Concluir"}
                            </MotionButton>
                          </div>
                        );
                      })
                    )}
                  </div>
                </Collapse>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
