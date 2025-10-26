// src/components/me/ProgressHeader.tsx
"use client";

import { motion } from "framer-motion";
import { Trophy } from "lucide-react";

export function ProgressHeader(props: {
  userName: string;
  points: number;
  level: number;
  nextTarget: number;
  percent: number;
  completedModules: number;
  totalModules: number;
  loading?: boolean;
}) {
  const {
    userName, points, level, nextTarget, percent,
    completedModules, totalModules, loading,
  } = props;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-6 md:p-7
                 bg-gradient-to-b from-neutral-900 to-black
                 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]"
    >
      <div className="flex items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-white/10 grid place-items-center">
            <Trophy className="h-6 w-6 text-lime-300" />
          </div>
          <div>
            <div className="text-sm text-white/60">Seus pontos</div>
            <div className="text-2xl md:text-3xl font-semibold">{points}</div>
          </div>
        </div>

        <div className="hidden md:block text-right">
          <div className="text-sm text-white/60">Nível</div>
          <div className="text-xl font-semibold">Nível {level}</div>
          <div className="text-xs text-white/50">Próximo: {nextTarget} pts</div>
        </div>
      </div>

      {/* Barra de progresso minimalista */}
      <div className="mt-6">
        <div className="flex items-end justify-between mb-2">
          <div className="text-sm text-white/70">{percent}%</div>
          <div className="text-xs text-white/50">
            {completedModules}/{totalModules} módulos concluídos
          </div>
        </div>
        <div className="h-2 rounded-full bg-white/8 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percent}%` }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
            className="h-full bg-lime-400/80"
          />
        </div>
      </div>
    </motion.div>
  );
}
