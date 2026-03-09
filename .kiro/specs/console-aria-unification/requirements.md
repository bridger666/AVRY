# Requirements Document

## Introduction

The AI Console currently suffers from a behavioral split caused by multiple JavaScript implementations with different prompts and logic. The backend has the correct ARIA Protocol v2.0 implementation in `app/prompts/console_prompts.py`, but the frontend has three separate JavaScript files (`console.js`, `console-premium.js`, `console-streaming.js`) that don't consistently use this protocol. This leads to inconsistent agent behavior, unreliable multilingual support, and maintenance complexity.

This specification defines requirements for unifying all console agent logic to use a single ARIA implementation, ensuring consistent behavior across all console pages and reliable multilingual support (EN/ID/AR).

## Glossary

- **ARIA**: Aivory Reasoning & Intelligence Assistant - the branded AI agent identity
- **ARIA_Protocol**: The system prompt and behavioral rules defined in `app/prompts/console_prompts.py`
- **Console**: The AI command interface for interacting with Aivory workflows and services
- **Zenclaw_Endpoint**: The backend LLM API endpoint at `http://43.156.108.96:8080/chat`
- **Backend_Endpoint**: The local Sumopod API endpoint at `http://localhost:8081/api/console/message`
- **Multilingual_Support**: Automatic language detection and response in EN/ID/AR
- **Streaming_Response**: Character-by-character text reveal for AI responses
- **Console_Premium**: The premium console page at `frontend/console-premium.html`
- **Console_Standard**: The standard console page at `frontend/console.html`
- **Unified_ARIA_Module**: The single JavaScript module that will handle all ARIA agent logic

## Requirements

### Requirement 1: Single Source of Truth for ARIA Logic

**User Story:** As a developer, I want one unified ARIA agent module, so that all console pages use consistent behavior and I only maintain one implementation.

#### Acceptance Criteria

1. THE System SHALL create a single JavaScript module that contains all ARIA agent logic
2. THE System SHALL load the ARIA system prompt from the backend endpoint
3. THE System SHALL handle language detection for EN/ID/AR
4. THE System SHALL manage LLM API calls to the Zenclaw endpoint
5. THE System SHALL implement streaming responses for AI messages
6. THE System SHALL be used by both console.html and console-premium.html

### Requirement 2: Backend ARIA Prompt Integration

**User Story:** As a system architect, I want the frontend to use the backend ARIA prompt, so that prompt updates are centralized and consistent.

#### Acceptance Criteria

1. WHEN the unified module initializes, THE System SHALL fetch the ARIA system prompt from the backend
2. WHEN the backend prompt is unavailable, THE System SHALL use a cached fallback version
3. THE System SHALL include user tier information when fetching the prompt
4. THE System SHALL include user state (has_snapshot, has_blueprint) when fetching the prompt
5. THE System SHALL refresh the prompt when user tier or state changes

### Requirement 3: Multilingual Behavior

**User Story:** As a multilingual user, I want ARIA to detect my language and respond consistently, so that I can interact in my preferred language (EN/ID/AR).

#### Acceptance Criteria

1. WHEN a user sends their first message, THE System SHALL introduce ARIA in the detected language
2. WHEN a user writes in Indonesian, THE System SHALL respond in Indonesian
3. WHEN a user writes in English, THE System SHALL respond in English
4. WHEN a user writes in Arabic, THE System SHALL respond in Arabic
5. WHEN a user explicitly requests a language switch, THE System SHALL switch and continue in that language
6. THE System SHALL pass language context to the backend with each message

### Requirement 4: Consistent Agent Identity

**User Story:** As a user, I want ARIA to consistently introduce itself, so that I know I'm interacting with Aivory's branded assistant.

#### Acceptance Criteria

1. WHEN starting a new conversation, THE System SHALL ensure ARIA introduces itself in the first response
2. THE System SHALL never refer to itself as ChatGPT, Claude, or any other model name
3. THE System SHALL always identify as "ARIA – Aivory Reasoning & Intelligence Assistant"
4. THE System SHALL strip emojis from AI responses for professional tone
5. THE System SHALL follow ARIA Protocol behavioral rules (no filler phrases, business-centric)

### Requirement 5: Legacy Code Removal

**User Story:** As a developer, I want duplicate and legacy scripts removed, so that the codebase is clean and maintainable.

