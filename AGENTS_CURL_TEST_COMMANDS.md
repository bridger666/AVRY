# Agents API - Curl Test Commands

## Setup

```bash
# Set environment variables
export API_KEY="test-key-123"
export BASE_URL="http://localhost:3003"
```

## Test Commands

### 1. Health Check (No Auth Required)
```bash
curl -sS "$BASE_URL/health" | jq .
```

Expected: `{"status":"ok"}`

### 2. List Agents (Empty)
```bash
curl -sS "$BASE_URL/agents" \
  -H "X-Api-Key: $API_KEY" | jq .
```

Expected:
```json
{
  "items": [],
  "total": 0,
  "page": 1,
  "pageSize": 20
}
```

### 3. Create Agent #1
```bash
AGENT_1=$(curl -sS "$BASE_URL/agents" \
  -X POST \
  -H "X-Api-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Research Agent",
    "model": "claude-3.5-sonnet",
    "provider": "openrouter",
    "runtime": "zeroclaw",
    "description": "Analyzes research queries and generates insights",
    "status": "active",
    "tags": ["research", "analysis"]
  }' | jq -r '.id')

echo "Created Agent 1: $AGENT_1"
```

Expected: Returns agent object with `id` field

### 4. Create Agent #2
```bash
AGENT_2=$(curl -sS "$BASE_URL/agents" \
  -X POST \
  -H "X-Api-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Code Review Agent",
    "model": "claude-3.5-sonnet",
    "provider": "openrouter",
    "runtime": "zeroclaw",
    "description": "Reviews code and provides feedback",
    "status": "draft",
    "tags": ["code", "review"]
  }' | jq -r '.id')

echo "Created Agent 2: $AGENT_2"
```

### 5. List Agents (Should Show 2)
```bash
curl -sS "$BASE_URL/agents" \
  -H "X-Api-Key: $API_KEY" | jq .
```

Expected: `"total": 2` with both agents in items array

### 6. Get Specific Agent
```bash
curl -sS "$BASE_URL/agents/$AGENT_1" \
  -H "X-Api-Key: $API_KEY" | jq .
```

Expected: Returns the specific agent object

### 7. Search Agents by Name
```bash
curl -sS "$BASE_URL/agents?q=research" \
  -H "X-Api-Key: $API_KEY" | jq .
```

Expected: Returns only agents matching "research"

### 8. Filter by Status (Active)
```bash
curl -sS "$BASE_URL/agents?status=active" \
  -H "X-Api-Key: $API_KEY" | jq .
```

Expected: Returns only agents with `status: "active"`

### 9. Filter by Status (Draft)
```bash
curl -sS "$BASE_URL/agents?status=draft" \
  -H "X-Api-Key: $API_KEY" | jq .
```

Expected: Returns only agents with `status: "draft"`

### 10. Pagination - Page 1
```bash
curl -sS "$BASE_URL/agents?page=1&pageSize=1" \
  -H "X-Api-Key: $API_KEY" | jq .
```

Expected: Returns 1 item, `"page": 1`, `"total": 2`

### 11. Pagination - Page 2
```bash
curl -sS "$BASE_URL/agents?page=2&pageSize=1" \
  -H "X-Api-Key: $API_KEY" | jq .
```

Expected: Returns 1 item, `"page": 2`, `"total": 2`

### 12. Update Agent (Change Status)
```bash
curl -sS "$BASE_URL/agents/$AGENT_2" \
  -X PATCH \
  -H "X-Api-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "active",
    "description": "Updated: Now actively reviewing code"
  }' | jq .
```

Expected: Returns updated agent with new status and description

### 13. Update Agent (Add Tags)
```bash
curl -sS "$BASE_URL/agents/$AGENT_1" \
  -X PATCH \
  -H "X-Api-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "tags": ["research", "analysis", "insights", "ml"]
  }' | jq .
```

Expected: Returns agent with updated tags

### 14. Update Agent (Change Model)
```bash
curl -sS "$BASE_URL/agents/$AGENT_1" \
  -X PATCH \
  -H "X-Api-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4-turbo",
    "provider": "openai"
  }' | jq .
```

Expected: Returns agent with updated model and provider

### 15. Delete Agent (Soft Delete)
```bash
curl -sS "$BASE_URL/agents/$AGENT_2" \
  -X DELETE \
  -H "X-Api-Key: $API_KEY" \
  -w "\nStatus: %{http_code}\n"
```

Expected: 204 No Content

### 16. Verify Soft Delete (Agent Should Not Appear)
```bash
curl -sS "$BASE_URL/agents" \
  -H "X-Api-Key: $API_KEY" | jq .
```

Expected: `"total": 1` with only Agent 1 in items

### 17. Get Deleted Agent (Should Return 404)
```bash
curl -sS "$BASE_URL/agents/$AGENT_2" \
  -H "X-Api-Key: $API_KEY" | jq .
```

Expected: 404 error with `"code": "AGENT_NOT_FOUND"`

## Error Handling Tests

### 18. Missing Required Field (name)
```bash
curl -sS "$BASE_URL/agents" \
  -X POST \
  -H "X-Api-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "claude-3.5-sonnet",
    "provider": "openrouter"
  }' | jq .
```

Expected: 400 error with `"code": "BAD_REQUEST"`

### 19. Missing Required Field (model)
```bash
curl -sS "$BASE_URL/agents" \
  -X POST \
  -H "X-Api-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Agent",
    "provider": "openrouter"
  }' | jq .
```

Expected: 400 error with `"code": "BAD_REQUEST"`

