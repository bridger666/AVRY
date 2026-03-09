# Requirements Document: n8n Workflow Sync

## Introduction

The Aivory Workflow Tab must synchronize bidirectionally with n8n (v2.8.3) running at http://43.156.108.96:5678. All workflow data—nodes, labels, tools, connections, and execution status—must be read from and written to n8n as the single source of truth. The system must provide real-time sync status feedback and graceful offline fallback when n8n is unavailable.

## Glossary

- **Aivory**: The Next.js-based workflow editor UI component
- **n8n**: Open-source workflow automation platform (v2.8.3)
- **Workflow**: A collection of nodes and connections representing an automation sequence
- **Node**: An individual step in a workflow (trigger, action, or manual step)
- **ReactFlow**: The canvas library used to render workflow nodes visually
- **Sync Status**: The current state of synchronization between Aivory and n8n (Synced, Unsaved changes, Saving, Failed)
- **Execution**: A single run of a workflow with associated logs and status
- **API Key**: X-N8N-API-KEY header used for n8n authentication
- **Offline Mode**: Local editing when n8n is unavailable, with cached data

## Requirements

### Requirement 1: Fetch Workflow from n8n on Mount

**User Story:** As a workflow editor, I want the Aivory canvas to load the current workflow state from n8n on page load, so that I always see the authoritative workflow data.

#### Acceptance Criteria

1. WHEN the WorkflowCanvas component mounts, THE Aivory_System SHALL fetch the workflow from n8n using GET /api/n8n/workflow/{id}
2. WHEN the fetch succeeds, THE Aivory_System SHALL map n8n node structure to ReactFlow nodes:
   - n8n node.name → ReactFlow node.data.label
   - n8n node.type → ReactFlow nodeType (manualTrigger, stepNode, etc.)
   - n8n node.parameters → ReactFlow node.data.tool and node.data.output
   - n8n node.position → ReactFlow node.position { x, y }
   - n8n node.id → ReactFlow node.id
3. WHEN the fetch succeeds, THE Aivory_System SHALL render a loading skeleton during the fetch operation
4. WHEN the fetch fails with network error, THE Aivory_System SHALL display a warning toast "n8n offline — editing in local mode" and fall back to last cached workflow data
5. WHEN the fetch fails with 401 Unauthorized, THE Aivory_System SHALL display a persistent banner "n8n auth failed — check API key"
6. WHEN the fetch times out after 5 seconds, THE Aivory_System SHALL retry once, then fall back to offline mode with a warning toast

### Requirement 2: Save Workflow Changes to n8n

**User Story:** As a workflow editor, I want to save my changes to n8n when I click the Save Changes button, so that my edits persist in the authoritative workflow.

#### Acceptance Criteria

1. WHEN the user clicks Save Changes, THE Aivory_System SHALL collect all current ReactFlow nodes and edges
2. WHEN collecting changes, THE Aivory_System SHALL map ReactFlow state back to n8n workflow format:
   - ReactFlow node.data.label → n8n node.name
   - ReactFlow nodeType → n8n node.type
   - ReactFlow node.data.tool and node.data.output → n8n node.parameters
   - ReactFlow node.position → n8n node.position
   - ReactFlow edges → n8n connections
3. WHEN mapping is complete, THE Aivory_System SHALL send a PUT request to /api/n8n/workflow/{id} with the full workflow object including name, nodes, connections, and settings
4. WHEN the PUT request succeeds, THE Aivory_System SHALL update the sync status to "Synced" and display a green flash confirmation
5. WHEN the PUT request fails, THE Aivory_System SHALL display a toast with the n8n error message and keep local state intact for retry
6. WHEN the PUT request times out after 5 seconds, THE Aivory_System SHALL retry once, then display an error toast

### Requirement 3: Activate and Deactivate Workflow

**User Story:** As a workflow manager, I want to toggle the workflow between Active and Draft states using the header dropdown, so that I can control when the workflow runs.

#### Acceptance Criteria

1. WHEN the user selects "Active" from the status dropdown, THE Aivory_System SHALL send POST /api/n8n/workflow/{id}/activate
2. WHEN the user selects "Draft" from the status dropdown, THE Aivory_System SHALL send POST /api/n8n/workflow/{id}/deactivate
3. WHEN activation succeeds, THE Aivory_System SHALL update the header status display to "Active" with green indicator
4. WHEN deactivation succeeds, THE Aivory_System SHALL update the header status display to "Draft" with gray indicator
5. IF the activation or deactivation request fails, THEN THE Aivory_System SHALL display an error toast and revert the dropdown to the previous state

### Requirement 4: Display Real-Time Sync Status

**User Story:** As a workflow editor, I want to see the current sync status at a glance, so that I know whether my changes are saved or pending.

#### Acceptance Criteria

1. WHEN the workflow is loaded and no changes have been made, THE SyncStatus_Component SHALL display "● Synced" in green
2. WHEN the user makes local changes to nodes or edges, THE SyncStatus_Component SHALL display "● Unsaved changes" in yellow
3. WHEN the user clicks Save Changes and the request is in progress, THE SyncStatus_Component SHALL display "⏳ Saving..." in gray
4. WHEN the save request completes successfully, THE SyncStatus_Component SHALL display "● Synced" in green and flash briefly
5. WHEN the save request fails, THE SyncStatus_Component SHALL display "● Sync failed — retry" in red with a clickable retry button
6. THE SyncStatus_Component SHALL be positioned left of the Save Changes button in the canvas header

