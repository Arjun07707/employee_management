# Employee Management System

A full-stack employee management app built with **Next.js 16 (App Router)**,
**TypeScript**, **MongoDB + Mongoose**, **Zod**, and **JWT auth**. The API and
the app run in a single Next.js process, so one `pnpm dev` is all you need.

> **Status:** complete. The backend (API, auth, tests) and the frontend UI
> (login, dashboard, employees CRUD, charts, GSAP motion, dark/light theme)
> are both implemented. One `pnpm dev` runs everything.

## Tech stack

| Layer      | Choice                                                  |
| ---------- | ------------------------------------------------------- |
| Framework  | Next.js 16.4 (Route Handlers, `src/proxy.ts` auth gate) |
| Language   | TypeScript (strict)                                     |
| Database   | MongoDB with Mongoose 9                                 |
| Validation | Zod 4 (shared between API and forms)                    |
| Auth       | JWT (HS256, `jose`) in an httpOnly cookie               |
| Passwords  | bcryptjs, cost 12                                       |
| Frontend   | Tailwind v4, shadcn-style UI, GSAP, TanStack Query      |
| Forms      | React Hook Form + Zod resolver                          |
| Tests      | Vitest 5 + `mongodb-memory-server`                      |

## Quick start

**Prerequisites:** Node.js 20.9+ (22 LTS recommended), pnpm 10+ (via
`corepack enable pnpm`), and a MongoDB instance (MongoDB Atlas, a local
install, or Docker).

```bash
# 1. Install dependencies
pnpm install

# 2. Create your env file and fill in the values
cp .env.example .env.local          # macOS / Linux
Copy-Item .env.example .env.local   # Windows PowerShell

# 3. Start MongoDB locally (only if you use Docker)
pnpm db:up

# 4. Create the admin account from ADMIN_USERNAME / ADMIN_PASSWORD
pnpm create-admin

# 5. Optional: add 60 fake employees
pnpm seed

# 6. Run the app (API + UI in one process)
pnpm dev
```

Open <http://localhost:3000>. The API lives under `/api`; see
[`docs/API.md`](docs/API.md) for requests and responses.

### Environment variables

| Variable               | Required | Notes                                      |
| ---------------------- | -------- | ------------------------------------------ |
| `MONGODB_URI`          | yes      | Local URI or Atlas `mongodb+srv://` URI    |
| `JWT_SECRET`           | yes      | At least 32 characters; use a random value |
| `JWT_EXPIRES_IN`       | no       | `7d` by default (`30m`, `12h`, `7d`, …)    |
| `ADMIN_PASSWORD`       | setup    | Only needed to run `pnpm create-admin`     |
| `ADMIN_USERNAME`       | setup    | Only needed to run `pnpm create-admin`     |
| `NODE_ENV`             | no       | `development` / `test` / `production`      |
| `NEXT_PUBLIC_APP_NAME` | no       | Display name used by the UI                |

`.env.local` is git-ignored. `.env.example` is committed. Environment values
are validated with Zod at startup and the app fails fast on bad config.

### MongoDB options

- **Atlas:** create a database user with `readWrite` on
  `employee_management`, allow your IP, and paste the SRV URI into
  `MONGODB_URI`.
- **Docker (local):** `pnpm db:up` starts `mongo:7` on port 27017 with a
  named volume (`mongo_data`), so data survives restarts. Stop it with
  `pnpm db:down`.
- **Existing local MongoDB:** point `MONGODB_URI` at it directly.

## Scripts

| Command                  | Purpose                                             |
| ------------------------ | --------------------------------------------------- |
| `pnpm dev`               | Start Next.js (app + API) in development            |
| `pnpm build`             | Production build (standalone output)                |
| `pnpm start`             | Serve the production build                          |
| `pnpm lint`              | ESLint                                              |
| `pnpm typecheck`         | Generate Next route types and run `tsc --noEmit`    |
| `pnpm test`              | Run the Vitest suite once                           |
| `pnpm test:watch`        | Vitest in watch mode                                |
| `pnpm seed`              | Insert 60 faker employees through the service layer |
| `pnpm seed -- --clear`   | Wipe employees first, then seed                     |
| `pnpm create-admin`      | Idempotent admin upsert from env                    |
| `pnpm db:up` / `db:down` | Start/stop the Docker MongoDB                       |

## API overview

All responses use a standard envelope:
`{ success, message?, data?, pagination?, errors? }`.

| Method   | Path                           | Access               | Purpose                           |
| -------- | ------------------------------ | -------------------- | --------------------------------- |
| `GET`    | `/api/health`                  | public               | Server + DB connectivity          |
| `POST`   | `/api/auth/login`              | public, rate-limited | Sign in, set cookie               |
| `POST`   | `/api/auth/logout`             | any                  | Clear cookie                      |
| `GET`    | `/api/auth/me`                 | any                  | Current user                      |
| `GET`    | `/api/auth/username-available` | public, rate-limited | Check if a username is available  |
| `POST`   | `/api/auth/change-credentials` | any                  | Change password / username        |
| `GET`    | `/api/employees/:id/account`   | admin                | Get employee's login account      |
| `POST`   | `/api/employees/:id/account`   | admin                | Create employee login account     |
| `PATCH`  | `/api/employees/:id/account`   | admin                | Update employee login account     |
| `GET`    | `/api/employees`               | admin, viewer        | Search / filter / sort / paginate |
| `POST`   | `/api/employees`               | admin                | Create                            |
| `GET`    | `/api/employees/export`        | admin, viewer        | CSV export (max 10,000)           |
| `GET`    | `/api/employees/:id`           | admin, viewer        | Details                           |
| `PATCH`  | `/api/employees/:id`           | admin                | Partial update                    |
| `DELETE` | `/api/employees/:id`           | admin                | Soft delete                       |
| `GET`    | `/api/dashboard/stats`         | admin, viewer        | Dashboard aggregates              |

