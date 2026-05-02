#!/bin/bash
# Deploy nginx dotfile security fix to VPS
# Creates a snippet and includes it in each server block
# Local processes (Zeroclaw, Node.js) still read .env via fs - only HTTP blocked

set -e

VPS="ubuntu@43.156.108.96"
PASS="mT4-wye-9Dn-hYK"
SSH_CMD="sshpass -p $PASS ssh -o StrictHostKeyChecking=no $VPS"

echo "=========================================="
echo "  NGINX DOTFILE SECURITY DEPLOYMENT"
echo "=========================================="

# ── Check sshpass availability ──────────────────────────────────────────────
if ! command -v sshpass &>/dev/null; then
  echo "sshpass not found. Installing..."
  brew install hudochenkov/sshpass/sshpass
fi

# ── Step 1: .env permissions ────────────────────────────────────────────────
echo ""
echo "=== Step 1: Set .env file permissions (chmod 600) ==="
$SSH_CMD "chmod 600 /home/ubuntu/AVRY/vps-bridge/.env && ls -la /home/ubuntu/AVRY/vps-bridge/.env"

# ── Step 2: Create snippet + patch configs ──────────────────────────────────
echo ""
echo "=== Step 2: Create snippet & patch site configs ==="
$SSH_CMD "echo '$PASS' | sudo -S python3 << 'PYEOF'
import os, re

# 2a. Create snippet directory
os.makedirs('/etc/nginx/snippets', exist_ok=True)

# 2b. Write the dotfile protection snippet
snippet = '''# Deny access to dotfiles (.env, .git, etc.) via HTTP requests only
# Local processes (Zeroclaw, Node.js) still read files directly via fs
location ~ /\\.(?!well-known).* {
    deny all;
    return 404;
}
'''
with open('/etc/nginx/snippets/dotfile-protection.conf', 'w') as f:
    f.write(snippet)
os.chmod('/etc/nginx/snippets/dotfile-protection.conf', 0o644)
print('  [OK] Snippet created: /etc/nginx/snippets/dotfile-protection.conf')

# 2c. Patch each site config — insert include line after the listen directive
sites_config = {
    '/etc/nginx/sites-available/zeroclaw':   r'(listen\s+3100;)',
    '/etc/nginx/sites-available/default':    r'(listen\s+80\s+default_server;)',
    '/etc/nginx/sites-available/n8n.conf':   r'(listen\s+80;)',
}
include_line = r'\\1\\n    include snippets/dotfile-protection.conf;'

for path, pattern in sites_config.items():
    if not os.path.exists(path):
        print(f'  [SKIP] {os.path.basename(path)} — file not found')
        continue
    with open(path, 'r') as f:
        content = f.read()
    if 'include snippets/dotfile-protection.conf' in content:
        print(f'  [SKIP] {os.path.basename(path)} — already patched')
        continue
    if not re.search(pattern, content):
        print(f'  [SKIP] {os.path.basename(path)} — pattern not matched')
        continue
    content = re.sub(pattern, include_line, content, count=1)
    with open(path, 'w') as f:
        f.write(content)
    print(f'  [OK]   {os.path.basename(path)} — patched')
PYEOF"

# ── Step 3: Test nginx config syntax ────────────────────────────────────────
echo ""
echo "=== Step 3: Test nginx config syntax ==="
$SSH_CMD "echo '$PASS' | sudo -S nginx -t"

# ── Step 4: Reload nginx ────────────────────────────────────────────────────
echo ""
echo "=== Step 4: Reload nginx ==="
$SSH_CMD "echo '$PASS' | sudo -S systemctl reload nginx"
echo "  [OK] nginx reloaded"

# ── Step 5: Verify dotfile blocking ─────────────────────────────────────────
echo ""
echo "=== Step 5: Verify dotfile blocking (curl) ==="
HTTP_CODE=$($SSH_CMD "curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3100/.env")
echo "  GET http://127.0.0.1:3100/.env -> HTTP $HTTP_CODE (expected 404)"

echo ""
echo "=========================================="
echo "  DEPLOYMENT COMPLETE"
echo "=========================================="
