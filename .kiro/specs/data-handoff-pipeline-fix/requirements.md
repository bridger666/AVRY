# Requirements Document: Data Handoff Pipeline Fix

## Introduction

The Aivory monetization funnel currently experiences 100% data loss between the three diagnostic steps (Free Diagnostic → AI Snapshot → AI Blueprint). Users must re-enter their email, company name, and industry at each step, and the Blueprint generation uses hardcoded mock data instead of real user data. This creates a broken user experience and prevents personalized Blueprint generation.

This feature implements database persistence, ID traceability, and zero data re-entry across the complete funnel to ensure seamless data handoff and personalized outputs.

## Glossary

- **Diagnostic_System**: The free 12-question AI readiness assessment (Step 1)
- **Snapshot_System**: The $15 AI Snapshot with 30-question strategic assessment (Step 2a)
- **Blueprint_System**: The $79 AI Blueprint generation system (Step 2b)
- **Database_Service**: File-based JSON storage service for diagnostics, snapshots, and blueprints
- **diagnostic_id**: Unique identifier for a completed diagnostic assessment
- **snapshot_id**: Unique identifier for a completed snapshot assessment
- **blueprint_id**: Unique identifier for a generated blueprint
- **User_Context**: Email, company name, and industry information entered once and reused
- **ID_Chain**: The linked sequence diagnostic_id → snapshot_id → blueprint_id

## Requirements

### Requirement 1: Diagnostic Persistence and ID Generation

**User Story:** As a user completing the free diagnostic, I want my answers and profile information saved, so that I don't have to re-enter data in subsequent steps.

#### Acceptance Criteria

1. WHEN a user submits the free diagnostic with email, company name, and industry, THE Diagnostic_System SHALL generate a unique diagnostic_id
2. WHEN the diagnostic is submitted, THE Diagnostic_System SHALL persist all answers to the Database_Service
3. WHEN the diagnostic is submitted, THE Diagnostic_System SHALL persist user_email, company_name, and industry to the Database_Service
4. WHEN the diagnostic is submitted, THE Diagnostic_System SHALL return the diagnostic_id in the API response
5. THE diagnostic_id SHALL follow the format "diag_" followed by 12 alphanumeric characters

### Requirement 2: Snapshot Persistence with Diagnostic Linkage

**User Story:** As a user purchasing the AI Snapshot, I want my snapshot results linked to my diagnostic, so that my data flows seamlessly through the funnel.

#### Acceptance Criteria

1. WHEN a user submits snapshot answers with a diagnostic_id, THE Snapshot_System SHALL link the snapshot to that diagnostic_id
2. WHEN the snapshot is submitted, THE Snapshot_System SHALL generate a unique snapshot_id
3. WHEN the snapshot is submitted, THE Snapshot_System SHALL persist all 30 answers to the Database_Service
4. WHEN the snapshot is submitted, THE Snapshot_System SHALL retrieve user_email, company_name, and industry from the linked diagnostic_id
5. WHEN the snapshot is submitted, THE Snapshot_System SHALL persist the complete snapshot result including readiness_score, category_scores, pain_points, workflows, and key_processes
6. WHEN the snapshot is submitted, THE Snapshot_System SHALL return the snapshot_id in the API response
7. THE snapshot_id SHALL follow the format "snap_" followed by 12 alphanumeric characters

### Requirement 3: Blueprint Generation with Real Snapshot Data

**User Story:** As a user purchasing the AI Blueprint, I want my blueprint generated from my actual snapshot data, so that I receive a personalized AI system architecture.

#### Acceptance Criteria

1. WHEN a user requests blueprint generation with a snapshot_id, THE Blueprint_System SHALL retrieve the complete snapshot record from the Database_Service
2. WHEN generating the blueprint, THE Blueprint_System SHALL use the real company_name from the snapshot record
3. WHEN generating the blueprint, THE Blueprint_System SHALL use the real pain_points from the snapshot record
4. WHEN generating the blueprint, THE Blueprint_System SHALL use the real workflows from the snapshot record
5. WHEN generating the blueprint, THE Blueprint_System SHALL use the real key_processes from the snapshot record
6. WHEN generating the blueprint, THE Blueprint_System SHALL use the real primary_objective from the snapshot record
7. WHEN generating the blueprint, THE Blueprint_System SHALL use the real readiness_score from the snapshot record
8. WHEN the blueprint is generated, THE Blueprint_System SHALL link the blueprint_id to the snapshot_id in the Database_Service
9. THE Blueprint_System SHALL NOT use hardcoded mock data for any blueprint field

### Requirement 4: Complete ID Chain Traceability

**User Story:** As a system administrator, I want complete traceability from diagnostic through blueprint, so that I can audit the data flow and debug issues.

#### Acceptance Criteria

