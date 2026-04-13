#!/bin/bash
echo "🔄 Restoring Saturday's work from commit f874bf7..."

# Core UI Components
echo "📦 Restoring ChatMessageCompact and FileDropzone..."
git checkout f874bf7 -- nextjs-console/components/ChatMessageCompact.tsx
git checkout f874bf7 -- nextjs-console/components/console/FileDropzone.tsx
git checkout f874bf7 -- nextjs-console/components/console/FileDropzone.module.css

# API Routes
echo "📡 Restoring API routes..."
git checkout f874bf7 -- nextjs-console/app/api/console/upload/route.ts
git checkout f874bf7 -- nextjs-console/app/api/console/stream/route.ts
git checkout f874bf7 -- nextjs-console/pages/api/bridge/context/ui-state.ts
git checkout f874bf7 -- app/api/aivory/pipeline/route.ts

# Page Updates
echo "📄 Restoring page updates..."
git checkout f874bf7 -- nextjs-console/app/blueprint/page.tsx
git checkout f874bf7 -- nextjs-console/app/console/page.tsx
git checkout f874bf7 -- nextjs-console/app/workflows/[id]/page.tsx
git checkout f874bf7 -- nextjs-console/app/settings/page.tsx
git checkout f874bf7 -- nextjs-console/app/layout.tsx

# Component Updates
echo "🎨 Restoring component updates..."
git checkout f874bf7 -- nextjs-console/components/AiraFloatingAssistant.tsx
git checkout f874bf7 -- nextjs-console/components/ChatInput.tsx
git checkout f874bf7 -- nextjs-console/components/blueprint/BlueprintHeader.tsx
git checkout f874bf7 -- nextjs-console/components/blueprint/BlueprintHeader.module.css
git checkout f874bf7 -- nextjs-console/components/shared/Sidebar.tsx
git checkout f874bf7 -- nextjs-console/components/workflow/CopilotTogglePanel.tsx
git checkout f874bf7 -- nextjs-console/components/workflow/StandardNode.tsx

# Lib/Hooks Updates
echo "🔧 Restoring lib and hooks..."
git checkout f874bf7 -- nextjs-console/hooks/useIntentRouter.ts
git checkout f874bf7 -- nextjs-console/lib/integrations/store.ts
git checkout f874bf7 -- nextjs-console/lib/nodeIcons.tsx
git checkout f874bf7 -- nextjs-console/lib/normalizeAssistantText.ts
git checkout f874bf7 -- nextjs-console/lib/session.ts
git checkout f874bf7 -- nextjs-console/lib/streaming.ts

# Integration Icons
echo "🎯 Restoring integration icons..."
git checkout f874bf7 -- nextjs-console/public/Aivory_icon_2026.svg
git checkout f874bf7 -- nextjs-console/public/Aivory_logo_2026.svg
git checkout f874bf7 -- nextjs-console/public/integrations/

# Test Files
echo "🧪 Restoring test files..."
git checkout f874bf7 -- nextjs-console/__tests__/console-streaming-bug-condition-fixed.test.ts 2>/dev/null || true
git checkout f874bf7 -- nextjs-console/__tests__/console-streaming-bug-condition.test.ts 2>/dev/null || true
git checkout f874bf7 -- nextjs-console/__tests__/console-streaming-preservation.properties.test.ts 2>/dev/null || true
git checkout f874bf7 -- nextjs-console/__tests__/markdown-element-styling.properties.test.tsx

# Source files
echo "📝 Restoring src files..."
git checkout f874bf7 -- nextjs-console/src/lib/postUiState.ts 2>/dev/null || true
git checkout f874bf7 -- nextjs-console/src/app/aivory-test/page.tsx 2>/dev/null || true

# Styles
echo "💅 Restoring styles..."
git checkout f874bf7 -- nextjs-console/styles/globals.css

# VPS Bridge Updates
echo "🌉 Restoring VPS bridge updates..."
git checkout f874bf7 -- vps-bridge/endpoints.js
git checkout f874bf7 -- vps-bridge/zeroclawStreamingClient.js 2>/dev/null || true
git checkout f874bf7 -- vps-bridge/server.js
git checkout f874bf7 -- vps-bridge/test-zeroclaw-405-fix.js 2>/dev/null || true
git checkout f874bf7 -- vps-bridge/zeroclawClient.js

# Package updates
echo "📦 Restoring package files..."
git checkout f874bf7 -- nextjs-console/package.json
git checkout f874bf7 -- nextjs-console/package-lock.json

# Documentation
echo "📚 Restoring documentation..."
git checkout f874bf7 -- VPS_BRIDGE_URL_CHANGES_VISUAL.txt 2>/dev/null || true
git checkout f874bf7 -- VPS_DIAGNOSTIC_SCRIPT.sh 2>/dev/null || true
git checkout f874bf7 -- AGENTS_BACKEND_IMPLEMENTATION_SUMMARY.md 2>/dev/null || true
git checkout f874bf7 -- AGENTS_CURL_TEST_COMMANDS.md 2>/dev/null || true
git checkout f874bf7 -- AGENTS_IMPLEMENTATION_CHANGES.md 2>/dev/null || true
git checkout f874bf7 -- VPS_BRIDGE_AGENTS_IMPLEMENTATION_COMPLETE.md 2>/dev/null || true

echo "✅ Restoration complete!"
echo ""
echo "📊 Summary of restored files:"
git status --short | head -20
echo ""
echo "💡 Next steps:"
echo "1. Review the changes: git diff --stat"
echo "2. Commit the restored files: git add . && git commit -m 'fix: restore Saturday work - new tabs, floating assistant, file upload'"
echo "3. Test the application"
