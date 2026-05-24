#!/bin/bash

PASSWORD='mT4-wye-9Dn-hYK'
HOST='ubuntu@43.156.108.96'
CONFIG_PATH='/home/ubuntu/aivory/zeroclaw-data/.zeroclaw/config.json'

# Read current config
echo "Reading current config from VPS..."
sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no $HOST "cat $CONFIG_PATH"