# Employee Management System - Project Spec

> Consolidated copy of the files in `plan/` for easy re-reading. The original files remain the source of truth.

---

# BACKEND PLAN: Employee Management System

## 2.1 Principles
- Next.js 15 Route Handlers (App Router) + TypeScript strict + Mongoose + Zod.
- Layering (never skip a layer):
    Route (src/app/api/**/route.ts) -> withApi wrapper -> Zod validation -> Service (src/server/services) -> Model (src/server/models)
- Routes are thin (<= 25 lines). Services hold all business and DB logic. Models hold schema and indexes only.
- All backend-only code lives in src/server/ and starts with `import "server-only"`, so it can never be bundled into the client.
- Zod schemas live in src/shared/schemas and are used by BOTH the API and the frontend forms (single source of truth).
- In Next 15 route handlers, `params` is a Promise: `const { id } = await ctx.params`.

## 2.2 Decisions (change before building if needed)
- Auth: JWT (HS256, jose) in an httpOnly cookie. Roles: admin (full access), viewer (read-only).
- Departments: fixed enum in shared/constants (Engineering, HR, Finance, Sales, Marketing, Operations, Support, Design).
- Delete: soft delete (isDeleted, deletedAt).
- Hosting: Vercel + MongoDB Atlas (docker-compose Mongo for local).

## 2.3 Environment variables (validated by src/server/config/env.ts with Zod, fail fast)
MONGODB_URI, JWT_SECRET (min 32 chars), JWT_EXPIRES_IN (default 7d), ADMIN_EMAIL, ADMIN_PASSWORD, NODE_ENV, NEXT_PUBLIC_APP_NAME.
.env.example is committed. .env.local is git-ignored.

## 2.4 Standard response format (every endpoint)
Success:    { "success": true, "message": "Employee created successfully", "data": { ... } }
Paginated:  { "success": true, "data": [...], "pagination": { "page":1,"limit":10,"total":54,"totalPages":6,"hasNext":true,"hasPrev":false } }
Error:      { "success": false, "message": "Validation failed", "errors": [{ "field":"email","message":"Invalid email format" }] }
Status codes: 200, 201, 400 (validation / bad id / bad query / bad JSON), 401, 403, 404, 409 (duplicate email),
429 (rate limit, with a Retry-After header), 500, 503 (health, DB down).

## 2.5 API endpoints
| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | /api/health | public | Server plus DB connectivity |
| POST | /api/auth/login | public (rate-limited) | Authenticate, set cookie |
| POST | /api/auth/logout | any | Clear cookie |
| GET | /api/auth/me | any | Current user |
| GET | /api/employees | admin, viewer | List with search/filter/sort/pagination |
| POST | /api/employees | admin | Create |
| GET | /api/employees/export | admin, viewer | CSV of the filtered list (max 10,000 rows) |
| GET | /api/employees/:id | admin, viewer | Details |
| PATCH | /api/employees/:id | admin | Partial update |
| DELETE | /api/employees/:id | admin | Soft delete |
| GET | /api/dashboard/stats | admin, viewer | Dashboard statistics |

### List query params (validated by employeeQuerySchema)
search (<=100 chars, matches name, email, employeeId, case-insensitive, regex-escaped)
department (enum), status (enum),
sortBy (name | email | department | salary | joiningDate | createdAt; default createdAt),
order (asc | desc; default desc),
page (int >= 1; default 1), limit (int 1-100; default 10)
Parse with Object.fromEntries(req.nextUrl.searchParams): values are strings only, which blocks object/operator injection.
Unknown params are stripped or rejected with 400 (use .strict()).

### Endpoint behaviors
- POST /employees: body = createEmployeeSchema. Service pre-checks for a duplicate non-deleted email (409 with field "email"), generates employeeId from the atomic counter,
  creates the document, returns 201. A race-condition duplicate is caught by Mongo error 11000 in handleError, which also returns 409.
- PATCH /employees/:id: body = updateEmployeeSchema (partial, non-empty). If email changes, re-check duplicates (exclude self). Uses findOneAndUpdate with runValidators and { new: true }.
- DELETE /employees/:id: sets isDeleted=true, deletedAt=now. Returns 200 with a message. A second delete returns 404.
- GET /employees/:id: invalid ObjectId -> 400 "Invalid employee id"; missing or soft-deleted -> 404 "Employee not found".
- GET /dashboard/stats returns:
  { totalEmployees, active, inactive, onLeave, newThisMonth,
    departmentStats: [{department,count,avgSalary}]  // ALL departments, zero-filled
    recentEmployees: Employee[5] }
- GET /health -> 200 { status:"ok", server:"up", database:"connected", uptime, timestamp }; 503 with database:"disconnected" on failure. Never requires auth.

## 2.6 Service layer (src/server/services/)
employee.service.ts
  listEmployees(query)    -> filter {isDeleted:false} + $or search + dept/status; sort whitelist map plus _id tiebreaker;
                             Promise.all([find().sort().skip().limit().lean(), countDocuments]); map results through toEmployeeDTO.
  getEmployeeById(id)
  createEmployee(input)
  updateEmployee(id, input)
  deleteEmployee(id)
  exportEmployeesCsv(query) -> same filters, no pagination (cap 10,000), RFC-4180 escaping, BOM prefix for Excel, filename employees-YYYY-MM-DD.csv
dashboard.service.ts
  getDashboardStats()     -> one $facet aggregation (see the Database plan), zero-fill departments from DEPARTMENTS.
auth.service.ts
  login(email, password)  -> find user (+passwordHash), bcrypt.compare (cost >= 10), generic "Invalid email or password", update lastLoginAt, return a signed token.
  getUserById(id)
Services throw typed errors (AppError subclasses) and never touch NextRequest or NextResponse.
IMPORTANT: .lean() bypasses schema toJSON transforms, so ALWAYS map results with toEmployeeDTO (server/utils/dto.ts): { _id -> id, dates -> ISO strings, drop internal fields }.

## 2.7 Auth & authorization
- Login: validate (loginSchema) -> rate limit check -> authService.login -> set cookie "ems_token":
  httpOnly, sameSite "lax", secure in production, path "/", maxAge equal to the JWT lifetime.
