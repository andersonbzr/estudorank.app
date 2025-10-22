"use client";

import { useEffect } from "react";
import { applyTheme, getSavedTheme, ThemeMode } from "@/lib/theme";

/**
 * Mantém o <html> com a classe 'light' ou 'dark' em sincronia com o localStorage.
 * Não toca nas CSS custom properties (as cores ficam todas no globals.css).
 */
export default function ThemeHydrator() {
  useEffect(() => {
    // 1) aplica de cara o que estiver salvo
    applyTheme(getSavedTheme());

    // 2) reage a alterações em outras abas
    const onStorage = (e: StorageEvent) => {
      if (e.key === "theme") {
        const mode = (e.newValue as ThemeMode) || "system";
        applyTheme(mode);
      }
    };

    // 3) reage a alterações locais (quando salvar pelo /config e disparar 'theme-change')
    const onCustom = () => {
      applyTheme(getSavedTheme());
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener("theme-change", onCustom as EventListener);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("theme-change", onCustom as EventListener);
    };
  }, []);

  return null;
}
