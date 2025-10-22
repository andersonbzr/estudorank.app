// src/app/admin/courses/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  FileText,
  Plus,
  Edit3,
  Trash2,
  Power,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase/client";
import AdminGuard from "@/components/AdminGuard";
import AppShell from "@/components/shell/AppShell";

/* Tipos */
type Course = {
  id: string;
  title: string;
  description: string | null;
  is_active: boolean;
};
type Module = {
  id: string;
  course_id: string;
  title: string;
  sort_order: number;
  is_active: boolean;
};

export default function AdminCoursesPage() {
  return (
    <AdminGuard>
      <AppShell>
        <Content />
      </AppShell>
    </AdminGuard>
  );
}

function Content() {
  const supabase = useMemo(() => supabaseBrowser(), []);

  const [courses, setCourses] = useState<Course[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  // novo curso
  const [newCourseTitle, setNewCourseTitle] = useState("");
  const [newCourseDesc, setNewCourseDesc] = useState("");

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadAll() {
    setLoading(true);
    setMsg(null);
    const [c1, m1] = await Promise.all([
      supabase.from("courses").select("*").order("created_at", { ascending: false }),
      supabase.from("modules").select("*").order("sort_order", { ascending: true }),
    ]);

    if (c1.error) setMsg(c1.error.message);
    if (m1.error) setMsg(m1.error.message);

    setCourses((c1.data as Course[]) ?? []);
    setModules((m1.data as Module[]) ?? []);
    setLoading(false);
  }

  async function seedDemo() {
    setBusy("seedDemo");
    setMsg(null);
    try {
      const coursesToCreate: Omit<Course, "id">[] = [
        { title: "Onboarding EstudoRank", description: "Aprenda a usar a plataforma", is_active: true },
        { title: "Lógica de Programação", description: "Variáveis, condicionais e laços", is_active: true },
        { title: "Git e GitHub", description: "Fluxo básico de versionamento", is_active: true },
        { title: "Next.js 15 — Fundamentos", description: "App Router, SSR, rotas e dados", is_active: true },
      ];
      await supabase.from("courses").insert(coursesToCreate).select();

      const { data: allCourses } = await supabase.from("courses").select("*");
      const getId = (title: string) => allCourses?.find((c) => c.title === title)?.id;

      const mods = [
        // Onboarding
        { course_id: getId("Onboarding EstudoRank"), title: "Tour pela plataforma", sort_order: 1, is_active: true },
        { course_id: getId("Onboarding EstudoRank"), title: "Perfil e segurança", sort_order: 2, is_active: true },
        { course_id: getId("Onboarding EstudoRank"), title: "Metas e Ranking", sort_order: 3, is_active: true },
        // Lógica
        { course_id: getId("Lógica de Programação"), title: "Variáveis e tipos", sort_order: 1, is_active: true },
        { course_id: getId("Lógica de Programação"), title: "If/Else e Operadores", sort_order: 2, is_active: true },
        { course_id: getId("Lógica de Programação"), title: "Laços e Arrays", sort_order: 3, is_active: true },
        // Git
        { course_id: getId("Git e GitHub"), title: "Configuração inicial", sort_order: 1, is_active: true },
        { course_id: getId("Git e GitHub"), title: "Commits e Branches", sort_order: 2, is_active: true },
        { course_id: getId("Git e GitHub"), title: "Pull Request (PR)", sort_order: 3, is_active: true },
        // Next.js
        { course_id: getId("Next.js 15 — Fundamentos"), title: "App Router e Layouts", sort_order: 1, is_active: true },
        { course_id: getId("Next.js 15 — Fundamentos"), title: "Server vs Client Components", sort_order: 2, is_active: true },
        { course_id: getId("Next.js 15 — Fundamentos"), title: "Data Fetching e Rotas", sort_order: 3, is_active: true },
      ].filter((m) => !!m.course_id);

      if (mods.length) await supabase.from("modules").insert(mods as any[]).select();
      await loadAll();
    } catch (e: any) {
      setMsg(e.message ?? "Falha ao popular demo.");
    } finally {
      setBusy(null);
    }
  }

  async function createCourse() {
    if (!newCourseTitle.trim()) return;
    setBusy("createCourse");
    setMsg(null);
    try {
      const { error } = await supabase.from("courses").insert([
        { title: newCourseTitle.trim(), description: newCourseDesc.trim() || null, is_active: true },
      ]);
      if (error) throw error;
      setNewCourseTitle("");
      setNewCourseDesc("");
      await loadAll();
    } catch (e: any) {
      setMsg(e.message ?? "Falha ao criar curso.");
    } finally {
      setBusy(null);
    }
  }

  async function toggleCourseActive(id: string, current: boolean) {
    setBusy(`course:${id}`);
    setMsg(null);
    try {
      const { error } = await supabase.from("courses").update({ is_active: !current }).eq("id", id);
      if (error) throw error;
      await loadAll();
    } catch (e: any) {
      setMsg(e.message ?? "Falha ao atualizar curso.");
    } finally {
      setBusy(null);
    }
  }

  async function updateCourseTitle(id: string, title: string) {
    setBusy(`courseTitle:${id}`);
    setMsg(null);
    try {
      const { error } = await supabase.from("courses").update({ title }).eq("id", id);
      if (error) throw error;
      await loadAll();
    } catch (e: any) {
      setMsg(e.message ?? "Falha ao renomear curso.");
    } finally {
      setBusy(null);
    }
  }

  async function deleteCourse(id: string) {
    if (!confirm("Excluir curso e seus módulos?")) return;
    setBusy(`courseDel:${id}`);
    setMsg(null);
    try {
      const { error } = await supabase.from("courses").delete().eq("id", id);
      if (error) throw error;
      await loadAll();
    } catch (e: any) {
      setMsg(e.message ?? "Falha ao excluir curso.");
    } finally {
      setBusy(null);
    }
  }

  async function addModule(courseId: string, title: string) {
    if (!title.trim()) return;
    setBusy(`addModule:${courseId}`);
    setMsg(null);
    try {
      const current = modules.filter((m) => m.course_id === courseId);
      const nextOrder = (current.at(-1)?.sort_order ?? 0) + 1;
      const { error } = await supabase
        .from("modules")
        .insert([{ course_id: courseId, title: title.trim(), sort_order: nextOrder, is_active: true }]);
      if (error) throw error;
      await loadAll();
    } catch (e: any) {
      setMsg(e.message ?? "Falha ao criar módulo.");
    } finally {
      setBusy(null);
    }
  }

  async function updateModuleTitle(id: string, title: string) {
    setBusy(`modTitle:${id}`);
    setMsg(null);
    try {
      const { error } = await supabase.from("modules").update({ title }).eq("id", id);
      if (error) throw error;
      await loadAll();
    } catch (e: any) {
      setMsg(e.message ?? "Falha ao renomear módulo.");
    } finally {
      setBusy(null);
    }
  }

  async function toggleModuleActive(id: string, current: boolean) {
    setBusy(`modActive:${id}`);
    setMsg(null);
    try {
      const { error } = await supabase.from("modules").update({ is_active: !current }).eq("id", id);
      if (error) throw error;
      await loadAll();
    } catch (e: any) {
      setMsg(e.message ?? "Falha ao atualizar módulo.");
    } finally {
      setBusy(null);
    }
  }

  async function deleteModule(id: string) {
    if (!confirm("Excluir este módulo?")) return;
    setBusy(`modDel:${id}`);
    setMsg(null);
    try {
      const { error } = await supabase.from("modules").delete().eq("id", id);
      if (error) throw error;
      await loadAll();
    } catch (e: any) {
      setMsg(e.message ?? "Falha ao excluir módulo.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <main className="max-w-6xl mx-auto px-6 lg:px-8 py-8">
      {/* Hero */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Admin • Cursos & Módulos</h1>
          <p className="text-sm opacity-70 mt-1">
            Crie cursos, adicione módulos, ative/desative e edite títulos. Somente administradores podem alterar.
          </p>
        </div>
        <button
          onClick={seedDemo}
          disabled={busy === "seedDemo"}
          aria-busy={busy === "seedDemo"}
          className="btn"
        >
          <Sparkles size={16} />
          {busy === "seedDemo" ? "Populando..." : "Popular demo"}
        </button>
      </div>

      {/* Mensagem de erro */}
      {msg && (
        <div className="mb-6 p-3 rounded-2xl border border-white/10 bg-white/10 text-sm">
          {msg}
        </div>
      )}

      {/* Novo curso */}
      <section className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl shadow-[0_4px_12px_rgba(0,0,0,0.25)] hover:bg-white/[0.05] transition">
        <div className="flex items-center gap-2 text-sm opacity-80">
          <BookOpen size={16} />
          <span>Novo curso</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
          <input
            value={newCourseTitle}
            onChange={(e) => setNewCourseTitle(e.target.value)}
            placeholder="Título do curso"
            className="field w-full"
          />
          <input
            value={newCourseDesc}
            onChange={(e) => setNewCourseDesc(e.target.value)}
            placeholder="Descrição (opcional)"
            className="field w-full"
          />
        </div>

        <div className="mt-3">
          <button
            onClick={createCourse}
            disabled={busy === "createCourse" || !newCourseTitle.trim()}
            aria-busy={busy === "createCourse"}
            className="btn"
          >
            <Plus size={16} /> {busy === "createCourse" ? "Criando..." : "Criar curso"}
          </button>
        </div>
      </section>

      {/* Lista de cursos */}
      <div className="mt-6 grid gap-4">
        {loading ? (
          <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10">Carregando…</div>
        ) : courses.length === 0 ? (
          <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10">
            Nenhum curso. Crie um acima.
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {courses.map((c) => {
              const mods = modules.filter((m) => m.course_id === c.id);
              return (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18 }}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl shadow-[0_4px_12px_rgba(0,0,0,0.25)]"
                >
                  <CourseCard
                    course={c}
                    modules={mods}
                    busy={busy}
                    onToggleCourse={toggleCourseActive}
                    onDeleteCourse={deleteCourse}
                    onRenameCourse={updateCourseTitle}
                    onAddModule={addModule}
                    onRenameModule={updateModuleTitle}
                    onToggleModule={toggleModuleActive}
                    onDeleteModule={deleteModule}
                  />
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </main>
  );
}

/* ---------- Componentes de UI ---------- */

function CourseCard({
  course,
  modules,
  busy,
  onToggleCourse,
  onDeleteCourse,
  onRenameCourse,
  onAddModule,
  onRenameModule,
  onToggleModule,
  onDeleteModule,
}: {
  course: Course;
  modules: Module[];
  busy: string | null;
  onToggleCourse: (id: string, current: boolean) => void;
  onDeleteCourse: (id: string) => void;
  onRenameCourse: (id: string, title: string) => void;
  onAddModule: (courseId: string, title: string) => void;
  onRenameModule: (id: string, title: string) => void;
  onToggleModule: (id: string, current: boolean) => void;
  onDeleteModule: (id: string) => void;
}) {
  const [open, setOpen] = useState(true);
  const [draftTitle, setDraftTitle] = useState(course.title);
  const [addingTitle, setAddingTitle] = useState("");

  const savingCourseTitle = busy === `courseTitle:${course.id}`;
  const togglingCourse = busy === `course:${course.id}`;
  const deletingCourse = busy === `courseDel:${course.id}`;
  const addingModule = busy === `addModule:${course.id}`;

  return (
    <div className="overflow-hidden">
      {/* Header do curso (sem nesting de <button>) */}
      <div className="flex items-start justify-between gap-3 p-4 border-b border-white/10">
        <div className="flex-1">
          <div className="flex items-center gap-2 text-sm opacity-80">
            <BookOpen size={16} /> <span>Curso</span>
          </div>

          <div className="mt-1 flex items-center gap-2">
            <input
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              onBlur={() =>
                draftTitle.trim() &&
                draftTitle !== course.title &&
                onRenameCourse(course.id, draftTitle.trim())
              }
              disabled={savingCourseTitle}
              className="field field-inline w-full max-w-[420px] font-semibold tracking-tight"
            />
            {savingCourseTitle && (
              <span className="text-xs opacity-70">Salvando…</span>
            )}
            <span className="text-xs px-2 py-0.5 rounded-md border border-white/10 bg-white/5">
              {modules.length} módulo(s)
            </span>
          </div>

          {course.description && <p className="opacity-70 text-sm mt-1">{course.description}</p>}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setOpen((v) => !v)}
            className="btn-icon"
            aria-expanded={open}
            title={open ? "Recolher" : "Expandir"}
          >
            <ChevronDown
              size={16}
              className={`transition-transform ${open ? "" : "-rotate-90"}`}
            />
          </button>
          <button
            onClick={() => onToggleCourse(course.id, course.is_active)}
            disabled={togglingCourse}
            className="btn-icon"
            title={course.is_active ? "Desativar" : "Ativar"}
          >
            <Power size={16} className={course.is_active ? "" : "opacity-60"} />
          </button>
          <button
            onClick={() => onDeleteCourse(course.id)}
            disabled={deletingCourse}
            className="btn-danger px-2 py-1.5"
            title="Excluir curso"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Body do curso */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            <div className="p-4">
              {/* Adicionar módulo */}
              <div className="flex items-center gap-2">
                <input
                  value={addingTitle}
                  onChange={(e) => setAddingTitle(e.target.value)}
                  placeholder="Novo módulo…"
                  className="field flex-1"
                />
                <button
                  onClick={() => {
                    if (addingTitle.trim()) {
                      onAddModule(course.id, addingTitle.trim());
                      setAddingTitle("");
                    }
                  }}
                  disabled={addingModule}
                  className="btn"
                >
                  {addingModule ? "Adicionando…" : "Adicionar módulo"}
                </button>
              </div>

              {/* Lista de módulos */}
              <div className="mt-3 pl-3 border-l border-white/10 space-y-2">
                {modules.length === 0 ? (
                  <div className="text-sm opacity-70 px-2">—</div>
                ) : (
                  modules.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between rounded-xl border border-white/10 px-3 py-2 bg-black/10"
                    >
                      <div className="flex items-center gap-2">
                        <FileText size={16} className="opacity-80" />
                        <InlineEdit
                          value={m.title}
                          saving={busy === `modTitle:${m.id}`}
                          onSave={(val) => onRenameModule(m.id, val)}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onToggleModule(m.id, m.is_active)}
                          disabled={busy === `modActive:${m.id}`}
                          className="btn-icon"
                          title={m.is_active ? "Desativar" : "Ativar"}
                        >
                          <Power size={16} className={m.is_active ? "" : "opacity-60"} />
                        </button>
                        <button
                          onClick={() => onDeleteModule(m.id)}
                          disabled={busy === `modDel:${m.id}`}
                          className="btn-danger px-2 py-1.5"
                          title="Excluir módulo"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function InlineEdit({
  value,
  onSave,
  saving,
}: {
  value: string;
  onSave: (v: string) => void;
  saving?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);

  return editing ? (
    <div className="flex items-center gap-2">
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        className="field w-[24rem] max-w-full"
        autoFocus
      />
      <button
        onClick={() => {
          const v = draft.trim();
          if (v && v !== value) onSave(v);
          setEditing(false);
        }}
        disabled={saving}
        className="btn h-10 px-3"
      >
        <Edit3 size={14} /> Salvar
      </button>
      <button
        onClick={() => {
          setDraft(value);
          setEditing(false);
        }}
        className="btn-ghost h-10 px-3"
      >
        Cancelar
      </button>
    </div>
  ) : (
    <button
      onClick={() => setEditing(true)}
      className="btn-ghost px-2 py-1 text-sm inline-flex items-center gap-2"
      title="Editar título"
    >
      {value} <Edit3 size={14} className="opacity-70" />
    </button>
  );
}
