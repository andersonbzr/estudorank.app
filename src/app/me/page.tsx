// src/app/me/page.tsx
"use client";

import AuthGuard from "@/components/AuthGuard";
import AppShell from "@/components/shell/AppShell";
import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useToast } from "@/components/Toast";
import { Trophy } from "lucide-react";
import { motion, useSpring, useTransform } from "framer-motion";
import Link from "next/link";

/* Tipos */
type Course = { id: string; title: string; description: string | null; is_active?: boolean };
type Module = { id: string; course_id: string; title: string; sort_order: number; is_active?: boolean };
type Prog = { id: string; module_id: string; completed: boolean; points: number; completed_at: string | null };

/* Helpers */
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

/* Confetti elegante */
async function fireConfetti() {
  const confetti = (await import("canvas-confetti")).default;
  const bursts = [
    { particleCount: 70, spread: 55, startVelocity: 45 },
    { particleCount: 50, spread: 75, startVelocity: 35, decay: 0.9 },
    { particleCount: 40, spread: 60, startVelocity: 30, scalar: 0.9 },
  ];
  const origin = { y: 0.6 };
  for (const b of bursts) {
    confetti({ ...b, origin });
    await new Promise((r) => setTimeout(r, 180));
  }
}

/* Donut progress moderno */
function DonutProgress({ value, size = 140, stroke = 12 }: { value: number; size?: number; stroke?: number }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = useSpring(0, { stiffness: 60, damping: 15 });
  const strokeDashoffset = useTransform(progress, (v) => circumference - (v / 100) * circumference);

  useEffect(() => {
    progress.set(value);
  }, [value, progress]);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#a3e635" />
            <stop offset="100%" stopColor="#bef264" />
          </linearGradient>
        </defs>

        {/* Fundo */}
        <circle
          stroke="rgba(255,255,255,0.08)"
          fill="transparent"
          strokeWidth={stroke}
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        {/* Traço animado */}
        <motion.circle
          stroke="url(#grad)"
          fill="transparent"
          strokeWidth={stroke}
          strokeLinecap="round"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          strokeDasharray={circumference}
          style={{ strokeDashoffset, filter: "drop-shadow(0 0 8px rgba(163,230,53,0.4))" }}
        />
      </svg>

      {/* Valor central */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          key={`donut-text-${value}`}
          initial={{ scale: 0.95 }}
          animate={{ scale: [0.95, 1.08, 1] }}
          transition={{ duration: 0.5 }}
          className="text-3xl font-semibold text-lime-300"
        >
          {Math.round(value)}%
        </motion.span>
        <span className="text-xs text-white/50 mt-1">Progresso</span>
      </div>
    </div>
  );
}

/* Skeletons (shimmer) para a tabela de cursos */
function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-md bg-white/10 ${className}`}>
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <style jsx>{`
        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
}

function SkeletonRow() {
  return (
    <li className="grid md:grid-cols-[1fr,180px,240px,180px] grid-cols-1 gap-3 px-6 py-5">
      {/* Conteúdo */}
      <div className="flex items-start gap-3">
        <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/15" />
        <div className="flex-1">
          <SkeletonBlock className="h-4 w-56" />
          <SkeletonBlock className="h-3 w-40 mt-2" />
        </div>
      </div>

      {/* Status */}
      <div className="md:text-left">
        <SkeletonBlock className="h-3 w-24" />
      </div>

      {/* Progresso */}
      <div className="flex items-center gap-3">
        <SkeletonBlock className="h-2.5 w-48" />
        <SkeletonBlock className="h-3 w-8" />
      </div>

      {/* Última interação */}
      <div className="md:text-left">
        <SkeletonBlock className="h-3 w-24" />
      </div>
    </li>
  );
}

