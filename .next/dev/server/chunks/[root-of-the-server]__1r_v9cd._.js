module.exports = [
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
"[project]/lib/supabase/server.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "createClient",
    ()=>createClient,
    "getAuthenticatedUser",
    ()=>getAuthenticatedUser,
    "getSupabaseAdmin",
    ()=>getSupabaseAdmin,
    "supabaseAdmin",
    ()=>supabaseAdmin
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$ssr$2f$dist$2f$module$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@supabase/ssr/dist/module/index.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$ssr$2f$dist$2f$module$2f$createServerClient$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@supabase/ssr/dist/module/createServerClient.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/headers.js [app-route] (ecmascript)");
;
;
function ensureSupabaseEnv() {
    const url = ("TURBOPACK compile-time value", "https://placeholder.supabase.co");
    const key = ("TURBOPACK compile-time value", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder");
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    return {
        url,
        key
    };
}
async function createClient() {
    const cookieStore = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["cookies"])();
    const { url, key } = ensureSupabaseEnv();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$ssr$2f$dist$2f$module$2f$createServerClient$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createServerClient"])(url, key, {
        cookies: {
            getAll () {
                return cookieStore.getAll();
            },
            setAll (cookiesToSet) {
                try {
                    cookiesToSet.forEach(({ name, value, options })=>cookieStore.set(name, value, options));
                } catch  {
                // The `setAll` method was called from a Server Component.
                // This can be ignored if you have middleware refreshing
                // user sessions.
                }
            }
        }
    });
}
/**
 * Service-role admin client. **Bypasses RLS.** Lazy-initialized so missing
 * env vars only throw when actually used, not at module load.
 *
 * Only use for trusted server-side operations that must cross user boundaries
 * (e.g. scheduled cleanup jobs). Never use for user-scoped reads/writes —
 * prefer `createClient()` + `getAuthenticatedUser()` so RLS applies.
 */ let _adminClient = null;
