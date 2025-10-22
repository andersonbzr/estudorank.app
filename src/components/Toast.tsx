// src/components/Toast.tsx
"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

type Toast = { id: string; text: string };
type Ctx = { push: (text: string) => void };

const ToastCtx = createContext<Ctx | null>(null);

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("ToastProvider ausente");
  return ctx;
}

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);
  const [mounted, setMounted] = useState(false); // evita mismatch de hidratação

  useEffect(() => setMounted(true), []);

  const api = useMemo<Ctx>(
    () => ({
      push(text: string) {
        const id = Math.random().toString(36).slice(2);
        setItems((s) => [...s, { id, text }]);
        setTimeout(() => {
          setItems((s) => s.filter((t) => t.id !== id));
        }, 2500);
      },
    }),
    []
  );

  return (
    <ToastCtx.Provider value={api}>
      {children}
      {mounted && (
        <div
          className="fixed bottom-4 right-4 z-50 space-y-2"
          aria-live="polite"
          aria-atomic="true"
        >
          {items.map((t) => (
            <div
              key={t.id}
              className="px-4 py-2 rounded-lg bg-white/10 border border-white/15 shadow-lg backdrop-blur"
            >
              {t.text}
            </div>
          ))}
        </div>
      )}
    </ToastCtx.Provider>
  );
}
