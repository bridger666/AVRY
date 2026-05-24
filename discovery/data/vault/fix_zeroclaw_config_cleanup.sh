#!/bin/bash

echo "================================================================================"
echo "ZEROCLAW CONFIG CLEANUP - Remove Orphaned Lines"
echo "================================================================================"

# Step 1: Backup current config
echo ""
echo ">>> Step 1: Backup current config"
BACKUP_FILE="/home/ubuntu/.zeroclaw/config.toml.backup-$(date +%s)"
sshpass -p   ssh -o StrictHostKeyChecking=no ubuntu@  "  $BACKUP_FILE"
echo "✅ Backup created: $BACKUP_FILE"

# Step 2: Remove orphaned lines after [providers.models.openrouter]
echo ""
echo ">>> Step 2: Remove orphaned lines causing config error"
sshpass -p  ssh -o StrictHostKeyChecking=no ubuntu@  << 'ENDSSH'
# Use Python to safely remove orphaned lines
python3 << 'PYTHON'
import re

config_path = "/home/ubuntu/.zeroclaw/config.toml"

with open(config_path, 'r') as f:
    lines = f.readlines()

# Find and remove orphaned lines after [providers.models.openrouter]
# These lines appear after the openrouter section but before the next section
result = []
skip_next = False
in_openrouter_section = False
blank_lines_after_openrouter = 0

for i, line in enumerate(lines):
    stripped = line.strip()
    
    # Check if we're entering openrouter section
    if stripped == "[providers.models.openrouter]":
        in_openrouter_section = True
        result.append(line)
        continue
    
    # If we're in openrouter section and hit a blank line, count it
    if in_openrouter_section and stripped == "":
        blank_lines_after_openrouter += 1
        result.append(line)
        continue
    
    # If we're in openrouter section and hit a new section, we're done
    if in_openrouter_section and stripped.startswith("["):
        in_openrouter_section = False
        result.append(line)
        continue
    
    # If we're in openrouter section, keep the line
    if in_openrouter_section:
        result.append(line)
        continue
    
    # Skip orphaned lines that appear after openrouter section
    # These are lines like "deferred_loading = true" and "enabled = false"
    # that don't belong to any section
    if not in_openrouter_section and blank_lines_after_openrouter > 0:
        # Check if this is an orphaned line (not a section header)
        if not stripped.startswith("[") and stripped != "" and "=" in stripped:
            # Check if this is one of the known orphaned lines
            if stripped.startswith("deferred_loading") or stripped.startswith("enabled"):
                print(f"  Skipping orphaned line: {stripped}")
                continue
    
    result.append(line)

# Write back
with open(config_path, 'w') as f:
    f.writelines(result)

print("✅ Config cleaned successfully")
PYTHON
ENDSSH

# Step 3: Verify config is valid
echo ""
echo ">>> Step 3: Verify config with zeroclaw doctor"
sshpass -p '  ssh -o StrictHostKeyChecking=no   "zeroclaw doctor 2>&1 | tail -15"

# Step 4: Restart zeroclaw service
echo ""
echo ">>> Step 4: Restart zeroclaw service"
sshpass -p   ssh -o StrictHostKeyChecking=no   "sudo systemctl restart zeroclaw"
sleep 5

# Step 5: Check service status
echo ""
echo ">>> Step 5: Check service status"
sshpass -p   ssh -o StrictHostKeyChecking=no ubuntu@  "sudo systemctl status zeroclaw --no-pager | head -15"

# Step 6: Test webhook
echo ""
echo ">>> Step 6: Test webhook"
sshpass -p   ssh -o StrictHostKeyChecking=no ubuntu@  "curl -s -X POST http://127.0.0.1:3010/webhook -H 'Content-Type: application/json' -d '{\"message\":\"test after config cleanup\",\"session_id\":\"cleanup-test\"}' --max-time 60"

echo ""
echo "================================================================================"
echo "CONFIG CLEANUP COMPLETE"
echo "================================================================================"
