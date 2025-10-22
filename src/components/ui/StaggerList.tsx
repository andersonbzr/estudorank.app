// src/components/ui/StaggerList.tsx
"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

export default function StaggerList({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: 0.05 } },
      }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children }: { children: ReactNode }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 6 },
        show: { opacity: 1, y: 0, transition: { duration: 0.18, ease: "easeOut" } },
      }}
    >
      {children}
    </motion.div>
  );
}
