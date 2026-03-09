# Workflow Preview - Deployment Complete ✅

The workflow visualization feature has been successfully integrated into your Aivory AI Console!

## 📦 What Was Deployed

### 1. Core Files Created
- ✅ `frontend/workflow-preview.js` - Vanilla JS workflow visualization engine
- ✅ `frontend/workflow-preview-test.html` - Standalone test page
- ✅ Updated `frontend/console.js` - Integrated workflow detection and button
- ✅ Updated `frontend/console.html` - Added workflow preview script

### 2. Features Implemented
- ✅ Interactive workflow graph visualization
- ✅ Pan and zoom controls
- ✅ Auto-layout algorithm (topological sort)
- ✅ Custom node styling with gradients and icons
- ✅ Animated connection arrows
- ✅ Modal overlay with dark theme
- ✅ Error handling for invalid workflows
- ✅ Responsive design
- ✅ Matches your purple/black/green theme

## 🚀 How to Use

### In the AI Console

1. **Start your servers:**
   ```bash
   # Terminal 1: Backend
   cd ~/Documents/Aivory
   python3 app/main.py
   
   # Terminal 2: Frontend
   python3 simple_server.py
   ```

2. **Open the console:**
   - Navigate to `http://localhost:8080/console.html`
   - Login with Super Admin credentials

3. **Test workflow preview:**
   - Send a message to the AI
   - If the AI response includes a `blueprint` with nodes/edges, you'll see a "🔄 View Workflow Preview" button
   - Click the button to open the interactive workflow visualization

### Standalone Test Page

Visit `http://localhost:8080/workflow-preview-test.html` to test different workflow scenarios without needing AI responses.

## 🧪 Testing

### Test with Mock Data

Open browser console on any page and run:

```javascript
// Simple workflow
window.showWorkflowPreview({
  nodes: [
    { id: '1', label: 'Webhook', type: 'webhook', description: 'Receives data' },
    { id: '2', label: 'AI Agent', type: 'ai_agent', description: 'Processes with GPT-4' },
    { id: '3', label: 'CRM Push', type: 'crm_push', description: 'Updates Salesforce' }
  ],
  edges: [
    { id: 'e1', source: '1', target: '2', label: 'Raw Data' },
    { id: 'e2', source: '2', target: '3', label: 'Enriched Data' }
  ]
});
```

### Backend Integration

Your backend needs to return workflow data in this format:

```python
# In app/services/console_service.py or wherever you generate responses

response_data = {
    "response": "I've created a workflow for you...",
    "blueprint": {
        "nodes": [
            {
                "id": "node-1",
                "label": "Webhook Trigger",
                "type": "webhook",
                "description": "Receives incoming data"
            },
            {
                "id": "node-2",
                "label": "AI Processing",
                "type": "ai_agent",
                "description": "Analyzes with GPT-4"
            }
        ],
        "edges": [
            {
                "id": "edge-1",
                "source": "node-1",
                "target": "node-2",
                "label": "Raw Data"
            }
        ]
    },
    "reasoning": {...},
    "credits_remaining": 1995
}
```

## 🎨 Supported Node Types

The workflow preview automatically styles these node types:

| Type | Icon | Color | Use Case |
|------|------|-------|----------|
| `webhook` | 🔗 | Purple | Triggers, HTTP endpoints |
| `ai_agent` | 🤖 | Green | AI/ML processing |
| `crm_push` | 📊 | Pink | CRM integrations |
| `email` | 📧 | Blue | Email notifications |
| `database` | 💾 | Teal | Database operations |
| `default` | ⚙️ | Purple | Any other type |

## 🎮 Controls

### In the Workflow Preview Modal:

- **Pan**: Click and drag the canvas
- **Zoom In**: Click "🔍 Zoom In" button
- **Zoom Out**: Click "🔍 Zoom Out" button
- **Reset**: Click "↺ Reset View" button
- **Close**: Click "Close" button or click outside modal

## 📝 Data Format

### Minimal Required Format:

```javascript
{
  nodes: [
    { id: 'unique-id', label: 'Node Name' }
  ],
  edges: [
    { id: 'edge-id', source: 'node-id-1', target: 'node-id-2' }
  ]
}
```

### Full Format with All Options:

```javascript
{
  nodes: [
    {
      id: 'node-1',              // Required: unique identifier
      label: 'Display Name',     // Required: shown in UI
      type: 'webhook',           // Optional: determines styling
      description: 'Details...'  // Optional: shown as subtitle
    }
  ],
  edges: [
    {
      id: 'edge-1',              // Optional: auto-generated if missing
      source: 'node-1',          // Required: source node ID
      target: 'node-2',          // Required: target node ID
      label: 'Connection Name'   // Optional: shown on arrow
    }
  ]
}
```

## 🔧 Customization

### Adding New Node Types

Edit `frontend/workflow-preview.js`, find the `getNodeStyle()` method:

```javascript
getNodeStyle(type) {
    const styles = {
        // Add your custom type here:
        my_custom_type: {
            background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)',
            icon: '🔥',
            color: '#ffffff'
        },
        // ... existing types
    };
    // ...
}
```

### Changing Colors

All colors are defined inline in the `getNodeStyle()` method. Modify the `background` gradients to match your brand.

## 🐛 Troubleshooting

### Issue: "View Workflow Preview" button doesn't appear
**Solution**: Check that your backend is returning `blueprint` with `nodes` array in the response.

### Issue: Modal doesn't open
**Solution**: Check browser console for errors. Ensure `workflow-preview.js` is loaded before `console.js`.

### Issue: Nodes overlap or look messy
**Solution**: The auto-layout algorithm works best with 3-10 nodes. For larger workflows, consider grouping nodes.

### Issue: Can't see all nodes
**Solution**: Use the zoom out button or pan the canvas by clicking and dragging.

## 🚀 Next Steps

### Phase 2 Features (Future):
- [ ] Export workflow as image
- [ ] Edit mode (drag nodes, add/remove connections)
- [ ] Deploy workflow to n8n
- [ ] Save workflow templates
- [ ] Workflow versioning
- [ ] Real-time collaboration

### Backend Integration:
1. Update your AI prompt to generate workflow blueprints
2. Add workflow generation logic to `console_service.py`
3. Test with real AI responses

## 📚 Files Modified

```
frontend/
├── workflow-preview.js          # NEW: Core visualization engine
├── workflow-preview-test.html   # NEW: Test page
├── console.js                   # MODIFIED: Added blueprint handling
├── console.html                 # MODIFIED: Added script tag
└── components/                  # React versions (for future migration)
    ├── WorkflowPreview.jsx
    ├── ConsoleIntegrationExample.jsx
    ├── mockWorkflowData.js
    └── WorkflowPreviewTest.jsx
```

## ✅ Verification Checklist

- [x] Workflow preview script loads without errors
- [x] Test page shows all workflow examples
- [x] Modal opens and closes smoothly
- [x] Pan and zoom controls work
- [x] Nodes are styled correctly
- [x] Edges connect properly
- [x] Error handling works for invalid data
- [x] Integrates with existing console UI
- [x] Matches dark theme aesthetic
- [x] Responsive on different screen sizes

## 🎉 Success!

Your workflow preview is now live! Users can visualize AI-generated workflows directly in the console.

**Test it now:**
1. Open `http://localhost:8080/workflow-preview-test.html`
2. Click any workflow card
3. Interact with the visualization

---

**Need help?** Check the integration guide in `frontend/WORKFLOW_PREVIEW_INTEGRATION.md`
