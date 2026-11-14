# API Reference

All endpoints are Next.js Route Handlers under `/api`. They run in the same
process as the app, so a single `npm run dev` serves both the API and the UI.

- **Base URL (development):** `http://localhost:3000`
- **Content type:** `application/json` for requests and responses (except CSV export)
- **Auth:** JWT in the httpOnly `ems_token` cookie, set by `POST /api/auth/login`
- **Roles:** `admin` (full access), `viewer` (read-only), `employee` (own profile only)

Every JSON response uses one of these envelopes:

```json
{ "success": true, "message": "Employee created successfully", "data": {} }
```

```json
{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 54,
    "totalPages": 6,
    "hasNext": true,
    "hasPrev": false
  }
}
```

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [{ "field": "email", "message": "Invalid email format" }]
}
```

`message` is omitted on some success responses (for example list and detail
reads). `errors` is only present for validation and duplicate-username failures.

## Status codes

| Code  | Meaning                                                      |
| ----- | ------------------------------------------------------------ |
| `200` | OK                                                           |
| `201` | Created                                                      |
| `400` | Validation failed, invalid ObjectId, bad query, invalid JSON |
| `401` | Missing, invalid, or expired session                         |
| `403` | Authenticated but the role is not allowed                    |
| `404` | Resource not found (including soft-deleted employees)        |
| `409` | Duplicate username                                      |
| `429` | Rate limit exceeded (includes `Retry-After`)                 |
| `500` | Unexpected server error                                      |
| `503` | Health check only: database unavailable                      |

Every API response includes an `x-request-id` header. Send your own
`x-request-id` to correlate logs; otherwise the server generates one.

## Rate limits

| Scope | Limit                   | Key               |
| ----- | ----------------------- | ----------------- |
| Login | 5 attempts / 15 minutes | client IP + username |
| API   | 120 requests / minute   | client IP         |

Exceeding a limit returns `429` with a `Retry-After` header (seconds). The
limiter is in-memory and per process; use a shared store (for example Upstash
Redis) when running multiple instances.

---

## Health

### `GET /api/health`

Public. Reports server and database connectivity.

```bash
curl http://localhost:3000/api/health
```

```json
{
  "success": true,
  "data": {
    "server": "up",
    "uptime": 186.64,
    "timestamp": "2026-10-29T08:08:40.368Z",
    "status": "ok",
    "database": "connected"
  }
}
```

When MongoDB is unreachable the status is `503` and the body is:

```json
{
  "success": false,
  "message": "Database unavailable",
  "data": {
    "server": "up",
    "uptime": 186.64,
    "timestamp": "2026-10-29T08:08:40.368Z",
    "status": "degraded",
    "database": "disconnected"
  }
}
```

---

## Auth

### `POST /api/auth/login`

Public, rate-limited. On success sets the `ems_token` cookie
(`HttpOnly`, `SameSite=Lax`, `Path=/`, `Secure` in production) and returns the
current user.

```bash
curl -i -c cookies.txt -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin@12345"}'
```

Request body:

| Field      | Type   | Rules                    |
| ---------- | ------ | ------------------------ |
| `username` | string | 3–30 chars, lowercased   |
| `password` | string | 8–128 characters         |

```json
{
  "success": true,
  "message": "Signed in successfully",
  "data": {
    "id": "6ae2fef069eb0fcc7ab0c30d",
    "name": "Administrator",
    "username": "admin",
    "role": "admin",
    "mustChangePassword": false
  }
}
```

Failures:

- `400` — invalid body.
- `401` — `{"success":false,"message":"Invalid username or password"}` (the same
  message for unknown usernames, wrong passwords, and inactive accounts).
- `429` — too many attempts; honour `Retry-After`.

### `POST /api/auth/logout`

Clears the auth cookie. Returns `200` even when no session is present.

```bash
curl -i -b cookies.txt -c cookies.txt -X POST http://localhost:3000/api/auth/logout
```

```json
{ "success": true, "message": "Signed out successfully", "data": null }
```

Logout is stateless: the JWT itself stays valid until it expires, but the
browser no longer sends it. Keep the token lifetime short for high-security
deployments.

### `GET /api/auth/me`

Returns the signed-in user. Requires a valid cookie.

```bash
curl -b cookies.txt http://localhost:3000/api/auth/me
```

```json
{
  "success": true,
  "data": {
    "id": "...",
    "name": "Administrator",
    "username": "admin",
    "role": "admin",
    "mustChangePassword": false
  }
}
```

`401` when the cookie is missing, malformed, or expired.

### `GET /api/auth/username-available`

Public, rate-limited. Returns whether a username is available to register.
Suggests alternatives when taken.

```bash
curl -b cookies.txt "http://localhost:3000/api/auth/username-available?username=priya"
```

Query: `username` (required), optional `forEmployee` (exclude the current
employee's own username when checking).

Response:

```json
{
  "success": true,
  "data": {
    "available": true,
    "reason": "ok",
    "message": "priya is available"
  }
}
```

When taken:

```json
{
  "success": true,
  "data": {
    "available": false,
    "reason": "taken",
    "message": "priya is already taken",
    "suggestions": ["priya12", "priya.99", "priya24"]
  }
}
```

### `POST /api/auth/change-credentials`

Returns `200` on success and sets a fresh `ems_token` cookie.

Request body:

| Field          | Type      | Rules                                             |
| -------------- | --------- | ------------------------------------------------- |
| `currentPassword` | string   | required                                          |
| `newUsername`    | string?   | 3–30 chars, lowercased                            |
| `newPassword`    | string?   | 8–72 chars, must differ from `currentPassword`    |
| `confirmPassword`| string?   | must equal `newPassword` when `newPassword` set   |

At least one of `newUsername` or `newPassword` is required.

```json
{
  "success": true,
  "message": "Credentials updated successfully",
  "data": null
}
```

Failures: `400` validation, `401` wrong current password, `409` username taken.

---

## Employee login accounts

### `GET /api/employees/:id/account`

Role: `admin`. Returns the employee's login account or `404` when none exists.

### `POST /api/employees/:id/account`

Role: `admin`. Creates a login account for the employee.

Request body:

| Field              | Type   | Rules                     |
| ------------------ | ------ | ------------------------- |
| `username`         | string | required, 3–30 chars      |
| `password`         | string | required, 8–72 chars      |
| `mustChangePassword`| boolean | optional, defaults `true` |

Returns `201`. `409` when the employee already has a login or the username is taken.

### `PATCH /api/employees/:id/account`

Role: `admin`. Updates username, password, and/or `isActive`. Changing the
password bumps the employee's token version, invalidating existing sessions.

---


## Employees

Employee objects returned by the API:

```json
{
  "id": "6ae2ff05e6a40e22cb73baea",
  "employeeId": "EMP-0062",
  "name": "Smoke Test Two",
  "email": "smoke.test.two@example.com",
  "phone": "+91 90000 22222",
  "department": "Design",
  "designation": "Product Designer",
  "salary": 1200000,
  "joiningDate": "2024-05-01T00:00:00.000Z",
  "status": "active",
  "createdAt": "2026-10-29T08:08:37.915Z",
  "updatedAt": "2026-10-29T08:08:37.915Z"
}
```

`salary` is a raw number in INR; formatting belongs to the UI. `employeeId` is
generated by an atomic counter (`EMP-0001`, …) and is immutable. Gaps are
possible when a create fails after the counter increment.

### `GET /api/employees`

Roles: `admin`, `viewer`.

| Query        | Type          | Default     | Notes                                                               |
| ------------ | ------------- | ----------- | ------------------------------------------------------------------- |
| `search`     | string ≤ 100  | –           | case-insensitive match on name, email, employeeId; regex-escaped    |
| `department` | enum          | –           | one of the eight departments                                        |
| `status`     | enum          | –           | `active`, `inactive`, `on_leave`                                    |
| `sortBy`     | enum          | `createdAt` | `name`, `email`, `department`, `salary`, `joiningDate`, `createdAt` |
| `order`      | enum          | `desc`      | `asc` or `desc`                                                     |
| `page`       | integer ≥ 1   | `1`         |                                                                     |
| `limit`      | integer 1–100 | `10`        | capped to protect the database                                      |

Unknown query keys are rejected with `400`.

```bash
curl -b cookies.txt \
  "http://localhost:3000/api/employees?search=priya&department=Engineering&sortBy=name&order=asc&page=1&limit=10"
