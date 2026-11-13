$ErrorActionPreference = "Continue"
$base = "http://localhost:3000"

function Status($fn) {
  try { $r = & $fn; return "$($r.StatusCode)" }
  catch { return "$([int]$_.Exception.Response.StatusCode)" }
}

# 1. Bad login -> 401
Write-Host ("BAD_LOGIN=" + (Status { Invoke-WebRequest -Uri "$base/api/auth/login" -Method POST -ContentType "application/json" -Body '{"email":"admin@example.com","password":"wrongpass"}' -UseBasicParsing }))

# 2. Login page renders
$lp = Invoke-WebRequest -Uri "$base/login" -UseBasicParsing
Write-Host "LOGIN_PAGE=$($lp.StatusCode) hasWelcome=$($lp.Content.Contains('Welcome back'))"

# 3. 404 page
try { $nf = Invoke-WebRequest -Uri "$base/no-such-page" -UseBasicParsing } catch { $nf = $_.Exception.Response }
Write-Host "NOTFOUND=$([int]$nf.StatusCode)"

# 4. Admin session
Invoke-WebRequest -Uri "$base/api/auth/login" -Method POST -ContentType "application/json" -Body '{"email":"admin@example.com","password":"Admin@12345"}' -SessionVariable s -UseBasicParsing | Out-Null

# 5. Create
$new = Invoke-WebRequest -Uri "$base/api/employees" -Method POST -ContentType "application/json" -WebSession $s -UseBasicParsing -Body '{"name":"Smoke Tester","email":"smoke.tester@example.com","phone":"+91 90000 00001","department":"Engineering","designation":"QA Engineer","salary":900000,"joiningDate":"2024-01-15","status":"active"}'
Write-Host "CREATE=$($new.StatusCode)"
$id = ($new.Content | ConvertFrom-Json).data.id
Write-Host "ID=$id"

# 6. Duplicate -> 409
Write-Host ("DUP=" + (Status { Invoke-WebRequest -Uri "$base/api/employees" -Method POST -ContentType "application/json" -WebSession $s -UseBasicParsing -Body '{"name":"Dup","email":"smoke.tester@example.com","phone":"+91 90000 00002","department":"Engineering","designation":"QA","salary":900000,"joiningDate":"2024-01-15","status":"active"}' }))

# 7. Validation error -> 422
Write-Host ("INVALID=" + (Status { Invoke-WebRequest -Uri "$base/api/employees" -Method POST -ContentType "application/json" -WebSession $s -UseBasicParsing -Body '{"name":"X","email":"not-an-email","phone":"1","department":"Engineering","designation":"","salary":-5,"joiningDate":"2024-01-15","status":"active"}' }))

# 8. Update
$upd = Invoke-WebRequest -Uri "$base/api/employees/$id" -Method PATCH -ContentType "application/json" -WebSession $s -UseBasicParsing -Body '{"salary":1000000}'
Write-Host "UPDATE=$($upd.StatusCode)"

# 9. Detail page renders with the employee
$dp = Invoke-WebRequest -Uri "$base/employees/$id" -WebSession $s -UseBasicParsing
Write-Host "DETAIL_PAGE=$($dp.StatusCode) hasName=$($dp.Content.Contains('Smoke Tester'))"

# 10. Edit page renders
$ep = Invoke-WebRequest -Uri "$base/employees/$id/edit" -WebSession $s -UseBasicParsing
Write-Host "EDIT_PAGE=$($ep.StatusCode)"

# 11. Delete
$del = Invoke-WebRequest -Uri "$base/api/employees/$id" -Method DELETE -WebSession $s -UseBasicParsing
Write-Host "DELETE=$($del.StatusCode)"

# 12. CSV export
$csv = Invoke-WebRequest -Uri "$base/api/employees/export?department=Engineering" -WebSession $s -UseBasicParsing
Write-Host "CSV=$($csv.StatusCode) lines=$(($csv.Content -split "`n").Count)"

# 13. Viewer role: login as viewer? (no viewer seeded) -> check role-gated nav on employees page for admin
$emps = Invoke-WebRequest -Uri "$base/employees" -WebSession $s -UseBasicParsing
Write-Host "EMPLOYEES_PAGE=$($emps.StatusCode) hasAdd=$($emps.Content.Contains('Add Employee')) hasExport=$($emps.Content.Contains('Export CSV'))"

# 14. Rate limit: 6 rapid bad logins (limit is likely 5/min on login)
for ($i = 1; $i -le 6; $i++) { $st = Status { Invoke-WebRequest -Uri "$base/api/auth/login" -Method POST -ContentType "application/json" -Body '{"email":"a@b.com","password":"x"}' -UseBasicParsing }; Write-Host "RL_$i=$st" }
