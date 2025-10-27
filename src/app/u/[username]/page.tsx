import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";

type Profile = {
  id: string;
  name?: string | null;
  full_name?: string | null;
  username?: string | null;
  bio?: string | null;
};

type ProgRow = {
  module_id: string;
  completed: boolean | null;
  completed_at: string | null;
  points: number | null;
};

type Course = { id: string; title: string; is_active?: boolean | null };
type Module = { id: string; course_id: string; is_active?: boolean | null };

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function fetchProfileByUsernameOrId(slug: string): Promise<Profile | null> {
  const supabase = await supabaseServer();

  try {
    const { data } = await supabase
      .from("profiles")
      .select("id, name, full_name, username, bio")
      .eq("username", slug)
      .maybeSingle();
    if (data) return data as Profile;
  } catch {}

  try {
    const { data } = await supabase
      .from("profiles")
      .select("id, name, full_name, username, bio")
      .eq("id", slug)
      .maybeSingle();
    if (data) return data as Profile;
  } catch {}

  return null;
}

async function fetchUserPoints(userId: string): Promise<number> {
  const supabase = await supabaseServer();
  try {
    const { data } = await supabase
      .from("progress")
      .select("points, completed")
      .eq("user_id", userId);

    if (Array.isArray(data)) {
      return data.reduce(
        (acc, r) => acc + (r.completed ? Number(r.points) || 0 : 0),
        0
      );
    }
  } catch {}
  return 0;
}

async function fetchProgressOverview(userId: string): Promise<
  Array<{
    course_id: string;
    course_title: string;
    completed: number;
    total: number;
    percent: number;
    last_done: string | null;
  }>
> {
  const supabase = await supabaseServer();
  const [{ data: courses }, { data: modules }] = await Promise.all([
    supabase.from("courses").select("id,title,is_active"),
    supabase.from("modules").select("id,course_id,is_active"),
  ]);

  if (!Array.isArray(courses) || !Array.isArray(modules)) return [];

  const byCourse = new Map<string, { title: string; total: number }>();
  for (const c of courses as Course[]) {
    if (c?.is_active === false) continue;
    byCourse.set(c.id, { title: c.title, total: 0 });
  }
  for (const m of modules as Module[]) {
    if (m?.is_active === false) continue;
    const rec = byCourse.get(m.course_id);
    if (rec) rec.total += 1;
  }

  let prog: ProgRow[] = [];
  try {
    const { data } = await supabase
      .from("progress")
      .select("module_id, completed, completed_at, points")
      .eq("user_id", userId);
    prog = (data || []) as ProgRow[];
  } catch {}

  const completedSet = new Set<string>(
    prog.filter((p) => p.completed).map((p) => p.module_id)
  );

  const result = Array.from(byCourse.entries()).map(([course_id, rec]) => {
    const total = Math.max(1, rec.total);
    const doneMods = (modules as Module[]).filter(
      (m) => m.course_id === course_id && completedSet.has(m.id)
    );
    const done = doneMods.length;
    const percent = Math.round((done / total) * 100);

    let last_done: string | null = null;
    for (const m of doneMods) {
      const row = prog.find((p) => p.module_id === m.id && p.completed_at);
      if (row?.completed_at) {
        if (!last_done || new Date(row.completed_at) > new Date(last_done)) {
          last_done = row.completed_at;
        }
      }
    }

    return {
      course_id,
      course_title: rec.title,
      completed: done,
      total,
      percent,
      last_done,
    };
  });

  result.sort((a, b) => b.percent - a.percent || b.total - a.total);
  return result;
}

export default async function UserProfilePage({
  params,
  searchParams,
}: {
  params: { username: string };
  searchParams: { n?: string; e?: string };
}) {
  const slug = decodeURIComponent(params.username);
  if (!slug) notFound();

  const hintedName = searchParams?.n ? decodeURIComponent(searchParams.n) : undefined;
  const hintedEmail = searchParams?.e ? decodeURIComponent(searchParams.e) : undefined;

  const profile = await fetchProfileByUsernameOrId(slug);

  const userId = profile?.id ?? slug; // fallback
  const display =
    (profile?.username && `@${profile.username}`) ||
    hintedName ||
    hintedEmail ||
    (typeof userId === "string" ? userId.slice(0, 8) : "Usuário");

  const fullName =
    profile?.full_name || profile?.name || hintedName || hintedEmail || null;

  const [points, progress] = await Promise.all([
    fetchUserPoints(userId),
    fetchProgressOverview(userId),
  ]);

  return (
    <main className="px-5 md:px-8 py-8 text-white">
      <div className="max-w-3xl mx-auto">
        <div className="relative overflow-hidden rounded-3xl p-6 md:p-8 bg-gradient-to-b from-neutral-900 to-black border border-white/10 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]">
          {/* Aurora sutil */}
          <div
            className="pointer-events-none absolute -top-28 left-1/2 -translate-x-1/2 h-72 w-72 rounded-full blur-3xl"
            style={{
              background:
                "radial-gradient(circle, rgba(163,230,53,0.22), transparent)",
            }}
          />

          {/* Cabeçalho do perfil */}
          <div className="relative z-10">
            {/* Nome principal */}
            {fullName ? (
              <h1 className="text-2xl font-bold tracking-tight text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.15)]">
                {fullName}
              </h1>
            ) : (
              <h1 className="text-2xl font-bold tracking-tight text-white/90">
                Usuário
              </h1>
            )}

            {/* Username ou identificador */}
            <div className="text-lime-300/90 text-sm font-medium mt-1">
              {display}
            </div>

            {/* ID + email */}
            <div className="text-xs text-white/60 mt-1">
              ID: {String(userId).slice(0, 8)}
            </div>
            {hintedEmail && (
              <p className="text-xs text-white/50 mt-1">{hintedEmail}</p>
            )}

            {/* Bio */}
            {profile?.bio && (
              <p className="mt-3 text-sm text-white/80 whitespace-pre-wrap leading-relaxed">
                {profile.bio}
              </p>
            )}
          </div>

          {/* Visão geral */}
          <section className="relative z-10 border-t border-white/5 mt-6 pt-6">
            <h2 className="text-lime-300/90 font-semibold text-base mb-4">
              Visão geral
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Stat label="Pontos" value={points.toLocaleString("pt-BR")} />
              <Stat label="Posição" value="—" hint="em breve" />
              <Stat label="Maior Streak" value="—" hint="em breve" />
            </div>
          </section>

          {/* Progresso */}
          <section className="relative z-10 border-t border-white/5 mt-6 pt-6">
            <h2 className="text-lime-300/90 font-semibold text-base mb-4">
              Progresso
            </h2>
            {progress.length === 0 ? (
              <div className="text-sm text-white/70">
                Sem progresso para mostrar.
              </div>
            ) : (
              <div className="space-y-3">
                {progress.map((c) => (
                  <div
                    key={c.course_id}
                    className="rounded-xl border border-white/10 bg-white/5 p-3"
                  >
                    <div className="grid grid-cols-[1fr,120px,160px] gap-3 items-center">
                      <div className="min-w-0">
                        <div className="font-medium truncate">
                          {c.course_title}
                        </div>
                        <div className="mt-2 h-2 rounded-full bg-white/10 overflow-hidden">
                          <div
                            className="h-full bg-lime-400"
                            style={{ width: `${c.percent}%` }}
                          />
                        </div>
                      </div>
                      <div className="text-sm text-white/70 justify-self-end">
                        {c.percent}% ({c.completed}/{c.total})
                      </div>
                      <div className="text-xs text-white/60 justify-self-end">
                        {c.last_done
                          ? new Date(c.last_done)
                              .toLocaleDateString("pt-BR", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })
                              .replace(".", "")
                          : "—"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Conquistas */}
          <section className="relative z-10 border-t border-white/5 mt-6 pt-6">
            <h2 className="text-lime-300/90 font-semibold text-base mb-4">
              Conquistas
            </h2>
            <div className="text-sm text-white/70">Em breve.</div>
          </section>
        </div>

        <div className="mt-4 text-center">
          <Link
            href="/ranking"
            className="text-sm opacity-80 hover:opacity-100 underline"
          >
            ← Voltar ao ranking
          </Link>
        </div>
      </div>
    </main>
  );
}

/* ========= Subcomponentes ========= */

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
      <div className="text-xs text-white/60">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
      {hint && <div className="text-[11px] text-white/50 mt-0.5">{hint}</div>}
    </div>
  );
}
