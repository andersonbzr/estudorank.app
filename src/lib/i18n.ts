// src/lib/i18n.ts
export type Locale = "pt-BR" | "en-US";
type Dict = Record<string, string>;

/** ===== Português ===== */
const ptBR: Dict = {
  // comuns / header
  welcome: "Bem-vindo",
  signOut: "Sair",
  myPanel: "Meu Painel",
  admin: "Admin",

  // ranking
  ranking: "Ranking",
  refresh: "Atualizar",
  position: "Posição",
  user: "Usuário",
  points: "Pontos",
  loadingRanking: "Carregando ranking...",
  noData: "Sem dados ainda.",
  usersCount: "{{total}} usuários • página {{page}} de {{pages}}",
  previous: "Anterior",
  next: "Próxima",

  // me (painel)
  yourPoints: "Seus pontos:",
  createExample: "Criar dados de exemplo",
  creatingExample: "Criando exemplo...",
  weeklyGoalLabel: "Meta semanal (seg–dom): {{done}}/{{goal}} módulos",
  saveGoal: "Salvar meta",
  generalProgress: "Progresso geral",
  modulesCompleted: "{{done}}/{{total}} módulos concluídos",
  loadingCoursesModules: "Carregando cursos e módulos...",
  noActiveCourses: "Nenhum curso ativo. Use “Criar dados de exemplo”.",
  pending: "Pendente",
  donePlusPoints: "Concluído (+10 pts)",
  undo: "Desfazer",
  conclude: "Concluir",
  updating: "Atualizando...",

  // admin/courses
  adminCoursesTitle: "Admin • Cursos & Módulos",
  adminCoursesSubtitle: "Crie cursos, adicione módulos, ative/desative e edite títulos. Somente administradores podem alterar.",
  demoMode: "Modo Demo",
  demoModeDesc: "Popula vários cursos e módulos de exemplo.",
  populateDemo: "Popular demo",
  populating: "Populando...",
  newCourse: "Novo curso",
  courseTitlePlaceholder: "Título do curso",
  courseDescPlaceholder: "Descrição (opcional)",
  createCourse: "Criar curso",
  creating: "Criando...",
  loading: "Carregando...",
  noCourses: "Nenhum curso. Crie um acima.",
  disable: "Desativar",
  enable: "Ativar",
  delete: "Excluir",
  modulePlaceholder: "Novo módulo...",
  addModule: "Adicionar módulo",
  adding: "Adicionando...",
  titleLabel: "Título",
  moduleLabel: "Módulo",
  save: "Salvar",
  cancel: "Cancelar",
  edit: "Editar",

  // configurações (já existiam, mas mantive para consistência)
  settings: "Configurações",
  preferences: "Preferências",
  profile: "Perfil",
  email: "E-mail",
  displayName: "Nome de exibição",
  weeklyGoal: "Meta semanal (módulos)",
  theme: "Tema",
  system: "Sistema",
  light: "Claro",
  dark: "Escuro",
  language: "Idioma",
  ptBR: "Português (Brasil)",
  enUS: "English (US)",
  notifyEmail: "Receber e-mails sobre atualizações de progresso",
  security: "Segurança",
  sendReset: "Enviar e-mail de redefinição",
  saved: "Configurações salvas.",
  loadingShort: "Carregando...",
};

/** ===== English ===== */
const enUS: Dict = {
  // common / header
  welcome: "Welcome",
  signOut: "Sign out",
  myPanel: "My Dashboard",
  admin: "Admin",

  // ranking
  ranking: "Leaderboard",
  refresh: "Refresh",
  position: "Position",
  user: "User",
  points: "Points",
  loadingRanking: "Loading leaderboard...",
  noData: "No data yet.",
  usersCount: "{{total}} users • page {{page}} of {{pages}}",
  previous: "Previous",
  next: "Next",

  // me (dashboard)
  yourPoints: "Your points:",
  createExample: "Create example data",
  creatingExample: "Creating example...",
  weeklyGoalLabel: "Weekly goal (Mon–Sun): {{done}}/{{goal}} modules",
  saveGoal: "Save goal",
  generalProgress: "Overall progress",
  modulesCompleted: "{{done}}/{{total}} modules completed",
  loadingCoursesModules: "Loading courses and modules...",
  noActiveCourses: "No active courses. Use “Create example data”.",
  pending: "Pending",
  donePlusPoints: "Completed (+10 pts)",
  undo: "Undo",
  conclude: "Complete",
  updating: "Updating...",

  // admin/courses
  adminCoursesTitle: "Admin • Courses & Modules",
  adminCoursesSubtitle: "Create courses, add modules, enable/disable and edit titles. Only admins can change.",
  demoMode: "Demo mode",
  demoModeDesc: "Populates multiple demo courses and modules.",
  populateDemo: "Populate demo",
  populating: "Populating...",
  newCourse: "New course",
  courseTitlePlaceholder: "Course title",
  courseDescPlaceholder: "Description (optional)",
  createCourse: "Create course",
  creating: "Creating...",
  loading: "Loading...",
  noCourses: "No courses. Create one above.",
  disable: "Disable",
  enable: "Enable",
  delete: "Delete",
  modulePlaceholder: "New module...",
  addModule: "Add module",
  adding: "Adding...",
  titleLabel: "Title",
  moduleLabel: "Module",
  save: "Save",
  cancel: "Cancel",
  edit: "Edit",

  // settings
  settings: "Settings",
  preferences: "Preferences",
  profile: "Profile",
  email: "Email",
  displayName: "Display name",
  weeklyGoal: "Weekly goal (modules)",
  theme: "Theme",
  system: "System",
  light: "Light",
  dark: "Dark",
  language: "Language",
  ptBR: "Portuguese (Brazil)",
  enUS: "English (US)",
  notifyEmail: "Receive emails about progress updates",
  security: "Security",
  sendReset: "Send password reset email",
  saved: "Settings saved.",
  loadingShort: "Loading...",
};

/** helpers */
function interpolate(str: string, vars: Record<string, string | number>) {
  return Object.entries(vars).reduce((s, [k, v]) => s.replaceAll(`{{${k}}}`, String(v)), str);
}

const dicts: Record<Locale, Dict> = { "pt-BR": ptBR, "en-US": enUS };

export function resolveLocale(input?: string): Locale {
  const v = (input || "").toLowerCase();
  if (v.startsWith("en")) return "en-US";
  if (v.startsWith("pt")) return "pt-BR";
  return "pt-BR";
}

export function makeTranslator(locale: Locale) {
  const d = dicts[locale] || dicts["pt-BR"];
  return (key: string, vars?: Record<string, string | number>) => {
    const base = d[key] ?? dicts["pt-BR"][key] ?? key;
    return vars ? interpolate(base, vars) : base;
  };
}
