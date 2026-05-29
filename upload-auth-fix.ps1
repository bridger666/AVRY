# Upload auth fix to VPS
# This script uploads the updated auth-manager.js to the VPS

$secpasswd = ConvertTo-SecureString 'mT4-wye-9Dn-hYK' -AsPlainText -Force
$credential = New-Object System.Management.Automation.PSCredential('ubuntu', $secpasswd)

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  Uploading Auth Fix to VPS" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Upload auth-manager.js to AVRY frontend
Write-Host "▶ Uploading auth-manager.js to AVRY frontend..." -ForegroundColor Yellow
$authManagerContent = Get-Content "c:\Users\user\Documents\Software-Developer\Freelancer\aivery\frontend\auth-manager.js" -Raw
Invoke-Command -ComputerName 43.156.108.96 -Credential $credential -ScriptBlock {
    param($content)
    $content | Out-File -FilePath "/home/ubuntu/AVRY/frontend/auth-manager.js" -Encoding ascii
    Write-Host "✓ Uploaded auth-manager.js to AVRY" -ForegroundColor Green
} -ArgumentList $authManagerContent
Write-Host ""

# Upload auth-manager.js to stag-frontend
Write-Host "▶ Uploading auth-manager.js to stag-frontend..." -ForegroundColor Yellow
Invoke-Command -ComputerName 43.156.108.96 -Credential $credential -ScriptBlock {
    param($content)
    $content | Out-File -FilePath "/home/ubuntu/stag-frontend/frontend/auth-manager.js" -Encoding ascii
    Write-Host "✓ Uploaded auth-manager.js to stag-frontend" -ForegroundColor Green
} -ArgumentList $authManagerContent
Write-Host ""

# Restart stag-frontend container
Write-Host "▶ Restarting stag-frontend container..." -ForegroundColor Yellow
Invoke-Command -ComputerName 43.156.108.96 -Credential $credential -ScriptBlock {
    cd /home/ubuntu/stag-frontend
    docker compose down
    docker compose up -d
    Write-Host "✓ Restarted stag-frontend container" -ForegroundColor Green
}
Write-Host ""

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  ✅  Auth fix uploaded and deployed!" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan
