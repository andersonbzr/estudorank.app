import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // precisa estar setada
const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

export async function GET(
  _req: Request,
  { params }: { params: { username: string } }
) {
  try {
    const username = decodeURIComponent(params.username);

    // 1) Encontra o usuário (aceita username OU id)
    let { data: prof, error: e1 } = await admin
      .from("profiles")
      .select("id, username, full_name, name, avatar_url, bio")
      .eq("username", username)
      .maybeSingle();

    if (!prof) {
      const { data: byId, error: e2 } = await admin
        .from("profiles")
        .select("id, username, full_name, name, avatar_url, bio")
        .eq("id", username)
        .maybeSingle();
      if (e2) throw e2;
      prof = byId ?? null;
    }
    if (!prof) {
      return NextResponse.json({ ok: false, error: "Usuário não encontrado" }, { status: 404 });
    }

    // 2) Carrega cursos + módulos ativos
    const [{ data: courses, error: eC }, { data: mods, error: eM }] = await Promise.all([
      admin.from("courses").select("id,title,description,is_active").eq("is_active", true),
      admin.from("modules").select("id,course_id,is_active,sort_order").eq("is_active", true)
    ]);
    if (eC) throw eC;
    if (eM) throw eM;

    // 3) Progresso do usuário (completações + pontos)
    const { data: progs, error: eP } = await admin
      .from("progress")
      .select("module_id, completed, completed_at, points")
      .eq("user_id", prof.id);
    if (eP) throw eP;

    // 4) Agrega por curso
    const progMap = new Map<string, { completed: boolean; completed_at: string | null; points?: number }>();
    (progs ?? []).forEach((p) => progMap.set(p.module_id, p));

    const modsByCourse = new Map<string, any[]>();
    (mods ?? []).forEach((m) => {
      if (!modsByCourse.has(m.course_id)) modsByCourse.set(m.course_id, []);
      modsByCourse.get(m.course_id)!.push(m);
    });

    const courseAgg = (courses ?? []).map((c) => {
      const list = modsByCourse.get(c.id) || [];
      const total = list.length;
      let done = 0;
      let last: string | null = null;

      for (const m of list) {
        const p = progMap.get(m.id);
        if (p?.completed) {
          done++;
          if (p.completed_at && (!last || new Date(p.completed_at) > new Date(last))) {
            last = p.completed_at;
          }
        }
      }
      const percent = total > 0 ? Math.round((done / total) * 100) : 0;

      return {
        id: c.id,
        title: c.title,
        description: c.description,
        totalModules: total,
        completedModules: done,
        percent,
        lastCompletedAt: last,
      };
    });

    const totalPoints = (progs ?? []).reduce((acc, p) => acc + (p.points || 0), 0);

    return NextResponse.json({
      ok: true,
      profile: {
        id: prof.id,
        username: prof.username,
        name: prof.full_name || prof.name || null,
        avatar_url: prof.avatar_url || null,
        bio: prof.bio || null,
      },
      totals: { totalPoints },
      courses: courseAgg,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Falha ao carregar perfil público" },
      { status: 500 }
    );
  }
}
