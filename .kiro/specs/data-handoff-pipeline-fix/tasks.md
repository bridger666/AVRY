# Implementation Plan: Data Handoff Pipeline Fix

## Overview

This implementation plan converts the data handoff pipeline design into discrete coding tasks. The plan follows a bottom-up approach: first establishing the database foundation, then building ID generation utilities, then modifying APIs to persist and retrieve data, and finally updating the Blueprint generation service to use real data instead of mocks.

Each task builds incrementally, with checkpoints to validate core functionality before proceeding.

## Tasks

- [x] 1. Create ID generation utility module
  - Create `app/utils/id_generator.py` with functions for generating diagnostic_id, snapshot_id, blueprint_id
  - Each ID should follow format: prefix + 12 random alphanumeric characters (lowercase + digits)
  - Use Python's `secrets` module for cryptographic randomness
  - _Requirements: 1.5, 2.7_

- [ ]* 1.1 Write property test for ID generation uniqueness
  - **Property 1: Diagnostic ID Generation Uniqueness**
  - **Validates: Requirements 1.5**

- [ ]* 1.2 Write property test for snapshot ID generation uniqueness
  - **Property 3: Snapshot ID Generation Uniqueness**
  - **Validates: Requirements 2.7**

- [ ] 2. Extend DatabaseService with diagnostic persistence
  - [ ] 2.1 Implement `store_diagnostic()` method in `app/database/db_service.py`
    - Accept diagnostic_id, user_id, user_email, company_name, industry, answers, score, category
    - Validate answers contains exactly 12 items
    - Validate score is between 0 and 100
    - Store as JSON file in `data/diagnostics/{diagnostic_id}.json`
    - Set created_at to current UTC timestamp
    - Return True on success, False on failure
    - _Requirements: 1.2, 1.3, 6.1, 6.3, 6.4, 6.5_

  - [ ] 2.2 Implement `get_diagnostic()` method in `app/database/db_service.py`
    - Accept diagnostic_id
    - Read JSON file from `data/diagnostics/{diagnostic_id}.json`
    - Return dict with all fields or None if not found
    - _Requirements: 4.3_

  - [ ] 2.3 Implement `list_diagnostics_by_user()` method in `app/database/db_service.py`
    - Accept user_id
    - Scan all files in `data/diagnostics/`
    - Filter by user_id match
    - Sort by created_at descending
    - Return list of diagnostic dicts
    - _Requirements: 4.3_

- [ ]* 2.4 Write property test for diagnostic persistence round trip
  - **Property 2: Diagnostic Persistence Round Trip**
  - **Validates: Requirements 1.2, 1.3, 6.1**

- [ ]* 2.5 Write unit tests for diagnostic validation
  - Test store_diagnostic rejects answer count != 12
  - Test store_diagnostic rejects score < 0 or > 100
  - Test get_diagnostic returns None for non-existent ID
  - _Requirements: 6.3, 6.4_

- [ ] 3. Extend DatabaseService with snapshot persistence
  - [ ] 3.1 Implement `store_snapshot()` method in `app/database/db_service.py`
    - Accept snapshot_id, diagnostic_id, user_id, user_email, company_name, industry, answers, readiness_score, category_scores, primary_objective, top_recommendations, pain_points, workflows, key_processes, automation_level, data_quality_score
    - Validate answers contains exactly 30 items
    - Validate readiness_score is between 0 and 100
    - If diagnostic_id provided, validate it exists by calling get_diagnostic()
    - Store as JSON file in `data/snapshots/{snapshot_id}.json`
    - Set created_at to current UTC timestamp
    - Return True on success, False on failure
    - _Requirements: 2.3, 2.5, 7.1, 7.3, 7.4, 7.5, 7.6_

  - [ ] 3.2 Implement `get_snapshot()` method in `app/database/db_service.py`
    - Accept snapshot_id
    - Read JSON file from `data/snapshots/{snapshot_id}.json`
    - Return dict with all fields or None if not found
    - _Requirements: 4.4_

  - [ ] 3.3 Implement `list_snapshots_by_user()` method in `app/database/db_service.py`
    - Accept user_id
    - Scan all files in `data/snapshots/`
    - Filter by user_id match
    - Sort by created_at descending
    - Return list of snapshot dicts
    - _Requirements: 4.4_

  - [ ] 3.4 Implement `list_snapshots_by_diagnostic()` method in `app/database/db_service.py`
    - Accept diagnostic_id
    - Scan all files in `data/snapshots/`
    - Filter by diagnostic_id match
    - Sort by created_at descending
    - Return list of snapshot dicts
    - _Requirements: 4.5_

