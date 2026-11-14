# Tech Stack

This document describes every technology used in the Employee Management System, what it does in the project, and why it is used.

---

## 1. Summary

| Layer            | Technology                              | Version                    |
| ---------------- | --------------------------------------- | -------------------------- |
| Framework        | Next.js (App Router + Route Handlers)   | 16.4.3                     |
| UI runtime       | React                                   | 19.3.0                     |
| Language         | TypeScript (strict)                     | 5.x                        |
| Styling          | Tailwind CSS                            | 4.x                        |
| UI primitives    | Radix UI (shadcn-style components)      | 1.x / 2.x                  |
| Server state     | TanStack Query                          | 5.105                      |
| Forms            | React Hook Form + `@hookform/resolvers` | 7.91 / 6.0                 |
| Validation       | Zod                                     | 4.6                        |
| Database         | MongoDB + Mongoose                      | 9.11                       |
| Auth tokens      | `jose` (JWT, HS256)                     | 6.2                        |
| Password hashing | `bcryptjs`                              | 3.0                        |
| Charts           | Recharts                                | 3.10                       |
| Animation        | GSAP + `@gsap/react`                    | 3.15 / 2.1                 |
| Icons            | `lucide-react`                          | 1.64                       |
| Theming          | `next-themes`                           | 0.4                        |
| Notifications    | `sonner`                                | 2.0                        |
| Testing          | Vitest + `mongodb-memory-server`        | 5.0 / 11.3                 |
| Tooling          | ESLint 9, Prettier, `tsx`, `dotenv`     | —                          |
| Runtime          | Node.js                                 | 20.9+ (22 LTS recommended) |

---

## 2. Framework & runtime

### Next.js 16.4.3

- **What it does:** Runs the entire application — both the React UI and the REST API — in a single process.
- **How it is used:**
  - **App Router** with route groups: `(auth)` for login and `(dashboard)` for authenticated pages.
  - **Route Handlers** under `src/app/api/**` implement the REST API.
  - **Server Components** for layout/session reading; **Client Components** for interactive features.
  - **`src/proxy.ts`** is the Next.js 16 middleware equivalent — the edge auth gate that validates the JWT and enforces role/page access before rendering.
  - **Turbopack** for development and CSS processing.
  - **Standalone output** for production deployment (`output: "standalone"`).
- **Why:** One framework and one dev server for frontend + backend, with strong server/client boundaries and built-in routing.

### React 19.3.0

- **What it does:** Renders the UI.
- **How it is used:** Client components for forms, dialogs, tables, charts and animations; server components for static shells and session reads.
- **Why:** The framework's bundled React version with modern hooks and server/client component support.

### TypeScript 5 (strict)

- **What it does:** Static typing across the whole codebase.
- **Why:** Catches integration errors at compile time; strict mode is enabled. `npm run typecheck` runs `next typegen && tsc --noEmit`.

### Node.js 20.9+

- **What it does:** JavaScript runtime for Next.js and the maintenance scripts.

---

## 3. Styling & UI

### Tailwind CSS 4

- **What it does:** Utility-first styling and the design-token system.
- **How it is used:** The "Ink & Paper" theme is defined in `src/app/globals.css` with CSS variables and `@theme inline` tokens (colors, radii, shadows, fonts, animations). Processed in dev via `@tailwindcss/turbopack`.
- **Why:** Fast, consistent styling with a single token source of truth.

### Radix UI (shadcn-style components)

- **Packages:** `@radix-ui/react-dialog`, `-select`, `-dropdown-menu`, `-tooltip`, `-label`, `-checkbox`, `-slot`.
- **What it does:** Accessible, unstyled primitives for interactive components.
- **How it is used:** Wrapped by project components in `src/components/ui/*` (dialog, select, dropdown-menu, tooltip, label, checkbox, button, input, table, badge, card, sheet, skeleton).
- **Why:** Keyboard and screen-reader accessibility without reinventing behavior.

