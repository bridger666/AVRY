# Fix VPS Dashboard Navigation Issue
# This script fixes the 504 Gateway Timeout and localhost redirect issues
# Run on Windows to deploy fixes to VPS via SSH

$secpasswd = ConvertTo-SecureString 'mT4-wye-9Dn-hYK' -AsPlainText -Force
$credential = New-Object System.Management.Automation.PSCredential('ubuntu', $secpasswd)

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  AIVORY Dashboard Fix Script (Windows to VPS)" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# ── 1. Fix frontend files to use correct dashboard URL ────────────────────────
Write-Host "▶ [1/5] Fixing frontend files to use dashboard.aivory.id..." -ForegroundColor Yellow
$script1 = @'
cd /home/ubuntu/AVRY
cp frontend/index.html frontend/index.html.backup
cp frontend/index_embedded.html frontend/index_embedded.html.backup
cp frontend/workflows.html frontend/workflows.html.backup
cp frontend/settings.html frontend/settings.html.backup
cp frontend/logs.html frontend/logs.html.backup
sed -i 's|window.location.protocol}//app.aivory.id|window.location.protocol}//dashboard.aivory.id|g' frontend/index.html
sed -i 's|window.location.protocol}//app.aivory.id|window.location.protocol}//dashboard.aivory.id|g' frontend/index_embedded.html
echo "Fixed frontend files"
'@
Invoke-Command -ComputerName 43.156.108.96 -Credential $credential -ScriptBlock { param($s) Invoke-Expression $s } -ArgumentList $script1
Write-Host "Fixed frontend files" -ForegroundColor Green
Write-Host ""

# ── 2. Recreate dashboard container with correct labels ───────────────────────
Write-Host "▶ [2/5] Recreating dashboard container with correct labels..." -ForegroundColor Yellow
$script2 = @'
cd /home/ubuntu/AVRY
docker compose -f docker-compose.dashboard.yml down
docker compose -f docker-compose.dashboard.yml up -d --force-recreate
echo "Dashboard container recreated"
'@
Invoke-Command -ComputerName 43.156.108.96 -Credential $credential -ScriptBlock { param($s) Invoke-Expression $s } -ArgumentList $script2
Write-Host "Dashboard container recreated" -ForegroundColor Green
Write-Host ""

# ── 3. Wait for container to be ready ─────────────────────────────────────────
Write-Host "▶ [3/5] Waiting for dashboard container to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 10
Write-Host "Container ready" -ForegroundColor Green
Write-Host ""

# ── 4. Verify Traefik discovers the dashboard ─────────────────────────────────
Write-Host "▶ [4/5] Verifying Traefik discovers the dashboard..." -ForegroundColor Yellow
$script3 = @'
sleep 5
docker exec traefik cat /etc/traefik/dynamic.yml | grep -A 5 "aivory-dashboard" || echo "Dashboard service not yet in Traefik config"
'@
Invoke-Command -ComputerName 43.156.108.96 -Credential $credential -ScriptBlock { param($s) Invoke-Expression $s } -ArgumentList $script3
Write-Host ""
Write-Host ""

# ── 5. Test the dashboard ─────────────────────────────────────────────────────
Write-Host "▶ [5/5] Testing dashboard access..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Testing locally on VPS:" -ForegroundColor Cyan
$script4 = @'
curl -sf http://localhost:3000/ && echo "Dashboard responding locally" || echo "Dashboard not responding locally"
'@
Invoke-Command -ComputerName 43.156.108.96 -Credential $credential -ScriptBlock { param($s) Invoke-Expression $s } -ArgumentList $script4
Write-Host ""
Write-Host "Testing via Traefik:" -ForegroundColor Cyan
$script5 = @'
curl -sk https://dashboard.aivory.id/ && echo "Dashboard responding via Traefik" || echo "Dashboard not responding via Traefik"
'@
Invoke-Command -ComputerName 43.156.108.96 -Credential $credential -ScriptBlock { param($s) Invoke-Expression $s } -ArgumentList $script5
Write-Host ""

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  Fix complete!" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "If the dashboard is still not accessible, check:" -ForegroundColor Yellow
Write-Host "  - Docker logs: docker logs aivory-dashboard"
Write-Host "  - Traefik logs: docker logs traefik"
Write-Host "  - Network connectivity: docker exec aivory-dashboard ping -c 3 172.20.0.1"