```

```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "employeeId": "EMP-0001",
      "name": "Priya Sharma",
      "...": "..."
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 54,
    "totalPages": 6,
    "hasNext": true,
    "hasPrev": false
  }
}
```

Soft-deleted employees are always excluded.

### `POST /api/employees`

Role: `admin`. Returns `201`.

```bash
curl -b cookies.txt -X POST http://localhost:3000/api/employees \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Priya Sharma",
    "email": "priya.sharma@example.com",
    "phone": "+91 98765 43210",
    "department": "Engineering",
    "designation": "Senior Software Engineer",
    "salary": 1850000,
    "joiningDate": "2023-04-17",
    "status": "active"
  }'
```

| Field         | Rules                                                                                   |
| ------------- | --------------------------------------------------------------------------------------- |
| `name`        | string, 2–100 characters                                                                |
| `email`       | valid email, max 254, stored lowercase; unique among non-deleted employees              |
| `phone`       | matches `/^\+?[0-9\s-]{7,15}$/`                                                         |
| `department`  | `Engineering`, `HR`, `Finance`, `Sales`, `Marketing`, `Operations`, `Support`, `Design` |
| `designation` | string, 2–100 characters                                                                |
| `salary`      | number, 0–100,000,000                                                                   |
| `joiningDate` | ISO date; not more than 30 days in the future                                           |
| `status`      | optional, defaults to `active`                                                          |

Failures: `400` validation, `409` duplicate email (with `field: "email"`).

### `GET /api/employees/:id`

Roles: `admin`, `viewer`. Returns the employee or `404`.

```bash
curl -b cookies.txt http://localhost:3000/api/employees/6ae2ff05e6a40e22cb73baea
```

`400` `"Invalid employee id"` when the id is not a valid ObjectId,
`404` `"Employee not found"` when missing or soft-deleted.

### `PATCH /api/employees/:id`

Role: `admin`. Any subset of the create fields, at least one key required.
Changing the email re-checks uniqueness against other active employees.

```bash
curl -b cookies.txt -X PATCH http://localhost:3000/api/employees/6ae2ff05e6a40e22cb73baea \
  -H "Content-Type: application/json" \
  -d '{"salary":1300000,"designation":"Senior Product Designer"}'