#### Acceptance Criteria

1. WHEN the unified module is complete, THE System SHALL remove or deprecate `console-streaming.js` if its logic is fully integrated
2. THE System SHALL consolidate duplicate functions from `console.js` and `console-premium.js`
3. THE System SHALL document which files are deprecated and which are active
4. THE System SHALL ensure no orphaned code references remain
5. THE System SHALL update HTML files to reference only the unified module

### Requirement 6: Premium Console Integration

**User Story:** As a premium user, I want the premium console to use the unified ARIA implementation, so that I get consistent behavior with the standard console.

#### Acceptance Criteria

1. WHEN using console-premium.html, THE System SHALL use the unified ARIA module
2. THE System SHALL maintain premium-specific UI features (styling, layout)
3. THE System SHALL use the same message handling logic as the standard console
4. THE System SHALL use the same streaming implementation as the standard console
5. THE System SHALL use the same conversation persistence as the standard console

### Requirement 7: API Endpoint Consistency

**User Story:** As a system architect, I want consistent API endpoint usage, so that all console pages communicate with the backend the same way.

#### Acceptance Criteria

1. THE System SHALL use the Backend_Endpoint (`http://localhost:8081/api/console/message`) as the primary endpoint
2. WHEN the Backend_Endpoint is unavailable, THE System SHALL fall back to direct Zenclaw_Endpoint communication
3. THE System SHALL include tier, user_id, has_snapshot, and has_blueprint in all API requests
4. THE System SHALL handle rate limit errors consistently across all console pages
5. THE System SHALL handle insufficient credits errors consistently across all console pages

### Requirement 8: Testing and Verification

**User Story:** As a QA engineer, I want an internal test page for multilingual verification, so that I can validate EN/ID/AR behavior works correctly.

#### Acceptance Criteria

1. THE System SHALL create an internal test page for ARIA multilingual testing
2. THE Test_Page SHALL allow sending messages in EN/ID/AR
3. THE Test_Page SHALL display the detected language for each message
4. THE Test_Page SHALL show whether ARIA introduced itself correctly
5. THE Test_Page SHALL verify business-centric, Aivory-focused responses
6. THE Test_Page SHALL test language switching behavior

### Requirement 9: Conversation Persistence

**User Story:** As a user, I want my conversation history to persist across page reloads, so that I don't lose context when refreshing the page.

#### Acceptance Criteria

1. WHEN a user sends a message, THE System SHALL save the conversation to localStorage
2. WHEN a user reloads the page, THE System SHALL restore the last 50 messages
3. THE System SHALL restore messages without streaming effect (instant display)
4. THE System SHALL maintain message metadata (timestamp, reasoning, files)
5. THE System SHALL provide a clear conversation function that removes localStorage data

### Requirement 10: Streaming Response Implementation

**User Story:** As a user, I want AI responses to stream character-by-character, so that I see progressive output and the interface feels responsive.

#### Acceptance Criteria

1. WHEN ARIA responds, THE System SHALL stream text character-by-character
2. THE System SHALL render markdown progressively during streaming
3. THE System SHALL respect prefers-reduced-motion for accessibility
4. WHEN prefers-reduced-motion is set, THE System SHALL display responses instantly
5. THE System SHALL highlight code blocks after streaming completes

### Requirement 11: Error Handling

**User Story:** As a user, I want clear error messages when something goes wrong, so that I understand what happened and what to do next.

#### Acceptance Criteria

1. WHEN the API returns a rate limit error, THE System SHALL display a user-friendly message
2. WHEN the API returns insufficient credits error, THE System SHALL show an upgrade modal
3. WHEN the network connection fails, THE System SHALL explain the connection issue
4. WHEN file upload fails, THE System SHALL show a specific error toast
5. THE System SHALL log all errors to the console for debugging

### Requirement 12: Credit Management

**User Story:** As a user, I want to see my credit balance update after each message, so that I know how many credits I have remaining.

#### Acceptance Criteria

1. WHEN a message is sent, THE System SHALL deduct 1 credit from the user's balance
2. THE System SHALL update the credit display after each message
3. WHEN credits reach zero, THE System SHALL prevent sending messages
4. THE System SHALL show an insufficient credits modal when attempting to send with zero credits
5. THE System SHALL fetch current credit balance from the backend on page load
