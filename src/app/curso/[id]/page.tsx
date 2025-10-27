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
type Module = {
  id: string;
  course_id: string;
  title: string;
  sort_order: number;
  is_active?: boolean;
};
type Prog = {
  id?: string;
  user_id: string;
  module_id: string;
  completed: boolean;
  points: number | null;
  completed_at: string | null;
};

/* Config */
const POINTS_PER_MODULE = 10;

/* Donut reutilizável (mini) */
function Donut({
  value,
  size = 120,
  stroke = 10,
}: {
  value: number;
  size?: number;
  stroke?: number;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = useSpring(0, { stiffness: 60, damping: 15 });
  const dash = useTransform(
    progress,
    (v) => circumference - (v / 100) * circumference
  );
  useEffect(() => {
    progress.set(value);
  }, [value, progress]);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="-rotate-90" width={size} height={size}>
        <defs>
          <linearGradient id="gradCourse" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#a3e635" />
            <stop offset="100%" stopColor="#bef264" />
          </linearGradient>
        </defs>
        <circle
          stroke="rgba(255,255,255,0.08)"
          fill="none"
          strokeWidth={stroke}
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <motion.circle
          stroke="url(#gradCourse)"
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          strokeDasharray={circumference}
          style={{
            strokeDashoffset: dash,
            filter: "drop-shadow(0 0 8px rgba(163,230,53,0.4))",
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          key={`pct-${value}`}
          initial={{ scale: 0.95 }}
          animate={{ scale: [0.95, 1.06, 1] }}
          transition={{ duration: 0.45 }}
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
  await confetti({
    particleCount: 70,
    spread: 60,
    startVelocity: 42,
    origin: { y: 0.6 },
  });
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
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);
  const router = useRouter();
  const supabase = useMemo(() => supabaseBrowser(), []);
  const toast = useToast();

  const [uid, setUid] = useState<string | null>(null);

  const [courseTitle, setCourseTitle] = useState("");
  const [modules, setModules] = useState<Module[]>([]);
  const [progress, setProgress] = useState<Map<string, Prog>>(new Map());
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [pulse, setPulse] = useState(0);
  const [err, setErr] = useState<string | null>(null);

  // 1) Quem é o usuário?
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUid(data.user?.id ?? null));
  }, [supabase]);

  // 2) Carrega dados do curso + módulos + progresso DO USUÁRIO
  useEffect(() => {
    if (!uid) return; // espera saber quem é o user
    if (!id) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      setErr(null);

      try {
        const [c1, m1] = await Promise.all([
          supabase.from("courses").select("title").eq("id", id).maybeSingle(),
          supabase
            .from("modules")
            .select("id, course_id, title, sort_order, is_active")
            .eq("course_id", id)
            .eq("is_active", true)
            .order("sort_order", { ascending: true }),
        ]);

        if (c1.error) throw c1.error;
        if (!c1.data) throw new Error("Curso não encontrado.");

        const mods = (m1.data as Module[]) ?? [];
        const modIds = mods.map((m) => m.id);

        // progresso APENAS do usuário logado
        let progMap = new Map<string, Prog>();
        if (modIds.length) {
          const { data: pRows, error: pErr } = await supabase
            .from("progress")
            .select("id,user_id,module_id,completed,points,completed_at")
            .eq("user_id", uid)
            .in("module_id", modIds);

          if (pErr) throw pErr;

          for (const p of (pRows as Prog[]) ?? []) {
            progMap.set(p.module_id, p);
          }
        }

        if (!cancelled) {
          setCourseTitle(c1.data.title);
          setModules(mods);
          setProgress(progMap);
        }
      } catch (e: any) {
        if (!cancelled) setErr(e?.message || "Falha ao carregar o curso.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [supabase, uid, id]);

  // Índices rápidos
  const doneCount = useMemo(
    () => modules.filter((m) => progress.get(m.id)?.completed).length,
    [modules, progress]
  );
  const percent = useMemo(() => {
    const total = modules.length || 1;
    return Math.round((doneCount / total) * 100);
  }, [modules.length, doneCount]);

  const coursePoints = useMemo(
    () =>
      modules.reduce(
        (acc, m) => acc + (progress.get(m.id)?.points ?? 0),
        0
      ),
    [modules, progress]
  );

  async function toggleModule(moduleId: string) {
    if (!uid) return;
    setBusy(moduleId);

    const current = progress.get(moduleId);
    const willComplete = !(current?.completed ?? false);

    try {
      if (!current) {
        // INSERT — cria registro só para ESTE usuário
        const { data, error } = await supabase
          .from("progress")
          .insert([
            {
              user_id: uid,
              module_id: moduleId,
              completed: true,
              points: POINTS_PER_MODULE,
              completed_at: new Date().toISOString(),
            },
          ])
          .select("id,user_id,module_id,completed,points,completed_at")
          .single();
        if (error) throw error;

        // otimista
        setProgress((prev) => {
          const next = new Map(prev);
          next.set(moduleId, data as Prog);
          return next;
        });

        toast.push(`+${POINTS_PER_MODULE} pts adicionados`);
        setPulse((p) => p + 1);

        const allDone = modules.every((m) =>
          m.id === moduleId ? true : !!progress.get(m.id)?.completed
        );
        if (allDone) {
          fireConfetti();
          toast.push("🎉 Curso concluído!");
        }
      } else {
        // UPDATE — só do próprio usuário
        const { data, error } = await supabase
          .from("progress")
          .update({
            completed: willComplete,
            points: willComplete ? POINTS_PER_MODULE : 0,
            completed_at: willComplete ? new Date().toISOString() : null,
          })
          .eq("id", current.id)
          .eq("user_id", uid) // garante que só atualiza do próprio user
          .select("id,user_id,module_id,completed,points,completed_at")
          .single();

        if (error) throw error;

        setProgress((prev) => {
          const next = new Map(prev);
          next.set(moduleId, data as Prog);
          return next;
        });

        toast.push(
          willComplete
            ? `+${POINTS_PER_MODULE} pts adicionados`
            : `-${POINTS_PER_MODULE} pts removidos`
        );
        setPulse((p) => p + 1);

        if (willComplete) {
          const allDone = modules.every((m) =>
            m.id === moduleId ? true : !!progress.get(m.id)?.completed
          );
          if (allDone) {
            fireConfetti();
            toast.push("🎉 Curso concluído!");
          }
        }
      }
    } catch (e: any) {
      toast.push(e?.message ?? "Erro ao atualizar módulo");
      // rollback fino: recarrega apenas aquele registro do server
      const { data: pRow } = await supabase
        .from("progress")
        .select("id,user_id,module_id,completed,points,completed_at")
        .eq("user_id", uid)
        .eq("module_id", moduleId)
        .maybeSingle();
      setProgress((prev) => {
        const next = new Map(prev);
        if (pRow) next.set(moduleId, pRow as Prog);
        else next.delete(moduleId);
        return next;
      });
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
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl p-7 bg-gradient-to-b from-neutral-900 to-black shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]"
      >
        {loading ? (
          <div className="h-20 animate-pulse bg-white/5 rounded-lg" />
        ) : err ? (
          <div className="text-sm text-red-300">{err}</div>
        ) : (
          <div className="flex items-center justify-between gap-6 flex-wrap">
            <div className="min-w-[220px]">
              <h1 className="text-2xl md:text-3xl font-semibold text-white/90">
                {courseTitle || "Curso"}
              </h1>
              <div className="mt-2 flex items-center gap-2 text-white/70">
                <Trophy size={18} className="text-lime-300" />
                <motion.span
                  key={`pts-${pulse}-${coursePoints}`}
                  initial={{ scale: 1 }}
                  animate={{ scale: [1, 1.06, 1] }}
                  transition={{ duration: 0.4 }}
                  className="font-medium"
                >
                  {coursePoints} pts no curso
                </motion.span>
              </div>
              <div className="text-xs text-white/50 mt-1">
                {doneCount}/{modules.length || 0} módulos concluídos
              </div>
            </div>

            <motion.div
              key={`donut-${pulse}-${percent}`}
              initial={{ scale: 0.95, opacity: 0.9 }}
              animate={{ scale: [0.95, 1.05, 1], opacity: [0.9, 1, 1] }}
              transition={{ duration: 0.5 }}
              className="flex items-center gap-4"
            >
              <Donut value={percent} />
            </motion.div>
          </div>
        )}
      </motion.div>

      {/* Lista de módulos */}
      <div className="mt-8">
        {loading ? (
          <div className="text-sm text-white/60">Carregando módulos…</div>
        ) : modules.length === 0 ? (
          <div className="text-sm text-white/60">
            Nenhum módulo encontrado.
          </div>
        ) : (
          <ul className="divide-y divide-white/10 rounded-xl overflow-hidden bg-white/[0.03] border border-white/10">
            {modules.map((m) => {
              const st = progress.get(m.id);
              const done = !!st?.completed;
              const busyHere = busy === m.id;

              return (
                <li
                  key={m.id}
                  className="flex items-center justify-between px-5 py-4 hover:bg-white/[0.04] transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {done ? (
                      <CheckCircle2 size={18} className="text-lime-300" />
                    ) : (
                      <Circle size={18} className="opacity-50" />
                    )}
                    <div className="truncate">
                      <div
                        className={`font-medium truncate ${
                          done ? "text-white/60 line-through" : "text-white/90"
                        }`}
                      >
                        {m.title}
                      </div>
                      <div className="text-xs text-white/50">
                        {done
                          ? `Concluído (+${POINTS_PER_MODULE} pts)`
                          : "Pendente"}
                      </div>
                    </div>
                  </div>
                  <MotionButton
                    onClick={() => toggleModule(m.id)}
                    disabled={busyHere || !uid}
                    aria-busy={busyHere}
                    className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
                      busyHere
                        ? "bg-white/5 text-white/50"
                        : done
                        ? "bg-white/5 text-white/60 hover:bg-white/10"
                        : "bg-lime-400/10 text-lime-300 hover:bg-lime-400/20"
                    }`}
                  >
                    {busyHere ? "Atualizando..." : done ? "Desfazer" : "Concluir"}
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
