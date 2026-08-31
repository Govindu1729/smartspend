# 💰 SmartSpend

> A modern personal-finance PWA for students — track spending, set budgets, get AI-powered insights, and receive real-time push alerts when you're about to overspend.

SmartSpend is a full-stack Next.js 16 + Supabase application that helps users manage their money with confidence. It works offline, installs on mobile home screens, and uses Google Gemini to answer natural-language questions about your finances.

---

## ✨ Features

| Area | What it does |
|---|---|
| **Auth** | Email/password + Google OAuth via Supabase. Sessions persisted in HTTP-only cookies. Protected routes via Next.js middleware. |
| **Transactions** | Full CRUD with optimistic UI updates and automatic rollback on error. Filter by type, date range, search. Mark recurring. |
| **Categories** | 8 default categories auto-created on signup. Users can add/edit/delete custom categories. AI auto-categorizes new transactions. |
| **Budgets** | Per-category monthly budgets with custom alert thresholds (50–100%). Real-time spending tracking. |
| **Budget Alerts** | In-app banner + browser push notification when you cross 80% (configurable) and 100% of any budget. |
| **AI Insights** | Ask questions in plain English ("How much did I spend on food?"), get auto-generated monthly summaries, and auto-categorize expenses via Google Gemini. |
| **Reports** | 6-month income/expense trend, top spending categories, savings rate. Export transactions as CSV or text report. |
| **PWA** | Installable on Android/iOS, offline support via service worker (cache-first for static, network-first for data). |
| **Multi-Currency** 🆕 | Support for 10+ currencies (USD, EUR, GBP, INR, JPY, AUD, CAD, SGD, AED, SAR) with locale-aware formatting. |
| **Savings Goals** 🆕 | Set financial goals with targets, deadlines, and progress tracking. Add contributions and monitor achievement. |
| **Notification Preferences** 🆕 | Granular control over in-app, email, and push notifications with quiet hours support. |
| **Rate Limiting** 🆕 | API protection with Upstash Redis to prevent abuse and control costs. |

---

## 🧱 Tech Stack

- **Framework:** [Next.js 16](https://nextjs.org) (App Router) + React 19
- **Language:** TypeScript (strict)
- **Styling:** Tailwind CSS 4 + [shadcn/ui](https://ui.shadcn.com)
- **Database & Auth:** [Supabase](https://supabase.com) (Postgres + RLS)
- **AI:** Google Gemini (`@google/generative-ai`)
- **Charts:** [Recharts](https://recharts.org)
- **Push Notifications:** Web Push API (`web-push`)
- **Validation:** [Zod](https://zod.dev)

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Supabase project (free tier works)
- A Google AI Studio API key (for Gemini)
- VAPID keys for push notifications

### 1. Clone & install

```bash
git clone https://github.com/govindu1729/smartspend.git
cd smartspend
npm install
```

### 2. Configure environment

Copy the template and fill in your values:

```bash
cp .env.local.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

NEXT_PUBLIC_APP_URL=http://localhost:3000

GEMINI_API_KEY=your-gemini-api-key

# Generate with: npx web-push generate-vapid-keys
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
VAPID_EMAIL=mailto:you@example.com
```

### 3. Apply database schema

Open the Supabase SQL editor and run the contents of [`db/migrations/001_schema.sql`](db/migrations/001_schema.sql). This creates all tables, enables Row-Level Security with policies, and sets up a trigger to auto-create a profile + default categories on signup.

### 4. Run the dev server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

---

## 📁 Project Structure

```
smartspend/
├── app/                        # Next.js App Router
│   ├── (routes)/               # Pages: /, /login, /signup, /transactions, /budgets, /reports, /ai-insights, /settings, /notifications, /help
│   └── api/                    # Route handlers (all auth-checked, zod-validated)
│       ├── transactions/       # CRUD + /summary
│       ├── budgets/            # CRUD + /check-alerts
│       ├── categories/         # CRUD
│       ├── ai/                 # /categorize, /query
│       ├── push/               # /subscribe, /send
│       ├── export/             # CSV + PDF (text)
│       └── auth/               # /user, /signout, /delete-account, /callback
├── components/                 # React components + shadcn/ui primitives
├── hooks/                      # Data hooks (use-transactions, use-budgets, etc.)
├── lib/                        # Server utilities
│   ├── supabase/               # server / client / session helpers
│   ├── ai.ts                   # Gemini integration
│   ├── budget-alerts.ts        # Alert detection + push fan-out
│   ├── notifications.ts        # Web Push sender
│   ├── schemas.ts              # Zod schemas for all API inputs
│   └── utils.ts
├── db/migrations/              # SQL schema (RLS-enabled)
├── public/                     # Static assets, manifest.json, service worker
├── middleware.ts               # Route protection + session refresh
└── types/                      # Shared TS types
```

---

## 🔒 Security Model

- **Auth:** All `/api/*` routes (except `/api/auth/*`) require a valid session cookie. User identity is derived from the session via `getAuthenticatedUser()` — **never** from a client-supplied `user_id`.
- **Database:** Row-Level Security is enabled on every table. Policies use `auth.uid() = user_id`, so the user-scoped Supabase client can only read/write its own rows.
- **Service role:** The `SUPABASE_SERVICE_ROLE_KEY` is server-side only and bypasses RLS. It's used exclusively in `lib/notifications.ts` (for the cron sweep helper) and never in user-scoped handlers.
- **Input validation:** Every API route validates its input with [Zod](https://zod.dev) schemas defined in `lib/schemas.ts`.
- **Secrets:** All keys live in `.env.local`. The repo's `.gitignore` blocks `.env*`, `Vapid Keys`, and other secret patterns.

---

## 🧪 Scripts

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run start    # Run production server
npm run lint     # ESLint
```

---

## 🚢 Deployment

The app is configured for Vercel out of the box:

1. Push to GitHub
2. Import the repo at [vercel.com/new](https://vercel.com/new)
3. Add all env vars from `.env.local.example` in the project settings
4. Run the SQL migration in Supabase (if not already done)
5. Deploy

For push notifications to work in production, set `NEXT_PUBLIC_APP_URL` to your deployed URL and ensure the VAPID keys match what's in your service worker.

---

## 📝 License

MIT — feel free to fork, learn, and build on top of this.

---

## 🙌 Acknowledgements

Built by [Govindu Srimaan](https://github.com/govindu1729). Built with Next.js, Supabase, Tailwind, shadcn/ui, and Google Gemini.
