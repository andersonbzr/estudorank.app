export type ThemeMode = "light" | "dark" | "system";

/** Lê o tema salvo no localStorage (ou "system" se não existir) */
export function getSavedTheme(): ThemeMode {
  if (typeof window === "undefined") return "system";
  const t = (localStorage.getItem("theme") as ThemeMode | null) || "system";
  return t === "light" || t === "dark" || t === "system" ? t : "system";
}

/** Aplica o tema (light/dark/system) ao <html> e atualiza CSS vars */
export function applyTheme(mode: ThemeMode) {
  if (typeof document === "undefined") return;

  const prefersDark =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;

  const finalMode = mode === "system" ? (prefersDark ? "dark" : "light") : mode;
  const html = document.documentElement;

  html.classList.remove("light", "dark");
  html.classList.add(finalMode);

  const themes = {
    dark: {
      bg: "11 15 26",
      surface: "18 24 38",
      text: "231 231 234",
      accent: "163 230 53",
      primary: "30 58 138",
    },
    light: {
      bg: "247 249 252",
      surface: "255 255 255",
      text: "31 41 55",
      accent: "99 102 241",
      primary: "2 132 199",
    },
  } as const;

  const palette = themes[finalMode === "dark" ? "dark" : "light"];
  const style = html.style;

  style.setProperty("--bg", palette.bg);
  style.setProperty("--surface", palette.surface);
  style.setProperty("--text", palette.text);
  style.setProperty("--accent", palette.accent);
  style.setProperty("--primary", palette.primary);
}

/** Salva e aplica o tema escolhido */
export function saveTheme(mode: ThemeMode) {
  if (typeof window !== "undefined") {
    localStorage.setItem("theme", mode);
    applyTheme(mode);
    window.dispatchEvent(new Event("theme-change"));
  }
}
