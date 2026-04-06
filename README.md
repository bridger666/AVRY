# AVRY

> A full-stack AI-powered console and workflow automation platform with real-time streaming, visual workflow builder, and intelligent diagnostics.

[![Node.js](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow)](./LICENSE)

## Overview

AVRY is a comprehensive platform for building, managing, and executing AI-driven workflows and diagnostics. It combines a modern web interface with a robust backend infrastructure to provide:

- **Real-time AI streaming** with organic typewriter effects
- **Visual workflow builder** with drag-and-drop canvas
- **Intelligent diagnostics** with scoring and recommendations
- **Multi-LLM support** (OpenRouter, Zeroclaw, Anthropic)
- **N8N integration** for workflow automation
- **Agent management** with workflow integration

## Tech Stack

### Frontend
- **Next.js 14** (TypeScript) - React framework with App Router
- **React 18** - UI library with hooks
- **Tailwind CSS** - Utility-first styling
- **React Flow** - Interactive workflow canvas
- **i18n** - Multi-language support (English, Indonesian)

### Backend
- **Node.js** - VPS Bridge server
- **Express-like routing** - RESTful API endpoints
- **OpenRouter** - Multi-LLM API gateway
- **Zeroclaw** - Custom LLM client with streaming
- **SSE (Server-Sent Events)** - Real-time token streaming

### Integrations & Services
- **N8N** - Workflow orchestration and automation
- **PostgreSQL** - Data persistence
- **Supabase** - Optional auth/storage layer

## Project Structure

```
AVRY/
├── nextjs-console/              # Next.js frontend (primary)
│   ├── app/
│   │   ├── api/                 # API routes (streaming, workflows, diagnostics)
│   │   ├── console/             # Chat console page
│   │   ├── workflows/           # Workflow builder and management
│   │   ├── diagnostics/         # Diagnostic flows (free & paid)
│   │   ├── agents/              # Agent management
│   │   ├── integrations/        # Integration dashboard
│   │   └── dashboard/           # Main dashboard
│   ├── components/              # React components
│   │   ├── console/             # Console UI components
│   │   ├── workflow/            # Workflow builder components
│   │   ├── diagnostics/         # Diagnostic components
│   │   └── dashboard/           # Dashboard components
│   ├── lib/                     # Utilities and helpers
│   ├── types/                   # TypeScript definitions
│   ├── __tests__/               # Test suite (unit, integration, properties)
│   └── messages/                # i18n translations
├── vps-bridge/                  # Node.js backend proxy
│   ├── endpoints.js             # API endpoint handlers
│   ├── openrouterClient.js      # OpenRouter LLM client
│   ├── zeroclawClient.js        # Zeroclaw LLM client
│   ├── n8nClient.js             # N8N workflow client
│   ├── skillRouter.js           # Skill routing logic
│   └── config.js                # Configuration
├── .kiro/specs/                 # Feature specifications (40+ specs)
├── docs/                        # Documentation
└── app/                         # Legacy Python backend (deprecated)

## Key Features

### 🎯 Console
- Real-time AI chat with streaming responses
- Organic typewriter effect for natural text display
- Session management with persistent conversation history
- File attachment support with preview
- Auto-scroll and cursor visibility management
- Multi-language interface (English, Indonesian)

### 🔄 Workflows
- Visual workflow builder with React Flow canvas
- Drag-and-drop node creation and connection
- N8N integration for workflow execution
- AI-powered workflow generation and refinement (AIRA)
- Workflow templates and quick-action presets
- Node inspector with specialized forms (HTTP, If/Else, etc.)
- Workflow versioning and execution history

### 📊 Diagnostics
- **Free Diagnostic** - Quick assessment with scoring
- **Deep Diagnostic** - Comprehensive multi-phase analysis
- Blueprint generation from diagnostic results
- Scoring cards with recommendations
- Phase-based navigation and progress tracking

### 🤖 Agents
- Agent creation and configuration
- Agent node integration in workflows
- Agent execution and monitoring
- Agent parameter management

### 🔌 Integrations
- N8N workflow sync and management
- Multiple LLM providers (OpenRouter, Zeroclaw, Anthropic)
- Extensible integration framework
- Connection management dashboard

## Quick Start

### Prerequisites
- **Node.js** 18+ ([download](https://nodejs.org/))
- **npm** or **yarn**
- **PostgreSQL** 12+ (optional, for legacy backend)

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/bridger666/AVRY.git
cd AVRY
```

2. **Install frontend dependencies:**
```bash
cd nextjs-console
npm install
```

3. **Install backend dependencies:**
```bash
cd ../vps-bridge
npm install
```

4. **Configure environment variables:**

Create `nextjs-console/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
VPS_BRIDGE_URL=http://localhost:3001
VPS_BRIDGE_API_KEY=dev_key_12345
```