### `clsx` + `tailwind-merge`

- **What it does:** Conditional class names and conflict-free class merging.
- **How it is used:** The `cn()` helper in `src/lib/utils.ts`.

### `lucide-react`

- **What it does:** Icon set.
- **How it is used:** All icons, rendered at 1.5px stroke to match the design language.

### `next-themes`

- **What it does:** Light/dark theme switching.
- **How it is used:** Theme provider plus the theme toggle; the design tokens have `.dark` variants.

### `sonner`

- **What it does:** Toast notifications.
- **How it is used:** Success/error feedback for mutations, credential actions, exports, etc.

---

## 4. Data fetching & forms

### TanStack Query 5

- **What it does:** Client-side server-state management — caching, mutations, invalidation, retries.
- **How it is used:** Hooks such as `useEmployees`, `useEmployee`, `useDashboardStats`, `useAccount`, `useCreateAccount`, `useUpdateAccount`, `useUsernameAvailability`.
- **Why:** Predictable caching and invalidation with minimal boilerplate.

### React Hook Form 7

- **What it does:** Form state and submission handling.
- **How it is used:** Login, employee create/edit, login-access dialogs and credential-change forms; `useWatch` is used where needed to stay React-Compiler-friendly.
- **Why:** Low re-render forms with straightforward validation integration.

### Zod 4

- **What it does:** Runtime schema validation, shared between server and client.
- **How it is used:**
  - API request validation (`loginSchema`, `createEmployeeSchema`, `createAccountSchema`, …).
  - Form validation via `@hookform/resolvers/zod`.
  - Environment variable validation at startup (`src/server/config/env.ts`).
- **Why:** One schema source of truth for both boundaries; typed inputs via `z.infer`.

### `use-debounce`

- **What it does:** Debounces the live username availability check (~500 ms).

---

## 5. Backend & data

### MongoDB

- **What it does:** Document database.
- **How it is used:** Stores `employees` and `users` collections. Can run on MongoDB Atlas (used in development) or locally via Docker.

### Mongoose 9

- **What it does:** ODM — schemas, models, validation and queries.
- **How it is used:**
  - `Employee` model — soft delete (`isDeleted`), indexes for list/search.
  - `User` model — unique `username`, unique partial `employeeRef` (one login per employee), `tokenVersion`, `mustChangePassword`.
  - Aggregation pipelines power dashboard statistics.
- **Why:** Typed, schema-driven access with indexing and lifecycle hooks.

### `server-only`

- **What it does:** Prevents accidental client bundling of server code.
- **How it is used:** Every module under `src/server/**` begins with `import "server-only"`, enforcing the server/client boundary at build time.

---

## 6. Auth & security

### `jose`

- **What it does:** JWT signing and verification (HS256).
- **How it is used:** `signSession` on login/credential change; `verifyToken` in the session layer; self-contained verification inside `src/proxy.ts` (edge-compatible).
- **Claims:** `sub`, `role`, `username`, `name`, `tv` (token version), `mcp` (must-change-password).

### `bcryptjs`

- **What it does:** Password hashing.
- **How it is used:** Cost factor 12; `passwordHash` is excluded from queries by default (`select: false`) and only opted in for login and password changes.

### Cookie-based sessions

- **What it does:** The JWT is stored in a `httpOnly`, `SameSite=lax` cookie (`ems_token`), never exposed to JavaScript.
- **Why:** Mitigates XSS token theft.

### Rate limiting

- **What it does:** In-memory sliding-window limiter (`src/server/security/rate-limit.ts`).
- **Limits:** login 5 / 15 min (per IP + username), API 120 / min (per IP), credential change 5 / 15 min (per user).

### Security headers

- Configured in `next.config.ts`: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, restrictive `Permissions-Policy`.

---

## 7. Charts & animation

### Recharts 3