function getSupabaseAdmin() {
    if (_adminClient) return _adminClient;
    const url = ("TURBOPACK compile-time value", "https://placeholder.supabase.co");
    const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceRole) {
        throw new Error('Missing Supabase admin environment variables. Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to .env.local.');
    }
    _adminClient = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$ssr$2f$dist$2f$module$2f$createServerClient$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createServerClient"])(url, serviceRole, {
        cookies: {
            getAll () {
                return [];
            },
            setAll () {
            // No-op for admin client
            }
        }
    });
    return _adminClient;
}
const supabaseAdmin = new Proxy({}, {
    get (_target, prop) {
        const client = getSupabaseAdmin();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const value = client[prop];
        return typeof value === 'function' ? value.bind(client) : value;
    }
});
async function getAuthenticatedUser() {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return null;
    return data.user;
}
}),
"[project]/lib/schemas.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "aiCategorizeSchema",
    ()=>aiCategorizeSchema,
    "aiQuerySchema",
    ()=>aiQuerySchema,
    "amountSchema",
    ()=>amountSchema,
    "authSchema",
    ()=>authSchema,
    "createBudgetSchema",
    ()=>createBudgetSchema,
    "createCategorySchema",
    ()=>createCategorySchema,
    "createTransactionSchema",
    ()=>createTransactionSchema,
    "dateSchema",
    ()=>dateSchema,
    "pushSubscriptionSchema",
    ()=>pushSubscriptionSchema,
    "recurringIntervalSchema",
    ()=>recurringIntervalSchema,
    "sendPushSchema",
    ()=>sendPushSchema,
    "transactionQuerySchema",
    ()=>transactionQuerySchema,
    "transactionTypeSchema",
    ()=>transactionTypeSchema,
    "updateBudgetSchema",
    ()=>updateBudgetSchema,
    "updateCategorySchema",
    ()=>updateCategorySchema,
    "updateTransactionSchema",
    ()=>updateTransactionSchema,
    "uuidSchema",
    ()=>uuidSchema
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/v3/external.js [app-route] (ecmascript) <export * as z>");
;
const uuidSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().uuid();
const amountSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].coerce.number().positive().max(1_000_000_000);
const dateSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD');
// Helper to convert empty strings to null for optional UUIDs
const optionalUuidToNull = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].preprocess((val)=>val === '' || val === undefined ? null : val, uuidSchema.nullable().optional());
const transactionTypeSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
    'income',
    'expense'
]);
const recurringIntervalSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
    'daily',
    'weekly',
    'monthly',
    'yearly'
]);
const createTransactionSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    amount: amountSchema,
    type: transactionTypeSchema,
    category_id: optionalUuidToNull,
    description: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().trim().max(500).optional().nullable(),
    date: dateSchema.optional(),
    is_recurring: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].boolean().optional(),
    recurring_interval: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].preprocess((val)=>val === '' ? null : val, recurringIntervalSchema.nullable().optional())
});
const updateTransactionSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    id: uuidSchema,
    amount: amountSchema.optional(),
    type: transactionTypeSchema.optional(),
    category_id: optionalUuidToNull,
    description: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().trim().max(500).optional().nullable(),
    date: dateSchema.optional(),
    is_recurring: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].boolean().optional(),
    recurring_interval: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].preprocess((val)=>val === '' ? null : val, recurringIntervalSchema.nullable().optional())
});
const transactionQuerySchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    start: dateSchema.optional(),
    end: dateSchema.optional(),
    type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        'income',
        'expense',
        'all'
    ]).optional()
});
const createCategorySchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    name: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().trim().min(1).max(50),
    icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().trim().max(50).optional()
});
const updateCategorySchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    id: uuidSchema,
    name: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().trim().min(1).max(50).optional(),
    icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().trim().max(50).optional()
});
const createBudgetSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    category_id: uuidSchema,
    month: dateSchema,
    amount: amountSchema,
    alert_threshold: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].coerce.number().min(0.1).max(1).optional()
});
const updateBudgetSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    id: uuidSchema,
    amount: amountSchema.optional(),
    alert_threshold: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].coerce.number().min(0.1).max(1).optional()
});
const aiQuerySchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    query: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().trim().min(1).max(1000)
});
const aiCategorizeSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    description: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().trim().min(1).max(500)
});
const pushSubscriptionSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    endpoint: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().url(),
    keys: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
        p256dh: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1),
        auth: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1)
    })
});
const sendPushSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    message: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().trim().min(1).max(500),
    title: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().trim().max(100).optional()
});
const authSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    email: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().email(),
    password: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(8).max(128),
    full_name: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().trim().min(1).max(100).optional()
});
}),
"[project]/lib/ai.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "answerFinancialQuery",
    ()=>answerFinancialQuery,
    "calculateFinancialHealthScore",
    ()=>calculateFinancialHealthScore,
    "categorizeTransaction",
    ()=>categorizeTransaction,
    "default",
    ()=>__TURBOPACK__default__export__,
    "detectSpendingAnomalies",
    ()=>detectSpendingAnomalies,
    "generateMonthlySummary",
    ()=>generateMonthlySummary,
    "generateSpendingInsights",
    ()=>generateSpendingInsights
]);
// Groq AI Integration for SmartSpend - FREE & FAST
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$groq$2d$sdk$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/groq-sdk/index.mjs [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$groq$2d$sdk$2f$client$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__Groq__as__default$3e$__ = __turbopack_context__.i("[project]/node_modules/groq-sdk/client.mjs [app-route] (ecmascript) <export Groq as default>");
;
// Get API key from environment
const apiKey = process.env.GROQ_API_KEY;
// Debug logging (remove in production)
if (!apiKey) {
    console.error('⚠️ GROQ_API_KEY is not set in environment variables');
} else {
    console.log('✅ Groq API key found, length:', apiKey.length);
}
// Initialize Groq client with API key
const groq = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$groq$2d$sdk$2f$client$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__Groq__as__default$3e$__["default"]({
    apiKey: apiKey || 'dummy-key-for-initialization'
});
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';
/**
 * Call Groq AI API with financial context
 */ async function callGroqAI(prompt, systemPrompt) {
    const messages = [];
    // Add system prompt for financial expertise
    if (systemPrompt) {
        messages.push({
            role: 'system',
            content: systemPrompt
        });
    } else {
        messages.push({
            role: 'system',
            content: `You are SmartSpend AI, an expert personal finance assistant for students and young professionals in India. 
      
Your role:
- Analyze spending patterns and provide actionable insights
- Answer questions about transactions, budgets, and savings
- Use ₹ (rupee symbol) for all currency amounts
- Be friendly, encouraging, and non-judgmental
- Provide specific, data-driven recommendations
- Keep responses concise (2-4 sentences) unless asked for details
- Format numbers with commas (e.g., ₹1,50,000)
- Highlight concerning patterns gently
- Celebrate good financial habits

Always base your answers on the provided transaction and budget data.`
        });
    }
    messages.push({
        role: 'user',
        content: prompt
    });
    try {
        const response = await groq.chat.completions.create({
            model: GROQ_MODEL,
            messages,
            temperature: 0.7,
            max_tokens: 1024
        });
        return response.choices[0]?.message?.content || 'No response generated';
    } catch (error) {
        console.error('Groq AI error:', error);
        throw error;
    }
}
async function categorizeTransaction(description, categoriesCsv) {
    try {
        const prompt = `Classify this expense into one category: ${categoriesCsv}. Reply with only the category name.\nDescription: ${description}`;
        return (await callGroqAI(prompt)).trim() || null;
    } catch (error) {
        console.error('AI categorization error:', error);
        return null;
    }
}
async function answerFinancialQuery(query, context) {
    try {
        const prompt = `You are a helpful personal finance assistant. Answer based on this data:\n${JSON.stringify(context)}\n\nUser question: ${query}\n\nBe concise and friendly. Use ₹ for rupee amounts.`;
        return await callGroqAI(prompt);
    } catch (error) {
        console.error('AI query error:', error);
        return `AI Error: ${error instanceof Error ? error.message : 'Unknown'}`;
    }
}
async function generateMonthlySummary(transactions, budgets) {
    try {
        const prompt = `Generate a friendly monthly financial summary:\nTransactions: ${JSON.stringify(transactions)}\nBudgets: ${JSON.stringify(budgets)}\n\nInclude: total income, expenses, savings rate, top spending, and one money-saving tip. Use ₹.`;
        return await callGroqAI(prompt);
    } catch (error) {
        console.error('AI summary error:', error);
        return 'Unable to generate summary.';
    }
}
async function generateSpendingInsights(transactions, budgets) {
    const recentTransactions = transactions.slice(0, 50);
    const prompt = `Analyze these recent transactions and provide 3-5 key insights:\n\n${JSON.stringify(recentTransactions, null, 2)}\n\n${budgets ? `\nBudget status:\n${JSON.stringify(budgets, null, 2)}` : ''}\n\nProvide insights on:\n1. Total spending trends\n2. Top spending categories\n3. Any unusual patterns\n4. Budget compliance (if budget data provided)\n5. One actionable money-saving tip\n\nBe specific with amounts in ₹.`;
    return await callGroqAI(prompt);
}
async function detectSpendingAnomalies(transactions) {
    const prompt = `Analyze these transactions for anomalies (unusual spending patterns):\n\n${JSON.stringify(transactions.slice(0, 100), null, 2)}\n\nLook for:\n1. Unusually large amounts compared to category average\n2. Sudden spikes in specific categories\n3. Changes in spending frequency\n\nReturn JSON array of anomalies found (max 3) with format:\n[{\n  "type": "unusual_amount|category_spike|frequency_change",\n  "description": "Brief description",\n  "severity": "low|medium|high",\n  "suggestion": "Actionable suggestion"\n}]\n\nIf no anomalies found, return empty array.`;
    try {
        const response = await callGroqAI(prompt);
        // Extract JSON from response
        const jsonMatch = response.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        return [];
    } catch (error) {
        console.error('Anomaly detection error:', error);
        return [];
    }
}
async function calculateFinancialHealthScore(metrics) {
    const prompt = `Calculate a financial health score (0-100) based on:\n\nIncome: ₹${metrics.totalIncome.toLocaleString('en-IN')}\nExpenses: ₹${metrics.totalExpenses.toLocaleString('en-IN')}\nSavings Rate: ${metrics.savingsRate}%\nBudget Compliance: ${metrics.budgetCompliance}%\n${metrics.emergencyFundMonths ? `Emergency Fund: ${metrics.emergencyFundMonths} months` : ''}\n\nReturn JSON with:\n{\n  "score": number (0-100),\n  "grade": "A|B|C|D|F",\n  "strengths": ["array of 2-3 positive observations"],\n  "improvements": ["array of 2-3 actionable suggestions"]\n}`;
    try {
        const response = await callGroqAI(prompt);
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        // Fallback calculation
        const score = Math.round(metrics.savingsRate * 0.4 + metrics.budgetCompliance * 0.4 + (metrics.emergencyFundMonths ? Math.min(metrics.emergencyFundMonths * 10, 20) : 0));
        return {
            score: Math.min(score, 100),
            grade: score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F',
            strengths: [
                'Regular income tracking',
                'Active budget management'
            ],
            improvements: [
                'Increase savings rate',
                'Build emergency fund'
            ]
        };
    } catch (error) {
        console.error('Health score calculation error:', error);
        return {
            score: 50,
            grade: 'C',
            strengths: [
                'Getting started with financial tracking'
            ],
            improvements: [
                'Set up budgets',
                'Track expenses consistently'
            ]
        };
    }
}
const __TURBOPACK__default__export__ = {
    categorizeTransaction,
    answerFinancialQuery,
    generateMonthlySummary,
    generateSpendingInsights,
    detectSpendingAnomalies,
    calculateFinancialHealthScore
};
}),
"[project]/app/api/ai/query/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/supabase/server.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$schemas$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/schemas.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ai$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/ai.ts [app-route] (ecmascript)");
;
;
;
;
async function POST(request) {
    const user = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getAuthenticatedUser"])();
    if (!user) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'Unauthorized'
        }, {
            status: 401
        });
    }
    const json = await request.json().catch(()=>null);
    if (!json) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'Invalid JSON'
        }, {
            status: 400
        });
    }
    const parsed = __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$schemas$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["aiQuerySchema"].safeParse(json);
    if (!parsed.success) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'Please enter a valid question.'
        }, {
            status: 400
        });
    }
    const userQuery = parsed.data.query;
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createClient"])();
    const [{ data: transactions }, { data: budgets }] = await Promise.all([
        supabase.from('transactions').select('amount, type, date, categories(name)').eq('user_id', user.id).order('date', {
            ascending: false
        }).limit(500),
        supabase.from('budgets').select('amount, month, categories(name)').eq('user_id', user.id)
    ]);
    const context = {
        transactions: (transactions || []).map((t)=>({
                amount: t.amount,
                type: t.type,
                date: t.date,
                category: t.categories?.name || 'Uncategorized'
            })),
        budgets: (budgets || []).map((b)=>({
                category: b.categories?.name,
                amount: b.amount,
                month: b.month
            }))
    };
    try {
        const answer = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ai$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["answerFinancialQuery"])(userQuery, context);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            answer
        });
    } catch (error) {
        const msg = error?.message || String(error);
        // Map common errors to friendly messages
        if (msg.includes('429') || msg.includes('rate') || msg.includes('quota')) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                answer: '🤖 The AI is experiencing high traffic right now. Please try again in a minute.'
            });
        }
        if (msg.includes('401') || msg.includes('unauthorized') || msg.includes('key')) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                answer: '🔧 AI service is being configured. Please check back soon!'
            });
        }
        if (msg.includes('timeout') || msg.includes('timed out')) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                answer: '⏳ The AI took too long to respond. Try a simpler question or try again.'
            });
        }
        console.error('AI query error:', msg);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            answer: '😕 Something went wrong. Please try rephrasing your question or try again later.'
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__1r_v9cd._.js.map