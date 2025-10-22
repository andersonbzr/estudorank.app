"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

type Props = {
  title: React.ReactNode;           // conteúdo exibido no cabeçalho (sem <button>)
  subtitle?: React.ReactNode;       // opcional
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
};

export default function Collapse({
  title,
  subtitle,
  defaultOpen = false,
  children,
  className = "",
}: Props) {
  const [open, setOpen] = useState<boolean>(!!defaultOpen);

  return (
    <div className={className}>
      {/* Botão ÚNICO do cabeçalho */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        data-open={open}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-white/5 transition focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
      >
        <div className="min-w-0">
          {/* title vem pronto (div, fragment, texto, etc.) */}
          <div className="truncate">{title}</div>
          {subtitle ? (
            <div className="text-xs opacity-70 truncate">{subtitle}</div>
          ) : null}
        </div>
        <ChevronDown
          className={`size-4 shrink-0 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Conteúdo colapsável */}
      <div data-open={open} className={open ? "block" : "hidden"}>
        {children}
      </div>
    </div>
  );
}
