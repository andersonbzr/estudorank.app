// src/app/admin/courses/page.tsx
"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Search, Filter, Pencil, Copy, Trash2, Power, FileText, X, ChevronRight,
  ChevronsLeft, ChevronLeft, ChevronRight as ChevronRightIcon, ChevronsRight,
  Shield, MessageSquareText, Users, Loader2,
} from "lucide-react";
import AdminGuard from "@/components/AdminGuard";
import AppShell from "@/components/shell/AppShell";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useToast } from "@/components/Toast";

/* Tipos */
type Course = {
  id: string;
  title: string;
  description: string | null;
  is_active: boolean;
  created_at?: string | null; // usamos created_at
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
  const sb = useMemo(() => supabaseBrowser(), []);
  const toast = useToast();

  const [q, setQ] = useState("");
  const [qDeb, setQDeb] = useState(""); // debounce da busca

  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  const [showNew, setShowNew] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);

  // paginação
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // debounce da busca
  useEffect(() => {
    const t = setTimeout(() => setQDeb(q.trim().toLowerCase()), 200);
    return () => clearTimeout(t);
  }, [q]);

  // ESC para fechar modal/drawer
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setShowNew(false);
        setEditing(null);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  async function loadAll() {
    setLoading(true);
    setMsg(null);
    const [c1, m1] = await Promise.all([
      sb.from("courses")
        .select("id,title,description,is_active,created_at")
        .order("created_at", { ascending: false }),
      sb.from("modules")
        .select("id,course_id,title,sort_order,is_active")
        .order("sort_order", { ascending: true }),
    ]);

    if (c1.error) setMsg(c1.error.message);
    if (m1.error) setMsg(m1.error.message);

    setCourses((c1.data as Course[]) ?? []);
    setModules((m1.data as Module[]) ?? []);
    setLoading(false);
  }

  /* ------- Ações de curso ------- */
  async function createCourse(title: string, description: string) {
    try {
      const { error } = await sb
        .from("courses")
        .insert([{ title: title.trim(), description: description.trim() || null, is_active: true }]);
      if (error) throw error;
      toast.push("Curso criado.");
      await loadAll();
      setPage(1);
    } catch (e: any) {
      toast.push(e?.message ?? "Falha ao criar curso.");
    }
  }

  // toggle otimista do curso
  async function toggleCourseActive(id: string, current: boolean) {
    // otimista
    setCourses((prev) => prev.map(c => c.id === id ? { ...c, is_active: !current } : c));
    try {
      const { error } = await sb.from("courses").update({ is_active: !current }).eq("id", id);
      if (error) throw error;
      toast.push(!current ? "Curso ativado." : "Curso desativado.");
    } catch (e: any) {
      // rollback
      setCourses((prev) => prev.map(c => c.id === id ? { ...c, is_active: current } : c));
      toast.push(e?.message ?? "Falha ao atualizar curso.");
    }
  }

  async function renameCourse(id: string, title: string) {
    try {
      const { error } = await sb.from("courses").update({ title }).eq("id", id);
      if (error) throw error;
      toast.push("Título do curso atualizado.");
      setCourses((prev) => prev.map(c => c.id === id ? { ...c, title } : c));
    } catch (e: any) {
      toast.push(e?.message ?? "Falha ao renomear curso.");
    }
  }

  async function saveCourseDesc(id: string, description: string | null) {
    try {
      const { error } = await sb.from("courses").update({ description }).eq("id", id);
      if (error) throw error;
      toast.push("Descrição atualizada.");
      setCourses((prev) => prev.map(c => c.id === id ? { ...c, description } : c));
    } catch (e: any) {
      toast.push(e?.message ?? "Falha ao salvar descrição.");
    }
  }

  async function duplicateCourse(course: Course) {
    try {
      const { data: created, error } = await sb
        .from("courses")
        .insert([{ title: `${course.title} (cópia)`, description: course.description, is_active: course.is_active }])
        .select("*").single();
      if (error) throw error;

      const srcMods = modules.filter((m) => m.course_id === course.id);
      if (srcMods.length) {
        const payload = srcMods.map((m) => ({
          course_id: (created as any).id,
          title: m.title,
          sort_order: m.sort_order,
          is_active: m.is_active,
        }));
        const { error: me } = await sb.from("modules").insert(payload);
        if (me) throw me;
      }

      toast.push("Curso duplicado.");
      await loadAll();
      setPage(1);
    } catch (e: any) {
      toast.push(e?.message ?? "Falha ao duplicar curso.");
    }
  }

  async function deleteCourse(id: string) {
    if (!confirm("Excluir curso e seus módulos?")) return;
    try {
      const { error } = await sb.from("courses").delete().eq("id", id);
      if (error) throw error;
      toast.push("Curso excluído.");
      // otimista simples
      setCourses((prev) => prev.filter(c => c.id !== id));
      setModules((prev) => prev.filter(m => m.course_id !== id));
    } catch (e: any) {
      toast.push(e?.message ?? "Falha ao excluir curso.");
    }
  }

  /* ------- Ações de módulo (Drawer) ------- */
  async function addModule(courseId: string, title: string) {
    try {
      const list = modules.filter((m) => m.course_id === courseId);
      const nextOrder = (list.at(-1)?.sort_order ?? 0) + 1;
      const { data, error } = await sb
        .from("modules")
        .insert([{ course_id: courseId, title, sort_order: nextOrder, is_active: true }])
        .select("id,course_id,title,sort_order,is_active").single();
      if (error) throw error;
      toast.push("Módulo adicionado.");
      // otimista
      setModules((prev) => [...prev, (data as Module)]);
    } catch (e: any) {
      toast.push(e?.message ?? "Falha ao adicionar módulo.");
    }
  }

  async function renameModule(id: string, title: string) {
    try {
      const { error } = await sb.from("modules").update({ title }).eq("id", id);
      if (error) throw error;
      toast.push("Módulo atualizado.");
      setModules((prev) => prev.map(m => m.id === id ? { ...m, title } : m));
    } catch (e: any) {
      toast.push(e?.message ?? "Falha ao renomear módulo.");
    }
  }

  // toggle otimista do módulo
  async function toggleModuleActive(id: string, current: boolean) {
    // otimista
    setModules((prev) => prev.map(m => m.id === id ? { ...m, is_active: !current } : m));
    try {
      const { error } = await sb.from("modules").update({ is_active: !current }).eq("id", id);
      if (error) throw error;
      toast.push(!current ? "Módulo ativado." : "Módulo desativado.");
    } catch (e: any) {
      // rollback
      setModules((prev) => prev.map(m => m.id === id ? { ...m, is_active: current } : m));
      toast.push(e?.message ?? "Falha ao atualizar módulo.");
    }
  }

  async function deleteModule(id: string) {
    if (!confirm("Excluir este módulo?")) return;
    try {
      const { error } = await sb.from("modules").delete().eq("id", id);
      if (error) throw error;
      toast.push("Módulo excluído.");
      // otimista
      setModules((prev) => prev.filter(m => m.id !== id));
    } catch (e: any) {
      toast.push(e?.message ?? "Falha ao excluir módulo.");
    }
  }

  // filtro + paginação
  const filtered = courses.filter((c) =>
    (c.title + " " + (c.description ?? "")).toLowerCase().includes(qDeb),
  );
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageSafe = Math.min(Math.max(page, 1), pages);
  const start = (pageSafe - 1) * pageSize;
  const end = start + pageSize;
  const pageItems = filtered.slice(start, end);

  // quando o termo de busca muda, volta para página 1
  useEffect(() => { setPage(1); }, [qDeb]);

  const gotoFirst = useCallback(() => setPage(1), []);
  const gotoPrev  = useCallback(() => setPage(p => Math.max(1, p - 1)), []);
  const gotoNext  = useCallback(() => setPage(p => Math.min(pages, p + 1)), [pages]);
  const gotoLast  = useCallback(() => setPage(pages), [pages]);

  return (
    <motion.main
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="px-5 md:px-8 py-8 text-white"
    >
      <div className="max-w-6xl mx-auto">
        <div className="relative overflow-hidden rounded-3xl p-6 md:p-7 bg-gradient-to-b from-neutral-900/95 to-black/90 backdrop-blur-md border border-white/10 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]">
          {/* aurora */}
          <motion.div
            className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-64 w-64 rounded-full blur-3xl"
            style={{ background: "radial-gradient(circle, rgba(163,230,53,0.22), transparent)" }}
            animate={{ opacity: [0.25, 0.4, 0.25], scale: [0.95, 1.05, 0.95] }}
            transition={{ duration: 6, repeat: Infinity }}
          />

          {/* header */}
          <div className="relative z-10 flex items-center justify-between gap-3">
            <div>
              <h1 className="text-xl md:text-2xl font-semibold text-lime-300 drop-shadow-[0_0_10px_rgba(163,230,53,0.25)]">
                Cursos
              </h1>
              <p className="text-sm text-white/70">Gerencie cursos e módulos.</p>
            </div>
            <button
              onClick={() => setShowNew(true)}
              className="h-10 px-3 rounded-xl bg-lime-400/10 text-lime-300 hover:bg-lime-400/20 hover:shadow-[0_0_10px_rgba(163,230,53,0.25)] transition inline-flex items-center gap-2"
            >
              <Plus size={16} /> Adicionar curso
            </button>
          </div>

          {/* toolbar */}
          <div className="relative z-10 mt-6 flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 opacity-60" size={16} />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar curso…"
                className="w-full h-11 pl-9 pr-3 rounded-xl bg-white/5 border border-white/10 outline-none focus:ring-2 focus:ring-lime-400/25"
              />
            </div>
            <button className="h-11 px-3 rounded-xl bg-white/5 border border-white/10 inline-flex items-center gap-2 hover:bg-white/10 transition">
              <Filter size={16} /> Filtros
            </button>
          </div>

          {msg && (
            <div className="relative z-10 mt-4 p-3 rounded-xl border border-white/10 bg-white/10 text-sm">
              {msg}
            </div>
          )}

          {/* tabela */}
          <div className="relative z-10 mt-6 rounded-2xl overflow-hidden bg-white/[0.03] border border-white/10">
            <div className="hidden md:grid grid-cols-[1fr,120px,140px,160px,140px] px-6 py-3 text-xs uppercase tracking-wide text-white/60 border-b border-white/10">
              <div>Curso</div>
              <div>Módulos</div>
              <div>Status</div>
              <div>Criado</div>
              <div>Ações</div>
            </div>

            {loading ? (
              <ul className="divide-y divide-white/10 animate-pulse">
                {Array.from({ length: 4 }).map((_, i) => (
                  <li key={i} className="grid md:grid-cols-[1fr,120px,140px,160px,140px] grid-cols-1 gap-3 px-6 py-5">
                    <div className="h-4 w-64 bg-white/10 rounded" />
                    <div className="h-4 w-10 bg-white/10 rounded" />
                    <div className="h-4 w-20 bg-white/10 rounded" />
                    <div className="h-4 w-24 bg-white/10 rounded" />
                    <div className="h-8 w-24 bg-white/10 rounded" />
                  </li>
                ))}
              </ul>
            ) : filtered.length === 0 ? (
              <div className="px-6 py-10 text-center text-white/70">
                Nenhum curso encontrado.
              </div>
            ) : (
              <>
                <ul className="divide-y divide-white/10">
                  <AnimatePresence initial={false}>
                    {pageItems.map((c) => {
                      const count = modules.filter((m) => m.course_id === c.id).length;
                      return (
                        <motion.li
                          key={c.id}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ duration: 0.16 }}
                          className="grid md:grid-cols-[1fr,120px,140px,160px,140px] grid-cols-1 gap-3 px-6 py-5 hover:bg-white/[0.04] transition-colors"
                        >
                          <div>
                            <div className="font-medium text-white/90 line-clamp-1">{c.title}</div>
                            {c.description && (
                              <div className="text-sm text-white/60 line-clamp-2">
                                {c.description}
                              </div>
                            )}
                          </div>
                          <div className="self-center text-sm text-white/80">{count}</div>
                          <div className="self-center">
                            <span
                              className={`text-[11px] font-semibold px-2 py-1 rounded-md border
                                ${c.is_active
                                  ? "text-lime-300 border-lime-400/30 bg-lime-400/10"
                                  : "text-white/60 border-white/15 bg-white/5"
                                }`}
                            >
                              {c.is_active ? "Ativo" : "Inativo"}
                            </span>
                          </div>
                          <div className="self-center text-sm text-white/70">
                            {c.created_at
                              ? new Date(c.created_at).toLocaleDateString("pt-BR", {
                                  day: "2-digit", month: "short", year: "numeric",
                                }).replace(".", "")
                              : "—"}
                          </div>
                          <div className="self-center flex items-center gap-2">
                            <button
                              className="h-8 w-8 grid place-items-center rounded-lg bg-white/5 border border-white/10 hover:bg-white/10"
                              title="Editar"
                              onClick={() => setEditing(c)}
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              className="h-8 w-8 grid place-items-center rounded-lg bg-white/5 border border-white/10 hover:bg-white/10"
                              title="Duplicar"
                              onClick={() => duplicateCourse(c)}
                            >
                              <Copy size={16} />
                            </button>
                            <button
                              className="h-8 w-8 grid place-items-center rounded-lg bg-white/5 border border-white/10 hover:bg-white/10"
                              title={c.is_active ? "Desativar" : "Ativar"}
                              onClick={() => toggleCourseActive(c.id, c.is_active)}
                              aria-pressed={c.is_active}
                            >
                              <Power size={16} className={c.is_active ? "" : "opacity-60"} />
                            </button>
                            <button
                              className="h-8 w-8 grid place-items-center rounded-lg bg-red-500/15 border border-red-400/30 text-red-300 hover:bg-red-500/25"
                              title="Excluir"
                              onClick={() => deleteCourse(c.id)}
                            >
                              <Trash2 size={16} />
                            </button>
                            <button
                              className="h-8 px-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 inline-flex items-center gap-1"
                              onClick={() => setEditing(c)}
                              title="Abrir detalhes"
                            >
                              <span className="text-xs">Detalhes</span>
                              <ChevronRight size={14} />
                            </button>
                          </div>
                        </motion.li>
                      );
                    })}
                  </AnimatePresence>
                </ul>

                {/* Paginação */}
                <div className="flex items-center justify-between px-4 py-3 border-t border-white/10 bg-white/[0.02]">
                  <div className="text-sm text-white/60">
                    Mostrando <span className="text-white/80">{filtered.length === 0 ? 0 : start + 1}</span>–<span className="text-white/80">{Math.min(end, filtered.length)}</span> de <span className="text-white/80">{filtered.length}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      className="h-9 w-9 grid place-items-center rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-50"
                      onClick={gotoFirst} disabled={pageSafe === 1} aria-label="Primeira página"
                    >
                      <ChevronsLeft size={16} />
                    </button>
                    <button
                      className="h-9 w-9 grid place-items-center rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-50"
                      onClick={gotoPrev} disabled={pageSafe === 1} aria-label="Página anterior"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span className="mx-2 text-sm text-white/70">
                      Página <span className="text-white/90">{pageSafe}</span> de <span className="text-white/90">{pages}</span>
                    </span>
                    <button
                      className="h-9 w-9 grid place-items-center rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-50"
                      onClick={gotoNext} disabled={pageSafe === pages} aria-label="Próxima página"
                    >
                      <ChevronRightIcon size={16} />
                    </button>
                    <button
                      className="h-9 w-9 grid place-items-center rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-50"
                      onClick={gotoLast} disabled={pageSafe === pages} aria-label="Última página"
                    >
                      <ChevronsRight size={16} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* --- Moderação (Chat + Usuários) --- */}
          <div className="relative z-10 mt-6">
            <ModerationBlock />
          </div>
        </div>
      </div>

      {/* Modal Novo Curso */}
      <NewCourseModal
        open={showNew}
        onClose={() => setShowNew(false)}
        onCreate={async (t, d) => {
          await createCourse(t, d);
          setShowNew(false);
        }}
      />

      {/* Drawer Editar Curso */}
      <EditCourseDrawer
        key={editing?.id || "drawer-none"}
        course={editing}
        modules={modules.filter((m) => m.course_id === (editing?.id ?? ""))}
        onClose={() => setEditing(null)}
        onRenameCourse={renameCourse}
        onSaveDesc={saveCourseDesc}
        onToggleCourse={toggleCourseActive}
        onAddModule={addModule}
        onRenameModule={renameModule}
        onToggleModule={toggleModuleActive}
        onDeleteModule={deleteModule}
        onDeleteCourse={async (id) => {
          await deleteCourse(id);
          setEditing(null);
        }}
      />
    </motion.main>
  );
}

