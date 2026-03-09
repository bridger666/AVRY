# Workflow Preview Integration - COMPLETE ✅

## Integration Status

The workflow preview component has been successfully integrated into the Workflows dashboard window (`workflows.html`).

## What Was Implemented

### 1. Script Integration
- Added `workflow-preview.js` to `workflows.html`
- Workflow preview is now available on the Workflows page

### 2. Interactive "View Workflow" Button
- Updated the "View" button to "View Workflow" with visual icon
- Clicking "View Workflow" opens the interactive workflow preview modal
- Mock workflow data demonstrates the Invoice Processing System with 5 nodes

### 3. Workflow Visualization Demo Section
- Added prominent demo section explaining the visualization features
- Lists key features: visual node graph, zoom & pan, connection arrows, node styling
- Shows available node types with color-coded badges
- Gradient background with mint green accent for visual appeal

### 4. Mock Data
- Created realistic mock workflow for "Invoice Processing System"
- 5 nodes: Webhook → AI Agent → AI Agent → CRM Push → Email
- 4 edges with descriptive labels
- Demonstrates real-world invoice automation workflow

## How It Works

When a user clicks "View Workflow" on the active workflow:
1. JavaScript calls `viewWorkflow('wf-123')`
2. Function looks up workflow in `mockWorkflows` object
3. Calls `window.showWorkflowPreview(workflow)` from `workflow-preview.js`
4. Modal opens with interactive graph visualization
5. User can zoom, pan, and explore the workflow visually

## Features Available

✅ Visual node graph with auto-layout
✅ Zoom in/out controls
✅ Pan/drag canvas
✅ Reset view button
✅ Node type styling (webhook, ai_agent, crm_push, email, database)
✅ Connection arrows with labels
✅ Hover effects on nodes
✅ Responsive modal overlay
✅ Close on backdrop click or close button

## Node Types Supported

The workflow preview supports these node types with custom styling:
- `webhook` - Purple gradient, 🔗 icon
- `ai_agent` - Mint green gradient, 🤖 icon
- `crm_push` - Pink gradient, 📊 icon
- `email` - Blue gradient, 📧 icon
- `database` - Green gradient, 💾 icon
- Custom types - Default purple gradient, ⚙️ icon

## Next Steps (Future Enhancements)

### Backend Integration
- Replace mock data with real workflow data from API
- Fetch workflows from `/api/workflows` endpoint
- Support dynamic workflow loading

### Additional Features
- Edit mode for workflow nodes
- Add/remove nodes and connections
- Save workflow changes
- Export workflow as JSON
- Workflow execution history overlay
- Real-time execution status indicators

### UI Enhancements
- Minimap for large workflows
- Search/filter nodes
- Collapse/expand node groups
- Workflow templates gallery
- Drag-and-drop node creation

## Testing

To test the integration:
1. Open `http://localhost:8080/workflows.html`
2. Click "View Workflow" button on "Invoice Processing System"
3. Interactive modal should open with 5-node workflow
4. Test zoom in/out buttons
5. Test pan by dragging canvas
6. Test reset view button
7. Hover over nodes to see scale effect
8. Click backdrop or close button to dismiss

## Files Modified

- `frontend/workflows.html` - Added script, updated buttons, added demo section
- `frontend/WORKFLOW_PREVIEW_INTEGRATION.md` - Updated documentation

## Files Used (No Changes)

- `frontend/workflow-preview.js` - Vanilla JS workflow visualizer
- `frontend/design-system.css` - Design tokens
- `frontend/dashboard-layout.css` - Layout system

---

## Original Integration Guide (Archive)

Since Aivory currently uses **vanilla JavaScript** (not React), you have two options:

## Option 1: Add React to Existing Project (Recommended)

### Step 1: Install Dependencies

```bash
npm init -y  # If you don't have package.json
npm install react react-dom reactflow dagre
npm install -D @vitejs/plugin-react vite
```

### Step 2: Create Vite Config

Create `vite.config.js`:

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  root: 'frontend',
  build: {
    outDir: '../dist',
  },
});
```

### Step 3: Update console.html

Add React root div and import:

```html
<!-- Add this div where you want the workflow preview -->
<div id="workflow-preview-root"></div>

<!-- Add React scripts before closing </body> -->
<script type="module" src="/workflow-preview-mount.jsx"></script>
```

### Step 4: Create Mount Script

Create `frontend/workflow-preview-mount.jsx`:

```javascript
import React from 'react';
import { createRoot } from 'react-dom/client';
import WorkflowPreview from './components/WorkflowPreview';

// Global function to show workflow preview
window.showWorkflowPreview = (blueprint) => {
  const container = document.getElementById('workflow-preview-root');
  const root = createRoot(container);
  
  root.render(
    <WorkflowPreview
      blueprint={blueprint}
      isOpen={true}
      onClose={() => root.unmount()}
    />
  );
};
```

### Step 5: Update console.js

In your existing `console.js`, call the preview when AI returns workflow:

```javascript
// In your sendMessage() function, after receiving AI response:
const data = await response.json();

// Check if response has workflow blueprint
if (data.blueprint && data.blueprint.nodes && data.blueprint.nodes.length > 0) {
  // Show workflow preview button
  const workflowButton = document.createElement('button');
  workflowButton.textContent = '🔄 View Workflow Preview';
  workflowButton.className = 'workflow-preview-btn';
  workflowButton.onclick = () => {
    window.showWorkflowPreview(data.blueprint);
  };
  
  // Append to message
  messageDiv.querySelector('.message-text').appendChild(workflowButton);
}
```

### Step 6: Add Button Styles to console.css

```css
.workflow-preview-btn {
  margin-top: 1rem;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #07d197 0%, #06b380 100%);
  border: none;
  border-radius: 8px;
  color: #1a0b2e;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: transform 0.2s;
}

