# Employee Management System — Roles & Features Report

This document describes every role in the application, what each role can do, and the complete feature set of the project.

---

## 1. Roles

The application has three roles, defined in `src/shared/constants/index.ts` as `ROLES = ["admin", "viewer", "employee"]`.

| Role | Scope | Summary |
| --- | --- | --- |
| `admin` | Full system access | Manages employee records and employee login accounts. |
| `viewer` | Read-only access | Can browse the directory and dashboard but cannot change data. |
| `employee` | Self-service only | Can view their own profile and change their own credentials. |

Roles are enforced in two layers:

- **Edge gate** — `src/proxy.ts` checks the JWT payload (`role`, `mcp`) on every request.
- **API guard** — `withApi({ roles: [...] })` calls `requireRole(...)` against the session in the database, so disabling a user or bumping `tokenVersion` takes effect immediately.

### 1.1 `admin`

Full read/write access to the system.

**Pages**
- `/dashboard` — overview statistics and charts.
- `/employees` — directory list with search, filters, sort, pagination.
- `/employees/[id]` — employee details, including the **Login access** card.
- `/employees/new` — add employee (optional inline login provisioning).
- `/employees/[id]/edit` — edit employee.
- `/account` — change own username / password.
- `/me` — view own profile.

**API access**
- `GET /api/dashboard/stats`
- `GET /api/employees`, `GET /api/employees/:id`, `GET /api/employees/export`
- `POST /api/employees`, `PATCH /api/employees/:id`, `DELETE /api/employees/:id` (soft delete)
- `GET/POST/PATCH /api/employees/:id/account` (create and manage employee logins)
- `GET /api/auth/me`, `GET /api/auth/username-available`, `POST /api/auth/change-credentials`, `POST /api/auth/logout`

**Capabilities**
- Create, edit and soft-delete employees.
- Export the filtered directory to CSV (max 10,000 rows).
- Create a login for an employee (username, password, “must change on first sign-in”).
- Manage an existing login: change username, reset password, enable/disable sign-in.
- Check username availability live.
- Change their own credentials.

### 1.2 `viewer`

Read-only access to the directory and dashboard.

**Pages**
- `/dashboard`
- `/employees`
- `/employees/[id]`
- `/account`
- `/me`

**API access**
- `GET /api/dashboard/stats`
- `GET /api/employees`, `GET /api/employees/:id`, `GET /api/employees/export`
- `GET /api/auth/me`, `POST /api/auth/change-credentials`, `POST /api/auth/logout`

**Capabilities**
- View dashboard statistics and charts.
- Browse, search, filter, sort and paginate employees.
- View employee details.
- Export CSV.
- Change their own credentials.

**Restrictions**
- No create, edit or delete actions.
- No employee login management (the Login access card is hidden and its API routes are admin-only).
- No access to `/api/auth/username-available` (admin/employee only).

### 1.3 `employee`

Self-service access, linked to an Employee record via `employeeRef`.

**Pages**
- `/me` — own profile.
- `/account` — change own username / password (also the forced first-login password-change screen).

**API access**
- `/api/auth/*` (login, logout, me, change-credentials)
- `/api/me`

**Capabilities**
- Sign in with the username/password provisioned by an admin.
- View their own profile.
- Change their own username and password.

**Restrictions**
- Redirected away from `/dashboard`, `/employees`, etc. to `/me`.
- API calls other than `/api/auth/*` and `/api/me` are rejected with `403`.
- If `mustChangePassword` is set, all pages/APIs except `/account` and `/api/auth/*` are blocked until the password is changed.

### 1.4 Access matrix

| Capability | admin | viewer | employee |
| --- | :---: | :---: | :---: |
| Sign in | ✅ | ✅ | ✅ |
| Dashboard statistics | ✅ | ✅ | — |
| Browse employees | ✅ | ✅ | — |
| View employee details | ✅ | ✅ | — |
| Export CSV | ✅ | ✅ | — |
| Create employee | ✅ | — | — |
| Edit employee | ✅ | — | — |
| Soft-delete employee | ✅ | — | — |
| Create employee login | ✅ | — | — |
| Manage / reset / disable employee login | ✅ | — | — |
| View own profile (`/me`) | ✅ | ✅ | ✅ |
| Change own credentials | ✅ | ✅ | ✅ |

---

## 2. Project features

### 2.1 Authentication & security

- **Username-based login.** The username is the only login identifier (case-insensitive, stored lowercase). Email is **not** a login identifier.
- **Admin-provisioned accounts.** There is no public registration — an admin creates credentials for each employee.
- **JWT authentication.** HS256 token signed with `jose`, stored in an httpOnly, `SameSite=lax` cookie.
- **Token versioning.** A `tokenVersion` (`tv`) claim invalidates existing sessions immediately when credentials change or an account is disabled.
- **Forced first-login password change.** New accounts can be marked `mustChangePassword`; the `mcp` claim forces the user to `/account` and blocks other pages/APIs until changed.
- **Live username availability.** Debounced (~500 ms) check with `checking → available / taken / invalid / reserved` states and suggestions when taken.
- **Password policy.** 8–72 characters with at least one lowercase, one uppercase and one number; hashed with bcrypt at cost 12 (bcryptjs).
- **Rate limiting.** Login (5 / 15 min per IP + username), general API (120 / min per IP), and credential changes (5 / 15 min per user).
- **Role-based access control** at both the edge (`proxy`) and the API (`requireRole`).
- **Session consistency.** Session is re-read from the database on each request, so disabled accounts and revocations apply instantly.
- **Security headers.** `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`, restrictive `Permissions-Policy`.
- **Standard API envelope & errors.** `{ success, message?, data?, pagination?, errors? }`, typed errors, request IDs, and Zod validation at every boundary.
- **Immediate revocation on delete.** Soft-deleting an employee disables their login and bumps `tokenVersion`.

### 2.2 Employee management

- **Create / read / update / soft-delete** employee records.
- **Auto-generated employee IDs** (`EMP-0001`, …) with a unique email constraint.
- **Directory list** with:
  - full-text search (name / email / employee ID),
  - department filter,
  - status filter (active / inactive / on leave),
  - sortable columns,
  - pagination.
- **Employee details** page with contact, job, compensation, tenure, timestamps and a timeline.
- **CSV export** of the filtered list (max 10,000 rows).
- **Data validation:** email format, phone pattern, salary range, joining date (not beyond the allowed future window).
- **Soft delete** preserves records (`isDeleted` / `deletedAt`) and disables the linked login.
- **Dashboard aggregate** endpoints built with MongoDB facet pipelines for efficiency.

### 2.3 Employee login management

- **Login access card** on the employee details page (admin only) showing status, username, last sign-in and first-login password state.
- **Create login** dialog:
  - suggested username derived from the employee name,
  - live availability check,
  - password generator + strength meter,
  - “require password change on first sign-in” option,
  - one-time credentials reveal with copy buttons.
- **Manage login** dialog:
  - change username (current username is accepted),
  - reset password,
  - enable / disable sign-in.
- **One login per employee** enforced by a unique partial index on `users.employeeRef`.
- **Inline provisioning while creating an employee**, with validation so a checked “Create login” cannot be silently skipped.
- **Delete employee ⇒ disable login** automatically.

### 2.4 Dashboard & analytics

- **Summary statistics:** total employees, active, inactive, on leave, and new this month.
- **Department distribution** chart rendered with Recharts (loaded client-side only, with `ssr: false`).
- **Department breakdown** with headcount and average salary, sorted by headcount.
- **Recent employees** list.
- **Skeletons and error states** for every async section, with retry.
- **Empty-directory state** with a call to action.

### 2.5 Employee self-service

- **`/me` profile** showing name, username, role, password-change status and employee reference.
- **`/account` credentials form** to change username and/or password (with confirmation and validation).
- **Forced-change banner** when `mustChangePassword` is active.

### 2.6 UX / UI

- **Ink & Paper design system** — paper/ink surfaces, a single vermilion highlight (≤ 3 per viewport), serif display headings with italic emphasis, uppercase tracked eyebrows, hairline double rules, 1.5px icons.
- **Light / dark themes** via `next-themes`.
- **GSAP motion** — SplitText masked page-title reveals, fade/scale/stagger entrances, hover micro-interactions.
- **Responsive layout** — desktop sidebar, mobile navigation, adaptive grids.
- **Accessible primitives** — Radix/shadcn-style dialog, select, dropdown, tooltip, label, checkbox, with visible focus rings.
- **Feedback** — toast notifications (`sonner`), skeletons, empty states, error states, confirm dialogs.
- **Copy-to-clipboard** for employee IDs and credentials.

### 2.7 Data, quality & tooling

- **MongoDB models** (`Employee`, `User`) with indexes for uniqueness and query performance.
- **Shared Zod schemas** reused by both the API and the React forms.
- **Testing** — Vitest with `mongodb-memory-server` (6 suites, 31 tests).
- **Seed and maintenance scripts** — `create-admin`, `seed`, `migrate:users` for migrating legacy email-based accounts to usernames.
- **Code quality** — TypeScript strict mode, ESLint 9, Prettier.
- **Production build** — Next.js standalone output.

---

## 3. Out of scope

- Self-service employee registration.
- Email-based login or email verification.
- Multi-tenant organizations.
- File uploads (avatars are generated initials).
- Payroll processing beyond storing and summarizing salary.
