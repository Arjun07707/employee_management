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