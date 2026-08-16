# 1. Build Next.js
Write-Host "Building Next.js..."
npm run build
if ($LASTEXITCODE -ne 0) { throw "Build failed" }

# 2. Remove old tar.gz files
Remove-Item -LiteralPath "standalone_dotnext.tar.gz" -ErrorAction SilentlyContinue
Remove-Item -LiteralPath "next_static.tar.gz" -ErrorAction SilentlyContinue

# 3. Create standalone tar.gz with .next/ only (NOT data/ — live data is in MySQL)
#    data/ is excluded to prevent overwriting live products/orders/settings on deploy.
Write-Host "Creating standalone_dotnext.tar.gz..."
$standaloneItems = @(
    ".next/",
    "package.json",
    "server.js"
)
tar -czf standalone_dotnext.tar.gz --exclude="node_modules" $standaloneItems 2>$null

# 4. Create static tar.gz for _next/static/
Write-Host "Creating next_static.tar.gz..."
Push-Location -LiteralPath ".next"
tar -czf "..\next_static.tar.gz" "static/" 2>$null
Pop-Location

# 5. Deploy
Write-Host "Deploying..."
python deploy.py
