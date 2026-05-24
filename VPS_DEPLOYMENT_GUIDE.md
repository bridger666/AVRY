# VPS Deployment Guide

## Overview
This guide covers the complete deployment of Aivory infrastructure to the VPS.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           AIVORY INFRASTRUCTURE                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐                │
│  │   Homepage   │────▶│  VPS Bridge  │────▶│   Zeroclaw   │                │
│  │  (Port 80)   │     │  (Port 3003) │     │  (Port 3010) │                │
│  └──────────────┘     └──────────────┘     └──────────────┘                │
│                              │                                              │
│                              ▼                                              │
│                      ┌──────────────┐                                       │
│                      │   Next.js    │                                       │
│                      │ Console      │                                       │
│                      │ (Port 3000)  │                                       │
│                      └──────────────┘                                       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Port Configuration

| Service | Port | Purpose | Status |
|---------|------|---------|--------|
| Homepage | 80 | Public landing page | ✅ Production |
| VPS Bridge | 3003 | Thin proxy to Zeroclaw | ✅ Production |
| Zeroclaw | 3010 | AI engine backend | ✅ Production |
| Next.js Console | 3000 | Dashboard UI | ✅ Production |
| FastAPI Backend | 8081 | Auth & database | ✅ Production |

## Domain Configuration

| Environment | Domain | Purpose |
|-------------|--------|---------|
| Production | `aivory.id` | Homepage |
| Production | `api.aivory.id` | VPS Bridge API |
| Production | `app.aivory.id` | Next.js Dashboard |
| Production | `n8n.aivory.id` | n8n Workflow Editor |

## VPS Setup

### 1. SSH into VPS
```bash
ssh root@43.156.108.96
```

### 2. Update System
```bash
apt update && apt upgrade -y
```

### 3. Install Required Packages
```bash
apt install -y nodejs npm git ufw
npm install -g pm2
```

### 4. Configure Firewall
```bash
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 3003/tcp
ufw allow 3010/tcp
ufw allow 3000/tcp
ufw allow 8081/tcp
ufw allow 5678/tcp
ufw enable
```

### 5. Clone Repository
```bash
cd /opt
git clone https://github.com/bridger666/AVRY.git aivory
cd aivory
```

## VPS Bridge Deployment

### 1. Navigate to VPS Bridge Directory
```bash
cd vps-bridge
```

### 2. Create Environment File
```bash
cp .env.example .env
nano .env
```

### 3. Configure .env
```env
# Server Configuration
PORT=3003
API_KEY=your_vps_bridge_api_key_here

# CORS Configuration
CORS_ORIGIN=https://app.aivory.id

# OpenRouter Configuration
OPENROUTER_API_KEY=your_openrouter_api_key_here

# n8n Configuration
N8N_BASE_URL=https://n8n.aivory.id
N8N_API_KEY=your_n8n_api_key_here

# Supabase Configuration
SUPABASE_URL=https://menwamioodephdglqxdi.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Zeroclaw Configuration
ZEROCLAW_URL=http://localhost:3010
ZEROCLAW_TOKEN=your_zeroclaw_token_here

# Logging Configuration
LOG_LEVEL=info
```

### 4. Install Dependencies
```bash
npm install --production
```

### 5. Deploy with PM2
```bash
pm2 start server.js --name vps-bridge
pm2 save
pm2 startup systemd -u root --hp /root
```

### 6. Verify VPS Bridge
```bash
pm2 status
curl http://localhost:3003/health
```

## Next.js Console Deployment

### 1. Navigate to Next.js Console Directory
```bash
cd /opt/aivory/nextjs-console
```

### 2. Create Environment File
```bash
cp .env.example .env.local
nano .env.local
```

