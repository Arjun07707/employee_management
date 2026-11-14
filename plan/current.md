# Current Project: Employee Management System

## Project Details
- **Name:** Employee Management System (emp_manage)
- **Type:** Full-stack SaaS-style HR dashboard (Next.js 15 App Router)
- **Purpose:** Manage employee records with auth, CRUD, search/filter/sort/pagination, CSV export, and dashboard statistics.
- **Database:** MongoDB (Mongoose) — collections: `employees`, `users`, `counters`; soft-delete via `isDeleted`/`deletedAt`; partial unique email index.
- **Auth:** JWT (HS256, jose) in httpOnly cookie; roles `admin` / `viewer`; rate-limited login; admin seeded via `scripts/create-admin.ts`.
- **API:** Standard response format (`success`/`message`/`data`/`errors`); endpoints: `/api/health`, `/api/auth/*`, `/api/employees`, `/api/employees/:id`, `/api/employees/export`, `/api/dashboard/stats`.
- **Frontend:** Login page, dashboard (stats, charts, recent employees), employees list/new/edit/details; URL-synced filters; TanStack Query; shadcn/ui; GSAP animations.
- **Validation:** Zod schemas in `src/shared/schemas` shared by API and frontend forms.
- **Environment:** `.env.local` with `MONGODB_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `NODE_ENV`, `NEXT_PUBLIC_APP_NAME`.
- **Scripts:** `dev`, `build`, `start`, `lint`, `typecheck`, `test`, `seed`, `create-admin`.
- **Tests:** Vitest + mongodb-memory-server (6 files, 31 tests).

## Tech Stack
- **Framework:** Next.js 16.4.3 (App Router, Turbopack)
- **UI:** React 19.3.0, TypeScript 5, Tailwind CSS v4, shadcn/ui (Radix primitives)
- **State/Data:** TanStack Query v5, React Hook Form + `@hookform/resolvers/zod`
- **Database/ORM:** Mongoose 9, MongoDB
- **Auth/Crypto:** jose (JWT), bcryptjs, zod
- **Charts/Animations:** Recharts, GSAP 3 + `@gsap/react`, Sonner, lucide-react, next-themes
- **Dev/Test:** Vitest, mongodb-memory-server, tsx, ESLint, Prettier
