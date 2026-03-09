# Blueprint → Workflow Generation Bugfix

## Introduction

The Blueprint → Workflow generation feature is broken. Users cannot generate workflows from blueprints, see generated workflows in the Workflows tab, or differentiate between Blueprint-based and n8n-based workflows in the UI. This bugfix restores the complete pipeline: Blueprint detail page → API endpoint → Workflows list with source badges → Correct editor navigation.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a user clicks "Generate Workflow" on a blueprint detail page THEN the system displays a generic "Service temporarily unavailable" error and does not create a workflow

1.2 WHEN a user clicks "Generate Workflow" on a blueprint THEN the system does not redirect to the newly created workflow

1.3 WHEN a user views the Workflows tab THEN the system does not display any Blueprint-generated workflows

1.4 WHEN a user views the Workflows tab THEN the system does not show source badges (n8n vs Blueprint) to differentiate workflow types

1.5 WHEN a user clicks a Blueprint-generated workflow in the Workflows list THEN the system does not open the correct editor (should open n8n editor for n8n-backed workflows)

### Expected Behavior (Correct)

2.1 WHEN a user clicks "Generate Workflow" on a blueprint detail page THEN the system creates a new workflow instance backed by n8n and returns success

2.2 WHEN a user clicks "Generate Workflow" on a blueprint THEN the system redirects to /workflows/[consoleWorkflowId] to display the newly created workflow

2.3 WHEN a user views the Workflows tab THEN the system displays all Blueprint-generated workflows alongside n8n workflows

2.4 WHEN a user views the Workflows tab THEN the system displays source badges ("n8n" or "Blueprint") for each workflow to indicate its source

2.5 WHEN a user clicks a Blueprint-generated workflow (n8n-backed) in the Workflows list THEN the system opens the n8n Workflow Editor (WorkflowCanvas component)

2.6 WHEN a user views a Blueprint-generated workflow detail THEN the system displays the blueprint source information (e.g., "Generated from [Blueprint Name]") in the header

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a user interacts with existing n8n workflows THEN the system SHALL CONTINUE TO display them in the Workflows tab with "n8n" badge

3.2 WHEN a user clicks an existing n8n workflow THEN the system SHALL CONTINUE TO open the n8n Workflow Editor (WorkflowCanvas component)

3.3 WHEN a user views the blueprint detail page THEN the system SHALL CONTINUE TO display blueprint information and metadata correctly

3.4 WHEN a user navigates between pages THEN the system SHALL CONTINUE TO maintain proper routing and state management

3.5 WHEN a user stores workflows THEN the system SHALL CONTINUE TO persist workflows in the existing storage mechanism (localStorage/backend)