### 3. Configure .env.local
```env
# Backend API base URL
NEXT_PUBLIC_API_URL=https://backend.aivory.id

# VPS Bridge (internal gateway)
VPS_BRIDGE_URL=https://api.aivory.id

# n8n editor base URL
NEXT_PUBLIC_N8N_EDITOR_BASE_URL=https://n8n.aivory.id

# Composio OAuth
COMPOSIO_API_KEY=your-composio-api-key
COMPOSIO_REDIRECT_URL=https://app.aivory.id/integrations/callback

# App URLs
NEXT_PUBLIC_APP_URL=https://app.aivory.id
NEXT_PUBLIC_CONSOLE_URL=https://app.aivory.id

# ZeroClaw URL
ZEROCLAW_URL=http://localhost:3010

# n8n URL
N8N_URL=https://n8n.aivory.id

# n8n API Key
N8N_API_KEY=your-n8n-api-key

# ARIA Webhook URL
ARIA_WEBHOOK_URL=https://api.aivory.id/webhook/755fcac8-dc36-49e3-9553-67e62bac82e8
```

### 4. Install Dependencies and Build
```bash
npm install
npm run build
```

### 5. Deploy with PM2
```bash
pm2 start npm --name "nextjs-console" -- start
pm2 save
```

### 6. Verify Next.js Console
```bash
pm2 status
curl http://localhost:3000
```

## Cloudflare DNS Configuration

### Add DNS Records

| Type | Name | Content | TTL |
|------|------|---------|-----|
| A | `@` | 43.156.108.96 | Auto |
| A | `api` | 43.156.108.96 | Auto |
| A | `app` | 43.156.108.96 | Auto |
| A | `n8n` | 43.156.108.96 | Auto |
| CNAME | `www` | `@` | Auto |

### SSL/TLS Configuration
- SSL/TLS: Full (strict)
- Origin Certificates: Install on VPS
- Auto SSL: Enabled

## Traefik Configuration (Optional)

If using Traefik as reverse proxy:

### 1. Create dynamic.yml
```yaml
http:
  routers:
    aivory-bridge:
      rule: "Host(`api.aivory.id`)"
      entryPoints:
        - websecure
      service: aivory-bridge
      tls:
        certResolver: letsencrypt

  services:
    aivory-bridge:
      loadBalancer:
        servers:
          - url: "http://localhost:3003"
        responseForwarding:
          flushInterval: "1ms"
```

### 2. Update docker-compose.yml
```yaml
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.aivory-bridge.rule=Host(`api.aivory.id`)"
  - "traefik.http.routers.aivory-bridge.entrypoints=websecure"
  - "traefik.http.routers.aivory-bridge.tls.certresolver=letsencrypt"
  - "traefik.http.services.aivory-bridge.loadbalancer.server.port=3003"
```

## Monitoring

### Check Service Status
```bash
pm2 status
pm2 logs vps-bridge
pm2 logs nextjs-console
```

### Restart Services
```bash
pm2 restart vps-bridge
pm2 restart nextjs-console
```

### View Logs
```bash
pm2 logs
journalctl -u vps-bridge.service
```

## Troubleshooting

### VPS Bridge Not Starting
1. Check environment variables: `cat .env`
2. Verify port 3003 is not in use: `netstat -tulpn | grep 3003`
3. Check logs: `pm2 logs vps-bridge`

### Next.js Console Not Starting
1. Check environment variables: `cat .env.local`
2. Verify port 3000 is not in use: `netstat -tulpn | grep 3000`
3. Check build: `npm run build`
4. Check logs: `pm2 logs nextjs-console`

### Connection Issues
1. Verify firewall rules: `ufw status`
2. Check Cloudflare DNS: `dig api.aivory.id`
3. Test VPS Bridge: `curl http://localhost:3003/health`

## Security Checklist

- [ ] All environment variables configured
- [ ] Firewall rules in place
- [ ] SSL certificates configured
- [ ] PM2 auto-start enabled
- [ ] Regular backups configured
- [ ] Monitoring alerts set up
- [ ] API keys rotated
- [ ] Access keys secured
