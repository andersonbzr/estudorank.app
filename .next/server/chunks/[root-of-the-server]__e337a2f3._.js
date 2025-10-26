module.exports = [
"[project]/.next-internal/server/app/api/ranking/route/actions.js [app-rsc] (server actions loader, ecmascript)", ((__turbopack_context__, module, exports) => {

}),
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/action-async-storage.external.js [external] (next/dist/server/app-render/action-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/action-async-storage.external.js", () => require("next/dist/server/app-render/action-async-storage.external.js"));

module.exports = mod;
}),
"[project]/src/lib/supabase/server.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// src/lib/supabase/server.ts
__turbopack_context__.s([
    "supabaseServer",
    ()=>supabaseServer
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/headers.js [app-route] (ecmascript)");
(()=>{
    const e = new Error("Cannot find module '@supabase/ssr'");
    e.code = 'MODULE_NOT_FOUND';
    throw e;
})();
;
;
function supabaseServer() {
    const cookieStore = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["cookies"])();
    return createServerClient(("TURBOPACK compile-time value", "https://mmrzhazdbqrwipxpygbn.supabase.co"), ("TURBOPACK compile-time value", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1tcnpoYXpkYnFyd2lweHB5Z2JuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDc2MTA0NiwiZXhwIjoyMDc2MzM3MDQ2fQ.5zSCkcLNhLSa4P42Rp0W5H9YShETgWYbifQkoLGHqlg"), {
        cookies: {
            get (name) {
                return cookieStore.get(name)?.value;
            },
            set (name, value, options) {
                cookieStore.set({
                    name,
                    value,
                    ...options
                });
            },
            remove (name, options) {
                cookieStore.set({
                    name,
                    value: "",
                    ...options
                });
            }
        }
    });
}
}),
"[project]/src/app/api/ranking/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// app/api/ranking/route.ts
__turbopack_context__.s([
    "GET",
    ()=>GET
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/supabase/server.ts [app-route] (ecmascript)");
;
;
function parseIntSafe(v, def) {
    if (!v) return def;
    const n = Number.parseInt(v, 10);
    return Number.isFinite(n) && n > 0 ? n : def;
}
async function GET(req) {
    const url = new URL(req.url);
    const page = Math.max(1, parseIntSafe(url.searchParams.get("page"), 1));
    const pageSize = Math.min(100, Math.max(1, parseIntSafe(url.searchParams.get("pageSize"), 25)));
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseServer"])();
    /** -------------------- 1) Tenta via VIEW otimizada -------------------- */ try {
        // Tentamos suportar tanto `total` quanto `points` como nome da coluna agregada.
        const { data, error, count } = await supabase.from("user_points_view").select("user_id,name,email,total,points", {
            count: "exact"
        }).order("total", {
            ascending: false
        }) // se `total` existir, ordena por ele
        .range(from, to);
        if (!error && Array.isArray(data)) {
            const leaderboard = data.map((row)=>{
                const val = typeof row.total === "number" ? row.total : typeof row.points === "number" ? row.points : 0;
                return {
                    user_id: row.user_id,
                    name: row.name ?? null,
                    email: row.email ?? null,
                    points: val,
                    total: val
                };
            });
            const total = typeof count === "number" ? count : leaderboard.length;
            const pages = Math.max(1, Math.ceil(total / pageSize));
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                ok: true,
                leaderboard,
                page,
                pageSize,
                total,
                pages
            });
        }
    // Se deu erro, cai para fallback
    } catch  {
    // segue para fallback
    }
    /** -------------------- 2) Fallback: agrega na aplicação -------------------- */ try {
        // Carrega todos os pontos (ou uma janela grande; ajuste se o dataset crescer muito)
        // Espera-se uma tabela `points` com colunas: user_id (uuid/text), value (number)
        const { data: pointsRows, error: pointsErr } = await supabase.from("points").select("user_id,value");
        if (pointsErr) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                ok: false,
                error: pointsErr.message
            }, {
                status: 500
            });
        }
        // Agrega soma por usuário
        const map = new Map();
        for (const r of pointsRows){
            const curr = map.get(r.user_id) ?? 0;
            map.set(r.user_id, curr + (Number.isFinite(r.value) ? r.value : 0));
        }
        const aggregated = Array.from(map.entries()).map(([user_id, total])=>({
                user_id,
                total
            })).sort((a, b)=>b.total - a.total);
        const totalCount = aggregated.length;
        const pages = Math.max(1, Math.ceil(totalCount / pageSize));
        const sliced = aggregated.slice(from, to + 1);
        // Busca perfis apenas dos que estão nesta página (evita query enorme)
        const ids = sliced.map((r)=>r.user_id);
        let profilesById = new Map();
        if (ids.length > 0) {
            const { data: profiles, error: profilesErr } = await supabase.from("profiles").select("id,name,email").in("id", ids);
            if (!profilesErr && Array.isArray(profiles)) {
                profilesById = new Map(profiles.map((p)=>[
                        p.id,
                        {
                            name: p.name ?? null,
                            email: p.email ?? null
                        }
                    ]));
            }
        }
        const leaderboard = sliced.map((r)=>{
            const prof = profilesById.get(r.user_id);
            const val = r.total ?? 0;
            return {
                user_id: r.user_id,
                name: prof?.name ?? null,
                email: prof?.email ?? null,
                points: val,
                total: val
            };
        });
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            ok: true,
            leaderboard,
            page,
            pageSize,
            total: totalCount,
            pages
        });
    } catch (err) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            ok: false,
            error: err?.message ?? "unexpected_error"
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__e337a2f3._.js.map