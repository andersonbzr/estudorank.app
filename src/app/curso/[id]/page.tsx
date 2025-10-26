// src/app/curso/[id]/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useToast } from "@/components/Toast";
import AuthGuard from "@/components/AuthGuard";
import AppShell from "@/components/shell/AppShell";
import MotionButton from "@/components/ui/MotionButton";
import { motion, useSpring, useTransform } from "framer-motion";
import { ArrowLeft, CheckCircle2, Circle, Trophy } from "lucide-react";

/* Tipos */
type Module = { id: string; course_id: string; title: string; sort_order: number; is_active?: boolean };
type Prog = { id: string; module_id: string; completed: boolean; points: number; completed_at: string | null };

/* Donut reutilizável (mini) */
function Donut({ value, size = 120, stroke = 10 }: { value: number; size?: number; stroke?: number }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = useSpring(0, { stiffness: 60, damping: 15 });
  const dash = useTransform(progress, (v) => circumference - (v / 100) * circumference);
  useEffect(() => { progress.set(value); }, [value, progress]);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="-rotate-90" width={size} height={size}>
        <defs>
          <linearGradient id="gradCourse" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#a3e635" />
            <stop offset="100%" stopColor="#bef264" />
          </linearGradient>
        </defs>
        <circle stroke="rgba(255,255,255,0.08)" fill="none" strokeWidth={stroke} r={radius} cx={size/2} cy={size/2} />
        <motion.circle
          stroke="url(#gradCourse)" fill="none" strokeWidth={stroke} strokeLinecap="round"
          r={radius} cx={size/2} cy={size/2} strokeDasharray={circumference}
          style={{ strokeDashoffset: dash, filter: "drop-shadow(0 0 8px rgba(163,230,53,0.4))" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          key={`pct-${value}`}
          initial={{ scale: 0.95 }} animate={{ scale: [0.95,1.06,1] }} transition={{ duration: 0.45 }}
          className="text-2xl font-semibold text-lime-300"
        >
          {Math.round(value)}%
        </motion.span>
        <span className="text-[11px] text-white/50">progresso</span>
      </div>
    </div>
  );
}

/* Confetti */
async function fireConfetti() {
  const confetti = (await import("canvas-confetti")).default;
  await confetti({ particleCount: 70, spread: 60, startVelocity: 42, origin: { y: 0.6 } });
}

export default function CursoPage() {
  return (
    <AuthGuard>
      <AppShell>
        <Content />
      </AppShell>
    </AuthGuard>
  );
}

function Content() {
  const { id } = useParams();
  const router = useRouter();
  const supabase = useMemo(() => supabaseBrowser(), []);
  const toast = useToast();

  const [courseTitle, setCourseTitle] = useState("");
  const [modules, setModules] = useState<Module[]>([]);
  const [progress, setProgress] = useState<Prog[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [c1, m1, p1] = await Promise.all([
        supabase.from("courses").select("title").eq("id", id).single(),
        supabase.from("modules")
          .select("id, course_id, title, sort_order, is_active")
          .eq("course_id", id).eq("is_active", true).order("sort_order", { ascending: true }),
        supabase.from("progress").select("id, module_id, completed, points, completed_at"),
      ]);
      if (c1.data) setCourseTitle(c1.data.title);
      setModules((m1.data as Module[]) ?? []);
      setProgress((p1.data as Prog[]) ?? []);
      setLoading(false);
    }
    load();
  }, [id, supabase]);

  // Índices rápidos
  const progByModule = useMemo(() => {
    const map = new Map<string, Prog>();
    for (const p of progress) map.set(p.module_id, p);
    return map;
  }, [progress]);

  // Métricas do curso
  const total = modules.length || 1;
  const doneCount = modules.filter((m) => progByModule.get(m.id)?.completed).length;
  const percent = Math.round((doneCount / total) * 100);
  const coursePoints = modules.reduce((acc, m) => acc + (progByModule.get(m.id)?.points ?? 0), 0);

  async function toggleModule(moduleId: string) {
    setBusy(moduleId);
    try {
      const current = progByModule.get(moduleId);
      if (!current) {
        const { data, error } = await supabase
          .from("progress")
          .insert([{ module_id: moduleId, completed: true, points: 10, completed_at: new Date().toISOString() }])
          .select().single();
        if (error) throw error;
        setProgress((s) => [...s, data as Prog]);
        toast.push("+10 pts adicionados");
        setPulse((p) => p + 1);
        if ((doneCount + 1) === modules.length) {
          fireConfetti();
          toast.push("🎉 Curso concluído!");
        }
      } else {
        const newCompleted = !current.completed;
        const newPoints = newCompleted ? 10 : 0;
        const { data, error } = await supabase
          .from("progress")
          .update({ completed: newCompleted, points: newPoints, completed_at: newCompleted ? new Date().toISOString() : null })
          .eq("id", current.id)
          .select().single();
        if (error) throw error;
        setProgress((s) => s.map((p) => (p.id === current.id ? (data as Prog) : p)));
        toast.push(newCompleted ? "+10 pts adicionados" : "-10 pts removidos");
        setPulse((p) => p + 1);
        if (newCompleted && (doneCount + 1) === modules.length) {
          fireConfetti();
          toast.push("🎉 Curso concluído!");
        }
      }
    } catch (e: any) {
      toast.push(e.message ?? "Erro ao atualizar módulo");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-5 md:px-8 py-10">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="mb-6 inline-flex items-center gap-2 text-white/70 hover:text-white transition"
      >
        <ArrowLeft size={18} />
        Voltar
      </button>

      {/* Header do curso com mini-dashboard */}
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl p-7 bg-gradient-to-b from-neutral-900 to-black shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]"
      >
        <div className="flex items-center justify-between gap-6 flex-wrap">
          <div className="min-w-[220px]">
            <h1 className="text-2xl md:text-3xl font-semibold text-white/90">{courseTitle}</h1>
            <div className="mt-2 flex items-center gap-2 text-white/70">
              <Trophy size={18} className="text-lime-300" />
              <motion.span
                key={`pts-${pulse}-${coursePoints}`}
                initial={{ scale: 1 }} animate={{ scale: [1, 1.06, 1] }} transition={{ duration: 0.4 }}
                className="font-medium"
              >
                {coursePoints} pts no curso
              </motion.span>
            </div>
            <div className="text-xs text-white/50 mt-1">{doneCount}/{modules.length || 0} módulos concluídos</div>
          </div>

          <motion.div
            key={`donut-${pulse}-${percent}`}
            initial={{ scale: 0.95, opacity: 0.9 }} animate={{ scale: [0.95, 1.05, 1], opacity: [0.9, 1, 1] }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-4"
          >
            <Donut value={percent} />
          </motion.div>
        </div>
      </motion.div>

      {/* Lista de módulos */}
      <div className="mt-8">
        {loading ? (
          <div className="text-sm text-white/60">Carregando módulos…</div>
        ) : modules.length === 0 ? (
          <div className="text-sm text-white/60">Nenhum módulo encontrado.</div>
        ) : (
          <ul className="divide-y divide-white/10 rounded-xl overflow-hidden bg-white/[0.03] border border-white/10">
            {modules.map((m) => {
              const st = progByModule.get(m.id);
              const done = !!st?.completed;
              return (
                <li key={m.id} className="flex items-center justify-between px-5 py-4 hover:bg-white/[0.04] transition">
                  <div className="flex items-center gap-3">
                    {done ? <CheckCircle2 size={18} className="text-lime-300" /> : <Circle size={18} className="opacity-50" />}
                    <div>
                      <div className={`font-medium ${done ? "text-white/60 line-through" : "text-white/90"}`}>{m.title}</div>
                      <div className="text-xs text-white/50">{done ? "Concluído (+10 pts)" : "Pendente"}</div>
                    </div>
                  </div>
                  <MotionButton
                    onClick={() => toggleModule(m.id)}
                    disabled={busy === m.id}
                    aria-busy={busy === m.id}
                    className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
                      busy === m.id
                        ? "bg-white/5 text-white/50"
                        : done
                        ? "bg-white/5 text-white/60 hover:bg-white/10"
                        : "bg-lime-400/10 text-lime-300 hover:bg-lime-400/20"
                    }`}
                  >
                    {busy === m.id ? "Atualizando..." : done ? "Desfazer" : "Concluir"}
                  </MotionButton>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