function SkeletonCoursesTable({ rows = 3 }: { rows?: number }) {
  return (
    <div className="rounded-2xl overflow-hidden bg-white/[0.03] border border-white/10">
      {/* Cabeçalho fixo da tabela */}
      <div className="hidden md:grid grid-cols-[1fr,180px,240px,180px] px-6 py-3 text-xs uppercase tracking-wide text-white/60 border-b border-white/10">
        <div>Conteúdo</div>
        <div>Status</div>
        <div>Progresso</div>
        <div>Última interação</div>
      </div>

      <ul className="divide-y divide-white/10 animate-pulse">
        {Array.from({ length: rows }).map((_, i) => (
          <SkeletonRow key={i} />
        ))}
      </ul>
    </div>
  );
}

/* Linha de progresso horizontal (tabela) */
function LineProgress({ value }: { value: number }) {
  const v = Math.min(100, Math.max(0, Math.round(value)));
  return (
    <div className="w-48 h-2.5 rounded-full bg-white/10 overflow-hidden">
      <div className="h-full bg-lime-400" style={{ width: `${v}%` }} />
    </div>
  );
}

/* Data format para 'Última interação' */
function formatDate(d?: string | null) {
  if (!d) return "—";
  try {
    return new Date(d)
      .toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })
      .replace(".", "");
  } catch {
    return "—";
  }
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
  const [msg, setMsg] = useState<string | null>(null);
  const [pulseTick, setPulseTick] = useState(0);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [c1, m1, p1] = await Promise.all([
        supabase.from("courses").select("id, title, description, is_active").eq("is_active", true),
        supabase
          .from("modules")
          .select("id, course_id, title, sort_order, is_active")
          .eq("is_active", true)
          .order("sort_order", { ascending: true }),
        supabase.from("progress").select("id, module_id, completed, points, completed_at"),
      ]);
      if (c1.error || m1.error || p1.error) setMsg(c1.error?.message || m1.error?.message || p1.error?.message);
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

  const totalPoints = progress.reduce((acc, p) => acc + (p.points ?? 0), 0);
  const activeModules = modules.filter((m) => m.is_active !== false);
  const completedCount = activeModules.filter((m) => progByModule.get(m.id)?.completed).length;
  const totalCount = activeModules.length || 1;
  const percent = Math.min(100, Math.round((completedCount / totalCount) * 100));
  const level = Math.floor(totalPoints / 100) + 1;

  /* UI */
  return (
    <div className="max-w-6xl mx-auto px-5 md:px-8 py-8 md:py-10">
      {/* Header moderno com donut central */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl p-10
                   bg-gradient-to-b from-neutral-900 to-black
                   shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]
                   text-center"
      >
        <motion.div
          key={`aurora-${pulseTick}`}
          className="pointer-events-none absolute -top-28 left-1/2 -translate-x-1/2 h-72 w-72 rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(163,230,53,0.25), transparent)" }}
          initial={{ opacity: 0.2 }}
          animate={{ opacity: [0.2, 0.4, 0.2], scale: [0.9, 1.05, 0.9] }}
          transition={{ duration: 6, repeat: Infinity }}
        />
        <div className="relative z-10 flex flex-col items-center justify-center gap-6">
          <div className="flex items-center gap-3">
            <Trophy size={40} className="text-lime-300 drop-shadow-[0_0_8px_rgba(163,230,53,0.3)]" />
            <motion.div
              key={`points-${pulseTick}-${totalPoints}`}
              initial={{ scale: 1 }}
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 0.5 }}
              className="text-4xl md:text-5xl font-semibold tracking-tight text-lime-300"
            >
              {totalPoints} pts
            </motion.div>
          </div>

          <motion.div
            key={`donut-${pulseTick}-${percent}`}
            initial={{ scale: 0.9, opacity: 0.9 }}
            animate={{ scale: [0.9, 1.05, 1], opacity: [0.9, 1, 1] }}
            transition={{ duration: 0.6 }}
          >
            <DonutProgress value={percent} />
          </motion.div>

          <motion.div
            key={`level-${pulseTick}-${level}`}
            initial={{ scale: 1 }}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 0.45 }}
            className="text-lime-300 font-semibold text-lg mt-2"
          >
            Nível {level} <span className="text-white/60 text-sm">— Próximo: {level * 100} pts</span>
          </motion.div>
        </div>
      </motion.div>

      {msg && (
        <div className="mt-4 p-3 rounded-xl border border-white/10 bg-white/10 text-sm text-center">
          {msg}
        </div>
      )}

      <h2 className="mt-12 mb-4 text-lg md:text-xl font-semibold text-white/90">Cursos ativos</h2>

      {/* Tabela minimalista com shimmer */}
      <div className="rounded-2xl overflow-hidden bg-white/[0.03] border border-white/10">
        {/* Cabeçalho */}
        <div className="hidden md:grid grid-cols-[1fr,180px,240px,180px] px-6 py-3 text-xs uppercase tracking-wide text-white/60 border-b border-white/10">
          <div>Conteúdo</div>
          <div>Status</div>
          <div>Progresso</div>
          <div>Última interação</div>
        </div>

        {/* Conteúdo */}
        {loading ? (
          <SkeletonCoursesTable rows={3} />
        ) : courses.length === 0 ? (
          <div className="p-6 text-sm text-white/70">Nenhum curso ativo.</div>
        ) : (
          <ul className="divide-y divide-white/10">
            {courses.map((c) => {
              const courseModules = modules.filter((m) => m.course_id === c.id);
              const totalRaw = courseModules.length;       // total real de módulos
              const total = totalRaw || 1;                 // evita divisão por zero no %
              const doneCount = courseModules.filter((m) => progByModule.get(m.id)?.completed).length;
              const pcent = Math.round((doneCount / total) * 100);

              // 3 estados
              let status: "CONCLUÍDO" | "EM ANDAMENTO" | "NÃO INICIADO";
              if (totalRaw === 0 || doneCount === 0) {
                status = "NÃO INICIADO";
              } else if (doneCount < totalRaw) {
                status = "EM ANDAMENTO";
              } else {
                status = "CONCLUÍDO";
              }

              // maior completed_at do curso
              let last: string | null = null;
              for (const m of courseModules) {
                const prog = progByModule.get(m.id);
                if (prog?.completed_at) {
                  if (!last || new Date(prog.completed_at) > new Date(last)) last = prog.completed_at;
                }
              }

              return (
                <li
                  key={c.id}
                  className="grid md:grid-cols-[1fr,180px,240px,180px] grid-cols-1 gap-3 px-6 py-5 hover:bg-white/[0.04] transition-colors"
                >
                  {/* Conteúdo */}
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/15">
                      {/* play icon minimalista */}
                      <svg width="12" height="12" viewBox="0 0 24 24" className="opacity-70">
                        <path fill="currentColor" d="M8 5v14l11-7z" />
                      </svg>
                    </span>
                    <div>
                      <Link
                        href={`/curso/${c.id}`}
                        className="font-medium text-white/90 hover:underline"
                      >
                        {c.title}
                      </Link>
                      {c.description && <div className="text-sm text-white/60">{c.description}</div>}
                    </div>
                  </div>

                  {/* Status */}
                  <div className="md:text-left">
                    <span
                      className={`text-[11px] font-semibold tracking-wide ${
                        status === "CONCLUÍDO"
                          ? "text-lime-300"
                          : status === "EM ANDAMENTO"
                          ? "text-white/70"
                          : "text-white/50" // NÃO INICIADO
                      }`}
                    >
                      {status}
                    </span>
                  </div>

                  {/* Progresso */}
                  <div className="flex items-center gap-3">
                    <LineProgress value={pcent} />
                    <span className="text-sm text-white/70">{pcent}%</span>
                  </div>

                  {/* Última interação */}
                  <div className="text-sm text-white/70 md:text-left">{formatDate(last)}</div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