### Requirement 5: Provide n8n API Proxy Layer

**User Story:** As a frontend developer, I want a secure server-side API proxy for n8n requests, so that the API key is never exposed to the browser.

#### Acceptance Criteria

1. THE API_Proxy SHALL implement GET /api/n8n/workflow/{id} to fetch workflow data from n8n
2. THE API_Proxy SHALL implement PUT /api/n8n/workflow/{id} to update workflow data in n8n
3. THE API_Proxy SHALL implement POST /api/n8n/workflow/{id}/activate to activate a workflow
4. THE API_Proxy SHALL implement POST /api/n8n/workflow/{id}/deactivate to deactivate a workflow
5. THE API_Proxy SHALL implement GET /api/n8n/executions to fetch execution logs for a workflow
6. WHEN any request is received, THE API_Proxy SHALL validate that the workflow ID matches the environment variable N8N_WORKFLOW_ID
7. WHEN any request is received, THE API_Proxy SHALL use process.env.N8N_API_KEY server-side and never expose it to the client
8. WHEN any n8n request times out after 5 seconds, THE API_Proxy SHALL return a 504 Gateway Timeout error
9. WHEN any n8n request fails with 401, THE API_Proxy SHALL return a 401 Unauthorized error with message "n8n auth failed"
10. WHEN any n8n request fails with network error, THE API_Proxy SHALL return a 503 Service Unavailable error

### Requirement 6: Provide Typed n8n Client Utility

**User Story:** As a frontend developer, I want typed helper functions for n8n API calls, so that I can safely interact with n8n without manual HTTP setup.

#### Acceptance Criteria

1. THE N8n_Client SHALL export `getWorkflow(id: string): Promise<N8nWorkflow>`
2. THE N8n_Client SHALL export `updateWorkflow(id: string, data: N8nWorkflow): Promise<N8nWorkflow>`
3. THE N8n_Client SHALL export `activateWorkflow(id: string): Promise<void>`
4. THE N8n_Client SHALL export `deactivateWorkflow(id: string): Promise<void>`
5. THE N8n_Client SHALL export `getExecutions(workflowId: string, limit?: number): Promise<N8nExecution[]>`
6. WHEN any function is called, THE N8n_Client SHALL use the /api/n8n/... proxy routes, not direct n8n calls
7. WHEN any function encounters an error, THE N8n_Client SHALL throw a typed error with message and status code

### Requirement 7: Map n8n Workflow to ReactFlow Format

**User Story:** As a frontend developer, I want a utility to convert between n8n and ReactFlow formats, so that I can seamlessly sync data structures.

#### Acceptance Criteria

1. THE N8n_Mapper SHALL export `n8nToReactFlow(workflow: N8nWorkflow): { nodes: Node[], edges: Edge[] }`
2. THE N8n_Mapper SHALL export `reactFlowToN8n(nodes: Node[], edges: Edge[], baseWorkflow: N8nWorkflow): N8nWorkflow`
3. WHEN converting n8n to ReactFlow, THE N8n_Mapper SHALL preserve all node properties (id, name, type, parameters, position)
4. WHEN converting ReactFlow to n8n, THE N8n_Mapper SHALL preserve the full n8n workflow structure (name, settings, etc.) and only update nodes and connections
5. WHEN converting, THE N8n_Mapper SHALL handle edge cases: missing positions, undefined parameters, empty connections

### Requirement 8: Display Execution Logs from n8n

**User Story:** As a workflow monitor, I want to see real execution logs from n8n on the Execution Logs page, so that I can track workflow runs.

#### Acceptance Criteria

1. WHEN the Execution Logs page loads, THE Aivory_System SHALL fetch executions from GET /api/n8n/executions?workflowId={id}&limit=20
2. WHEN executions are fetched, THE Aivory_System SHALL map n8n execution status to display colors:
   - success → green
   - error → red
   - running → yellow
3. WHEN the fetch fails, THE Aivory_System SHALL display a fallback message "Unable to load execution logs"
4. WHEN the user clicks an execution row, THE Aivory_System SHALL fetch and display execution details

### Requirement 9: Handle Offline Mode Gracefully

**User Story:** As a workflow editor, I want to continue editing locally when n8n is offline, so that I don't lose my work.

#### Acceptance Criteria

1. WHEN n8n is unavailable, THE Aivory_System SHALL cache the last successfully fetched workflow in localStorage
2. WHEN n8n is unavailable, THE Aivory_System SHALL allow local editing with a warning banner
3. WHEN n8n comes back online, THE Aivory_System SHALL attempt to sync cached changes automatically
4. WHEN syncing cached changes, IF there are conflicts, THEN THE Aivory_System SHALL display a merge dialog allowing the user to choose n8n version or local version

### Requirement 10: Secure API Key Handling

**User Story:** As a security officer, I want the API key to be protected from exposure, so that n8n access is not compromised.

#### Acceptance Criteria

1. THE API_Key SHALL be stored only in process.env.N8N_API_KEY on the server
2. THE API_Key SHALL never be logged or exposed in error messages sent to the client
3. WHEN the client makes a request to /api/n8n/..., THE API_Key SHALL be injected server-side only
4. WHEN the client receives a response, THE API_Key SHALL not be included in the response body
5. WHEN an error occurs, THE API_Proxy SHALL return a generic error message to the client without exposing the API key