### 20. Missing Required Field (provider)
```bash
curl -sS "$BASE_URL/agents" \
  -X POST \
  -H "X-Api-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Agent",
    "model": "claude-3.5-sonnet"
  }' | jq .
```

Expected: 400 error with `"code": "BAD_REQUEST"`

### 21. Invalid API Key
```bash
curl -sS "$BASE_URL/agents" \
  -H "X-Api-Key: invalid-key" | jq .
```

Expected: 401 error with `"code": "UNAUTHORIZED"`

### 22. Missing API Key
```bash
curl -sS "$BASE_URL/agents" | jq .
```

Expected: 401 error with `"code": "UNAUTHORIZED"`

### 23. Agent Not Found
```bash
curl -sS "$BASE_URL/agents/nonexistent-id" \
  -H "X-Api-Key: $API_KEY" | jq .
```

Expected: 404 error with `"code": "AGENT_NOT_FOUND"`

### 24. Update Non-Existent Agent
```bash
curl -sS "$BASE_URL/agents/nonexistent-id" \
  -X PATCH \
  -H "X-Api-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"status": "active"}' | jq .
```

Expected: 404 error with `"code": "AGENT_NOT_FOUND"`

### 25. Delete Non-Existent Agent
```bash
curl -sS "$BASE_URL/agents/nonexistent-id" \
  -X DELETE \
  -H "X-Api-Key: $API_KEY" | jq .
```

Expected: 404 error with `"code": "AGENT_NOT_FOUND"`

## Complex Scenarios

### 26. Create Agent with Config
```bash
curl -sS "$BASE_URL/agents" \
  -X POST \
  -H "X-Api-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Advanced Agent",
    "model": "claude-3.5-sonnet",
    "provider": "openrouter",
    "description": "Agent with custom configuration",
    "status": "active",
    "config": {
      "temperature": 0.7,
      "max_tokens": 2000,
      "system_prompt": "You are a helpful assistant"
    },
    "tags": ["advanced", "config"]
  }' | jq .
```

Expected: Returns agent with config object preserved

### 27. Search with Multiple Filters
```bash
curl -sS "$BASE_URL/agents?q=agent&status=active&page=1&pageSize=10" \
  -H "X-Api-Key: $API_KEY" | jq .
```

Expected: Returns agents matching all filters

### 28. Update Multiple Fields
```bash
curl -sS "$BASE_URL/agents/$AGENT_1" \
  -X PATCH \
  -H "X-Api-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Research Agent",
    "description": "Enhanced research capabilities",
    "status": "active",
    "model": "gpt-4-turbo",
    "provider": "openai",
    "tags": ["research", "analysis", "gpt4"]
  }' | jq .
```

Expected: Returns agent with all fields updated

## Batch Operations

### 29. Create Multiple Agents
```bash
for i in {1..5}; do
  curl -sS "$BASE_URL/agents" \
    -X POST \
    -H "X-Api-Key: $API_KEY" \
    -H "Content-Type: application/json" \
    -d "{
      \"name\": \"Batch Agent $i\",
      \"model\": \"claude-3.5-sonnet\",
      \"provider\": \"openrouter\",
      \"description\": \"Batch created agent $i\",
      \"status\": \"draft\"
    }" | jq '.id'
done
```

Expected: Creates 5 agents and prints their IDs

### 30. List All with Pagination
```bash
for page in {1..3}; do
  echo "=== Page $page ==="
  curl -sS "$BASE_URL/agents?page=$page&pageSize=5" \
    -H "X-Api-Key: $API_KEY" | jq '.items | length'
done
```

Expected: Shows pagination working across multiple pages

## Performance Tests

### 31. Large Config Object
```bash
curl -sS "$BASE_URL/agents" \
  -X POST \
  -H "X-Api-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Large Config Agent",
    "model": "claude-3.5-sonnet",
    "provider": "openrouter",
    "config": {
      "nested": {
        "deep": {
          "structure": {
            "with": {
              "many": {
                "fields": "value"
              }
            }
          }
        }
      },
      "array": [1, 2, 3, 4, 5],
      "string": "Lorem ipsum dolor sit amet, consectetur adipiscing elit"
    }
  }' | jq .
```

Expected: Handles large config objects correctly

### 32. Long Description
```bash
curl -sS "$BASE_URL/agents" \
  -X POST \
  -H "X-Api-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Verbose Agent",
    "model": "claude-3.5-sonnet",
    "provider": "openrouter",
    "description": "This is a very long description that contains multiple sentences and paragraphs. It describes the agent in great detail, including its capabilities, limitations, and use cases. The description is designed to test how the system handles longer text fields."
  }' | jq .
```

Expected: Handles long descriptions correctly

## Cleanup

### 33. Delete All Agents
```bash
# Get all agent IDs
AGENT_IDS=$(curl -sS "$BASE_URL/agents" \
  -H "X-Api-Key: $API_KEY" | jq -r '.items[].id')

# Delete each agent
for id in $AGENT_IDS; do
  curl -sS "$BASE_URL/agents/$id" \
    -X DELETE \
    -H "X-Api-Key: $API_KEY"
  echo "Deleted: $id"
done
```

Expected: All agents soft-deleted

### 34. Verify All Deleted
```bash
curl -sS "$BASE_URL/agents" \
  -H "X-Api-Key: $API_KEY" | jq .
```

Expected: `"total": 0` with empty items array

## Summary

- **Total Tests**: 34
- **CRUD Operations**: 5 (Create, Read, List, Update, Delete)
- **Error Cases**: 8
- **Complex Scenarios**: 3
- **Batch Operations**: 2
- **Performance Tests**: 2
- **Cleanup**: 2

All tests should pass with the implemented agents API.