.workflow-preview-btn:hover {
  transform: translateY(-2px);
}
```

### Step 7: Run Development Server

```bash
npm run dev  # or npx vite
```

---

## Option 2: Pure Vanilla JS Version (No React)

If you want to avoid React entirely, here's a simplified vanilla JS version:

### Create `frontend/workflow-preview-vanilla.js`:

```javascript
/**
 * Vanilla JS Workflow Preview
 * Simplified version without React Flow
 */

class WorkflowPreviewVanilla {
  constructor(blueprint) {
    this.blueprint = blueprint;
    this.modal = null;
  }

  show() {
    this.modal = this.createModal();
    document.body.appendChild(this.modal);
    this.render();
  }

  close() {
    if (this.modal) {
      this.modal.remove();
      this.modal = null;
    }
  }

  createModal() {
    const modal = document.createElement('div');
    modal.className = 'workflow-preview-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.85);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 2rem;
    `;

    modal.onclick = () => this.close();

    const container = document.createElement('div');
    container.className = 'workflow-preview-container';
    container.style.cssText = `
      background: #1a0b2e;
      border-radius: 16px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      width: 100%;
      max-width: 1000px;
      max-height: 80vh;
      overflow: auto;
      padding: 2rem;
    `;

    container.onclick = (e) => e.stopPropagation();

    modal.appendChild(container);
    return modal;
  }

  render() {
    const container = this.modal.querySelector('.workflow-preview-container');
    
    // Header
    const header = document.createElement('div');
    header.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
        <h2 style="color: #ffffff; margin: 0;">Workflow Preview</h2>
        <button class="close-btn" style="
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          color: #ffffff;
          padding: 0.5rem 1rem;
          cursor: pointer;
        ">Close</button>
      </div>
    `;
    header.querySelector('.close-btn').onclick = () => this.close();
    container.appendChild(header);

    // Nodes list
    const nodesList = document.createElement('div');
    nodesList.style.cssText = 'display: flex; flex-direction: column; gap: 1rem;';

    this.blueprint.nodes.forEach((node, idx) => {
      const nodeEl = document.createElement('div');
      nodeEl.style.cssText = `
        padding: 1rem;
        background: rgba(7, 209, 151, 0.1);
        border: 1px solid rgba(7, 209, 151, 0.3);
        border-radius: 8px;
        color: #ffffff;
      `;
      nodeEl.innerHTML = `
        <div style="font-weight: 600; margin-bottom: 0.5rem;">
          ${idx + 1}. ${node.label || node.name}
        </div>
        <div style="font-size: 0.875rem; color: rgba(255, 255, 255, 0.7);">
          Type: ${node.type || 'default'}
        </div>
        ${node.description ? `<div style="font-size: 0.875rem; margin-top: 0.5rem;">${node.description}</div>` : ''}
      `;
      nodesList.appendChild(nodeEl);

      // Show connection arrow
      if (idx < this.blueprint.nodes.length - 1) {
        const arrow = document.createElement('div');
        arrow.style.cssText = 'text-align: center; color: #07d197; font-size: 1.5rem;';
        arrow.textContent = '↓';
        nodesList.appendChild(arrow);
      }
    });

    container.appendChild(nodesList);
  }
}

// Global function
window.showWorkflowPreview = (blueprint) => {
  const preview = new WorkflowPreviewVanilla(blueprint);
  preview.show();
};
```

### Usage in console.js:

```javascript
// Include the script in console.html
<script src="workflow-preview-vanilla.js"></script>

// Then in your message handler:
if (data.blueprint && data.blueprint.nodes) {
  const btn = document.createElement('button');
  btn.textContent = '🔄 View Workflow';
  btn.className = 'workflow-preview-btn';
  btn.onclick = () => window.showWorkflowPreview(data.blueprint);
  messageDiv.appendChild(btn);
}
```

---

## Comparison

| Feature | React Version | Vanilla JS Version |
|---------|--------------|-------------------|
| Visual Quality | ⭐⭐⭐⭐⭐ (Interactive graph) | ⭐⭐⭐ (Simple list) |
| Setup Complexity | Medium (requires build) | Easy (just include script) |
| Performance | Excellent | Good |
| Zoom/Pan | ✅ Yes | ❌ No |
| Auto-layout | ✅ Yes (Dagre) | ❌ No |
| Future Editing | ✅ Easy to add | ❌ Hard to add |

**Recommendation**: Use Option 1 (React) for production quality. The setup is worth it for the superior UX.

---

## Testing

### Test with Mock Data:

```javascript
// In browser console:
window.showWorkflowPreview({
  nodes: [
    { id: '1', label: 'Webhook', type: 'webhook' },
    { id: '2', label: 'AI Agent', type: 'ai_agent' },
    { id: '3', label: 'CRM Push', type: 'crm_push' },
  ],
  edges: [
    { id: 'e1', source: '1', target: '2' },
    { id: 'e2', source: '2', target: '3' },
  ],
});
```

---

## Troubleshooting

### Issue: "React is not defined"
- Make sure you're using `type="module"` in script tags
- Check that React is properly installed

### Issue: Workflow doesn't show
- Check browser console for errors
- Verify blueprint has `nodes` array
- Check that `#workflow-preview-root` div exists

### Issue: Styling looks wrong
- Make sure React Flow CSS is imported
- Check z-index conflicts with existing modals

---

## Next Steps

1. ✅ Install dependencies
2. ✅ Add React mount point
3. ✅ Update console.js to detect workflows
4. ✅ Test with mock data
5. ✅ Update backend to return proper blueprint format
6. 🔄 Add workflow editing (future)
7. 🔄 Add workflow deployment (future)