Create `vps-bridge/.env`:
```env
PORT=3001
NODE_ENV=development
OPENROUTER_API_KEY=your_openrouter_key
ZEROCLAW_API_KEY=your_zeroclaw_key
N8N_BASE_URL=http://localhost:5678
```

### Running Locally

**Terminal 1 - Start VPS Bridge (backend):**
```bash
cd vps-bridge
npm start
# Server runs on http://localhost:3001
```

**Terminal 2 - Start Next.js frontend:**
```bash
cd nextjs-console
npm run dev
# App runs on http://localhost:3000
```

Open http://localhost:3000 in your browser and start building workflows!

## Architecture

### System Overview
```
┌─────────────────────────────────────────────────────────────┐
│                     Browser / Client                         │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP/SSE
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Next.js Frontend (Port 3000)                    │
│  ├─ Console (Chat UI)                                       │
│  ├─ Workflow Builder (React Flow)                           │
│  ├─ Diagnostics Engine                                      │
│  └─ Agent Manager                                           │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP/REST
                         ▼
┌─────────────────────────────────────────────────────────────┐
│           VPS Bridge Backend (Port 3001)                    │
│  ├─ Streaming Proxy (SSE)                                   │
│  ├─ LLM Clients (OpenRouter, Zeroclaw)                      │
│  ├─ N8N Orchestrator                                        │
│  └─ Skill Router                                            │
└────────────────────────┬────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
    ┌────────┐      ┌────────┐      ┌────────┐
    │OpenRouter│    │Zeroclaw│    │N8N     │
    │(LLM)    │    │(LLM)   │    │(Workflows)
    └────────┘      └────────┘      └────────┘
```

### Streaming Architecture
- **SSE (Server-Sent Events)** for real-time token streaming
- **Organic typewriter delays** based on punctuation and character type
- **No buffering** - tokens forwarded immediately from LLM
- **Fallback UUID generation** for HTTP environments without WebSocket

### Request Flow Example (Chat)
```
1. User sends message → Next.js API route
2. API route → VPS Bridge /stream endpoint
3. VPS Bridge → OpenRouter/Zeroclaw LLM
4. LLM streams tokens → VPS Bridge
5. VPS Bridge applies delays → SSE stream to browser
6. Browser receives chunks → Renders with typewriter effect
```

## API Routes

### Console Streaming
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/console/stream` | Stream AI responses with SSE |
| POST | `/api/console/workflows/from-blueprint` | Create workflow from blueprint |

### Workflows
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/workflows` | List all workflows |
| POST | `/api/workflows` | Create new workflow |
| GET | `/api/workflows/[id]` | Get workflow details |
| PUT | `/api/workflows/[id]` | Update workflow |
| POST | `/api/workflows/[id]/activate` | Activate workflow |
| POST | `/api/workflows/[id]/deactivate` | Deactivate workflow |
| POST | `/api/workflows/[id]/canvas` | Save canvas state |
| POST | `/api/workflows/aira-extend` | AI-powered workflow extension |
| POST | `/api/workflows/aira-edit` | AI-powered workflow editing |

### Diagnostics
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/diagnostics/run` | Run deep diagnostic |
| POST | `/api/diagnostics/free/run` | Run free diagnostic |

### Agents
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/agents` | List all agents |
| POST | `/api/agents` | Create new agent |
| GET | `/api/agents/[id]` | Get agent details |
| PUT | `/api/agents/[id]` | Update agent |
| DELETE | `/api/agents/[id]` | Delete agent |

### Integrations
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/integrations/connections` | List connections |
| POST | `/api/integrations/connections` | Create connection |

## Development

### Running Tests

**Unit & Integration Tests:**
```bash
cd nextjs-console
npm run test
```

**Property-Based Tests:**
```bash
npm run test:properties
```

**E2E Tests:**
```bash
npm run test:e2e
```

**Watch Mode:**
```bash
npm run test:watch
```

### Building for Production

**Frontend:**
```bash
cd nextjs-console
npm run build
npm start
```

**Backend:**
```bash
cd vps-bridge
npm run build
npm start
```

### Code Quality

**Linting:**
```bash
npm run lint
```

**Type Checking:**
```bash
npm run type-check
```

### Project Scripts

**Frontend (nextjs-console):**
```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "next lint",
  "test": "vitest",
  "test:watch": "vitest --watch",
  "type-check": "tsc --noEmit"
}
```

**Backend (vps-bridge):**
```json
{
  "start": "node server.js",
  "dev": "nodemon server.js",
  "test": "jest"
}
```

## Deployment

### Frontend Deployment

**Vercel (Recommended):**
```bash
npm install -g vercel
vercel
```

**AWS ECS Express Mode:**
See [ECS Deployment Guide](./docs/ECS_DEPLOYMENT.md)

**Self-Hosted:**
```bash
cd nextjs-console
npm run build
npm start
```

### Backend Deployment

**VPS/Cloud Server:**
```bash
cd vps-bridge
npm install --production
npm start
```

**Docker:**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

**Environment Variables (Production):**
```env
NODE_ENV=production
PORT=3001
OPENROUTER_API_KEY=your_production_key
ZEROCLAW_API_KEY=your_production_key
N8N_BASE_URL=https://n8n.yourdomain.com
VPS_BRIDGE_API_KEY=your_secure_key
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

