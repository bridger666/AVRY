#!/bin/bash

PASSWORD='mT4-wye-9Dn-hYK'
HOST='ubuntu@43.156.108.96'
CONFIG_PATH='/home/ubuntu/aivory/zeroclaw-data/.zeroclaw/config.json'
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "=== Step 1: Backup original config ==="
sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no $HOST "cp $CONFIG_PATH ${CONFIG_PATH}.backup_$TIMESTAMP"
echo "✅ Backup created: ${CONFIG_PATH}.backup_$TIMESTAMP"

echo ""
echo "=== Step 2: Upload fixed config ==="
sshpass -p "$PASSWORD" scp -o StrictHostKeyChecking=no vps-config-fixed.json $HOST:$CONFIG_PATH
echo "✅ Fixed config uploaded"

echo ""
echo "=== Step 3: Verify new config ==="
sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no $HOST "cat $CONFIG_PATH"

echo ""
echo "=== Step 4: Restart Zeroclaw (if needed) ==="
echo "You may need to restart Zeroclaw for changes to take effect:"
echo "sshpass -p '$PASSWORD' ssh -o StrictHostKeyChecking=no $HOST 'sudo systemctl restart zeroclaw'"