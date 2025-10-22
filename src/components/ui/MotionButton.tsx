// src/components/ui/MotionButton.tsx
"use client";

import { motion } from "framer-motion";
import { ButtonHTMLAttributes } from "react";

export default function MotionButton(
  props: ButtonHTMLAttributes<HTMLButtonElement>
) {
  const { className = "", ...rest } = props;
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.08 }}
      className={`px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition disabled:opacity-60 ${className}`}
      {...rest}
    />
  );
}
