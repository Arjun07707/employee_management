# UPGRADE PROMPT: Employee Login (admin-provisioned credentials + live username check)

You are upgrading the existing Employee Management System (Next.js 15 App Router, TypeScript strict, MongoDB/Mongoose, Zod, TanStack Query, React Hook Form, GSAP). Existing layering stays: Route -> withApi -> Zod -> Service -> Model. Follow every item. Output COMPLETE files for anything new or changed (full path as heading). No "...", no TODOs. Do not rewrite unrelated files.

# 1. FEATURE SUMMARY
1. Admin creates login credentials (username + password) for an employee from the employee's page (or right after creating the employee) and hands them over personally.
2. The employee signs in with that username + password. Employees see ONLY their own profile (read-only) and an Account page. They can never see the employee list, dashboard, or other people's data.
3. Employee can later change their username and/or password (requires the current password).
4. Username availability is checked LIVE while typing, GitHub-style, after 500ms of typing inactivity: checking spinner -> available / taken / invalid / reserved. Used in: admin "Create login", admin "Change username", employee "Change username".
5. Admin can reset a password, change a username, and disable/enable a login. Soft-deleting an employee automatically disables their login.

# 2. DECISIONS (change here if needed)
- ROLES = admin | viewer | employee. (viewer = read-only staff member who sees everything, employee = self-service only)
- FORCE_PASSWORD_CHANGE_ON_FIRST_LOGIN = true. Admin-created or admin-reset passwords are temporary (mustChangePassword = true).
- Login identifier = username only (case-insensitive, stored lowercase). Email is NOT a login identifier.
- No self-service "forgot password" in v1: the admin resets it. Document this in the README.
- One login account per employee (unique partial index on users.employeeRef).
- Employee profile is read-only for the employee in v1.
- Create-employee + create-login are TWO sequential API calls (local Mongo is standalone and has no transactions). If the second fails, show an error toast and route to the employee details page with the "Create login" dialog open.

# 3. SHARED LAYER

## 3.1 src/shared/constants/index.ts  (ADD)
export const ROLES = ["admin", "viewer", "employee"] as const;
export type Role = (typeof ROLES)[number];
export const USERNAME_MIN = 3;
export const USERNAME_MAX = 30;
export const USERNAME_CHECK_DEBOUNCE_MS = 500;
export const FORCE_PASSWORD_CHANGE_ON_FIRST_LOGIN = true;
export const RESERVED_USERNAMES = [
  "admin","administrator","root","system","support","help","api","null","undefined",
  "me","account","login","logout","employees","dashboard","hr","staff","owner","superuser",
] as const;

## 3.2 src/shared/schemas/account.schema.ts  (NEW; used by client AND server)
import { z } from "zod";
import { RESERVED_USERNAMES, USERNAME_MAX, USERNAME_MIN } from "../constants";

// lowercase letters/digits; single . _ - allowed BETWEEN alphanumerics (no leading/trailing/double separators)
export const USERNAME_REGEX = /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/;

export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(USERNAME_MIN, `Username must be at least ${USERNAME_MIN} characters`)
  .max(USERNAME_MAX, `Username must be at most ${USERNAME_MAX} characters`)
  .regex(USERNAME_REGEX, "Use letters, numbers and single . _ - between characters")
  .refine((u) => !(RESERVED_USERNAMES as readonly string[]).includes(u), "This username is reserved");

// bcrypt only uses the first 72 BYTES, so cap at 72 to avoid silent truncation
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must be at most 72 characters")
  .regex(/[a-z]/, "Include a lowercase letter")
  .regex(/[A-Z]/, "Include an uppercase letter")
  .regex(/[0-9]/, "Include a number");

export const loginSchema = z.object({
  username: z.string().trim().toLowerCase().min(1, "Username is required").max(USERNAME_MAX),
  password: z.string().min(1, "Password is required").max(72),
});

export const createAccountSchema = z.object({
  username: usernameSchema,
  password: passwordSchema,
  mustChangePassword: z.boolean().default(true),
});

export const adminUpdateAccountSchema = z
  .object({
    username: usernameSchema.optional(),
    newPassword: passwordSchema.optional(),
    isActive: z.boolean().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, "Provide at least one field to update");

export const changeCredentialsSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required").max(72),
    newUsername: usernameSchema.optional(),
    newPassword: passwordSchema.optional(),
  })
  .refine((v) => v.newUsername || v.newPassword, "Provide a new username or a new password")
  .refine((v) => !v.newPassword || v.newPassword !== v.currentPassword, {
    path: ["newPassword"], message: "New password must be different from the current password",
  });

