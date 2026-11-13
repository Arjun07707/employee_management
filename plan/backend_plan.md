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