# Deploy fix to VPS via SSH
# This script uploads the fix script to VPS and runs it

$secpasswd = ConvertTo-SecureString 'mT4-wye-9Dn-hYK' -AsPlainText -Force
$credential = New-Object System.Management.Automation.PSCredential('ubuntu', $secpasswd)

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  Deploying Dashboard Fix to VPS" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Upload the fix script to VPS
Write-Host "▶ Uploading fix script to VPS..." -ForegroundColor Yellow
$fixScript = Get-Content "c:\Users\user\Documents\Software-Developer\Freelancer\aivery\fix-vps-dashboard.sh" -Raw
Invoke-Command -ComputerName 43.156.108.96 -Credential $credential -ScriptBlock {
    param($scriptContent)
    $scriptContent | Out-File -FilePath "/home/ubuntu/AVRY/fix-vps-dashboard.sh" -Encoding ascii
    chmod +x "/home/ubuntu/AVRY/fix-vps-dashboard.sh"
    Write-Host "✓ Fix script uploaded to VPS" -ForegroundColor Green
} -ArgumentList $fixScript
Write-Host ""

# Run the fix script on VPS
Write-Host "▶ Running fix script on VPS..." -ForegroundColor Yellow
Invoke-Command -ComputerName 43.156.108.96 -Credential $credential -ScriptBlock {
    cd /home/ubuntu/AVRY
    bash fix-vps-dashboard.sh
}
Write-Host ""

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  ✅  Fix deployment complete!" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan
