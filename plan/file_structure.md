# FILE STRUCTURE: Employee Management System

employee-management-system/
├── public/
│   ├── favicon.ico
│   └── logo.svg
│
├── docs/
│   ├── PROJECT_SPEC.md                    # the full spec (keep for AI re-reading)
│   └── API.md                             # request/response examples per endpoint
│
├── scripts/                               # run with tsx
│   ├── seed.ts                            # 60 fake employees (--clear)
│   └── create-admin.ts                    # idempotent admin user
│
├── tests/
│   ├── setup.ts                           # mongodb-memory-server lifecycle
│   ├── unit/
│   │   ├── employee.schema.test.ts
│   │   ├── escape-regex.test.ts
│   │   ├── rate-limit.test.ts
│   │   └── handle-error.test.ts
│   └── integration/
│       ├── employee.service.test.ts
│       └── dashboard.service.test.ts
│
├── src/
│   ├── app/                               # ROUTING ONLY: pages stay thin and compose feature components
│   │   ├── layout.tsx                     # fonts, <Providers>, <Toaster>, metadata
│   │   ├── globals.css                    # design tokens (light/dark), Tailwind layers, shimmer keyframes
│   │   ├── page.tsx                       # redirect -> /dashboard
│   │   ├── loading.tsx
│   │   ├── error.tsx
│   │   ├── not-found.tsx
│   │   ├── (auth)/
│   │   │   ├── layout.tsx                 # bare layout for login
│   │   │   └── login/page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx                 # app shell: Sidebar + Navbar + session gate
│   │   │   ├── template.tsx               # per-navigation GSAP page-enter animation
│   │   │   ├── dashboard/page.tsx
│   │   │   └── employees/
│   │   │       ├── page.tsx               # list
│   │   │       ├── new/page.tsx
│   │   │       └── [id]/
│   │   │           ├── page.tsx           # details
│   │   │           ├── edit/page.tsx
│   │   │           └── not-found.tsx
│   │   └── api/
│   │       ├── health/route.ts
│   │       ├── auth/
│   │       │   ├── login/route.ts
│   │       │   ├── logout/route.ts
│   │       │   └── me/route.ts
│   │       ├── dashboard/stats/route.ts
│   │       └── employees/
│   │           ├── route.ts               # GET list, POST create
│   │           ├── export/route.ts        # GET CSV
│   │           └── [id]/route.ts          # GET, PATCH, DELETE
│   │
│   ├── features/                          # FRONTEND, grouped by domain (edit one feature in one folder)
│   │   ├── auth/
│   │   │   ├── components/LoginForm.tsx
│   │   │   ├── components/BrandPanel.tsx  # animated gradient blobs + headline
│   │   │   ├── hooks/use-auth.ts
│   │   │   └── api.ts                     # login(), logout(), me()
│   │   ├── dashboard/
│   │   │   ├── components/
│   │   │   │   ├── StatCard.tsx
│   │   │   │   ├── StatsGrid.tsx
│   │   │   │   ├── DepartmentChart.tsx    # Recharts (dynamic import)
│   │   │   │   ├── DepartmentBreakdown.tsx# animated progress bars
│   │   │   │   ├── RecentEmployees.tsx
│   │   │   │   └── DashboardSkeleton.tsx
│   │   │   ├── hooks/use-dashboard-stats.ts
│   │   │   └── api.ts
│   │   └── employees/
│   │       ├── components/
│   │       │   ├── EmployeeTable.tsx
│   │       │   ├── EmployeeCard.tsx       # mobile list item
│   │       │   ├── EmployeeTableSkeleton.tsx
│   │       │   ├── EmployeeToolbar.tsx    # search + filters + actions
│   │       │   ├── SearchBar.tsx
│   │       │   ├── FilterBar.tsx
│   │       │   ├── FilterChips.tsx
│   │       │   ├── Pagination.tsx
│   │       │   ├── EmployeeForm.tsx       # create + edit
│   │       │   ├── FormSection.tsx
│   │       │   ├── EmployeeDetails.tsx
│   │       │   ├── DeleteConfirmDialog.tsx
│   │       │   ├── StatusBadge.tsx
│   │       │   ├── DepartmentBadge.tsx
│   │       │   └── EmptyState.tsx
│   │       ├── hooks/
│   │       │   ├── use-employees-list.ts
│   │       │   ├── use-employee.ts
│   │       │   ├── use-create-employee.ts
│   │       │   ├── use-update-employee.ts
│   │       │   ├── use-delete-employee.ts
│   │       │   └── use-employee-url-state.ts   # read/write search params
│   │       ├── api.ts                     # list(), get(), create(), update(), remove(), exportUrl()
│   │       └── query-keys.ts
│   │
│   ├── components/                        # SHARED UI (no business logic)
│   │   ├── ui/                            # shadcn primitives (button, input, select, dialog, table, ...)
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Navbar.tsx
│   │   │   ├── MobileNav.tsx
│   │   │   ├── UserMenu.tsx
│   │   │   └── PageHeader.tsx
│   │   ├── common/
│   │   │   ├── Logo.tsx
│   │   │   ├── Avatar.tsx                 # initials + deterministic gradient
│   │   │   ├── ThemeToggle.tsx
│   │   │   ├── ConfirmDialog.tsx
│   │   │   ├── ErrorState.tsx             # message + Retry
│   │   │   └── CopyButton.tsx
│   │   └── motion/                        # reusable GSAP wrappers
│   │       ├── Reveal.tsx
│   │       ├── Stagger.tsx
│   │       ├── CountUp.tsx
│   │       └── AnimatedProgress.tsx
│   │
│   ├── animations/                        # ALL GSAP setup lives here (import GSAP only from this folder)
│   │   ├── gsap.ts                        # register plugins once, export { gsap, useGSAP, Flip }
│   │   ├── presets.ts                     # EASE, DUR, STAGGER, fadeUp, scaleIn, slideInX, shake, collapseRow
│   │   ├── use-motion.ts                  # useGSAP + matchMedia (reduced motion)
│   │   ├── count-up.ts
│   │   └── README.md                      # animation rules + catalog (short)
│   │
│   ├── providers/
│   │   ├── index.tsx                      # composes all providers
│   │   ├── query-provider.tsx
│   │   └── theme-provider.tsx
│   │
│   ├── shared/                            # USED BY BOTH client and server (no server-only imports)
│   │   ├── schemas/
│   │   │   ├── employee.schema.ts         # create / update / query Zod schemas + inferred types
│   │   │   └── auth.schema.ts
│   │   ├── types/
│   │   │   ├── employee.ts                # Employee DTO, DashboardStats
│   │   │   └── api.ts                     # ApiSuccess, ApiPaginated, ApiError, Pagination
│   │   └── constants/
│   │       └── index.ts                   # DEPARTMENTS, EMPLOYEE_STATUSES, SORT_FIELDS, PAGE_SIZES, DEPARTMENT_COLORS, ROLES
│   │
│   ├── lib/                               # client-safe helpers
│   │   ├── api-client.ts                  # typed fetch wrapper + ApiError
│   │   ├── format.ts                      # formatINR, formatDate, tenure()
│   │   ├── avatar.ts                      # initials(), gradientFromName()
│   │   └── utils.ts                       # cn()
│   │
│   ├── server/                            # BACKEND ONLY (every file starts with `import "server-only"`)
│   │   ├── config/
│   │   │   └── env.ts                     # Zod-validated env
│   │   ├── db/
│   │   │   └── connect.ts                 # cached connection
│   │   ├── models/
│   │   │   ├── employee.model.ts
│   │   │   ├── user.model.ts
│   │   │   └── counter.model.ts
│   │   ├── services/
│   │   │   ├── employee.service.ts
│   │   │   ├── dashboard.service.ts
│   │   │   └── auth.service.ts
│   │   ├── auth/
│   │   │   ├── jwt.ts                     # sign/verify (jose)
│   │   │   ├── session.ts                 # getSession(), requireRole()
│   │   │   └── cookies.ts                 # set/clear auth cookie
│   │   ├── http/
│   │   │   ├── errors.ts
│   │   │   ├── handle-error.ts
│   │   │   ├── api-response.ts            # ok(), created(), paginated()
│   │   │   └── with-api.ts                # route wrapper: auth + db + error handling
│   │   ├── security/
│   │   │   ├── rate-limit.ts
│   │   │   ├── escape-regex.ts
│   │   │   └── sanitize.ts                # strips $-keys from objects
│   │   └── utils/
│   │       ├── dto.ts                     # toEmployeeDTO (lean doc -> API shape)
│   │       └── csv.ts                     # escape + build CSV
│   │
│   └── middleware.ts                      # edge auth gate (jose only; no mongoose here)
│
├── .github/workflows/ci.yml               # install, lint, typecheck, test, build
├── .env.example
├── .gitignore
├── .prettierrc
├── components.json                        # shadcn config
├── docker-compose.yml                     # mongo (+volume) + app
├── Dockerfile                             # multi-stage, standalone output
├── eslint.config.mjs
├── next.config.ts                         # security headers, output: "standalone"
├── package.json
├── postcss.config.mjs
├── tsconfig.json                          # strict, "@/*" -> "src/*"
├── vitest.config.ts
└── README.md

# CONVENTIONS (so humans and AIs can edit safely)
1. Naming: components PascalCase.tsx; hooks use-kebab-case.ts; services/models *.service.ts / *.model.ts; schemas *.schema.ts.
2. Import direction (never reverse):
     app -> features -> components -> lib/shared/animations
     app/api -> server -> shared
   shared/ must never import from server/, features/ or components/. Client code must never import from server/.
3. Pages in app/ contain no logic beyond fetching or composing. Real UI lives in features/*/components.
4. One component per file; a component over ~200 lines should be split.
5. GSAP is imported only from "@/animations/gsap" (never directly from "gsap").
6. All magic values (departments, statuses, page sizes, colors) live in shared/constants.
7. Each new API endpoint requires: Zod schema (shared) -> service function (server) -> route using withApi -> client api.ts function -> hook.
8. Barrel files only at folder roots that are consumed widely (providers, shared/constants). Do not barrel everything.

# WHERE TO EDIT WHAT (quick map)
| I want to change...            | Edit this                                              |
|---|---|
| Colors / theme                 | src/app/globals.css                                    |
| Animation speed or easing      | src/animations/presets.ts                              |
| A validation rule              | src/shared/schemas/employee.schema.ts (affects both client and server) |
| Departments or statuses        | src/shared/constants/index.ts                          |
| Table columns                  | src/features/employees/components/EmployeeTable.tsx    |
| Search/filter logic            | src/server/services/employee.service.ts + FilterBar.tsx|
| DB fields or indexes           | src/server/models/employee.model.ts + shared schema + DTO |
| API response shape             | src/server/http/api-response.ts + shared/types/api.ts  |
| Auth rules / roles             | src/server/auth/* + src/middleware.ts                  |