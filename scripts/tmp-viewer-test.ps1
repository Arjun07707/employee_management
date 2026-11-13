$base = "http://localhost:3000"

# Viewer login
Invoke-WebRequest -Uri "$base/api/auth/login" -Method POST -ContentType "application/json" -Body '{"email":"viewer@example.com","password":"Viewer@12345"}' -SessionVariable v -UseBasicParsing | Out-Null
Write-Host "VIEWER_LOGIN=200"

# Employees page as viewer: Add Employee must be hidden, Export visible
$emps = Invoke-WebRequest -Uri "$base/employees" -WebSession $v -UseBasicParsing
Write-Host "VIEWER_HAS_ADD=$($emps.Content.Contains('Add Employee')) VIEWER_HAS_EXPORT=$($emps.Content.Contains('Export CSV'))"

# Viewer cannot create (403)
try {
  $r = Invoke-WebRequest -Uri "$base/api/employees" -Method POST -ContentType "application/json" -WebSession $v -UseBasicParsing -Body '{"name":"Nope","email":"nope@example.com","phone":"+91 11111 11111","department":"Engineering","designation":"X","salary":100,"joiningDate":"2024-01-01","status":"active"}'
  Write-Host "VIEWER_CREATE=$($r.StatusCode)"
} catch { Write-Host "VIEWER_CREATE=$([int]$_.Exception.Response.StatusCode)" }

# Viewer cannot delete (403) — grab an id
$list = (Invoke-WebRequest -Uri "$base/api/employees?limit=1" -WebSession $v -UseBasicParsing).Content | ConvertFrom-Json
$id = $list.data[0].id
try {
  $r = Invoke-WebRequest -Uri "$base/api/employees/$id" -Method DELETE -WebSession $v -UseBasicParsing
  Write-Host "VIEWER_DELETE=$($r.StatusCode)"
} catch { Write-Host "VIEWER_DELETE=$([int]$_.Exception.Response.StatusCode)" }

# Viewer CAN read
Write-Host "VIEWER_LIST=$((Invoke-WebRequest -Uri "$base/api/employees?limit=1" -WebSession $v -UseBasicParsing).StatusCode)"

# Viewer create page: should redirect / show forbidden? (page-level role gating)
try {
  $np = Invoke-WebRequest -Uri "$base/employees/new" -WebSession $v -UseBasicParsing
  Write-Host "VIEWER_NEW_PAGE=$($np.StatusCode)"
} catch { Write-Host "VIEWER_NEW_PAGE=$([int]$_.Exception.Response.StatusCode)" }

# Admin login intact afterwards
$admin = Invoke-WebRequest -Uri "$base/api/auth/login" -Method POST -ContentType "application/json" -Body '{"email":"admin@example.com","password":"Admin@12345"}' -SessionVariable a -UseBasicParsing
Write-Host "ADMIN_RELOGIN=$($admin.StatusCode)"
$empsA = Invoke-WebRequest -Uri "$base/employees" -WebSession $a -UseBasicParsing
Write-Host "ADMIN_HAS_ADD=$($empsA.Content.Contains('Add Employee'))"