- JWT payload: { sub: userId, role, name, email }; algorithm HS256; verified with jose (works at the edge and in Node).
- Middleware (src/middleware.ts, edge):
    page requests without a valid token -> redirect /login?next=<path>
    /api/* without a valid token (except /api/health and /api/auth/login) -> 401 JSON in the standard format
    logged-in user visiting /login -> redirect /dashboard
    matcher excludes _next/static, _next/image, favicon, public assets.
- requireRole(roles) in server/auth/session.ts re-verifies the cookie inside the API (defense in depth) and throws UnauthorizedError (401) or ForbiddenError (403).
- Seeding the admin: scripts/create-admin.ts (idempotent upsert using ADMIN_EMAIL / ADMIN_PASSWORD).

## 2.8 Rate limiting (src/server/security/rate-limit.ts)
- In-memory sliding window (Map keyed by `${ip}:${email}`) for login: 5 attempts per 15 min -> 429 + Retry-After.
- General API limit: 120 requests/min per IP.
- Documented limitation: in-memory limiting is per instance. For multi-instance production, swap to Upstash Redis (same interface).

## 2.9 Security checklist
- Every input validated with Zod server-side. Query values are strings only. `limit` is capped at 100.
- search is regex-escaped (escapeRegex). Sort fields come from a whitelist map. Never spread user input into a Mongo filter.
- Strip or reject keys starting with "$" or containing "." in any body object (sanitize util).
- Passwords hashed with bcrypt; passwordHash has `select: false`.
- Generic error messages in production; real errors logged with a request id.
- Security headers in next.config.ts: X-Content-Type-Options nosniff, X-Frame-Options DENY, Referrer-Policy strict-origin-when-cross-origin, Permissions-Policy.
- Secrets only via env. Cookie flags as above. CORS: same-origin only (no wildcard).

## 2.10 Critical code that MUST exist

// src/server/db/connect.ts (cached connection; avoids connection exhaustion on hot reload and serverless)
import "server-only";
import mongoose from "mongoose";
import { env } from "../config/env";
type Cache = { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
declare global { var _mongooseCache: Cache | undefined; }
const cached: Cache = (globalThis._mongooseCache ??= { conn: null, promise: null });
export async function connectDB() {
  if (cached.conn) return cached.conn;
  cached.promise ??= mongoose.connect(env.MONGODB_URI, { bufferCommands: false, serverSelectionTimeoutMS: 5000, maxPoolSize: 10 });
  try { cached.conn = await cached.promise; } catch (e) { cached.promise = null; throw e; }
  return cached.conn;
}

// src/server/http/errors.ts
export class AppError extends Error {
  constructor(public message: string, public statusCode = 500, public errors?: { field?: string; message: string }[]) { super(message); this.name = new.target.name; }
}
export class BadRequestError extends AppError { constructor(m: string, e?: AppError["errors"]) { super(m, 400, e); } }
export class UnauthorizedError extends AppError { constructor(m = "Authentication required") { super(m, 401); } }
export class ForbiddenError extends AppError { constructor(m = "You do not have permission") { super(m, 403); } }
export class NotFoundError extends AppError { constructor(m = "Resource not found") { super(m, 404); } }
export class ConflictError extends AppError { constructor(m: string, e?: AppError["errors"]) { super(m, 409, e); } }
export class TooManyRequestsError extends AppError { constructor(public retryAfter: number) { super("Too many requests", 429); } }

// src/server/http/handle-error.ts
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import mongoose from "mongoose";
import { AppError, TooManyRequestsError } from "./errors";
export function handleError(err: unknown) {
  if (err instanceof ZodError)
    return fail(400, "Validation failed", err.issues.map(i => ({ field: i.path.join("."), message: i.message })));
  if (err instanceof TooManyRequestsError)
    return fail(429, err.message, undefined, { "Retry-After": String(err.retryAfter) });
  if (err instanceof AppError) return fail(err.statusCode, err.message, err.errors);
  if (typeof err === "object" && err && (err as { code?: number }).code === 11000)
    return fail(409, "Email already exists", [{ field: "email", message: "This email is already in use" }]);
  if (err instanceof mongoose.Error.CastError) return fail(400, "Invalid identifier");
  if (err instanceof mongoose.Error.ValidationError)
    return fail(400, "Validation failed", Object.values(err.errors).map(e => ({ field: e.path, message: e.message })));
  if (err instanceof SyntaxError) return fail(400, "Invalid JSON body");
  console.error("[API ERROR]", err);
  return fail(500, "Something went wrong. Please try again.");
}
const fail = (status: number, message: string, errors?: unknown, headers?: Record<string, string>) =>
  NextResponse.json({ success: false, message, ...(errors ? { errors } : {}) }, { status, headers });

// src/server/http/with-api.ts (removes try/catch boilerplate from every route)
export function withApi<P = Record<string, never>>(
  opts: { roles?: Role[] },
  handler: (req: NextRequest, ctx: { params: P; user: SessionUser | null }) => Promise<NextResponse>,
) {
  return async (req: NextRequest, route: { params: Promise<P> }) => {
    try {
      const user = opts.roles ? await requireRole(opts.roles) : null;
      await connectDB();
      return await handler(req, { params: await route.params, user });
    } catch (e) { return handleError(e); }
  };
}

// Route usage: src/app/api/employees/[id]/route.ts
export const GET = withApi<{ id: string }>({ roles: ["admin", "viewer"] }, async (_req, { params }) =>
  ok(await getEmployeeById(params.id)));
export const PATCH = withApi<{ id: string }>({ roles: ["admin"] }, async (req, { params }) =>
  ok(await updateEmployee(params.id, updateEmployeeSchema.parse(await req.json())), "Employee updated successfully"));
export const DELETE = withApi<{ id: string }>({ roles: ["admin"] }, async (_req, { params }) => {
  await deleteEmployee(params.id); return ok(null, "Employee deleted successfully");
});

// src/server/security/escape-regex.ts
export const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// employeeId generation (atomic)
const c = await Counter.findOneAndUpdate({ _id: "employee" }, { $inc: { seq: 1 } }, { new: true, upsert: true });
const employeeId = `EMP-${String(c.seq).padStart(4, "0")}`;  // gaps after failed creates are acceptable; documented in README

## 2.11 Seeding & scripts
- scripts/seed.ts: 60 faker employees through the service layer (Indian-style phones, all departments/statuses, joining dates over 5 years). `--clear` wipes first.
- scripts/create-admin.ts: idempotent admin creation.
- package.json scripts: dev, build, start, lint, typecheck, test, seed, create-admin.

## 2.12 Testing (Vitest + mongodb-memory-server)
- Schema tests: valid payload; invalid email, negative salary, short name, bad phone, far-future date, empty PATCH body, limit > 100.
- Service tests: create, duplicate email -> 409, list with search/filter/sort/pagination, soft delete hides the record, email reusable after soft delete,
  invalid ObjectId -> 400, missing -> 404, dashboard zero-fill, CSV escaping.
- Utility tests: escapeRegex, rate limiter window, handleError mapping.
- Optional API tests: call the exported route handlers directly with constructed NextRequest objects.

## 2.13 Backend acceptance checklist
[ ] Every endpoint uses the standard response format and correct status codes
[ ] No DB logic in routes; no NextRequest/NextResponse in services
[ ] Duplicate email blocked by the service check AND the partial unique index
[ ] Soft-deleted records never appear in lists, stats, search or export
[ ] Auth enforced in middleware AND in requireRole; viewers cannot mutate
[ ] Rate limit on login works (429 plus Retry-After)
[ ] /api/health returns 200 or 503 correctly
[ ] typecheck, lint, test and build all pass

---

# DATABASE SCHEMA: MongoDB (Mongoose) for Employee Management System

Database name: employee_management
Collections: employees, users, counters   (audit_logs reserved for v2)

## 4.1 Collection: employees

| Field | Type | Required | Rules |
|---|---|---|---|
| _id | ObjectId | auto | primary key |
| employeeId | String | yes | "EMP-0001" format, unique, immutable, from counter |
| name | String | yes | trim, 2-100 chars |
| email | String | yes | trim, lowercase, max 254, valid email, unique among NON-deleted docs |
| phone | String | yes | trim, regex /^\+?[0-9\s-]{7,15}$/ |
| department | String | yes | enum DEPARTMENTS |
| designation | String | yes | trim, 2-100 chars |
| salary | Number | yes | min 0, max 100000000 (store the raw number, never a formatted string) |
| joiningDate | Date | yes | stored UTC; not more than 30 days in the future (enforced in Zod and a Mongoose validator) |
| status | String | no | enum active / inactive / on_leave, default "active" |
| isDeleted | Boolean | no | default false (ALWAYS set so partial indexes include the doc) |
| deletedAt | Date | no | default null |
| createdAt, updatedAt | Date | auto | Mongoose timestamps |

### Mongoose model (src/server/models/employee.model.ts)

import "server-only";
import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";
import { DEPARTMENTS, EMPLOYEE_STATUSES } from "@/shared/constants";

const MAX_FUTURE_DAYS = 30;

const employeeSchema = new Schema(
  {
    employeeId:  { type: String, required: true, unique: true, immutable: true, index: true },
    name:        { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    email:       { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
    phone:       { type: String, required: true, trim: true, match: [/^\+?[0-9\s-]{7,15}$/, "Invalid phone number"] },
    department:  { type: String, required: true, enum: DEPARTMENTS },
    designation: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    salary:      { type: Number, required: true, min: 0, max: 100_000_000 },
    joiningDate: {
      type: Date, required: true,
      validate: {
        validator: (d: Date) => d.getTime() <= Date.now() + MAX_FUTURE_DAYS * 86_400_000,
        message: "Joining date cannot be more than 30 days in the future",
      },
    },
    status:      { type: String, enum: EMPLOYEE_STATUSES, default: "active" },
    isDeleted:   { type: Boolean, default: false },
    deletedAt:   { type: Date, default: null },
  },
  { timestamps: true, versionKey: false },
);

// ---------- INDEXES ----------
// 1) Email unique ONLY among active (non-deleted) records, so a soft-deleted email can be reused.
employeeSchema.index({ email: 1 }, { unique: true, partialFilterExpression: { isDeleted: false }, name: "uniq_email_active" });

// 2) Listing/sorting indexes. Partial on { isDeleted: false } to keep them small.
//    Every list query includes isDeleted:false, so the planner can use them.
const active = { partialFilterExpression: { isDeleted: false } };
employeeSchema.index({ createdAt: -1 },              { ...active, name: "idx_created" });            // default sort
employeeSchema.index({ department: 1, createdAt: -1 }, { ...active, name: "idx_dept_created" });     // dept filter + default sort
employeeSchema.index({ status: 1, createdAt: -1 },     { ...active, name: "idx_status_created" });   // status filter
employeeSchema.index({ name: 1 },                      { ...active, name: "idx_name" });             // sort by name
employeeSchema.index({ joiningDate: -1 },              { ...active, name: "idx_joining" });          // sort by joining date + "new this month"
employeeSchema.index({ salary: 1 },                    { ...active, name: "idx_salary" });           // sort by salary

// NOTE: unique:true on employeeId already creates its own unique index. Do NOT also call schema.index for it.
// NOTE: search uses a case-insensitive escaped regex across name/email/employeeId. That is a scan, fine up to roughly 50k docs.
//       Upgrade path: Atlas Search (autocomplete) when data grows. The service API stays unchanged.

export type EmployeeDoc = InferSchemaType<typeof employeeSchema>;
export const Employee: Model<EmployeeDoc> = (models.Employee as Model<EmployeeDoc>) || model<EmployeeDoc>("Employee", employeeSchema);

// IMPORTANT: .lean() skips schema transforms (toJSON). Services must return data through toEmployeeDTO():
//   { id: String(_id), employeeId, name, email, phone, department, designation, salary,
//     joiningDate: ISO string, status, createdAt: ISO, updatedAt: ISO }   // isDeleted/deletedAt are not exposed

## 4.2 Collection: users

| Field | Type | Required | Rules |
|---|---|---|---|
| _id | ObjectId | auto | |
| name | String | yes | trim, 2-100 |
| email | String | yes | unique, lowercase, trim |
| passwordHash | String | yes | bcrypt hash, `select: false` (never returned by default) |
| role | String | yes | enum "admin" / "viewer", default "viewer" |
| isActive | Boolean | no | default true (inactive users cannot log in) |
| lastLoginAt | Date | no | updated on successful login |
| createdAt, updatedAt | Date | auto | |

const userSchema = new Schema(
  {
    name:         { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role:         { type: String, enum: ROLES, default: "viewer" },
    isActive:     { type: Boolean, default: true },
    lastLoginAt:  { type: Date, default: null },
  },
  { timestamps: true, versionKey: false },
);
// Login query must opt in: User.findOne({ email }).select("+passwordHash")

## 4.3 Collection: counters (atomic sequence for employeeId)

| Field | Type | Notes |
|---|---|---|
| _id | String | sequence name, e.g. "employee" |
| seq | Number | default 0, incremented atomically |

const counterSchema = new Schema({ _id: { type: String }, seq: { type: Number, default: 0 } }, { versionKey: false });
// Usage (race-safe, one atomic round trip):
//   const c = await Counter.findOneAndUpdate({ _id: "employee" }, { $inc: { seq: 1 } }, { new: true, upsert: true });
//   employeeId = `EMP-${String(c.seq).padStart(4, "0")}`;
// Gaps are acceptable when a later insert fails (for example a duplicate email).

## 4.4 Relationships
- No foreign keys in v1. users and employees are independent (users are system accounts and employees are HR records).
- Future (v2) options: employees.userId (ref users), employees.managerId (ref employees), departments collection (replace the enum:
  { _id, name, code, headId, isActive }), audit_logs { actorId, action, entity, entityId, changes, at }.

## 4.5 Query patterns and the index each uses
| Operation | Query | Index |
|---|---|---|
| Default list | {isDeleted:false} sort createdAt desc | idx_created |
| Filter by department | {isDeleted:false, department} sort createdAt desc | idx_dept_created |
| Filter by status | {isDeleted:false, status} sort createdAt desc | idx_status_created |
| Sort by name / salary / joining | {isDeleted:false} sort field | idx_name / idx_salary / idx_joining |
| Search | {isDeleted:false, $or:[name,email,employeeId regex]} | collection scan over active docs (acceptable at this scale) |
| Duplicate email check | {email, isDeleted:false} | uniq_email_active |
| Get by id | {_id, isDeleted:false} | _id index |
| Login | users {email} | unique email index |
Always add the tiebreaker `_id` to sorts so pagination is stable and has no duplicate or missing rows between pages.

## 4.6 Dashboard aggregation (single round trip)

const startOfMonthUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
Employee.aggregate([
  { $match: { isDeleted: false } },
  { $facet: {
      total:        [{ $count: "count" }],
      byStatus:     [{ $group: { _id: "$status", count: { $sum: 1 } } }],
      byDepartment: [{ $group: { _id: "$department", count: { $sum: 1 }, avgSalary: { $avg: "$salary" } } }, { $sort: { count: -1 } }],
      newThisMonth: [{ $match: { joiningDate: { $gte: startOfMonthUTC } } }, { $count: "count" }],
      recent:       [{ $sort: { createdAt: -1 } }, { $limit: 5 }],
  } },
]);
// Post-process in the service: missing facet counts -> 0; zero-fill every DEPARTMENTS entry; round avgSalary; map recent through toEmployeeDTO.

## 4.7 Sample documents

employees:
{ "_id": "66f1c2a9b7e4a1d3c8a90e21", "employeeId": "EMP-0001", "name": "Priya Sharma", "email": "priya.sharma@example.com",
  "phone": "+91 98765 43210", "department": "Engineering", "designation": "Senior Software Engineer", "salary": 1850000,
  "joiningDate": "2023-04-17T00:00:00.000Z", "status": "active", "isDeleted": false, "deletedAt": null,
  "createdAt": "2026-10-01T09:30:00.000Z", "updatedAt": "2026-10-01T09:30:00.000Z" }

users:
{ "_id": "66f1c2a9b7e4a1d3c8a90e01", "name": "Admin", "email": "admin@example.com", "passwordHash": "$2a$10$...",
  "role": "admin", "isActive": true, "lastLoginAt": "2026-10-29T08:00:00.000Z" }

counters:
{ "_id": "employee", "seq": 60 }

## 4.8 Data rules
- Soft delete: set isDeleted=true and deletedAt=now. A hard delete is only done manually or by a future purge job (documented in the README).
- Emails are always stored lowercase and trimmed. Salary is a plain number in INR (formatting is done only in the UI).
- Dates are stored in UTC; the UI formats them in the local timezone. For joiningDate, display as a date only.
- Persistence: Atlas (production) or a docker volume (local): `volumes: - mongo_data:/data/db`.
- Atlas checklist: create a DB user with readWrite on employee_management, add the IP allowlist entry (0.0.0.0/0 only for demos), use the SRV URI in MONGODB_URI.
- Index sync: in development call `Employee.syncIndexes()` from the seed script. In production, create indexes during deployment, not on every request.
  (If you change an index definition, drop the old index first, otherwise Mongo throws an index-options conflict.)

## 4.9 Database acceptance checklist
[ ] Partial unique email index exists and rejects duplicates among active docs only
[ ] Re-creating an employee with a soft-deleted email succeeds
[ ] Counter produces unique, sequential employeeIds under concurrent creates
[ ] All list queries include isDeleted:false and use the listed indexes (verify with .explain())
[ ] passwordHash never appears in any API response
[ ] .lean() results are always passed through toEmployeeDTO
[ ] Data survives an app and Mongo restart (volume or Atlas)

---

# FILE STRUCTURE: Employee Management System

employee-management-system/
â”œâ”€â”€ public/
â”‚   â”œâ”€â”€ favicon.ico
â”‚   â””â”€â”€ logo.svg
â”‚
â”œâ”€â”€ docs/
â”‚   â”œâ”€â”€ PROJECT_SPEC.md                    # the full spec (keep for AI re-reading)
â”‚   â””â”€â”€ API.md                             # request/response examples per endpoint
â”‚
â”œâ”€â”€ scripts/                               # run with tsx
â”‚   â”œâ”€â”€ seed.ts                            # 60 fake employees (--clear)
â”‚   â””â”€â”€ create-admin.ts                    # idempotent admin user
â”‚
â”œâ”€â”€ tests/
â”‚   â”œâ”€â”€ setup.ts                           # mongodb-memory-server lifecycle
â”‚   â”œâ”€â”€ unit/
â”‚   â”‚   â”œâ”€â”€ employee.schema.test.ts
â”‚   â”‚   â”œâ”€â”€ escape-regex.test.ts
â”‚   â”‚   â”œâ”€â”€ rate-limit.test.ts
â”‚   â”‚   â””â”€â”€ handle-error.test.ts
â”‚   â””â”€â”€ integration/
â”‚       â”œâ”€â”€ employee.service.test.ts
â”‚       â””â”€â”€ dashboard.service.test.ts
â”‚
â”œâ”€â”€ src/
â”‚   â”œâ”€â”€ app/                               # ROUTING ONLY: pages stay thin and compose feature components
â”‚   â”‚   â”œâ”€â”€ layout.tsx                     # fonts, <Providers>, <Toaster>, metadata
â”‚   â”‚   â”œâ”€â”€ globals.css                    # design tokens (light/dark), Tailwind layers, shimmer keyframes
â”‚   â”‚   â”œâ”€â”€ page.tsx                       # redirect -> /dashboard
â”‚   â”‚   â”œâ”€â”€ loading.tsx
â”‚   â”‚   â”œâ”€â”€ error.tsx
â”‚   â”‚   â”œâ”€â”€ not-found.tsx
â”‚   â”‚   â”œâ”€â”€ (auth)/
â”‚   â”‚   â”‚   â”œâ”€â”€ layout.tsx                 # bare layout for login
â”‚   â”‚   â”‚   â””â”€â”€ login/page.tsx
â”‚   â”‚   â”œâ”€â”€ (dashboard)/
â”‚   â”‚   â”‚   â”œâ”€â”€ layout.tsx                 # app shell: Sidebar + Navbar + session gate
â”‚   â”‚   â”‚   â”œâ”€â”€ template.tsx               # per-navigation GSAP page-enter animation
â”‚   â”‚   â”‚   â”œâ”€â”€ dashboard/page.tsx
â”‚   â”‚   â”‚   â””â”€â”€ employees/
â”‚   â”‚   â”‚       â”œâ”€â”€ page.tsx               # list
â”‚   â”‚   â”‚       â”œâ”€â”€ new/page.tsx
â”‚   â”‚   â”‚       â””â”€â”€ [id]/
â”‚   â”‚   â”‚           â”œâ”€â”€ page.tsx           # details
â”‚   â”‚   â”‚           â”œâ”€â”€ edit/page.tsx
â”‚   â”‚   â”‚           â””â”€â”€ not-found.tsx
â”‚   â”‚   â””â”€â”€ api/
â”‚   â”‚       â”œâ”€â”€ health/route.ts
â”‚   â”‚       â”œâ”€â”€ auth/
â”‚   â”‚       â”‚   â”œâ”€â”€ login/route.ts
â”‚   â”‚       â”‚   â”œâ”€â”€ logout/route.ts
â”‚   â”‚       â”‚   â””â”€â”€ me/route.ts
â”‚   â”‚       â”œâ”€â”€ dashboard/stats/route.ts
â”‚   â”‚       â””â”€â”€ employees/
â”‚   â”‚           â”œâ”€â”€ route.ts               # GET list, POST create
â”‚   â”‚           â”œâ”€â”€ export/route.ts        # GET CSV
â”‚   â”‚           â””â”€â”€ [id]/route.ts          # GET, PATCH, DELETE
â”‚   â”‚
â”‚   â”œâ”€â”€ features/                          # FRONTEND, grouped by domain (edit one feature in one folder)
â”‚   â”‚   â”œâ”€â”€ auth/
â”‚   â”‚   â”‚   â”œâ”€â”€ components/LoginForm.tsx
â”‚   â”‚   â”‚   â”œâ”€â”€ components/BrandPanel.tsx  # animated gradient blobs + headline
â”‚   â”‚   â”‚   â”œâ”€â”€ hooks/use-auth.ts
â”‚   â”‚   â”‚   â””â”€â”€ api.ts                     # login(), logout(), me()
â”‚   â”‚   â”œâ”€â”€ dashboard/
â”‚   â”‚   â”‚   â”œâ”€â”€ components/
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ StatCard.tsx
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ StatsGrid.tsx
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ DepartmentChart.tsx    # Recharts (dynamic import)
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ DepartmentBreakdown.tsx# animated progress bars
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ RecentEmployees.tsx
â”‚   â”‚   â”‚   â”‚   â””â”€â”€ DashboardSkeleton.tsx
â”‚   â”‚   â”‚   â”œâ”€â”€ hooks/use-dashboard-stats.ts
â”‚   â”‚   â”‚   â””â”€â”€ api.ts
â”‚   â”‚   â””â”€â”€ employees/
â”‚   â”‚       â”œâ”€â”€ components/
â”‚   â”‚       â”‚   â”œâ”€â”€ EmployeeTable.tsx
â”‚   â”‚       â”‚   â”œâ”€â”€ EmployeeCard.tsx       # mobile list item
â”‚   â”‚       â”‚   â”œâ”€â”€ EmployeeTableSkeleton.tsx
â”‚   â”‚       â”‚   â”œâ”€â”€ EmployeeToolbar.tsx    # search + filters + actions
â”‚   â”‚       â”‚   â”œâ”€â”€ SearchBar.tsx
â”‚   â”‚       â”‚   â”œâ”€â”€ FilterBar.tsx
â”‚   â”‚       â”‚   â”œâ”€â”€ FilterChips.tsx
â”‚   â”‚       â”‚   â”œâ”€â”€ Pagination.tsx
â”‚   â”‚       â”‚   â”œâ”€â”€ EmployeeForm.tsx       # create + edit
â”‚   â”‚       â”‚   â”œâ”€â”€ FormSection.tsx
â”‚   â”‚       â”‚   â”œâ”€â”€ EmployeeDetails.tsx
â”‚   â”‚       â”‚   â”œâ”€â”€ DeleteConfirmDialog.tsx
â”‚   â”‚       â”‚   â”œâ”€â”€ StatusBadge.tsx
â”‚   â”‚       â”‚   â”œâ”€â”€ DepartmentBadge.tsx
â”‚   â”‚       â”‚   â””â”€â”€ EmptyState.tsx
â”‚   â”‚       â”œâ”€â”€ hooks/
â”‚   â”‚       â”‚   â”œâ”€â”€ use-employees-list.ts
â”‚   â”‚       â”‚   â”œâ”€â”€ use-employee.ts
â”‚   â”‚       â”‚   â”œâ”€â”€ use-create-employee.ts
â”‚   â”‚       â”‚   â”œâ”€â”€ use-update-employee.ts
â”‚   â”‚       â”‚   â”œâ”€â”€ use-delete-employee.ts
â”‚   â”‚       â”‚   â””â”€â”€ use-employee-url-state.ts   # read/write search params
â”‚   â”‚       â”œâ”€â”€ api.ts                     # list(), get(), create(), update(), remove(), exportUrl()
â”‚   â”‚       â””â”€â”€ query-keys.ts
â”‚   â”‚
â”‚   â”œâ”€â”€ components/                        # SHARED UI (no business logic)
â”‚   â”‚   â”œâ”€â”€ ui/                            # shadcn primitives (button, input, select, dialog, table, ...)
â”‚   â”‚   â”œâ”€â”€ layout/
â”‚   â”‚   â”‚   â”œâ”€â”€ Sidebar.tsx
â”‚   â”‚   â”‚   â”œâ”€â”€ Navbar.tsx
â”‚   â”‚   â”‚   â”œâ”€â”€ MobileNav.tsx
â”‚   â”‚   â”‚   â”œâ”€â”€ UserMenu.tsx
â”‚   â”‚   â”‚   â””â”€â”€ PageHeader.tsx
â”‚   â”‚   â”œâ”€â”€ common/
â”‚   â”‚   â”‚   â”œâ”€â”€ Logo.tsx
â”‚   â”‚   â”‚   â”œâ”€â”€ Avatar.tsx                 # initials + deterministic gradient
â”‚   â”‚   â”‚   â”œâ”€â”€ ThemeToggle.tsx
â”‚   â”‚   â”‚   â”œâ”€â”€ ConfirmDialog.tsx
â”‚   â”‚   â”‚   â”œâ”€â”€ ErrorState.tsx             # message + Retry
â”‚   â”‚   â”‚   â””â”€â”€ CopyButton.tsx
â”‚   â”‚   â””â”€â”€ motion/                        # reusable GSAP wrappers
â”‚   â”‚       â”œâ”€â”€ Reveal.tsx
â”‚   â”‚       â”œâ”€â”€ Stagger.tsx
â”‚   â”‚       â”œâ”€â”€ CountUp.tsx
â”‚   â”‚       â””â”€â”€ AnimatedProgress.tsx
â”‚   â”‚
â”‚   â”œâ”€â”€ animations/                        # ALL GSAP setup lives here (import GSAP only from this folder)
â”‚   â”‚   â”œâ”€â”€ gsap.ts                        # register plugins once, export { gsap, useGSAP, Flip }
â”‚   â”‚   â”œâ”€â”€ presets.ts                     # EASE, DUR, STAGGER, fadeUp, scaleIn, slideInX, shake, collapseRow
â”‚   â”‚   â”œâ”€â”€ use-motion.ts                  # useGSAP + matchMedia (reduced motion)
â”‚   â”‚   â”œâ”€â”€ count-up.ts
â”‚   â”‚   â””â”€â”€ README.md                      # animation rules + catalog (short)
â”‚   â”‚
â”‚   â”œâ”€â”€ providers/
â”‚   â”‚   â”œâ”€â”€ index.tsx                      # composes all providers
â”‚   â”‚   â”œâ”€â”€ query-provider.tsx
â”‚   â”‚   â””â”€â”€ theme-provider.tsx
â”‚   â”‚
â”‚   â”œâ”€â”€ shared/                            # USED BY BOTH client and server (no server-only imports)
â”‚   â”‚   â”œâ”€â”€ schemas/
â”‚   â”‚   â”‚   â”œâ”€â”€ employee.schema.ts         # create / update / query Zod schemas + inferred types
â”‚   â”‚   â”‚   â””â”€â”€ auth.schema.ts
â”‚   â”‚   â”œâ”€â”€ types/
â”‚   â”‚   â”‚   â”œâ”€â”€ employee.ts                # Employee DTO, DashboardStats
â”‚   â”‚   â”‚   â””â”€â”€ api.ts                     # ApiSuccess, ApiPaginated, ApiError, Pagination
â”‚   â”‚   â””â”€â”€ constants/
â”‚   â”‚       â””â”€â”€ index.ts                   # DEPARTMENTS, EMPLOYEE_STATUSES, SORT_FIELDS, PAGE_SIZES, DEPARTMENT_COLORS, ROLES
â”‚   â”‚
â”‚   â”œâ”€â”€ lib/                               # client-safe helpers
â”‚   â”‚   â”œâ”€â”€ api-client.ts                  # typed fetch wrapper + ApiError
â”‚   â”‚   â”œâ”€â”€ format.ts                      # formatINR, formatDate, tenure()
â”‚   â”‚   â”œâ”€â”€ avatar.ts                      # initials(), gradientFromName()
â”‚   â”‚   â””â”€â”€ utils.ts                       # cn()
â”‚   â”‚
â”‚   â”œâ”€â”€ server/                            # BACKEND ONLY (every file starts with `import "server-only"`)
â”‚   â”‚   â”œâ”€â”€ config/
â”‚   â”‚   â”‚   â””â”€â”€ env.ts                     # Zod-validated env
â”‚   â”‚   â”œâ”€â”€ db/
â”‚   â”‚   â”‚   â””â”€â”€ connect.ts                 # cached connection
â”‚   â”‚   â”œâ”€â”€ models/
â”‚   â”‚   â”‚   â”œâ”€â”€ employee.model.ts
â”‚   â”‚   â”‚   â”œâ”€â”€ user.model.ts
â”‚   â”‚   â”‚   â””â”€â”€ counter.model.ts
â”‚   â”‚   â”œâ”€â”€ services/
â”‚   â”‚   â”‚   â”œâ”€â”€ employee.service.ts
â”‚   â”‚   â”‚   â”œâ”€â”€ dashboard.service.ts
â”‚   â”‚   â”‚   â””â”€â”€ auth.service.ts
â”‚   â”‚   â”œâ”€â”€ auth/
â”‚   â”‚   â”‚   â”œâ”€â”€ jwt.ts                     # sign/verify (jose)
â”‚   â”‚   â”‚   â”œâ”€â”€ session.ts                 # getSession(), requireRole()
â”‚   â”‚   â”‚   â””â”€â”€ cookies.ts                 # set/clear auth cookie
â”‚   â”‚   â”œâ”€â”€ http/
â”‚   â”‚   â”‚   â”œâ”€â”€ errors.ts
â”‚   â”‚   â”‚   â”œâ”€â”€ handle-error.ts
â”‚   â”‚   â”‚   â”œâ”€â”€ api-response.ts            # ok(), created(), paginated()
â”‚   â”‚   â”‚   â””â”€â”€ with-api.ts                # route wrapper: auth + db + error handling
â”‚   â”‚   â”œâ”€â”€ security/
â”‚   â”‚   â”‚   â”œâ”€â”€ rate-limit.ts
â”‚   â”‚   â”‚   â”œâ”€â”€ escape-regex.ts
â”‚   â”‚   â”‚   â””â”€â”€ sanitize.ts                # strips $-keys from objects
â”‚   â”‚   â””â”€â”€ utils/
â”‚   â”‚       â”œâ”€â”€ dto.ts                     # toEmployeeDTO (lean doc -> API shape)
â”‚   â”‚       â””â”€â”€ csv.ts                     # escape + build CSV
â”‚   â”‚
â”‚   â””â”€â”€ middleware.ts                      # edge auth gate (jose only; no mongoose here)
â”‚
â”œâ”€â”€ .github/workflows/ci.yml               # install, lint, typecheck, test, build
â”œâ”€â”€ .env.example
â”œâ”€â”€ .gitignore
â”œâ”€â”€ .prettierrc
â”œâ”€â”€ components.json                        # shadcn config
â”œâ”€â”€ docker-compose.yml                     # mongo (+volume) + app
â”œâ”€â”€ Dockerfile                             # multi-stage, standalone output
â”œâ”€â”€ eslint.config.mjs
â”œâ”€â”€ next.config.ts                         # security headers, output: "standalone"
â”œâ”€â”€ package.json
â”œâ”€â”€ postcss.config.mjs
â”œâ”€â”€ tsconfig.json                          # strict, "@/*" -> "src/*"
â”œâ”€â”€ vitest.config.ts
â””â”€â”€ README.md

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

---

# UI & FRONTEND PLAN: Employee Management System

## 1.1 Design goals
- Look: modern SaaS dashboard, clean, spacious, soft depth, light and dark themes.
- Feel: every interaction has a subtle GSAP-driven response. Motion explains what is happening and is never decoration.
- Usability: obvious actions, instant feedback, zero dead ends. Every state is designed: loading, empty, error, success.
- Maintainability: tokens in one place, animations in one place, every component has a single job.

## 1.2 Frontend stack
- Next.js 15 (App Router) + TypeScript strict. In pages and layouts, `params` is a Promise, so use `await params` (server) or `use(params)` (client).
- Tailwind CSS v4 + shadcn/ui (button, input, select, table, dialog, dropdown-menu, badge, card, skeleton, label, form, tooltip, sheet)
- GSAP 3.13+ with `@gsap/react` (`useGSAP`). All plugins are free: use `Flip`.
- TanStack Query v5, React Hook Form + Zod (`@hookform/resolvers/zod`)
- Recharts (charts), Sonner (toasts), lucide-react (icons), next-themes (dark mode)
- Fonts via `next/font/google`: "Plus Jakarta Sans" (UI, weights 400/500/600/700) and "JetBrains Mono" (employee IDs, numbers)

## 1.3 Design system: "Aurora Indigo"

### Color tokens (put in src/app/globals.css as CSS variables, map via Tailwind v4 @theme inline)
LIGHT
  --background:        #F5F6FB   page background
  --surface:           #FFFFFF   cards, table, dialogs
  --surface-2:         #EEF0F8   hover rows, inputs, subtle panels
  --border:            #E3E6F0
  --foreground:        #0F1530   main text
  --muted-foreground:  #6B7392   secondary text
  --primary:           #5B5BD6   indigo (buttons, active nav, links)
  --primary-hover:     #4B4BC4
  --primary-soft:      #ECECFC   tinted backgrounds
  --accent:            #14B8A6   teal (highlights, positive trends)
  --accent-soft:       #DDF7F3
  --success: #16A34A   --warning: #F59E0B   --danger: #E5484D   --info: #3B82F6
  --ring: #5B5BD6 at 40% opacity
DARK
  --background: #0A0E1F  --surface: #111733  --surface-2: #172042  --border: #232C52
  --foreground: #EEF0FF  --muted-foreground: #9AA3C7
  --primary: #7C7CF5  --primary-hover: #9090FA  --primary-soft: #1E1F4D
  --accent: #2DD4BF  --accent-soft: #0F2E32
BRAND GRADIENT: linear-gradient(135deg, #5B5BD6 0%, #8B5CF6 50%, #14B8A6 100%)
  Use only for: login brand panel, primary CTA hover glow, avatar fallbacks, chart highlight.
CHART PALETTE (8 departments): #5B5BD6 #14B8A6 #F59E0B #EC4899 #3B82F6 #8B5CF6 #22C55E #F97316
STATUS BADGES (tinted bg + colored text + 6px dot):
  active -> success, inactive -> muted gray/red, on_leave -> warning

### Shape, depth, spacing, type
- Radius: inputs/buttons 10px, cards 16px, dialogs 20px, badges and avatars full.
- Shadows (light): sm 0 1px 2px rgba(15,21,48,.06); md 0 8px 24px -8px rgba(15,21,48,.12);
  lg 0 24px 48px -12px rgba(91,91,214,.25) (hover glow). Dark mode: replace shadows with 1px borders plus a faint glow.
- Spacing: 4px grid. Page padding 24px (16px on mobile). Card padding 20-24px. Section gap 24px.
- Type scale: page title 28/36 bold; section title 18/28 semibold; body 14/22; caption 12/16; stat number 32/40 bold mono-tabular.
- Glass: the navbar uses backdrop-blur-md with background /80 and a bottom border.
- Focus: 2px ring in --ring with a 2px offset on every interactive element. Never remove outlines.

## 1.4 GSAP architecture (strict rules)
Files (all in src/animations/):
  gsap.ts        registers plugins ONCE and re-exports { gsap, useGSAP, Flip }. Components import ONLY from here.
  presets.ts     EASE, DUR, STAGGER constants plus reusable tween helpers (fadeUp, scaleIn, slideIn, shake, collapse).
  use-motion.ts  wrapper hook around useGSAP + gsap.matchMedia (handles prefers-reduced-motion).
  count-up.ts    number tween helper.
Reusable wrappers (src/components/motion/): <Reveal>, <Stagger>, <CountUp>, <AnimatedProgress>.

RULES
1. Use `useGSAP` from @gsap/react (never raw useEffect). Always pass `{ scope: containerRef }` and select children with
   class or data attributes (`[data-anim="card"]`) so selectors stay scoped and cleanup is automatic.
2. Event-driven animations (click, hover) use `contextSafe` from useGSAP so they are cleaned up on unmount.
3. Respect reduced motion: wrap everything in gsap.matchMedia "(prefers-reduced-motion: no-preference)" via useMotion.
   With reduced motion, content simply appears (no transforms).
4. Animate only `transform` and `opacity` (use `autoAlpha` and `x/y/scale`). Never animate width/height/top/left, with two exceptions:
   progress-bar width and row collapse (height). Use `clearProps: "transform"` after entrance tweens.
5. Never re-run entrance animations on background refetches. Dependencies are limited to the data identity that should
   re-animate (for example page number or filter key). Do not depend on the whole data object.
6. Never hide content in CSS waiting for JS. Use `gsap.from(...)`. useGSAP runs in a layout effect, so there is no flash.
7. Client components only ("use client"). GSAP never runs in server components.
8. Keep durations between 0.2 and 0.7s. Entrances use power3.out, hovers use power2.out, playful moments use back.out(1.4).
9. React StrictMode double-invoke is handled automatically by useGSAP cleanup. Do not add manual guards.

### Code that MUST exist

// src/animations/gsap.ts
"use client";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Flip } from "gsap/Flip";
gsap.registerPlugin(useGSAP, Flip);
export { gsap, useGSAP, Flip };

// src/animations/presets.ts
import { gsap } from "./gsap";
export const EASE = { smooth: "power3.out", snappy: "power2.out", soft: "power2.inOut", spring: "back.out(1.4)", expo: "expo.out" } as const;
export const DUR = { fast: 0.2, base: 0.4, slow: 0.7 } as const;
export const STAGGER = { tight: 0.04, base: 0.07, loose: 0.12 } as const;

export const fadeUp = (targets: gsap.TweenTarget, vars: gsap.TweenVars = {}) =>
  gsap.from(targets, { autoAlpha: 0, y: 16, duration: DUR.base, ease: EASE.smooth, stagger: STAGGER.base, clearProps: "transform", ...vars });
export const scaleIn = (targets: gsap.TweenTarget, vars: gsap.TweenVars = {}) =>
  gsap.from(targets, { autoAlpha: 0, scale: 0.94, duration: DUR.base, ease: EASE.spring, clearProps: "transform", ...vars });
export const slideInX = (targets: gsap.TweenTarget, x = 24, vars: gsap.TweenVars = {}) =>
  gsap.from(targets, { autoAlpha: 0, x, duration: DUR.base, ease: EASE.smooth, stagger: STAGGER.base, clearProps: "transform", ...vars });
export const shake = (target: gsap.TweenTarget) =>
  gsap.fromTo(target, { x: 0 }, { x: 0, duration: 0.5, ease: "none", keyframes: { x: [-10, 10, -8, 8, -4, 4, 0] } });
export const collapseRow = (el: Element, onDone: () => void) =>
  gsap.to(el, { height: 0, autoAlpha: 0, paddingTop: 0, paddingBottom: 0, duration: DUR.base, ease: EASE.soft, onComplete: onDone });

// src/animations/use-motion.ts
"use client";
import type { RefObject } from "react";
import { gsap, useGSAP } from "./gsap";
export function useMotion(
  fn: (ctx: { contextSafe: <T extends (...a: never[]) => unknown>(f: T) => T }) => void,
  opts: { scope: RefObject<HTMLElement | null>; dependencies?: unknown[] },
) {
  useGSAP((_ctx, contextSafe) => {
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => fn({ contextSafe: contextSafe! }));
    return () => mm.revert();
  }, { scope: opts.scope, dependencies: opts.dependencies ?? [], revertOnUpdate: true });
}

// src/animations/count-up.ts
import { gsap } from "./gsap";
export function countUp(el: HTMLElement, to: number, format: (n: number) => string, duration = 1.2) {
  const state = { v: 0 };
  return gsap.to(state, { v: to, duration, ease: "power2.out", onUpdate: () => { el.textContent = format(Math.round(state.v)); } });
}

## 1.5 Animation catalog (implement ALL)
| Where | Animation | Details |
|---|---|---|
| Route change (dashboard group) | Page enter | src/app/(dashboard)/template.tsx re-mounts per navigation: fadeUp of main content, y:12, 0.35s. (App Router has no exit animation, so this is enter-only.) |
| Login page | Intro timeline | Brand-panel gradient blobs float (infinite yoyo, 6-9s, sine.inOut); headline words stagger up (0.05s); form card scaleIn; fields stagger; CTA last. |
| Login failure | Shake | shake(formCard) plus an error message that slides down (height auto -> 0 to auto) |
| Sidebar | Mount stagger | Nav items slideInX from -16, stagger 0.05 |
| Sidebar | Active indicator | A single pill element moves to the active link with gsap.to (y/height, 0.35s, power3.out), using Flip when the sidebar collapses |
| Sidebar collapse (desktop) | Width tween | 264px to 76px, labels fade, 0.35s |
| Mobile nav | Sheet | Backdrop fade plus panel x:-100% to 0, links stagger |
| Theme toggle | Icon morph | Sun/moon rotate 90 degrees plus scale swap, 0.3s |
| Navbar | Scroll shadow | Shadow and border fade in after 8px scroll (ScrollTrigger-free: a passive scroll listener tweening opacity) |
| Dashboard header | Greeting | Fade up; time-based greeting ("Good morning, Admin") |
| Stat cards (4) | Entrance plus count-up | fadeUp stagger 0.08; numbers count 0 to value (1.2s); icon chip scaleIn with back.out |
| Stat card hover | Lift | y:-4 plus glow shadow, 0.25s via contextSafe mouseenter/leave (or quickTo) |
| Department bar chart | Reveal | Card fadeUp; Recharts native animationDuration 900; legend items stagger |
| Department list | Animated progress bars | Width 0 to pct%, 0.9s expo.out, stagger 0.06; count labels count up |
| Recent employees | List slide-in | slideInX 24, stagger 0.07; avatar scaleIn |
| Employees table rows | Page/filter change | Rows fadeUp y:10 stagger 0.03 (cap at the first 15 rows). Triggered only when page, sort, search or filter key changes, never on refetch |
| Table sort header | Arrow rotate | Chevron rotates 0/180 degrees, 0.25s; active header text color tween |
| Filter chips | Add/remove | Chip scaleIn on add, scale/fade out on remove |
| Search input | Focus | Container width grows 280 to 360px and icon color shifts (0.3s); "/" keyboard shortcut focuses it |
| Pagination | Number change | Active pill moves via Flip |
| Row delete success | Collapse | collapseRow() then invalidate queries in onComplete |
| Dialog open | Scale plus fade | Overlay 0 to 1 (0.2s); content scale .95 to 1, y 8 to 0 (0.3s back.out). Exit uses the Radix default fade |
| Form page | Section reveal | Section cards stagger fadeUp; fields stagger within the section |
| Form validation error | Slide down | Error text height 0 to auto plus fade (0.2s); invalid input does a subtle 4px x-shake |
| Submit button | States | idle -> loading (spinner fades in, label shifts) -> success (check icon scale back.out, 0.6s, then navigate) |
| Details page | Hero | Avatar scaleIn, name/designation fadeUp, info cards stagger, timeline items slideInX |
| Toasts | Sonner | Use Sonner's built-in transitions, themed to match |
| Empty state | Illustration | Floating loop on the icon (y:-8 yoyo, 2.5s); text fadeUp |
| Skeletons | Shimmer | CSS shimmer (cheaper than GSAP for loops) |
| 404/error pages | Entrance | Big number scaleIn plus slight rotation settle; CTA pulses once |

## 1.6 App shell (src/app/(dashboard)/layout.tsx)
- Desktop: fixed left Sidebar (264px, collapsible to 76px with tooltips) + top Navbar (64px, sticky, glass) + scrollable main (max-w 1280px, centered).
- Sidebar: logo plus app name; sections: Overview (Dashboard), People (All Employees, Add Employee); bottom: user card (avatar, name, role badge).
  Active link = primary-soft background, primary text, animated indicator pill.
- Navbar: page title and breadcrumbs (left); global "/" search hint, theme toggle, user dropdown (Profile info, Logout) (right).
- Mobile (<1024px): sidebar becomes a Sheet opened from a hamburger button; the table becomes a card list.
- Auth gate: the layout calls the session on the server (redirect to /login if there is none). Middleware is the first line of defence.

## 1.7 Pages (every element specified)

### /login (src/app/(auth)/login/page.tsx)
- Split layout. Left (hidden on mobile): brand gradient panel with floating blobs, logo, headline "Manage your people, effortlessly.",
  three feature bullets with icons.
- Right: card with title, subtitle, Email input (mail icon), Password input (lock icon + show/hide toggle),
  "Sign in" button (full width, loading spinner), inline error alert (role="alert").
- Behavior: RHF + zod(loginSchema); autofocus email; Enter submits; on success the button shows a check, then router.replace(next ?? "/dashboard").
  On 401 show a generic message plus shake; on 429 show "Too many attempts, try again in N minutes" (read Retry-After).

### /dashboard
- Header: greeting plus today's date; right: "Add Employee" primary button.
- Row of 4 StatCards: Total Employees (users icon, primary), Active (check-circle, success), Inactive/On Leave (pause-circle, warning), New This Month (sparkles, accent).
  Each has: icon chip, label, animated number, small caption ("+3 vs last month" only if data is available, else omit).
- Row 2 (2/3 + 1/3 grid): DepartmentChart (Recharts BarChart, rounded bars, custom tooltip, colored per department, axis labels truncated on mobile)
  | DepartmentBreakdown list (department, count, avg salary in INR, animated progress bar, click navigates to /employees?department=X).
- Row 3: RecentEmployees (5 rows: avatar, name, designation, department badge, joined date; links to details; "View all" link).
- States: skeleton for each card; error card with Retry; zero-data friendly message with a CTA to add the first employee.

### /employees
- Page header: title, count ("54 employees"), buttons [Export CSV] [Add Employee] (Add hidden for viewers).
- Toolbar card: SearchBar (debounced 400ms, clear "x" button), Department select, Status select, "Clear filters" ghost button (visible only when filters are active),
  rows-per-page select (10/25/50).
- Active filter chips row (animated).
- EmployeeTable columns: Employee (avatar + name + email) | ID (mono) | Department (colored dot badge) | Designation | Salary (en-IN INR, right-aligned) |
  Joined (e.g. 12 Mar 2024) | Status (StatusBadge) | Actions (dropdown: View, Edit, Delete).
  Sortable headers: name, department, salary, joiningDate, createdAt. Sticky header, row hover = surface-2, whole row clickable to details, zebra off.
- Mobile: EmployeeCard list (same data, stacked, actions in a dropdown).
- Footer: "Showing 11-20 of 54", Prev/Next, numbered pages with ellipsis.
- State = URL params: ?search=&department=&status=&sortBy=&order=&page=&limit=. Reset page to 1 when the search or filters change.
  Use `keepPreviousData` so the table does not flash while paging, and dim the old rows (opacity .6) while fetching.
- Empty: "No employees yet" plus Add CTA, versus "No results match your filters" plus Clear filters.

### /employees/new and /employees/[id]/edit
- One EmployeeForm (mode create|edit), 3 section cards, 2-column grid on desktop and 1 column on mobile:
  1. Personal: Full name, Email, Phone (with a +91 hint)
  2. Job: Department (select), Designation, Joining date (date input), Status (select, default active)
  3. Compensation: Salary (â‚¹ prefix, numeric, formatted on blur, shown as "â‚¹ 12,50,000" helper text)
- Sticky bottom action bar: Cancel (ghost) | Save (primary, loading state). Edit mode also disables Save until the form is dirty.
- Validation: zodResolver(createEmployeeSchema); mode "onTouched"; errors render under the field with an icon; first invalid field is focused on submit.
- Server errors: a 409 maps to setError("email", ...); other field errors from `errors[]` map by field; the generic message goes to a toast.
- Unsaved-changes guard: beforeunload plus a confirm dialog when navigating away from a dirty form.
- Edit page: skeleton form while loading; 404 renders the not-found UI; prefilled values (date formatted yyyy-MM-dd).

### /employees/[id]
- Hero card: large gradient-initial avatar, name, designation, StatusBadge, employeeId chip (copy-to-clipboard with a tooltip "Copied").
- Info grid cards: Contact (email with mailto, phone with tel), Job (department, designation, joining date, tenure "2 yrs 3 mos"), Compensation (salary).
- Timeline card: Created at, Last updated at.
- Actions: Back, Edit, Delete (DeleteConfirmDialog). Viewers see no Edit/Delete.
- Invalid/missing id -> friendly not-found state with a back link.

### Global pages
- not-found.tsx (404), error.tsx (with "Try again" calling reset()), loading.tsx (skeleton shell).

## 1.8 Component specs (src/features/* and src/components/*)
- StatCard {label, value, icon, tone, loading}: tone picks the icon-chip colors; value uses <CountUp>.
- StatusBadge {status}: dot plus label plus tinted bg.
- DepartmentBadge {department}: dot color from the chart palette via a DEPARTMENT_COLORS map (shared/constants).
- Avatar {name}: initials, deterministic gradient from a name hash (lib/avatar.ts).
- SearchBar: controlled, internal debounce with use-debounce, emits onChange(value) only after the delay.
- FilterBar: Selects for department and status plus a clear button. Reads and writes URL state via use-employee-url-state.
- EmployeeTable / EmployeeCard / EmployeeTableSkeleton / EmptyState / Pagination / DeleteConfirmDialog / EmployeeForm / FormSection / FormField (label + control + error wrapper).
- ConfirmDialog (common): generic; DeleteConfirmDialog composes it.
- PageHeader {title, description, actions}: standard header with the fadeUp intro.
- Logo, ThemeToggle, UserMenu, Sidebar, Navbar, MobileNav.

## 1.9 Data layer (frontend)
- src/lib/api-client.ts: typed fetch wrapper. It sends credentials, parses the standard response format, and throws ApiError {status, message, errors[]}.
  On 401 it redirects to /login.
- Query keys (features/employees/query-keys.ts):
  ["employees","list",params], ["employees","detail",id], ["dashboard","stats"]
- Mutations invalidate ["employees"] and ["dashboard"].
- Defaults: staleTime 30s, retry 1 (never retry on 4xx), refetchOnWindowFocus false.
- Dedicated hooks per file: use-employees-list, use-employee, use-create-employee, use-update-employee, use-delete-employee, use-dashboard-stats, use-auth.

## 1.10 Accessibility, responsive, performance
- WCAG AA contrast in both themes. Labels on all inputs, aria-invalid / aria-describedby on errors, aria-sort on table headers,
  dialogs trap focus and restore it, all actions are keyboard reachable, icon-only buttons have aria-label.
- Breakpoints: sm 640, md 768, lg 1024, xl 1280. Touch targets are at least 40px.
- Performance: dynamic-import Recharts (ssr:false); import only the needed GSAP plugins; no layout-thrashing animations; images are SVG only.

## 1.11 Frontend acceptance checklist
[ ] Light and dark themes both polished; the toggle persists (next-themes, no flash)
[ ] Every animation in the catalog implemented, scoped via useGSAP, reduced-motion safe
[ ] No entrance animation replays on background refetch
[ ] All pages have loading, empty, error and success states
[ ] URL-synced list state works with refresh, back button and shared links
[ ] Forms: inline errors, server error mapping, double-submit prevention, dirty guard
[ ] Delete: confirm dialog, row collapse animation, toast
[ ] Viewer role hides mutating controls
[ ] Mobile layout verified at 360px width
[ ] Lighthouse accessibility >= 95