- **What it does:** Declarative chart components.
- **How it is used:** Department distribution chart, dynamically imported with `ssr: false` so it never blocks server rendering or the initial bundle.

### GSAP 3 + `@gsap/react`

- **What it does:** High-performance animation.
- **How it is used:** The `useMotion` hook integrates GSAP with React lifecycles; presets implement fade-up, scale-in, slide-in, shake and hover effects. **SplitText** drives masked, line-by-line page-title reveals.

---

## 8. Testing & tooling

### Vitest 5

- **What it does:** Unit/integration test runner.
- **How it is used:** 6 suites / 31 tests covering services, validation and API behavior. Run with `npm test` or `npm run test:watch`.

### `mongodb-memory-server`

- **What it does:** Spins up an in-memory MongoDB for tests.
- **Why:** Fast, isolated database tests with no external dependency.

### `@faker-js/faker`

- **What it does:** Generates realistic seed data.
- **How it is used:** `npm run seed` inserts 60 fake employees through the service layer.

### `tsx` + `dotenv`

- **What it does:** Runs TypeScript scripts and loads `.env.local`.
- **How it is used:** `create-admin`, `seed`, `migrate:users`, and the index-inspection/maintenance scripts.

### ESLint 9 + `eslint-config-next`

- **What it does:** Static analysis and Next.js/React rules.
- **How it is used:** `npm run lint`.

### Prettier

- **What it does:** Consistent code formatting.
- **How it is used:** `npm run format` / `npm run format:check`.

### Docker Compose (optional)

- **What it does:** Runs a local `mongo:7` instance with a named volume.
- **How it is used:** `npm run db:up` / `npm run db:down`. Atlas or an existing MongoDB can be used instead.

---

## 9. Configuration

### Environment variables

| Variable               | Required | Purpose                                              |
| ---------------------- | :------: | ---------------------------------------------------- |
| `MONGODB_URI`          |   yes    | MongoDB / Atlas connection string                    |
| `JWT_SECRET`           |   yes    | Token signing secret (≥ 32 chars)                    |
| `JWT_EXPIRES_IN`       |    no    | Token lifetime (`30m`, `12h`, `7d`, …; default `7d`) |
| `ADMIN_EMAIL`          |   yes    | Admin email used by `create-admin`                   |
| `ADMIN_PASSWORD`       |   yes    | Admin password used by `create-admin`                |
| `ADMIN_USERNAME`       |   yes    | Admin username used by `create-admin`                |
| `NODE_ENV`             |    no    | `development` / `test` / `production`                |
| `NEXT_PUBLIC_APP_NAME` |    no    | Display name used by the UI                          |

Environment values are validated with Zod at startup; the app fails fast on invalid configuration.

### Architecture & layering

```
Route Handler → withApi (auth + rate limit) → Zod validation → Service → Mongoose Model → MongoDB
```

- Pages in `src/app/**` only fetch data or compose feature components.
- UI logic lives in `src/features/**`.
- Shared schemas/types live in `src/shared/**` and are imported by both client and server.
- Server-only code lives in `src/server/**` and is guarded by `server-only`.

### Scripts

| Command                                    | Purpose                                    |
| ------------------------------------------ | ------------------------------------------ |
| `npm run dev`                              | Start the app + API (Turbopack)            |
| `npm run build` / `npm start`              | Production build / serve                   |
| `npm run lint`                             | ESLint                                     |
| `npm run typecheck`                        | Next typegen + `tsc --noEmit`              |
| `npm test` / `npm run test:watch`          | Vitest                                     |
| `npm run format` / `format:check`          | Prettier                                   |
| `npm run seed` / `npm run seed -- --clear` | Seed / wipe + seed employees               |
| `npm run create-admin`                     | Idempotent admin upsert                    |
| `npm run migrate:users`                    | Migrate legacy email accounts to usernames |
| `npm run db:up` / `npm run db:down`        | Start/stop Docker MongoDB                  |