## Documentation

### Core Documentation
- [Architecture Overview](./ARCHITECTURE.md) - System design and components
- [Streaming Implementation](./VPS_BRIDGE_STREAMING_INDEX.md) - Real-time streaming details
- [Deployment Guide](./DEPLOYMENT.md) - Production deployment instructions
- [Environment Reference](./ENVIRONMENT_REFERENCE.md) - All environment variables

### Feature Guides
- [Workflow Builder Guide](./nextjs-console/WORKFLOW_GENERATION_QUICK_START.md) - Building workflows
- [N8N Integration](./nextjs-console/N8N_INTEGRATION_SPEC.md) - N8N workflow setup
- [Diagnostics System](./nextjs-console/DASHBOARD.md) - Diagnostic flows
- [Agent Management](./nextjs-console/docs/AGENT_NODE_DESIGN.md) - Agent configuration

### API Documentation
- [API Routes](./nextjs-console/docs/API_ROUTES.md) - Complete API reference
- [Streaming Protocol](./VPS_BRIDGE_STREAMING_QUICK_START.md) - SSE streaming details

### Development
- [Testing Guide](./nextjs-console/__tests__/README.md) - Test structure and patterns
- [Error Handling](./nextjs-console/docs/ERROR_HANDLING.md) - Error handling patterns
- [Offline Mode](./nextjs-console/docs/OFFLINE_MODE.md) - Offline functionality

## Contributing

We welcome contributions! Here's how to get started:

1. **Fork the repository** on GitHub
2. **Create a feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes** and commit:
   ```bash
   git commit -am 'Add your feature description'
   ```
4. **Push to your fork:**
   ```bash
   git push origin feature/your-feature-name
   ```
5. **Open a Pull Request** with a clear description

### Development Workflow

1. Create a spec for your feature in `.kiro/specs/`
2. Implement the feature following the spec
3. Add tests (unit, integration, or property-based)
4. Update documentation
5. Submit PR for review

### Code Standards

- **TypeScript** - Use strict mode
- **Testing** - Aim for >80% coverage
- **Linting** - Follow ESLint rules
- **Commits** - Use conventional commits (feat:, fix:, docs:, etc.)

## Troubleshooting

### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Kill process on port 3001
lsof -ti:3001 | xargs kill -9
```

### Environment Variables Not Loading
- Ensure `.env.local` is in the correct directory
- Restart the dev server after changing env vars
- Check for typos in variable names

### Streaming Not Working
- Verify VPS Bridge is running on port 3001
- Check `VPS_BRIDGE_URL` in frontend `.env.local`
- Ensure LLM API keys are valid
- Check browser console for errors

### N8N Connection Issues
- Verify N8N is running and accessible
- Check `N8N_BASE_URL` in backend `.env`
- Ensure N8N API key is correct
- Check network connectivity

## License

MIT License - see [LICENSE](./LICENSE) file for details

## Support & Community

- **Issues** - [GitHub Issues](https://github.com/bridger666/AVRY/issues)
- **Discussions** - [GitHub Discussions](https://github.com/bridger666/AVRY/discussions)
- **Email** - support@avry.dev

## Roadmap

### Q2 2026
- [ ] Enhanced workflow templates library
- [ ] Advanced analytics dashboard
- [ ] Workflow versioning and rollback
- [ ] Team collaboration features

### Q3 2026
- [ ] Custom LLM provider support
- [ ] Workflow scheduling and automation
- [ ] Advanced error recovery
- [ ] Performance monitoring dashboard

### Q4 2026
- [ ] Multi-tenant support
- [ ] Advanced audit logging
- [ ] Workflow marketplace
- [ ] Mobile app (React Native)

## Acknowledgments

Built with ❤️ by the AVRY team

Special thanks to:
- [Next.js](https://nextjs.org/) - React framework
- [React Flow](https://reactflow.dev/) - Workflow visualization
- [N8N](https://n8n.io/) - Workflow automation
- [OpenRouter](https://openrouter.ai/) - LLM API gateway
- [Tailwind CSS](https://tailwindcss.com/) - Styling

---

**Last Updated:** April 2026 | **Version:** 1.0.0
