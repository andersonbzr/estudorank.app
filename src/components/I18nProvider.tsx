// src/components/I18nProvider.tsx
"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

/**
 * Dicionários simples. Mantive pt-BR como padrão.
 * Se quiser, pode preencher/enxugar o en-US — o app vai cair no pt-BR quando faltar chave.
 */
type Dict = Record<string, string | ((vars?: Record<string, any>) => string)>;

const ptBR: Dict = {
  // Globais / Header / Sidebar
  welcome: ({ name }: any) => (name ? `Bem-vindo, ${name}` : "Bem-vindo"),
  myPanel: "Meu Painel",
  ranking: "Ranking",
  settings: "Configurações",
  admin: "Admin",
  refresh: "Atualizar",
  prev: "Anterior",
  next: "Próxima",
  signOut: "Sair",

  // Página /me
  yourPoints: "Seus pontos:",
  creatingExample: "Criando exemplo...",
  createExample: "Criar dados de exemplo",
  weeklyGoalLabel: ({ done, goal }: any) => `Meta semanal (seg–dom): ${done}/${goal} módulos`,
  saveGoal: "Salvar meta",
  generalProgress: "Progresso geral",
  modulesCompleted: ({ done, total }: any) => `${done}/${total} módulos concluídos`,
  loadingCoursesModules: "Carregando cursos e módulos...",
  noActiveCourses: "Nenhum curso ativo. Use “Criar dados de exemplo”.",
  donePlusPoints: "Concluído (+10 pts)",
  pending: "Pendente",
  updating: "Atualizando...",
  undo: "Desfazer",
  conclude: "Concluir",

  // Admin / Cursos
  adminCoursesTitle: "Admin • Cursos & Módulos",
  adminCoursesSubtitle:
    "Crie cursos, adicione módulos, ative/desative e edite títulos. Somente administradores podem alterar.",
  demoMode: "Modo Demo",
  demoModeDesc: "Popula vários cursos e módulos de exemplo.",
  populating: "Populando...",
  populateDemo: "Popular demo",
  newCourse: "Novo curso",
  courseTitlePlaceholder: "Título do curso",
  courseDescPlaceholder: "Descrição (opcional)",
  creating: "Criando...",
  createCourse: "Criar curso",
  titleLabel: "Título",
  disable: "Desativar",
  enable: "Ativar",
  delete: "Excluir",
  modulePlaceholder: "Novo módulo...",
  addModule: "Adicionar módulo",
  adding: "Adicionando...",
  moduleLabel: "Módulo",
  save: "Salvar",
  cancel: "Cancelar",
  edit: "Editar",
  loading: "Carregando...",
  noCourses: "Nenhum curso. Crie um acima.",

  // Ranking
  position: "Posição",
  user: "Usuário",
  points: "Pontos",
  loadingRanking: "Carregando ranking...",
  noDataYet: "Sem dados ainda.",
  paginationSummary: ({ total, page, pages }: any) => `${total} usuários • página ${page} de ${pages}`,
};

const enUS: Dict = {
  // (opcional, serve como fallback para quando você selecionar "en-US" no futuro)
  welcome: ({ name }: any) => (name ? `Welcome, ${name}` : "Welcome"),
  myPanel: "My Panel",
  ranking: "Ranking",
  settings: "Settings",
  admin: "Admin",
  refresh: "Refresh",
  prev: "Previous",
  next: "Next",
  signOut: "Sign out",
};

export type Locale = "pt-BR" | "en-US";

const dictionaries: Record<Locale, Dict> = {
  "pt-BR": ptBR,
  "en-US": enUS,
};

type I18nCtxType = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string, vars?: Record<string, any>) => string;
};

const I18nCtx = createContext<I18nCtxType | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  // Se não for usar troca de idioma agora, deixe fixo em 'pt-BR'
  const [locale, setLocaleState] = useState<Locale>("pt-BR");

  // Mantém o atributo lang coerente (não é obrigatório, mas ajuda em SEO/acessibilidade)
  useEffect(() => {
    document.documentElement.setAttribute("lang", locale);
  }, [locale]);

  // Exponho setLocale para compatibilidade futura (hoje pode ficar sem uso)
  const setLocale = (l: Locale) => {
    setLocaleState(l);
  };

  // Tradutor com fallback para pt-BR e, por fim, a própria chave
  const t = useMemo(() => {
    return (key: string, vars?: Record<string, any>) => {
      const dict = dictionaries[locale] || ptBR;
      const entry = dict[key];
      if (typeof entry === "function") return (entry as any)(vars || {});
      if (typeof entry === "string") return entry;

      const fb = ptBR[key];
      if (typeof fb === "function") return (fb as any)(vars || {});
      if (typeof fb === "string") return fb;

      return key;
    };
  }, [locale]);

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, t]);

  return <I18nCtx.Provider value={value}>{children}</I18nCtx.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nCtx);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