/* ---------------- Components ---------------- */

function NewCourseModal({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (title: string, desc: string) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle("");
      setDesc("");
    }
  }, [open]);

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="newcourse-overlay"
        className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm grid place-items-center p-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          key="newcourse-modal"
          className="w-full max-w-lg rounded-2xl p-5 bg-gradient-to-b from-neutral-900/95 to-black/90 border border-white/10 shadow-2xl"
          initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-lime-300">Novo curso</h3>
            <button className="p-1 rounded-lg hover:bg-white/10" onClick={onClose} aria-label="Fechar">
              <X size={16} />
            </button>
          </div>

          <div className="mt-4 grid gap-3">
            <div>
              <label className="block text-sm opacity-70 mb-1">Título</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full h-11 rounded-xl bg-white/5 border border-white/10 px-3 outline-none focus:ring-2 focus:ring-lime-400/25"
                placeholder="Ex.: Next.js 15 — Fundamentos"
              />
            </div>
            <div>
              <label className="block text-sm opacity-70 mb-1">Descrição (opcional)</label>
              <textarea
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                className="w-full h-24 rounded-xl bg-white/5 border border-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-lime-400/25 resize-none"
                placeholder="Resumo curto…"
              />
            </div>
          </div>

          <div className="mt-5 flex items-center justify-end gap-2">
            <button className="h-10 px-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10" onClick={onClose}>
              Cancelar
            </button>
            <button
              className="h-10 px-3 rounded-xl bg-lime-400/10 text-lime-300 hover:bg-lime-400/20 hover:shadow-[0_0_10px_rgba(163,230,53,0.25)]"
              disabled={!title.trim() || busy}
              onClick={async () => {
                setBusy(true);
                await onCreate(title, desc);
                setBusy(false);
              }}
            >
              {busy ? "Criando…" : "Criar curso"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function EditCourseDrawer({
  course,
  modules,
  onClose,
  onRenameCourse,
  onSaveDesc,
  onToggleCourse,
  onAddModule,
  onRenameModule,
  onToggleModule,
  onDeleteModule,
  onDeleteCourse,
}: {
  course: Course | null;
  modules: Module[];
  onClose: () => void;
  onRenameCourse: (id: string, title: string) => Promise<void>;
  onSaveDesc: (id: string, desc: string | null) => Promise<void>;
  onToggleCourse: (id: string, current: boolean) => Promise<void>;
  onAddModule: (courseId: string, title: string) => Promise<void>;
  onRenameModule: (id: string, title: string) => Promise<void>;
  onToggleModule: (id: string, cur: boolean) => Promise<void>;
  onDeleteModule: (id: string) => Promise<void>;
  onDeleteCourse: (id: string) => Promise<void>;
}) {
  const [tab, setTab] = useState<"geral" | "modulos">("geral");
  const [title, setTitle] = useState(course?.title ?? "");
  const [desc, setDesc] = useState(course?.description ?? "");
  const [newMod, setNewMod] = useState("");

  useEffect(() => {
    setTitle(course?.title ?? "");
    setDesc(course?.description ?? "");
    setTab("geral");
  }, [course]);

  if (!course) return null;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={`drawer-overlay-${course.id}`}
        className="fixed inset-0 z-[60] bg-black/50"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.aside
        key={`drawer-${course.id}`}
        className="fixed right-0 top-0 bottom-0 z-[61] w-full max-w-xl p-6 overflow-auto
                   bg-gradient-to-b from-neutral-900/95 to-black/90 border-l border-white/10"
        initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
        transition={{ type: "tween", duration: 0.25 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-lime-300">Editar curso</h3>
            <p className="text-sm text-white/70">{course.title}</p>
          </div>
          <button className="p-1 rounded-lg hover:bg-white/10" onClick={onClose} aria-label="Fechar">
            <X size={16} />
          </button>
        </div>

        {/* tabs */}
        <div className="mt-5 flex items-center gap-2">
          <button
            className={`h-9 px-3 rounded-xl border ${tab === "geral" ? "border-lime-400/40 bg-lime-400/10 text-lime-300" : "border-white/10 bg-white/5"}`}
            onClick={() => setTab("geral")}
          >
            Geral
          </button>
          <button
            className={`h-9 px-3 rounded-xl border ${tab === "modulos" ? "border-lime-400/40 bg-lime-400/10 text-lime-300" : "border-white/10 bg-white/5"}`}
            onClick={() => setTab("modulos")}
          >
            Módulos
          </button>
        </div>

        {tab === "geral" ? (
          <div className="mt-5 grid gap-4">
            <div>
              <label className="block text-sm opacity-70 mb-1">Título</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={async () => {
                  const v = title.trim();
                  if (v && v !== course.title) await onRenameCourse(course.id, v);
                }}
                className="w-full h-11 rounded-xl bg-white/5 border border-white/10 px-3 outline-none focus:ring-2 focus:ring-lime-400/25"
              />
            </div>
            <div>
              <label className="block text-sm opacity-70 mb-1">Descrição</label>
              <textarea
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                onBlur={async () => {
                  if ((desc ?? "") !== (course.description ?? "")) {
                    await onSaveDesc(course.id, desc.trim() ? desc : null);
                  }
                }}
                className="w-full h-28 rounded-xl bg-white/5 border border-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-lime-400/25 resize-none"
              />
            </div>

            <div className="flex items-center justify-between mt-2">
              <div className="text-sm text-white/70">
                Status:{" "}
                <span className={`font-semibold ${course.is_active ? "text-lime-300" : "text-white/60"}`}>
                  {course.is_active ? "Ativo" : "Inativo"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="h-9 px-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10"
                  onClick={() => onToggleCourse(course.id, course.is_active)}
                  aria-pressed={course.is_active}
                >
                  {course.is_active ? "Desativar" : "Ativar"}
                </button>
                <button
                  className="h-9 px-3 rounded-xl bg-red-500/15 border border-red-400/30 text-red-300 hover:bg-red-500/25"
                  onClick={() => onDeleteCourse(course.id)}
                >
                  Excluir curso
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-5">
            <div className="flex items-center gap-2">
              <input
                value={newMod}
                onChange={(e) => setNewMod(e.target.value)}
                placeholder="Novo módulo…"
                className="flex-1 h-11 rounded-xl bg-white/5 border border-white/10 px-3 outline-none focus:ring-2 focus:ring-lime-400/25"
              />
              <button
                className="h-11 px-3 rounded-xl bg-lime-400/10 text-lime-300 hover:bg-lime-400/20 hover:shadow-[0_0_10px_rgba(163,230,53,0.25)]"
                disabled={!newMod.trim()}
                onClick={async () => {
                  const v = newMod.trim();
                  if (!v) return;
                  await onAddModule(course.id, v);
                  setNewMod("");
                }}
              >
                Adicionar
              </button>
            </div>

            <div className="mt-4 space-y-2">
              {modules.length === 0 ? (
                <div className="text-sm text-white/70">Nenhum módulo.</div>
              ) : (
                modules.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <FileText size={16} className="opacity-80" />
                      <InlineEdit value={m.title} onSave={(v) => onRenameModule(m.id, v)} />
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        className="h-8 w-8 grid place-items-center rounded-lg bg-white/5 border border-white/10 hover:bg-white/10"
                        title={m.is_active ? "Desativar" : "Ativar"}
                        onClick={() => onToggleModule(m.id, m.is_active)}
                        aria-pressed={m.is_active}
                      >
                        <Power size={16} className={m.is_active ? "" : "opacity-60"} />
                      </button>
                      <button
                        className="h-8 w-8 grid place-items-center rounded-lg bg-red-500/15 border border-red-400/30 text-red-300 hover:bg-red-500/25"
                        title="Excluir"
                        onClick={() => onDeleteModule(m.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </motion.aside>
    </AnimatePresence>
  );
}

function InlineEdit({
  value,
  onSave,
}: {
  value: string;
  onSave: (v: string) => void | Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="btn-ghost px-2 py-1 text-sm inline-flex items-center gap-2"
        title="Editar título"
      >
        <span className="line-clamp-1">{value}</span>
        <Pencil size={14} className="opacity-70" />
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        className="h-10 w-[24rem] max-w-full rounded-xl bg-white/5 border border-white/10 px-3 outline-none focus:ring-2 focus:ring-lime-400/25"
        autoFocus
      />
      <button
        onClick={async () => {
          const v = draft.trim();
          if (v && v !== value) await onSave(v);
          setEditing(false);
        }}
        className="h-10 px-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10"
      >
        Salvar
      </button>
      <button
        onClick={() => {
          setDraft(value);
          setEditing(false);
        }}
        className="h-10 px-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10"
      >
        Cancelar
      </button>
    </div>
  );
}

/* ---------------- Moderação (limpar chat + gerenciar usuários) ---------------- */

function ModerationBlock() {
  const [channel, setChannel] = useState("ranking-global");
  const [busy, setBusy] = useState(false);
  const [openUsers, setOpenUsers] = useState(false);
  const toast = useToast();

  async function clearChatAll() {
    if (!confirm("Tem certeza que deseja apagar TODAS as mensagens do chat? Esta ação é irreversível.")) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/chat/clear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      const j = await res.json();
      if (!j?.ok) throw new Error(j?.error || "Falha ao limpar chat.");
      toast.push("Mensagens apagadas (todas).");
    } catch (e: any) {
      toast.push(e?.message ?? "Erro ao limpar chat.");
    } finally {
      setBusy(false);
    }
  }

  async function clearChatChannel() {
    const ch = channel.trim();
    if (!ch) return;
    if (!confirm(`Apagar TODAS as mensagens do canal "${ch}"?`)) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/chat/clear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel: ch }),
      });
      const j = await res.json();
      if (!j?.ok) throw new Error(j?.error || "Falha ao limpar chat.");
      toast.push(`Mensagens do canal "${ch}" apagadas.`);
    } catch (e: any) {
      toast.push(e?.message ?? "Erro ao limpar chat.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative overflow-hidden rounded-2xl p-5 bg-white/[0.03] border border-white/10">
      <div className="flex items-center gap-2 text-sm text-white/80">
        <Shield size={16} className="text-lime-300" />
        <span>Moderação</span>
      </div>

      {/* Limpar chat */}
      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto_auto]">
        <div className="flex items-center gap-2">
          <MessageSquareText size={16} className="opacity-80" />
          <span className="text-sm text-white/70">Limpar chat</span>
        </div>
        <div className="flex items-center gap-2">
          <input
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
            placeholder="Canal do chat (ex.: ranking-global)"
            className="w-[260px] h-10 rounded-xl bg-white/5 border border-white/10 px-3 outline-none focus:ring-2 focus:ring-lime-400/25"
          />
          <button
            onClick={clearChatChannel}
            disabled={busy || !channel.trim()}
            className="h-10 px-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-60"
          >
            Limpar canal
          </button>
        </div>
        <div>
          <button
            onClick={clearChatAll}
            disabled={busy}
            className="h-10 px-3 rounded-xl bg-red-500/15 border border-red-400/30 text-red-300 hover:bg-red-500/25 inline-flex items-center gap-2 disabled:opacity-60"
          >
            {busy ? <Loader2 size={16} className="animate-spin" /> : null}
            Limpar tudo
          </button>
        </div>
      </div>

      {/* Usuários */}
      <div className="mt-6 pt-6 border-t border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-white/70">
            <Users size={16} className="opacity-80" />
            <span>Usuários</span>
          </div>
        <button
            onClick={() => setOpenUsers(true)}
            className="h-10 px-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10"
          >
            Gerenciar usuários
          </button>
        </div>
      </div>

      <UsersAdminModal open={openUsers} onClose={() => setOpenUsers(false)} />
    </div>
  );
}

function UsersAdminModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState(false);
  const [items, setItems] = useState<Array<{ id: string; email: string | null; display_name?: string | null; created_at?: string | null }>>([]);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (!open) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, page]);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/list?q=${encodeURIComponent(q)}&page=${page}&perPage=20`);
      const j = await res.json();
      if (!j?.ok) throw new Error(j?.error || "Falha ao listar usuários.");
      setItems(j.users || []);
    } catch (e: any) {
      toast.push(e?.message ?? "Erro ao buscar usuários.");
    } finally {
      setLoading(false);
    }
  }

  async function onDelete(user_id: string) {
    const hard = confirm("Excluir conta e dados auxiliares (progress, points, messages, profile)?\nOK = excluir tudo (hard)\nCancelar = excluir só a conta no Auth");
    setBusy(true);
    try {
      const res = await fetch("/api/admin/users/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id, hard }),
      });
      const j = await res.json();
      if (!j?.ok) throw new Error(j?.error || "Falha ao excluir usuário.");
      toast.push("Usuário excluído.");
      setItems((prev) => prev.filter(i => i.id !== user_id));
    } catch (e: any) {
      toast.push(e?.message ?? "Erro ao excluir usuário.");
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm grid place-items-center p-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="w-full max-w-4xl rounded-2xl p-5 bg-gradient-to-b from-neutral-900/95 to-black/90 border border-white/10 shadow-2xl"
          initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.98, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-lime-300">Gerenciar usuários</h3>
            <button className="p-1 rounded-lg hover:bg-white/10" onClick={onClose} aria-label="Fechar">
              <X size={16} />
            </button>
          </div>

          {/* Busca */}
          <div className="mt-4 flex items-center gap-2">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-60" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (setPage(1), load())}
                placeholder="Buscar por e-mail ou ID…"
                className="w-full h-11 pl-9 pr-3 rounded-xl bg-white/5 border border-white/10 outline-none focus:ring-2 focus:ring-lime-400/25"
              />
            </div>
            <button
              onClick={() => { setPage(1); load(); }}
              className="h-11 px-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10"
            >
              Buscar
            </button>
          </div>

          {/* Lista */}
          <div className="mt-4 rounded-xl border border-white/10 overflow-hidden">
            <div className="hidden md:grid grid-cols-[1.3fr,1fr,160px,120px] gap-3 px-4 py-2 text-xs uppercase tracking-wide text-white/60 bg-white/5 border-b border-white/10">
              <div>Usuário</div>
              <div>Email</div>
              <div>Criado</div>
              <div>Ações</div>
            </div>

            {loading ? (
              <div className="p-6 text-white/70">Carregando…</div>
            ) : items.length === 0 ? (
              <div className="p-6 text-white/70">Nenhum usuário.</div>
            ) : (
              <ul className="divide-y divide-white/10">
                {items.map((u) => (
                  <li key={u.id} className="grid md:grid-cols-[1.3fr,1fr,160px,120px] grid-cols-1 gap-3 px-4 py-3">
                    <div className="text-white/90">
                      <div className="font-medium line-clamp-1">{u.display_name || "—"}</div>
                      <div className="text-xs text-white/50">{u.id}</div>
                    </div>
                    <div className="self-center text-white/80">{u.email || "—"}</div>
                    <div className="self-center text-white/70">
                      {u.created_at
                        ? new Date(u.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).replace(".", "")
                        : "—"}
                    </div>
                    <div className="self-center">
                      <button
                        onClick={() => onDelete(u.id)}
                        disabled={busy}
                        className="h-9 px-3 rounded-xl bg-red-500/15 border border-red-400/30 text-red-300 hover:bg-red-500/25"
                        title="Excluir usuário"
                      >
                        Excluir
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Paginação simples */}
          <div className="mt-3 flex items-center justify-between">
            <div className="text-sm text-white/60">Total nesta página: {items.length}</div>
            <div className="flex items-center gap-2">
              <button
                className="h-9 px-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-50"
                onClick={() => { if (page > 1) setPage(page - 1); }}
                disabled={page <= 1}
              >
                Página {Math.max(1, page - 1)}
              </button>
              <button
                className="h-9 px-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10"
                onClick={() => setPage(page + 1)}
              >
                Página {page + 1}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