// client-only extension (confirm field)
export const changeCredentialsFormSchema = changeCredentialsSchema.and(
  z.object({ confirmPassword: z.string().optional() }),
).refine((v) => !v.newPassword || v.newPassword === v.confirmPassword, {
  path: ["confirmPassword"], message: "Passwords do not match",
});

export type LoginInput = z.infer<typeof loginSchema>;
export type CreateAccountInput = z.infer<typeof createAccountSchema>;
export type AdminUpdateAccountInput = z.infer<typeof adminUpdateAccountSchema>;
export type ChangeCredentialsInput = z.infer<typeof changeCredentialsSchema>;

## 3.3 src/shared/types/account.ts  (NEW)
export type UsernameCheckReason = "taken" | "invalid" | "reserved" | "current" | "ok";
export interface UsernameCheckResult {
  available: boolean;            // true for "ok" and "current"
  reason: UsernameCheckReason;
  message: string;
  suggestions?: string[];        // only when taken (max 3)
}
export interface AccountDTO {
  id: string; username: string; role: Role; isActive: boolean; mustChangePassword: boolean;
  lastLoginAt: string | null; passwordChangedAt: string | null; createdAt: string;
}
export interface SessionUserDTO {
  id: string; name: string; username: string; role: Role; mustChangePassword: boolean; employeeRef: string | null;
}

# 4. DATABASE

## 4.1 src/server/models/user.model.ts  (REPLACE)
import "server-only";
import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";
import { ROLES } from "@/shared/constants";
import { USERNAME_REGEX } from "@/shared/schemas/account.schema";