1. WHEN a snapshot is created, THE Database_Service SHALL store the diagnostic_id foreign key
2. WHEN a blueprint is created, THE Database_Service SHALL store the snapshot_id foreign key
3. WHEN querying a snapshot by snapshot_id, THE Database_Service SHALL return the linked diagnostic_id
4. WHEN querying a blueprint by blueprint_id, THE Database_Service SHALL return the linked snapshot_id
5. WHEN querying snapshots by diagnostic_id, THE Database_Service SHALL return all snapshots linked to that diagnostic
6. WHEN querying blueprints by snapshot_id, THE Database_Service SHALL return all blueprints linked to that snapshot

### Requirement 5: Zero Data Re-Entry User Experience

**User Story:** As a user progressing through the funnel, I want to enter my email, company, and industry only once, so that I have a seamless experience.

#### Acceptance Criteria

1. WHEN a user completes the diagnostic with User_Context, THE Diagnostic_System SHALL store the User_Context
2. WHEN a user starts the snapshot with a diagnostic_id, THE Snapshot_System SHALL retrieve and reuse the User_Context
3. WHEN a user starts the blueprint with a snapshot_id, THE Blueprint_System SHALL retrieve and reuse the User_Context
4. THE Snapshot_System SHALL NOT require the user to re-enter email, company_name, or industry if diagnostic_id is provided
5. THE Blueprint_System SHALL NOT require the user to re-enter email, company_name, or industry if snapshot_id is provided

### Requirement 6: Database Schema for Diagnostics

**User Story:** As a developer, I want a clear database schema for diagnostics, so that I can reliably store and retrieve diagnostic data.

#### Acceptance Criteria

1. THE Database_Service SHALL store diagnostic records with fields: diagnostic_id, user_id, user_email, company_name, industry, answers, score, category, created_at
2. THE Database_Service SHALL validate that diagnostic_id is unique before storing
3. WHEN storing a diagnostic, THE Database_Service SHALL validate that answers contains exactly 12 question-answer pairs
4. WHEN storing a diagnostic, THE Database_Service SHALL validate that score is between 0 and 100
5. WHEN storing a diagnostic, THE Database_Service SHALL set created_at to the current UTC timestamp

### Requirement 7: Database Schema for Snapshots

**User Story:** As a developer, I want a clear database schema for snapshots, so that I can reliably store and retrieve snapshot data with diagnostic linkage.

#### Acceptance Criteria

1. THE Database_Service SHALL store snapshot records with fields: snapshot_id, diagnostic_id, user_id, user_email, company_name, industry, answers, readiness_score, category_scores, primary_objective, top_recommendations, pain_points, workflows, key_processes, automation_level, data_quality_score, created_at
2. THE Database_Service SHALL validate that snapshot_id is unique before storing
3. WHEN storing a snapshot, THE Database_Service SHALL validate that answers contains exactly 30 question-answer pairs
4. WHEN storing a snapshot, THE Database_Service SHALL validate that readiness_score is between 0 and 100
5. WHEN storing a snapshot with a diagnostic_id, THE Database_Service SHALL validate that the diagnostic_id exists
6. WHEN storing a snapshot, THE Database_Service SHALL set created_at to the current UTC timestamp

### Requirement 8: Blueprint Metadata Enhancement

**User Story:** As a developer, I want blueprint metadata to include snapshot_id linkage, so that I can trace blueprints back to their source data.

#### Acceptance Criteria

1. WHEN storing a blueprint, THE Database_Service SHALL include snapshot_id in the blueprint metadata
2. WHEN retrieving a blueprint, THE Database_Service SHALL return the linked snapshot_id
3. WHEN a blueprint is generated, THE Blueprint_System SHALL validate that the snapshot_id exists before generation
4. THE Database_Service SHALL provide a method to query all blueprints by snapshot_id

### Requirement 9: API Response Updates

**User Story:** As a frontend developer, I want diagnostic and snapshot APIs to return their generated IDs, so that I can pass them to subsequent steps.

#### Acceptance Criteria

1. WHEN the diagnostic API returns a successful response, THE response SHALL include the diagnostic_id field
2. WHEN the snapshot API returns a successful response, THE response SHALL include the snapshot_id field
3. WHEN the snapshot API returns a successful response, THE response SHALL include the diagnostic_id field if linked
4. WHEN the blueprint API returns a successful response, THE response SHALL include the snapshot_id field

### Requirement 10: End-to-End Data Flow Validation

**User Story:** As a QA engineer, I want to validate the complete data flow, so that I can confirm zero data loss across all steps.

#### Acceptance Criteria

1. WHEN a user completes diagnostic → snapshot → blueprint with the same User_Context, THE final blueprint SHALL contain the original company_name
2. WHEN a user completes diagnostic → snapshot → blueprint, THE final blueprint SHALL contain pain_points extracted from the snapshot answers
3. WHEN a user completes diagnostic → snapshot → blueprint, THE final blueprint SHALL contain workflows extracted from the snapshot answers
4. WHEN querying the blueprint, THE system SHALL be able to trace back to the original diagnostic through the ID_Chain
5. WHEN a user refreshes the page during any step, THE system SHALL be able to resume using the stored IDs without data loss