- [ ]* 3.5 Write property test for snapshot persistence round trip
  - **Property 4: Snapshot Persistence Round Trip**
  - **Validates: Requirements 2.3, 2.5, 7.1**

- [ ]* 3.6 Write property test for foreign key integrity
  - **Property 6: Foreign Key Integrity**
  - **Validates: Requirements 4.1, 7.5**

- [ ]* 3.7 Write unit tests for snapshot validation
  - Test store_snapshot rejects answer count != 30
  - Test store_snapshot rejects readiness_score < 0 or > 100
  - Test store_snapshot rejects invalid diagnostic_id
  - Test get_snapshot returns None for non-existent ID
  - _Requirements: 7.3, 7.4, 7.5_

- [ ] 4. Checkpoint - Database layer validation
  - Ensure all database tests pass
  - Manually test storing and retrieving diagnostics and snapshots
  - Verify JSON files are created correctly in data/ directories
  - Ask the user if questions arise

- [ ] 5. Create data extraction service
  - [ ] 5.1 Create `app/services/data_extraction.py` with DataExtractionService class
    - Implement `extract_pain_points()` method
    - Implement `extract_workflows()` method
    - Implement `extract_key_processes()` method
    - Implement `determine_automation_level()` method
    - Implement `calculate_data_quality_score()` method
    - Use answer patterns to infer structured data
    - _Requirements: 3.3, 3.4, 3.5_

- [ ]* 5.2 Write property test for data extraction consistency
  - **Property 12: Data Extraction Consistency**
  - **Validates: Requirements 3.3, 3.4, 3.5**

- [ ]* 5.3 Write unit tests for data extraction
  - Test extract_pain_points with various answer patterns
  - Test extract_workflows with documented vs undocumented workflows
  - Test extract_key_processes for each primary_objective
  - Test automation_level determination
  - Test data_quality_score calculation
  - _Requirements: 3.3, 3.4, 3.5_

- [ ] 6. Update diagnostic API to persist data and return ID
  - [ ] 6.1 Modify `/diagnostic/run` endpoint in `app/api/routes/diagnostic.py`
    - Import `generate_diagnostic_id` from `app.utils.id_generator`
    - Import `db` from `app.database.db_service`
    - Update request model to accept optional user_email, company_name, industry
    - Generate diagnostic_id using `generate_diagnostic_id()`
    - Call `db.store_diagnostic()` to persist all data
    - Add diagnostic_id to response JSON
    - Handle database errors with HTTP 500
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 9.1_

- [ ]* 6.2 Write unit test for diagnostic API response
  - Test /diagnostic/run returns diagnostic_id in response
  - Test diagnostic_id follows correct format
  - Test User_Context is persisted when provided
  - _Requirements: 1.4, 9.1_

- [ ] 7. Update snapshot API to persist data, link to diagnostic, and return ID
  - [ ] 7.1 Modify `/diagnostic/snapshot` endpoint in `app/api/routes/diagnostic.py`
    - Import `generate_snapshot_id` from `app.utils.id_generator`
    - Import `db` from `app.database.db_service`
    - Import `DataExtractionService` from `app.services.data_extraction`
    - Update request model to accept optional diagnostic_id, user_email, company_name, industry
    - If diagnostic_id provided, call `db.get_diagnostic()` to retrieve User_Context
    - If diagnostic not found, return HTTP 404
    - Generate snapshot_id using `generate_snapshot_id()`
    - Extract pain_points, workflows, key_processes using DataExtractionService
    - Determine automation_level using DataExtractionService
    - Calculate data_quality_score using DataExtractionService
    - Call `db.store_snapshot()` to persist all data including foreign key
    - Add snapshot_id and diagnostic_id to response JSON
    - Handle database errors with HTTP 500
    - _Requirements: 2.1, 2.2, 2.4, 2.5, 2.6, 5.4, 9.2, 9.3_

- [ ]* 7.2 Write property test for user context inheritance
  - **Property 5: User Context Inheritance**
  - **Validates: Requirements 2.4, 5.2**

- [ ]* 7.3 Write unit tests for snapshot API
  - Test /diagnostic/snapshot returns snapshot_id in response
  - Test snapshot_id follows correct format
  - Test User_Context inherited from diagnostic when diagnostic_id provided
  - Test HTTP 404 when diagnostic_id not found
  - Test pain_points, workflows, key_processes extracted correctly
  - _Requirements: 2.6, 9.2, 9.3_