const userSchema = new Schema(
  {
    name:               { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    username:           { type: String, required: true, trim: true, lowercase: true, minlength: 3, maxlength: 30, match: USERNAME_REGEX },
    passwordHash:       { type: String, required: true, select: false },
    role:               { type: String, enum: ROLES, default: "employee" },
    employeeRef:        { type: Schema.Types.ObjectId, ref: "Employee", default: null },
    isActive:           { type: Boolean, default: true },
    mustChangePassword: { type: Boolean, default: true },
    tokenVersion:       { type: Number, default: 0 },          // bump to invalidate ALL existing sessions of this user
    passwordChangedAt:  { type: Date, default: null },
    lastLoginAt:        { type: Date, default: null },
    createdBy:          { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true, versionKey: false },
);

// Usernames are stored lowercase, so a plain unique index is case-insensitive in effect.
userSchema.index({ username: 1 }, { unique: true, name: "uniq_username" });
// One login per employee (admins/viewers have employeeRef = null and are excluded from the index).
userSchema.index(
  { employeeRef: 1 },
  { unique: true, partialFilterExpression: { employeeRef: { $type: "objectId" } }, name: "uniq_employee_account" },
);

export type UserDoc = InferSchemaType<typeof userSchema>;
export const User: Model<UserDoc> = (models.User as Model<UserDoc>) || model<UserDoc>("User", userSchema);
// Login query must opt in: User.findOne({ username }).select("+passwordHash")
// The old unique index on users.email (email_1) is DROPPED by the migration script. users.email no longer exists.

## 4.2 scripts/migrate-users-username.ts  (NEW, idempotent, run once: npm run migrate:users)
For every user without `username`: derive from the old email local part (lowercase, replace invalid chars with ".", collapse repeats, trim separators, pad to >= 3 chars, truncate to 30);
if taken append 2-digit counter until unique. Set tokenVersion = 0, mustChangePassword = false for existing admins, employeeRef = null.
Then try { await User.collection.dropIndex("email_1") } catch {} and call User.syncIndexes(). Log a summary.
Add "migrate:users" to package.json scripts.

## 4.3 scripts/create-admin.ts  (UPDATE)
Use ADMIN_USERNAME (default "admin") + ADMIN_PASSWORD; upsert by username; role "admin", mustChangePassword false, name "Administrator". Add ADMIN_USERNAME to env.ts (Zod) and .env.example.

## 4.4 Indexes and rules
| Collection | Index | Purpose |
|---|---|---|
| users | uniq_username (unique) | username uniqueness, login lookup, availability check |
| users | uniq_employee_account (unique, partial on employeeRef objectId) | max one login per employee |
Sample user: { "_id": "...", "name": "Priya Sharma", "username": "priya.sharma", "passwordHash": "$2a$12$...", "role": "employee",
  "employeeRef": "66f1c2a9b7e4a1d3c8a90e21", "isActive": true, "mustChangePassword": true, "tokenVersion": 0,
  "passwordChangedAt": null, "lastLoginAt": null, "createdBy": "<adminId>" }

# 5. BACKEND

## 5.1 Error mapping: src/server/http/handle-error.ts  (UPDATE the duplicate-key branch)
Mongo's MongoServerError exposes `keyPattern`. Map by the violated key:
  if ((err as {code?:number})?.code === 11000) {
    const key = Object.keys((err as { keyPattern?: Record<string, number> }).keyPattern ?? {})[0];
    if (key === "username")    return fail(409, "Username is already taken", [{ field: "username", message: "This username is already taken" }]);
    if (key === "employeeRef") return fail(409, "This employee already has a login");
    return fail(409, "Email already exists", [{ field: "email", message: "This email is already in use" }]);
  }

## 5.2 JWT: src/server/auth/jwt.ts  (UPDATE)
Payload: { sub: userId, role, username, name, tv: tokenVersion, mcp: mustChangePassword }  (HS256, jose).
`mcp` is read ONLY by the edge middleware for routing. The database is the source of truth.
Export signSession(user) and verifyToken(token). Cookie "ems_token": httpOnly, sameSite "lax", secure in production, path "/".

## 5.3 requireRole: src/server/auth/session.ts  (REPLACE: now validates against the DB)
export async function requireRole(roles: Role[], opts: { allowMustChange?: boolean } = {}): Promise<SessionUser> {
  const token = (await cookies()).get(AUTH_COOKIE)?.value;
  const payload = token ? await verifyToken(token).catch(() => null) : null;
  if (!payload) throw new UnauthorizedError();
  const u = await User.findById(payload.sub)
    .select("name username role isActive tokenVersion mustChangePassword employeeRef").lean();
  if (!u || !u.isActive || u.tokenVersion !== payload.tv) throw new UnauthorizedError("Session expired. Please sign in again.");
  if (u.mustChangePassword && !opts.allowMustChange) throw new ForbiddenError("You must change your password before continuing");
  if (!roles.includes(u.role)) throw new ForbiddenError();
  return { id: String(u._id), name: u.name, username: u.username, role: u.role,
           mustChangePassword: u.mustChangePassword, employeeRef: u.employeeRef ? String(u.employeeRef) : null };
}
// One extra indexed query per request. This is what makes "disable account", "reset password" and "change password" take effect immediately.

## 5.4 withApi: src/server/http/with-api.ts  (UPDATE)
- Add option `allowMustChange?: boolean`, forwarded to requireRole.
- ORDER MATTERS: `await connectDB()` must run BEFORE requireRole (requireRole now queries MongoDB).
- Rate limiter helper (src/server/security/rate-limit.ts): export `enforceRateLimit(key, { limit, windowMs })`, which throws TooManyRequestsError(retryAfterSeconds).

## 5.5 Services

### src/server/services/auth.service.ts  (REPLACE login)
import bcrypt from "bcryptjs";
let dummyHash: string | null = null;                      // used to equalize timing when the username does not exist
const getDummyHash = () => (dummyHash ??= bcrypt.hashSync("not-a-real-password", 12));

export async function login(input: LoginInput) {
  const user = await User.findOne({ username: input.username }).select("+passwordHash");
  const passwordOk = await bcrypt.compare(input.password, user?.passwordHash ?? getDummyHash());
  if (!user || !passwordOk) throw new UnauthorizedError("Invalid username or password");   // same message for both cases
  if (!user.isActive) throw new ForbiddenError("Your account is disabled. Please contact your administrator.");
  await User.updateOne({ _id: user._id }, { $set: { lastLoginAt: new Date() } });
  return { token: await signSession(user), user: toSessionUserDTO(user) };
}

### src/server/services/account.service.ts  (NEW)
import "server-only";
const BCRYPT_COST = 12;

// ---- availability (used by the live check) ----
export async function checkUsernameAvailability(raw: string, ctx: { excludeUserId?: string } = {}): Promise<UsernameCheckResult> {
  const username = raw.trim().toLowerCase();
  if ((RESERVED_USERNAMES as readonly string[]).includes(username))
    return { available: false, reason: "reserved", message: "This username is reserved" };
  const parsed = usernameSchema.safeParse(username);
  if (!parsed.success) return { available: false, reason: "invalid", message: parsed.error.issues[0].message };
  const existing = await User.findOne({ username }).select("_id").lean();
  if (!existing) return { available: true, reason: "ok", message: `${username} is available` };
  if (ctx.excludeUserId && String(existing._id) === ctx.excludeUserId)
    return { available: true, reason: "current", message: "This is your current username" };
  return { available: false, reason: "taken", message: `${username} is already taken`, suggestions: await suggest(username) };
}
async function suggest(base: string): Promise<string[]> {
  const stem = base.slice(0, 26);
  const candidates = [`${stem}${rand(2)}`, `${stem}.${rand(2)}`, `${stem}_${new Date().getFullYear() % 100}`, `${stem}${rand(3)}`];
  const taken = new Set((await User.find({ username: { $in: candidates } }).select("username").lean()).map((u) => u.username));
  return candidates.filter((c) => !taken.has(c) && usernameSchema.safeParse(c).success).slice(0, 3);
}

// ---- admin: create login for an employee ----
export async function createAccountForEmployee(employeeId: string, input: CreateAccountInput, admin: SessionUser): Promise<AccountDTO> {
  const employee = await getEmployeeEntity(employeeId);                       // validates ObjectId, 404 if missing or soft-deleted
  if (await User.exists({ employeeRef: employee._id })) throw new ConflictError("This employee already has a login");
  const passwordHash = await bcrypt.hash(input.password, BCRYPT_COST);
  const user = await User.create({                                             // race on username/employeeRef -> 11000 -> handleError -> 409
    name: employee.name, username: input.username, passwordHash, role: "employee", employeeRef: employee._id,
    mustChangePassword: FORCE_PASSWORD_CHANGE_ON_FIRST_LOGIN ? input.mustChangePassword : false,
    createdBy: admin.id,
  });
  return toAccountDTO(user);                                                   // NEVER return the password or hash
}
export async function getAccountByEmployee(employeeId: string): Promise<AccountDTO | null> { /* find by employeeRef, null when none */ }
export async function getAccountUserIdByEmployee(employeeId: string): Promise<string | null> { /* for exclude in availability check */ }

// ---- admin: update login ----
export async function adminUpdateAccount(employeeId: string, input: AdminUpdateAccountInput): Promise<AccountDTO> {
  const user = await User.findOne({ employeeRef: employeeId });
  if (!user) throw new NotFoundError("This employee has no login yet");
  if (input.username && input.username !== user.username) user.username = input.username;      // unique index guards races
  if (input.newPassword) {
    user.passwordHash = await bcrypt.hash(input.newPassword, BCRYPT_COST);
    user.mustChangePassword = FORCE_PASSWORD_CHANGE_ON_FIRST_LOGIN;
    user.passwordChangedAt = new Date();
    user.tokenVersion += 1;                                                                    // logs the employee out everywhere
  }
  if (input.isActive !== undefined) { user.isActive = input.isActive; if (!input.isActive) user.tokenVersion += 1; }
  await user.save();
  return toAccountDTO(user);
}

// ---- self-service: change own credentials ----
export async function changeOwnCredentials(userId: string, input: ChangeCredentialsInput) {
  const user = await User.findById(userId).select("+passwordHash");
  if (!user) throw new NotFoundError("Account not found");
  const ok = await bcrypt.compare(input.currentPassword, user.passwordHash);
  // 400 with a FIELD error, NOT 401 (the frontend api-client redirects to /login on 401)
  if (!ok) throw new BadRequestError("Current password is incorrect", [{ field: "currentPassword", message: "Current password is incorrect" }]);
  if (input.newUsername) user.username = input.newUsername;
  if (input.newPassword) { user.passwordHash = await bcrypt.hash(input.newPassword, BCRYPT_COST); user.passwordChangedAt = new Date(); }
  user.mustChangePassword = false;
  user.tokenVersion += 1;                                     // invalidate every other session, then re-issue a fresh token for this one
  await user.save();
  return { user: toSessionUserDTO(user), token: await signSession(user) };
}

### src/server/services/employee.service.ts  (UPDATE)
- deleteEmployee(id): after the soft delete also run
  User.updateOne({ employeeRef: id }, { $set: { isActive: false }, $inc: { tokenVersion: 1 } })
- getOwnProfile(userId): look up user.employeeRef, return getEmployeeById(employeeRef) as a DTO; 404 if the employee is missing or deleted.

## 5.6 API endpoints (ADD / CHANGE)
| Method | Path | Roles | Notes |
|---|---|---|---|
| POST | /api/auth/login | public | body {username, password}; rate limit 5 / 15 min per ip+username; returns {user, redirectTo} and sets the cookie |
| GET | /api/auth/me | any (allowMustChange) | current user |
| POST | /api/auth/logout | any | clears the cookie |
| POST | /api/auth/change-credentials | admin, employee, viewer (allowMustChange) | rate limit 5 / 15 min per user; re-issues the cookie |
| GET | /api/auth/username-available?username=x[&forEmployee=id] | admin, employee (allowMustChange) | rate limit 40 / min per user; Cache-Control: no-store |
| GET | /api/employees/:id/account | admin | AccountDTO or null |
| POST | /api/employees/:id/account | admin | 201 create login |
| PATCH | /api/employees/:id/account | admin | change username / reset password / enable-disable |
| GET | /api/me/profile | employee | own employee record (read-only) |
Existing /api/employees* and /api/dashboard* keep roles ["admin","viewer"], so employees automatically get 403.
redirectTo on login: mustChangePassword ? "/account?required=1" : role === "employee" ? "/me" : "/dashboard".

### Route code (follow exactly)
// src/app/api/auth/username-available/route.ts
export const GET = withApi({ roles: ["admin", "employee"], allowMustChange: true }, async (req, { user }) => {
  await enforceRateLimit(`uname:${user!.id}`, { limit: 40, windowMs: 60_000 });
  const username = req.nextUrl.searchParams.get("username") ?? "";
  const forEmployee = req.nextUrl.searchParams.get("forEmployee");
  let excludeUserId: string | undefined = user!.role === "employee" ? user!.id : undefined;      // employees may "keep" their own name
  if (user!.role === "admin" && forEmployee) excludeUserId = (await getAccountUserIdByEmployee(forEmployee)) ?? undefined;
  const res = ok(await checkUsernameAvailability(username.slice(0, 64), { excludeUserId }));
  res.headers.set("Cache-Control", "no-store");
  return res;
});

// src/app/api/employees/[id]/account/route.ts
export const GET   = withApi<{ id: string }>({ roles: ["admin"] }, async (_r, { params }) => ok(await getAccountByEmployee(params.id)));
export const POST  = withApi<{ id: string }>({ roles: ["admin"] }, async (req, { params, user }) =>
  created(await createAccountForEmployee(params.id, createAccountSchema.parse(await req.json()), user!), "Login created successfully"));
export const PATCH = withApi<{ id: string }>({ roles: ["admin"] }, async (req, { params }) =>
  ok(await adminUpdateAccount(params.id, adminUpdateAccountSchema.parse(await req.json())), "Account updated successfully"));

// src/app/api/auth/change-credentials/route.ts
export const POST = withApi({ roles: ["admin", "employee", "viewer"], allowMustChange: true }, async (req, { user }) => {
  await enforceRateLimit(`chg:${user!.id}`, { limit: 5, windowMs: 15 * 60_000 });
  const { user: updated, token } = await changeOwnCredentials(user!.id, changeCredentialsSchema.parse(await req.json()));
  const res = ok(updated, "Credentials updated successfully");
  setAuthCookie(res, token);
  return res;
});

## 5.7 Middleware: src/middleware.ts  (UPDATE; edge, jose only)
After verifying the JWT:
  const EMPLOYEE_PAGES = ["/me", "/account"];
  const EMPLOYEE_API   = ["/api/auth", "/api/me"];
  const isApi = pathname.startsWith("/api/");
  1. role === "employee": if (!isApi && !EMPLOYEE_PAGES.some((p) => pathname.startsWith(p))) redirect to /me;
     if (isApi && !EMPLOYEE_API.some((p) => pathname.startsWith(p))) return 403 JSON in the standard error format.
  2. payload.mcp === true: pages other than /account redirect to /account?required=1; APIs other than /api/auth/* return 403 {"message":"Password change required"}.
  3. "/" and "/login" for logged-in users: employee -> /me, others -> /dashboard (or /account?required=1 when mcp).
Middleware is only the first gate. requireRole re-checks everything in the API.

# 6. FRONTEND

## 6.1 New files
src/hooks/use-debounced-value.ts
src/hooks/use-username-availability.ts
src/components/forms/UsernameField.tsx
src/components/forms/PasswordField.tsx            (show/hide toggle, caps-lock hint, optional strength meter)
src/components/forms/PasswordStrength.tsx         (4-segment meter + checklist)
src/lib/generate-password.ts
src/lib/suggest-username.ts
src/features/employee-access/{api.ts, components/{LoginAccessCard,CreateLoginDialog,ManageLoginDialog,CredentialsReveal}.tsx, hooks/{use-account,use-create-account,use-update-account}.ts}
src/features/account/{api.ts, components/{ChangeCredentialsForm,RequiredBanner}.tsx, hooks/use-change-credentials.ts}
src/features/me/{components/MyProfile.tsx, hooks/use-my-profile.ts}
src/app/(dashboard)/me/page.tsx
src/app/(dashboard)/account/page.tsx

## 6.2 src/hooks/use-debounced-value.ts
"use client";
import { useEffect, useState } from "react";
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => { const t = setTimeout(() => setDebounced(value), delay); return () => clearTimeout(t); }, [value, delay]);
  return debounced;
}

## 6.3 src/hooks/use-username-availability.ts  (CORE LOGIC, implement exactly)
"use client";
export type UsernameStatus = "idle" | "hint" | "invalid" | "reserved" | "checking" | "available" | "current" | "taken" | "error";

export function useUsernameAvailability(value: string, opts: { forEmployeeId?: string; enabled?: boolean } = {}) {
  const normalized = value.trim().toLowerCase();
  const debounced = useDebouncedValue(normalized, USERNAME_CHECK_DEBOUNCE_MS);   // 500ms of inactivity
  const settled = normalized === debounced;
  const isReserved = (RESERVED_USERNAMES as readonly string[]).includes(normalized);
  const local = usernameSchema.safeParse(normalized);                             // instant, NO network

  const query = useQuery({
    queryKey: ["username-available", debounced, opts.forEmployeeId ?? null],
    queryFn: ({ signal }) => accountApi.checkUsername(debounced, opts.forEmployeeId, signal),   // signal => in-flight request is aborted on change
    enabled: (opts.enabled ?? true) && settled && usernameSchema.safeParse(debounced).success,
    staleTime: 10_000, gcTime: 30_000, retry: false,
  });

  let status: UsernameStatus;
  if (!normalized) status = "idle";
  else if (isReserved) status = "reserved";
  else if (!local.success) status = normalized.length < USERNAME_MIN ? "hint" : "invalid";   // short input = neutral "keep typing", not an error
  else if (!settled || query.isFetching) status = "checking";
  else if (query.isError) status = "error";
  else if (query.data) status = query.data.reason === "current" ? "current" : query.data.available ? "available" : "taken";
  else status = "checking";

  const message =
    status === "invalid" || status === "hint" ? (local.success ? "" : local.error.issues[0].message)
    : status === "reserved" ? "This username is reserved"
    : status === "checking" ? "Checking availability..."
    : status === "error" ? "Could not check availability. Try again."
    : query.data?.message ?? "";
  const ok = status === "available" || status === "current";
  return { status, message, suggestions: query.data?.suggestions ?? [], isOk: ok, isBlocking: !!normalized && !ok };
}
Rules: never fire a request for locally-invalid input; never show "available" before the debounce has settled; typing again immediately returns to "checking".

## 6.4 src/components/forms/UsernameField.tsx  (spec)
Props: { control/register (RHF), name = "username", label = "Username", forEmployeeId?, onStatusChange?(status) }.
- Input with autoComplete="off", spellCheck=false, autoCapitalize="none", inputMode="text", maxLength=30; value is lowercased on change.
- Right-side status icon (animated with GSAP scaleIn, back.out, keyed by status): checking = spinner, available/current = check, taken/invalid/reserved = x/alert.
- Message line under the input: role="status" aria-live="polite", text from the hook, tone by status (muted for hint/checking, success for available, danger for taken/invalid/reserved).
- Input gets aria-invalid for taken/invalid/reserved and aria-describedby for the message.
- When taken: show up to 3 suggestion chips; clicking one sets the field value (shouldValidate, shouldDirty).
- Exposes status to the parent form. The parent form blocks submit while `isBlocking`, focuses the field, and shows a toast "Choose an available username".
- Server 409 on submit -> setError("username", { message }) (covers the race where someone grabs the name between check and submit).

## 6.5 src/lib/generate-password.ts
export function generatePassword(length = 12): string {
  const sets = ["abcdefghijkmnopqrstuvwxyz", "ABCDEFGHJKLMNPQRSTUVWXYZ", "23456789", "!@#$%*?"];   // no look-alike chars (l I 1 O 0)
  const all = sets.join("");
  const pick = (s: string) => s[crypto.getRandomValues(new Uint32Array(1))[0] % s.length];
  const chars = [...sets.map(pick), ...Array.from({ length: length - sets.length }, () => pick(all))];
  for (let i = chars.length - 1; i > 0; i--) { const j = crypto.getRandomValues(new Uint32Array(1))[0] % (i + 1); [chars[i], chars[j]] = [chars[j], chars[i]]; }
  return chars.join("");        // always satisfies passwordSchema (lower + upper + digit)
}
src/lib/suggest-username.ts: suggestUsername("Priya Sharma") -> "priya.sharma" (lowercase, strip diacritics, non-alphanumerics -> ".", collapse, trim, <= 30 chars).

## 6.6 Admin UI: "Login Access" card on /employees/[id]  (admin only; hidden for viewer and employee)
Uses GET /api/employees/:id/account.
- No login yet: empty card ("No login created yet", short explanation) + primary "Create login" button.
- Login exists: rows -> Username (mono + copy), Status (Active / Disabled badge), Password ("Temporary, must be changed at first login" OR "Changed <relative date>"), Last login ("Never" or date).
  Buttons: "Reset password", "Change username", "Disable login" / "Enable login" (ConfirmDialog).
- CreateLoginDialog: UsernameField (prefilled with suggestUsername(employee.name), live check starts at once) + PasswordField with "Generate" button (generatePassword) + strength meter + checkbox "Require password change at first login" (default on, only when FORCE_PASSWORD_CHANGE_ON_FIRST_LOGIN). Submit disabled while the username status is blocking or the request is pending.
- On success -> CredentialsReveal (inside the same dialog): username, password (masked, eye toggle), Copy buttons, "Copy all" (format: "Username: x\nPassword: y\nSign in at: <origin>/login"), warning "Share this with the employee personally. The password will not be shown again."
  Keep the password ONLY in local component state: not in React Query cache (mutation gcTime 0), not in the URL, not in localStorage, not in logs. Clear it when the dialog closes.
- ManageLoginDialog modes: "reset-password" (PasswordField + Generate + CredentialsReveal afterwards) and "change-username" (UsernameField with forEmployeeId so the current name counts as "current").
- Mutations invalidate ["employee-account", id].
- Create-employee page: add an optional "Create login now" toggle at the bottom of EmployeeForm (create mode only). When on, show UsernameField + PasswordField. Flow: POST /employees, then POST /employees/:id/account. If step 2 fails: toast + router.push(`/employees/${id}?createLogin=1`) which auto-opens CreateLoginDialog.

## 6.7 Employee UI
- Login page: field label "Username" (autoComplete="username"), password (autoComplete="current-password"), helper text "Your username and password are provided by your administrator." Email is no longer accepted. 401 -> generic message + shake; 403 -> show the server message (disabled account); 429 -> "Too many attempts, try again in N minutes" from Retry-After. After success use redirectTo from the response.
  api-client: add option skipAuthRedirect and set it for login and change-credentials so a 401 never triggers a redirect loop.
- Sidebar and nav by role: admin = Dashboard, Employees, Add Employee. viewer = Dashboard, Employees. employee = My Profile, Account. UserMenu has "Account settings" for every role.
- /me (employee): read-only hero + info cards (reuse EmployeeDetails with `readOnly`). Hide salary? NO, show it (it is their own). Hide Edit and Delete. Data from GET /api/me/profile.
- /account (all roles): "Account security" page with ChangeCredentialsForm: current password (required), new username (UsernameField, optional, current name allowed), new password + confirm (PasswordField with strength meter, optional), at least one of the two new values required. Success: toast, the server re-issued the cookie, invalidate ["auth","me"], navigate to /me (employee) or /dashboard.
  When `?required=1` (or session.mustChangePassword): show RequiredBanner ("Set a new password to continue"), hide the sidebar links, username change optional, new password required.
  Wrong current password -> inline error on that field (400 field error).
- Role-based UI hiding is cosmetic. The server is the source of truth.

# 7. SECURITY CHECKLIST
- Passwords: bcrypt cost 12, 72-byte cap, never logged, never returned, never in URLs, passwordHash select:false.
- Login: generic "Invalid username or password" + dummy-hash compare for unknown users (timing equalization); rate limit per ip+username.
- Username-available endpoint: auth required (no public enumeration), rate limited, no-store, input capped at 64 chars.
- Sessions: tokenVersion invalidates sessions on reset, change, disable. requireRole validates against the DB each request.
- Authorization: employees blocked in middleware AND in services/routes; employees can only read their own record via employeeRef (never an id from the client).
- Disabled/soft-deleted employees cannot sign in and existing sessions die immediately.
- Never accept role, employeeRef, isActive or tokenVersion from a client body except through the admin endpoints above (strict Zod schemas).

# 8. TESTS (Vitest + mongodb-memory-server; add to tests/)
- account.schema: valid names, too short/long, uppercase normalized, leading/trailing/double separators rejected, reserved words, password rules, 72-char cap, changeCredentials refinements.
- checkUsernameAvailability: ok, taken (+ suggestions are free and valid), invalid, reserved, current (with excludeUserId), case-insensitive collision ("Priya" vs "priya").
- createAccountForEmployee: success; duplicate username -> 409 field "username"; second login for the same employee -> 409; two parallel creates with the same username via Promise.all -> exactly one succeeds; soft-deleted employee -> 404.
- login: success, wrong password and unknown user return the same message, disabled -> 403, lastLoginAt updated.
- changeOwnCredentials: wrong current password -> 400 with field error; success bumps tokenVersion; the OLD token is rejected by requireRole; mustChangePassword cleared; username change to a taken name -> 409.
- adminUpdateAccount: reset password sets mustChangePassword + bumps tokenVersion; disable blocks login and kills the session.
- deleteEmployee disables the account.
- Authorization: employee role gets 403 on /api/employees and /api/dashboard/stats; mustChangePassword user gets 403 everywhere except auth routes.
- Hook test (fake timers + React Testing Library): no request before 500ms; rapid typing sends ONE request for the last value; invalid input sends none; the status goes checking -> available/taken.

# 9. PHASES (stop and summarize after each)
A. Shared: constants, account.schema, types.
B. Database: user model, migration script, create-admin update, env, indexes.
C. Services: auth.service, account.service, employee.service updates, session/requireRole, with-api, rate-limit.
D. API: handleError update, all routes above, middleware update.
E. Frontend core: debounce hook, availability hook, UsernameField, PasswordField, strength meter, api-client option.
F. Admin Login Access UI + create-employee integration.
G. Employee pages (/me, /account), role-based nav, login page update.
H. Tests, README (new section "Employee logins"), .env.example, docs/API.md updates.

# 10. ACCEPTANCE CHECKLIST (confirm each against the real code)
[ ] Admin can create a login from the employee page and from the create-employee form
[ ] Username availability appears while typing, only after 500ms idle, with spinner / available / taken / invalid / reserved, and suggestions when taken
[ ] Only one availability request is sent per pause; in-flight requests are aborted; invalid input sends none
[ ] Duplicate usernames impossible (service check + unique index + 409 mapped to the field)
[ ] Credentials are shown once; no password is stored or cached on the client; "Copy all" works
[ ] Employee signs in with the username, lands on /me, and cannot reach any admin page or API (403 / redirect)
[ ] First login forces a password change; the banner is shown; nothing else is reachable until done
[ ] Employee can change username and password; the wrong current password shows a field error (not a redirect); old sessions are invalidated
[ ] Admin can reset the password, change the username, and disable/enable; the effect is immediate
[ ] Soft-deleting an employee disables the login
[ ] Existing admin works after the migration (username backfilled, email index dropped)
[ ] typecheck, lint, test and build pass; README and .env.example updated