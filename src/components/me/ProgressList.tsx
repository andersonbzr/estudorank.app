"use client";

import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

type Course = { id: string; title: string; is_active: boolean };
type Module = { id: string; course_id: string; is_active: boolean };
type Completion = { module_id: string };

export default function ProgressList() {
  const sb = useMemo(() => supabaseBrowser(), []);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<
    { course: Course; total: number; done: number }[]
  >([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);

      // 1) usuário atual
      const { data: u } = await sb.auth.getUser();
      const uid = u.user?.id;
      if (!uid) {
        if (mounted) setItems([]);
        setLoading(false);
        return;
      }

      // 2) cursos e módulos
      const [c1, m1] = await Promise.all([
        sb.from("courses")
          .select("id,title,is_active")
          .eq("is_active", true)
          .order("created_at", { ascending: true }),
        sb.from("modules")
          .select("id,course_id,is_active")
          .eq("is_active", true)
          .order("sort_order", { ascending: true }),
      ]);

      const courses: Course[] = (c1.data as any) ?? [];
      const modules: Module[] = (m1.data as any) ?? [];

      // 3) completions do usuário, filtrando pelos módulos retornados
      const modIds = modules.map((m) => m.id);
      let completions: Completion[] = [];
      if (modIds.length > 0) {
        const { data: comp } = await sb
          .from("module_completions")
          .select("module_id")
          .eq("user_id", uid)
          .in("module_id", modIds);
        completions = (comp as any) ?? [];
      }

      // 4) agrupa por curso
      const doneSet = new Set(completions.map((c) => c.module_id));
      const byCourse: Record<string, { total: number; done: number }> = {};
      for (const m of modules) {
        const bucket = (byCourse[m.course_id] ||= { total: 0, done: 0 });
        bucket.total += 1;
        if (doneSet.has(m.id)) bucket.done += 1;
      }

      const data = courses
        .map((c) => ({
          course: c,
          total: byCourse[c.id]?.total ?? 0,
          done: byCourse[c.id]?.done ?? 0,
        }))
        // esconde cursos sem módulos
        .filter((it) => it.total > 0);

      if (mounted) setItems(data);
      setLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, [sb]);

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="h-4 w-56 bg-white/10 rounded animate-pulse" />
            <div className="mt-2 h-2.5 w-full bg-white/10 rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return <div className="text-sm text-white/70">Sem progresso ainda.</div>;
  }

  return (
    <div className="space-y-3">
      {items.map(({ course, total, done }) => {
        const pct = total > 0 ? Math.round((done / total) * 100) : 0;
        return (
          <div
            key={course.id}
            className="p-4 rounded-xl bg-white/5 border border-white/10"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="font-medium">{course.title}</div>
              <div className="text-sm text-white/70">
                {done}/{total} ({pct}%)
              </div>
            </div>
            <div className="mt-2 h-2.5 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-lime-400 transition-[width] duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
