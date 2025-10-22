// src/components/ui/Card.tsx
"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

export default function Card({
  children,
  className = "",
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}) {
  const Comp: any = as;
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      whileHover={{ y: -1 }}
    >
      <Comp
        className={`rounded-2xl border border-white/10 bg-[var(--surface)]/90 shadow-lg ${className}`}
      >
        {children}
      </Comp>
    </motion.div>
  );
}