```

```json
{
  "success": true,
  "message": "Employee updated successfully",
  "data": {
    "id": "...",
    "salary": 1300000,
    "designation": "Senior Product Designer"
  }
}
```

### `DELETE /api/employees/:id`

Role: `admin`. Soft delete: sets `isDeleted` and `deletedAt`, keeps the
document. A second delete returns `404`.

```bash
curl -b cookies.txt -X DELETE http://localhost:3000/api/employees/6ae2ff05e6a40e22cb73baea
```

```json
{ "success": true, "message": "Employee deleted successfully", "data": null }
```

### `GET /api/employees/export`

Roles: `admin`, `viewer`. Returns a CSV of the filtered list (same query
parameters as the list endpoint, without pagination; capped at 10,000 rows).

```
Content-Type: text/csv; charset=utf-8
Content-Disposition: attachment; filename="employees-2026-10-29.csv"
```

The file is UTF-8 with a BOM (so Excel opens it correctly) and follows
RFC 4180 quoting. Header row: `Employee ID, Name, Email, Phone, Department,
Designation, Salary (INR), Joining Date, Status, Created At`.

```bash
curl -b cookies.txt -OJ "http://localhost:3000/api/employees/export?department=Design"
```

---

## Dashboard

### `GET /api/dashboard/stats`

Roles: `admin`, `viewer`. One aggregation round trip; department stats are
zero-filled for all eight departments.

```bash
curl -b cookies.txt http://localhost:3000/api/dashboard/stats
```

```json
{
  "success": true,
  "data": {
    "totalEmployees": 62,
    "active": 44,
    "inactive": 6,
    "onLeave": 12,
    "newThisMonth": 1,
    "departmentStats": [
      { "department": "Design", "count": 9, "avgSalary": 1370382 }
    ],
    "recentEmployees": [{ "id": "...", "employeeId": "EMP-0062", "...": "..." }]
  }
}
```

`newThisMonth` uses the start of the current month in UTC. `recentEmployees`
contains the five most recently created non-deleted employees.

---

## Error handling notes

- Malformed JSON returns `400` with `"Invalid JSON body"`.
- Request bodies are sanitized: keys starting with `$` or containing `.` are
  rejected so operators cannot be injected through JSON.
- Mongo duplicate-key errors (`code: 11000`) are mapped to `409` with a
  field-level `username` error.
- In production, unexpected errors return a generic message; the real error is
  logged server-side together with the request id.
