# AI Console Quick Start Guide

## 🚀 Getting Started

### 1. Start the Backend

```bash
cd ~/Documents/Aivory
uvicorn app.main:app --reload --port 8081
```

### 2. Access the Console

Open your browser and navigate to:
```
http://localhost/aivory/frontend/console.html
```

Or access via the dashboard:
```
http://localhost/aivory/frontend/dashboard.html
```
Then click **Console** in the sidebar.

## 💬 Using the Console

### Basic Chat

1. Type your message in the input bar at the bottom
2. Press **Enter** to send (or click **Send** button)
3. Use **Shift+Enter** for new lines
4. View AI response with reasoning panel (Operator/Enterprise tiers)

### Example Queries

**Workflow Generation**:
```
Create a lead scoring workflow that analyzes email content and escalates high-value leads to Slack
```

**Log Analysis**:
```
Why did workflow wf-123 fail?
```

**System Optimization**:
```
Analyze last 10 executions and suggest optimizations
```

**Diagnostic Insights**:
```
What are my top automation opportunities?
```

## 📎 File Upload

1. Click the **📎** button in the input bar
2. Select a file (PDF, DOCX, CSV, or TXT)
3. Wait for upload to complete
4. File appears as attachment chip
5. Ask questions about the file content

**Example**:
```
Analyze this invoice and extract key information
```

## ⚡ Workflow Attachment

1. Click the **⚡** button in the input bar
2. Select a workflow from the list
3. Workflow appears as attachment chip
4. Ask questions or request modifications

**Example**:
```
Optimize this workflow for lower token usage
```

## 🎯 Features by Tier

### Builder ($199/mo)
- Basic chat (1 credit per message)
- Workflow suggestions
- 1 file upload
- 10 requests/minute
- 50 credits/month

### Operator ($499/mo)
- Full workflow generation (8-15 credits)
- Log analysis (6 credits)
- 5 file uploads
- 30 requests/minute
- 300 credits/month
- **Reasoning panel** (see AI decision process)

### Enterprise ($1,200+/mo)
- Complex workflows (25 credits)
- Unlimited file uploads
- 100 requests/minute
- 2,000 credits/month
- **Full reasoning panel** (with routing paths)
- Document indexing
- Audit trails

## 📊 Context Panel (Right Side)

### System Status
- Current tier
- Credits remaining
- Credit meter (visual)

### Active Workflows
- Total count
- Workflow list with status

### Recent Executions
- Last 5 executions
- Success/failure status
- Timestamps

### Token Usage (during AI response)
- Model used
- Tokens consumed

## 🔄 Workflows Page

Access: Click **Workflows** in sidebar

**Features**:
- View active workflows
- Execute workflows
- Use workflow templates
- Generate new workflows via Console

**Templates**:
- 📧 Email Automation
- 📊 Data Processing
- 🔔 Notification System

## 📝 Logs Page

Access: Click **Logs** in sidebar

**Features**:
- View execution history
- Execution statistics
- Analyze failures
- Common query shortcuts

**Common Queries**:
- "Why did my last workflow fail?"
- "Analyze last 10 executions"
- "Show execution patterns"
- "Optimize for lower token usage"

## 💡 Tips & Tricks

### 1. Clear Conversation
Click **Clear History** button to start fresh (cannot be undone)

### 2. Session Persistence
Your conversation is automatically saved and restored when you return

### 3. Credit Management
- Monitor credits in top bar and context panel
- Credit meter shows visual progress
- Upgrade modal appears when credits are low

### 4. Reasoning Panel
- Click to expand/collapse
- Shows model, tokens, confidence, cost
- Enterprise: See routing paths and multi-model breakdown

### 5. Keyboard Shortcuts
- **Enter**: Send message
- **Shift+Enter**: New line
- **Esc**: Close modals

## 🚨 Error Handling

### Insufficient Credits
- Modal appears with upgrade option
- Send button disabled
- Navigate to subscription page to upgrade

### Rate Limit Exceeded
- Cooldown timer displayed
- Wait 1 minute before retrying
- Upgrade tier for higher limits

### File Upload Failed
- Check file type (PDF, DOCX, CSV, TXT only)
- Check file size (10MB Builder, 50MB Operator, 100MB Enterprise)
- Try again or contact support

## 🎨 UI Features

### Message Bubbles
- **User messages**: Purple avatar, left-aligned
- **AI messages**: Green avatar, markdown formatted

### Markdown Support
- **Bold**: `**text**`
- **Italic**: `*text*`
- **Code**: `` `code` ``
- **Code blocks**: ` ```language\ncode\n``` `
- **Lists**: `- item` or `1. item`
- **Tables**: Automatic rendering

### Typing Indicator
- Animated dots when AI is thinking
- Operation context ("Analyzing...", "Generating...")
- Appears during file uploads

## 🔐 Security

- All AI calls go through backend (API keys never exposed)
- Tier permissions validated server-side
- Credit balance checked before operations
- Rate limiting enforced per tier
- Input sanitization applied
- All operations logged for audit

## 📱 Mobile Support

- Responsive design works on tablets and phones
- Panels stack vertically on mobile
- Touch-friendly buttons (44px minimum)
- Optimized input bar for mobile keyboards

## 🐛 Troubleshooting

### Console not loading
1. Check backend is running on port 8081
2. Check XAMPP is running on port 80
3. Clear browser cache
4. Check browser console for errors

### AI not responding
1. Check backend logs for errors
2. Verify Sumopod API is accessible
3. Check credit balance
4. Check rate limit status

### File upload not working
1. Verify file type is supported
2. Check file size limits for your tier
3. Check backend logs for parsing errors
4. Try a different file

### Credits not updating
1. Refresh the page
2. Check backend credit manager logs
3. Verify API responses include credits_remaining

## 📚 Additional Resources

- **Full Spec**: `.kiro/specs/ai-command-console/`
- **API Reference**: `app/api/routes/console.py`
- **Design Document**: `.kiro/specs/ai-command-console/design.md`
- **Requirements**: `.kiro/specs/ai-command-console/requirements.md`

## 🎉 What's Next?

### Try These Workflows:
1. **Lead Scoring**: "Create a lead scoring workflow with email analysis"
2. **Invoice Processing**: "Generate an invoice processing workflow with OCR"
3. **Customer Support**: "Build a customer support triage workflow"

### Explore Features:
1. Upload a sample document and ask questions
2. Attach a workflow and request optimizations
3. Analyze execution logs for patterns
4. Generate multiple workflows and compare

### Provide Feedback:
- What features do you love?
- What could be improved?
- What new capabilities would you like?

---

**Need Help?** Check the deployment guide: `PHASE_1_DEPLOYMENT_COMPLETE.md`

**Version**: 1.0.0
**Last Updated**: February 15, 2025