Status codes: `200`, `201`, `400` (validation / bad id / bad JSON),
`401`, `403`, `404`, `409` (duplicate username), `429` (with `Retry-After`),
`500`, and `503` for a degraded health check. Full examples are in
[`docs/API.md`](docs/API.md).

### Auth and roles

- Login is username-based (`POST /api/auth/login` with `username` + `password`).
- Login sets `ems_token`: `HttpOnly`, `SameSite=Lax`, `Path=/`, `Secure` in
  production, lifetime equal to the JWT expiry.
- `src/proxy.ts` (the Next 16 replacement for `middleware.ts`) redirects
  unauthenticated page requests to `/login?next=…` and returns `401` JSON for
  protected API routes.
- Employees who must change their password (`mustChangePassword`) are gated to
  `/account` until they set a new one.
- Route handlers call `requireRole()` again as defense in depth; viewers get
  `403` on every mutation.
- Login is limited to 5 attempts per 15 minutes per IP + username; the API is
  limited to 120 requests per minute per IP.
- Roles: `admin`, `viewer`, `employee`. Employees land on `/me` after sign-in;
  admins and viewers land on `/dashboard`.

### Database notes

- Collections: `employees`, `users`, `counters`.
- `employeeId` (`EMP-0001`, …) comes from an atomic counter. Gaps are expected
  when a create fails after the increment.
- Username uniqueness is enforced by a unique index on
  `{ username: 1 }`, and one login per employee is enforced by a partial unique
  index on `{ employeeRef: 1 }` where `employeeRef` is set. Duplicate
  username/employeeRef conflicts map to `409` for race conditions.
- Delete is always soft (`isDeleted`, `deletedAt`). Soft-deleted rows are
  excluded from lists, search, export, detail reads, and dashboard stats.
- Listing/sorting indexes are partial on `isDeleted: false` and every list
  query includes that field. Sorts always add `_id` as a tiebreaker for stable
  pagination.
- The dashboard uses a single `$facet` aggregation and zero-fills all eight
  departments in the service.
- Mongoose `.lean()` is used for reads and every result passes through
  `toEmployeeDTO()`, so `isDeleted`, `deletedAt`, and `passwordHash` never
  reach the API.

## Project structure

```
src/
├── app/                 # routes only: pages + API route handlers
│   └── api/             # health, auth, employees, dashboard
├── shared/              # client-safe: Zod schemas, types, constants
├── server/              # backend-only ("server-only" imports)
│   ├── auth/            # JWT, session, cookies
│   ├── config/          # Zod-validated env
│   ├── db/              # cached Mongoose connection
│   ├── http/            # withApi, responses, errors, body parsing
│   ├── models/          # Employee, User, Counter
│   ├── security/        # rate limiting, regex escaping, sanitizing
│   ├── services/        # business + DB logic
│   └── utils/           # DTO mapper, CSV builder
├── proxy.ts             # Next 16 edge auth gate
tests/                   # unit + integration tests
scripts/                 # seed, create-admin
docs/                    # API reference and full project spec
plan/                    # original specification
```

Layering is strict: **route → withApi → Zod → service → model**. Routes stay
thin; services never import Next.js request/response types; all server-only
modules start with `import "server-only"`.

## Testing

```bash
pnpm test
```

The suite uses one shared `mongodb-memory-server` instance started in
`tests/setup.ts` and provided to tests through Vitest's `provide`/`inject`
API. It covers:

- Zod schemas: valid payloads, invalid email, negative salary, short name,
  bad phone, far-future joining date, empty PATCH, `limit > 100`.
- Services: create, duplicate email, search/filter/sort/pagination, soft
  delete, email reuse after delete, invalid/missing ids, dashboard zero-fill,
  CSV escaping.
- Utilities: regex escaping, rate-limit windows, error mapping.

No local MongoDB is required for tests.

## Deployment

- **Vercel + Atlas:** set the env vars in the project, use the Atlas SRV URI,
  and deploy. All API routes opt out of prerendering via `connection()`.
- **Docker:** `next.config.ts` enables `output: "standalone"`. A multi-stage
  `Dockerfile` and an `app` service in `docker-compose.yml` are provided for
  self-hosting. Build the image and run it with the same environment
  variables; the embedded Node server serves both the app and the API.
- **Indexes:** the seed script calls `syncIndexes()` in development. In
  production, create indexes during deployment instead of on every request.
  If you change an index definition, drop the old one first to avoid an
  index-options conflict.

## Roadmap

- [x] Database schema, indexes, and seed scripts
- [x] Shared Zod schemas and typed API layer
- [x] Auth, roles, rate limiting, security headers
- [x] Employees CRUD, search, CSV export, dashboard stats
- [x] Tests, typecheck, lint, production build
- [x] Login page and dashboard UI
- [x] Employee list, details, create/edit forms
- [x] Charts, GSAP motion, dark/light theme
- [x] Username-based login, `/me` profile, `/account` credentials
- [x] Admin provisioning of employee login accounts at employee creation

The full specification lives in [`plan/`](plan) and is consolidated in
[`docs/PROJECT_SPEC.md`](docs/PROJECT_SPEC.md).
