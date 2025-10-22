// src/components/ui/FadeIn.tsx
"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

export default function FadeIn({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: "easeOut", delay }}
    >
      {children}
    </motion.div>
  );
}