- [ ] 8. Checkpoint - API layer validation
  - Ensure all API tests pass
  - Manually test diagnostic → snapshot flow with diagnostic_id linkage
  - Verify User_Context inheritance works correctly
  - Verify data extraction produces reasonable results
  - Ask the user if questions arise

- [ ] 9. Update Blueprint generation service to use real snapshot data
  - [ ] 9.1 Modify `_retrieve_snapshot_data()` in `app/services/blueprint_generation.py`
    - Import `db` from `app.database.db_service`
    - Replace mock data with `db.get_snapshot(snapshot_id)` call
    - If snapshot not found, return None
    - Validate user access (user_id matches or user is super_admin)
    - Convert snapshot dict to SnapshotData model
    - Map all fields: snapshot_id, user_email, company_name, readiness_score, primary_objective, industry, key_processes, automation_level, pain_points, workflows, data_quality_score
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.9_

  - [ ] 9.2 Update blueprint metadata storage to include snapshot_id
    - Verify `BlueprintStorageService.store_blueprint()` includes snapshot_id in metadata
    - If not present, add snapshot_id to metadata.json
    - _Requirements: 3.8, 8.1, 8.2, 8.3, 8.4_

- [ ]* 9.3 Write property test for blueprint data authenticity
  - **Property 7: Blueprint Data Authenticity**
  - **Validates: Requirements 3.2, 3.3, 3.4, 3.5, 3.9**

- [ ]* 9.4 Write unit tests for blueprint generation
  - Test _retrieve_snapshot_data() returns real data from database
  - Test _retrieve_snapshot_data() returns None for non-existent snapshot
  - Test _retrieve_snapshot_data() validates user access
  - Test blueprint contains real company_name from snapshot
  - Test blueprint contains real pain_points from snapshot
  - Test blueprint contains no mock data strings
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.9_

- [ ] 10. Implement end-to-end integration tests
  - [ ] 10.1 Write end-to-end flow test
    - Submit diagnostic with User_Context
    - Verify diagnostic_id returned
    - Submit snapshot with diagnostic_id
    - Verify snapshot_id returned and User_Context inherited
    - Generate blueprint with snapshot_id
    - Verify blueprint contains real data from snapshot
    - Verify complete ID chain traceability
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

  - [ ]* 10.2 Write property test for ID chain traceability
    - **Property 8: ID Chain Traceability**
    - **Validates: Requirements 4.2, 4.3, 4.4**

  - [ ]* 10.3 Write property test for zero re-entry validation
    - **Property 9: Zero Re-Entry Validation**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5**

  - [ ] 10.4 Write data loss prevention test
    - Submit diagnostic
    - Simulate page refresh (clear frontend memory)
    - Submit snapshot with diagnostic_id
    - Verify User_Context retrieved from database
    - Simulate page refresh
    - Generate blueprint with snapshot_id
    - Verify all data present in blueprint
    - _Requirements: 10.5_

- [ ] 11. Implement validation error handling
  - [ ] 11.1 Add answer count validation to diagnostic API
    - Return HTTP 422 if answer count != 12
    - Include clear error message with expected vs actual count
    - _Requirements: 6.3_

  - [ ] 11.2 Add answer count validation to snapshot API
    - Return HTTP 422 if answer count != 30
    - Include clear error message with expected vs actual count
    - _Requirements: 7.3_

  - [ ]* 11.3 Write property test for diagnostic answer count validation
    - **Property 11: Diagnostic Answer Count Validation**
    - **Validates: Requirements 6.3**

  - [ ]* 11.4 Write property test for snapshot answer count validation
    - **Property 10: Snapshot Answer Count Validation**
    - **Validates: Requirements 7.3**

- [ ] 12. Final checkpoint - Complete system validation
  - Run all unit tests and property tests
  - Run end-to-end integration tests
  - Manually test complete funnel: diagnostic → snapshot → blueprint
  - Verify zero data loss and zero re-entry
  - Verify blueprint contains personalized data
  - Ensure all tests pass, ask the user if questions arise

## Notes

- Tasks marked with `*` are optional property-based and unit tests
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties using Hypothesis
- Unit tests validate specific examples and edge cases
- Integration tests validate end-to-end data flow
- All database operations use file-based JSON storage (existing pattern)
- Blueprint generation service already has storage methods, only retrieval needs updating
