// src/components/me/CourseCard.tsx
"use client";

import { motion } from "framer-motion";

export type UICourseItem = {
  id: string;
  title: string;
  status: "pending" | "done";
  points?: number;
};

export type UICourse = {
  id: string;
  title: string;
  subtitle?: string;
  totalModules: number;
  completedModules: number;
  items: UICourseItem[];
};

export function CourseCard(props: {
  course: UICourse;
  onComplete?: (itemId: string, courseId: string, points?: number) => void;
}) {
  const { course, onComplete } = props;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-5
                 bg-gradient-to-b from-neutral-900 to-black
                 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]
                 hover:translate-y-[-2px] transition-transform"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-base md:text-lg font-semibold text-white/90">{course.title}</h3>
          {course.subtitle && (
            <p className="text-sm text-white/60 mt-1">{course.subtitle}</p>
          )}
        </div>
        <div className="text-sm text-lime-300/80 shrink-0">
          {course.completedModules}/{course.totalModules}
        </div>
      </div>

      {/* itens */}
      <div className="mt-4 grid gap-3">
        {course.items.map((it) => {
          const done = it.status === "done";
          return (
            <div
              key={it.id}
              className="flex items-center justify-between gap-3 rounded-xl
                         bg-white/[0.03] border border-white/10 p-3"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${done ? "bg-lime-400" : "bg-white/30"}`}
                />
                <div className="text-sm">
                  <div className={`font-medium ${done ? "text-white/80 line-through" : "text-white/90"}`}>
                    {it.title}
                  </div>
                  {!!it.points && (
                    <div className="text-xs text-white/50">+{it.points} pts</div>
                  )}
                </div>
              </div>

              <button
                disabled={done}
                onClick={() => onComplete?.(it.id, course.id, it.points)}
                className={`px-3.5 py-2 rounded-xl text-sm transition-all 
                            ${done
                              ? "bg-white/5 text-white/40 cursor-not-allowed"
                              : "bg-lime-400/10 text-lime-300 hover:bg-lime-400/20 hover:shadow-[0_0_8px_rgba(163,230,53,0.25)]"
                            }`}
              >
                {done ? "Concluído" : "Concluir"}
              </button>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
