#!/bin/bash

echo "=== ZeroClaw Fix & n8n Integration ==="
echo ""

# Step 1: Backup current config
echo "Step 1: Backing up current config..."
ssh ubuntu@43.156.108.96 "cp /home/ubuntu/.zeroclaw/config.toml /home/ubuntu/.zeroclaw/config.toml.backup.$(date +%s)"

# Step 2: Remove Microsoft 365 section
echo ""
echo "Step 2: Removing Microsoft 365 section from config.toml..."
ssh ubuntu@43.156.108.96 "sed -i '/^\[microsoft365\]/,/^\[/{/d;}' /home/ubuntu/.zeroclaw/config.toml"

# Step 3: Add n8n tools to config.toml
echo ""
echo "Step 3: Adding n8n tools to config.toml..."
ssh ubuntu@43.156.108.96 "cat >> /home/ubuntu/.zeroclaw/config.toml << 'TOOL_EOF'

[[tools.http]]
name = \"n8n_build_draft\"
url = \"http://127.0.0.1:3500/drafts/build\"
method = \"POST\"
tool_timeout_secs = 60

[[tools.http]]
name = \"n8n_test_draft\"
url = \"http://127.0.0.1:3500/drafts/test\"
method = \"POST\"
tool_timeout_secs = 90

TOOL_EOF"

# Step 4: Update TOOLS.md
echo ""
echo "Step 4: Updating TOOLS.md..."
ssh ubuntu@43.156.108.96 "cat > /home/ubuntu/.zeroclaw/TOOLS.md << 'TOOLS_EOF'
# ZeroClaw Tool Documentation

## n8n Build Draft
Create an n8n workflow draft from user intent and steps.
- Tool: n8n_build_draft
- URL: POST http://127.0.0.1:3500/drafts/build
- Request Body:
  \`\`\`json
  {
    \"intent\": \"workflow purpose\",
    \"steps\": [
      {
        \"title\": \"step name\",
        \"type\": \"step_type\",
        \"description\": \"step description\"
      }
    ]
  }
  \`\`\`
- Use When: User wants to create an automation workflow
- Returns: draft_id and workflow metadata

## n8n Test Draft
Test a workflow draft in sandbox before deploying to production.
- Tool: n8n_test_draft
- URL: POST http://127.0.0.1:3500/drafts/test
- Request Body:
  \`\`\`json
  {
    \"draft_id\": \"draft_xxx\"
  }
  \`\`\`
- Use When: Need to validate workflow logic without credentials
- Returns: Test results with node-by-node status

## Workflow Best Practices

When generating workflows:
1. Always start with a trigger node (webhook, schedule, or manual)
2. Add clear step descriptions for better AI understanding
3. Use appropriate node types from n8n-as-code patterns
4. Validate with n8n_test_draft before telling user it's ready
TOOLS_EOF"

# Step 5: Update workflow_generate skill
echo ""
echo "Step 5: Updating workflow_generate skill..."
ssh ubuntu@43.156.108.96 "mkdir -p /home/ubuntu/.zeroclaw/skills/workflow_generate"

ssh ubuntu@43.156.108.96 "cat > /home/ubuntu/.zeroclaw/skills/workflow_generate/skill.md << 'SKILL_EOF'
# Workflow Generation Skill

You are an expert at creating n8n workflows. Use the n8n tools to build, test, and deploy workflows.

## Process

1. **Understand Intent**: Parse user's request to identify:
   - What the workflow should do
   - Required steps (trigger, actions, outputs)
   - Any external systems needed

2. **Build Draft**: Call n8n_build_draft tool with:
   - intent: Clear workflow purpose
   - steps: Array of step objects
   - config: Optional workflow settings

3. **Validate**: Call n8n_test_draft with the returned draft_id
   - Returns: Test results showing which steps pass/fail
   - Errors indicate missing credentials or invalid configurations

4. **Report**: Present results to user with:
   - Draft ID
   - Test status (passed/failed)
   - Next steps (deploy, fix issues, or add credentials)

## Tool Usage

When user asks to create a workflow:

\`\`\`json
{
  \"action\": \"n8n_build_draft\",
  \"input\": {
    \"intent\": \"Send daily sales report via email\",
    \"steps\": [
      {
        \"title\": \"Schedule Trigger\",
        \"type\": \"schedule\",
        \"description\": \"Run every day at 9 AM\"
      },
      {
        \"title\": \"Get Sales Data\",
        \"type\": \"http\",
        \"description\": \"Fetch from CRM API\"
      },
      {
        \"title\": \"Send Email\",
        \"type\": \"email\",
        \"description\": \"Email report to sales team\"
      }
    ]
  }
}
\`\`\`

Then validate with:

\`\`\`json
{
  \"action\": \"n8n_test_draft\",
  \"input\": {
    \"draft_id\": \"draft_xxx\"
  }
}
\`\`\`

## Best Practices

- Start every workflow with a trigger (webhook, schedule, or manual)
- Provide clear step descriptions for better AI mapping
- Always test before telling user workflow is ready
- Report credential requirements clearly
SKILL_EOF"

# Step 6: Check n8n-as-code service
echo ""
echo "Step 6: Checking n8n-as-code service status..."
ssh ubuntu@43.156.108.96 "curl -s http://127.0.0.1:3500/health"

# Step 7: Check config drift
echo ""
echo "Step 7: Checking ZeroClaw config drift..."
ssh ubuntu@43.156.108.96 "zeroclaw config drift" || echo "Config drift check completed"

# Step 8: Restart ZeroClaw
echo ""
echo "Step 8: Restarting ZeroClaw daemon..."
ssh ubuntu@43.156.108.96 "pm2 restart zeroclaw"

# Step 9: Wait for restart
echo ""
echo "Step 9: Waiting for ZeroClaw to start (5 seconds)..."
sleep 5

# Step 10: Verify ZeroClaw status
echo ""
echo "Step 10: Verifying ZeroClaw status..."
ssh ubuntu@43.156.108.96 "pm2 status zeroclaw"

echo ""
echo "=== Implementation Complete ==="
echo ""
echo "Next steps:"
echo "1. Test tool registration: zeroclaw chat \"list available tools\""
echo "2. Test workflow generation: zeroclaw chat \"create a workflow that sends email alerts\""
echo "3. Check logs if issues: pm2 logs zeroclaw --lines 50"
