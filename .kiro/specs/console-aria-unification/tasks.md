# Implementation Plan: Console ARIA Unification

## Overview

This implementation plan unifies the AI Console agent logic by creating a single ARIA module that serves as the source of truth for all console pages. The plan follows an incremental approach: create the unified module, add the backend prompt endpoint, integrate with both console pages, remove legacy code, and add comprehensive testing.

## Tasks

- [x] 1. Create unified ARIA module foundation
  - [x] 1.1 Create `frontend/console-aria.js` with ARIAAgent class structure
    - Implement constructor with config validation
    - Add initialize() method stub
    - Add basic state management (systemPrompt, conversationHistory, currentLanguage)
    - _Requirements: 1.1, 1.2_
  
  - [ ]* 1.2 Write property test for ARIAAgent initialization
    - **Property 2: API Request Context Completeness**
    - **Validates: Requirements 2.3, 2.4, 7.3**
    - Generate random user configs (tier, has_snapshot, has_blueprint)
    - Verify ARIAAgent initializes with all required fields
    - Verify config validation works correctly
  
  - [x] 1.3 Implement language detection logic
    - Add detectLanguage() method with EN/ID/AR patterns
    - Indonesian: detect common words (saya, anda, dengan, untuk, dari, yang, ini, itu, bisa, mau, ingin, tolong, bantu)
    - Arabic: detect Unicode range [\u0600-\u06FF]
    - English: default fallback
    - _Requirements: 1.3, 3.2, 3.3, 3.4_
  
  - [ ]* 1.4 Write property test for language detection
    - **Property 1: Multilingual Detection and Response**
    - **Validates: Requirements 1.3, 3.2, 3.3, 3.4**
    - Generate random messages in EN/ID/AR
    - Verify detectLanguage() returns correct language code
    - Test edge cases (mixed language, empty strings, special characters)

- [x] 2. Implement backend prompt loading
  - [x] 2.1 Add loadSystemPrompt() method to ARIAAgent
    - Fetch from `/api/console/prompt` with tier and user state
    - Handle successful response (store prompt in memory)
    - Handle error response (use fallback prompt)
    - Add timeout handling (5 second timeout)
    - _Requirements: 1.2, 2.1, 2.2_
  
  - [x] 2.2 Add getFallbackPrompt() method with cached ARIA Protocol v2.0
    - Copy complete ARIA Protocol v2.0 from `app/prompts/console_prompts.py`
    - Return as string for offline/fallback use
    - _Requirements: 2.2_
  
  - [x] 2.3 Create backend prompt endpoint in `app/api/routes/console.py`
    - Add POST `/api/console/prompt` route
    - Create PromptRequest model (tier, has_snapshot, has_blueprint)
    - Call get_console_system_prompt() from console_prompts.py
    - Return prompt with version and tier info
    - _Requirements: 1.2, 2.1_
  
  - [ ]* 2.4 Write unit tests for prompt loading
    - Test successful prompt fetch from backend
    - Test fallback when backend unavailable
    - Test prompt includes tier-specific additions
    - Test prompt includes user state context
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [ ] 3. Checkpoint - Verify prompt loading works
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. Implement message sending and API communication
  - [ ] 4.1 Add sendMessage() method to ARIAAgent
    - Detect language from message
    - Build payload with message, context, and conversation history
    - Try backend endpoint first (callBackendEndpoint)
    - Fallback to direct Zenclaw on error (callZenclawDirect)
    - Return response with reasoning metadata
    - _Requirements: 1.4, 3.6, 7.1, 7.2_
  
  - [ ] 4.2 Implement callBackendEndpoint() method
    - POST to `http://localhost:8081/api/console/message`
    - Include full payload with context
    - Handle response parsing
    - Throw error on non-OK status
    - _Requirements: 7.1, 7.3_
  
  - [ ] 4.3 Implement callZenclawDirect() method (fallback)
    - POST to `http://43.156.108.96:8080/chat`
    - Build history from conversation
    - Include system prompt
    - Parse response and build reasoning metadata
    - _Requirements: 7.2_
  
  - [ ]* 4.4 Write property test for API request completeness
    - **Property 2: API Request Context Completeness**
    - **Validates: Requirements 2.3, 2.4, 3.6, 7.3**
    - Generate random messages and user states
    - Intercept API calls
    - Verify all requests include tier, user_id, has_snapshot, has_blueprint, language
  
  - [ ]* 4.5 Write unit tests for endpoint fallback
    - Test backend endpoint is tried first
    - Test Zenclaw fallback when backend fails
    - Test error handling when both fail
    - _Requirements: 7.1, 7.2_

- [ ] 5. Implement streaming and markdown rendering
  - [ ] 5.1 Add streamText() method to ARIAAgent
    - Check prefers-reduced-motion preference
    - If reduced motion: display instantly
    - Otherwise: stream character-by-character (2 chars per 20ms)
    - Render markdown progressively during streaming
    - Call onComplete callback when done
    - _Requirements: 1.5, 10.1, 10.2, 10.3, 10.4_
  
  - [ ] 5.2 Add renderMarkdown() method
    - Use marked.js library for markdown parsing
    - Strip emojis before rendering
    - Configure syntax highlighting with highlight.js
    - Return HTML string
    - _Requirements: 4.4, 10.2_
  
  - [ ] 5.3 Add stripEmojis() method
    - Remove all emoji Unicode ranges
    - Trim whitespace
    - Return cleaned text
    - _Requirements: 4.4_
  
  - [ ]* 5.4 Write property test for emoji stripping
    - **Property 3: Emoji-Free Professional Responses**
    - **Validates: Requirements 4.4**
    - Generate random text with emojis
    - Verify stripEmojis() removes all emojis
    - Verify no emoji Unicode ranges remain
  
  - [ ]* 5.5 Write property test for streaming behavior
    - **Property 8: Streaming Text Rendering**
    - **Validates: Requirements 1.5, 10.1, 10.2**
    - Generate random AI responses
    - Verify text streams character-by-character
    - Verify markdown renders progressively
    - Test prefers-reduced-motion disables streaming

- [ ] 6. Implement conversation persistence
  - [ ] 6.1 Add saveConversation() method to ARIAAgent
    - Store last 50 messages to localStorage
    - Use key 'aria_conversation'
    - Handle localStorage errors gracefully
    - _Requirements: 9.1_
  
  - [ ] 6.2 Add restoreConversation() method
    - Load from localStorage on init
    - Parse JSON and restore to conversationHistory
    - Handle missing or corrupt data
    - _Requirements: 9.2_
  
  - [ ] 6.3 Add clearConversation() method
    - Clear conversationHistory array
    - Remove from localStorage
    - _Requirements: 9.5_
  
  - [ ]* 6.4 Write property test for conversation persistence
    - **Property 7: Conversation Persistence**
    - **Validates: Requirements 9.1, 9.4**
    - Generate random conversations
    - Save to localStorage
    - Verify all messages and metadata are preserved
    - Test restoration after page reload

- [ ] 7. Checkpoint - Verify core ARIA module works
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Implement error handling
  - [ ] 8.1 Add error handling to sendMessage()
    - Catch rate limit errors (429) → throw specific error
    - Catch insufficient credits (402) → throw specific error
    - Catch network errors → throw specific error
    - Log all errors to console
    - _Requirements: 11.1, 11.2, 11.3, 11.5_
  
  - [ ] 8.2 Create error message constants
    - Define ERROR_MESSAGES object with EN/ID/AR translations
    - Include messages for: rate_limit, insufficient_credits, network_error, file_too_large, invalid_file_type
    - _Requirements: 11.1, 11.2, 11.3, 11.4_
  
  - [ ] 8.3 Add getErrorMessage() method
    - Take error type and language
    - Return localized error message
    - _Requirements: 11.1, 11.2, 11.3_
  
  - [ ]* 8.4 Write property test for error logging
    - **Property 10: Error Logging**
    - **Validates: Requirements 11.5**
    - Generate random error scenarios
    - Verify console.error is called for each error
    - Verify error details are logged
  
  - [ ]* 8.5 Write unit tests for error handling
    - Test rate limit error shows correct message
    - Test insufficient credits error shows modal
    - Test network error shows connection message
    - Test file upload error shows toast
    - _Requirements: 11.1, 11.2, 11.3, 11.4_

- [ ] 9. Integrate unified module with console.html
  - [ ] 9.1 Update console.html to load console-aria.js
    - Add script tag for console-aria.js
    - Remove or comment out old console-streaming.js
    - Keep console.js for UI functions (for now)
    - _Requirements: 1.6, 5.5_
  
  - [ ] 9.2 Refactor console.js to use ARIAAgent
    - Initialize ARIAAgent in initConsole()
    - Replace sendMessageWithSimulatedStreaming() with ariaAgent.sendMessage()
    - Use ariaAgent.streamText() for rendering
    - Use ariaAgent.saveConversation() after messages
    - Use ariaAgent.restoreConversation() on load
    - _Requirements: 1.6, 6.1, 6.2_
  
  - [ ] 9.3 Update message handling in console.js
    - Modify addMessage() to use ARIAAgent streaming
    - Update showTypingIndicator() and hideTypingIndicator()
    - Ensure credit deduction works with new flow
    - _Requirements: 12.1, 12.2_
  
  - [ ]* 9.4 Write integration tests for console.html
    - Test page loads and initializes ARIAAgent
    - Test sending message triggers API call
    - Test response streams correctly
    - Test conversation persists across reload
    - _Requirements: 1.6, 9.2, 9.3_

- [ ] 10. Integrate unified module with console-premium.html
  - [ ] 10.1 Update console-premium.html to load console-aria.js
    - Add script tag for console-aria.js
    - Keep console-premium.js for UI-specific functions
    - _Requirements: 6.1_
  
  - [ ] 10.2 Refactor console-premium.js to use ARIAAgent
    - Initialize ARIAAgent in initConsole()
    - Replace simulateAIResponse() with ariaAgent.sendMessage()
    - Use ariaAgent.streamText() for rendering
    - Use ariaAgent.saveConversation() and restoreConversation()
    - _Requirements: 6.1, 6.3, 6.4, 6.5_
  
  - [ ]* 10.3 Write property test for consistent behavior across pages
    - **Property 5: Consistent Behavior Across Console Pages**
    - **Validates: Requirements 6.3, 6.4, 6.5**
    - Generate random operations (send message, stream response, save conversation)
    - Execute on both console.html and console-premium.html
    - Verify identical behavior and output
  
  - [ ]* 10.4 Write property test for consistent error handling
    - **Property 6: Consistent Error Handling Across Pages**
    - **Validates: Requirements 7.4, 7.5**
    - Generate random error scenarios
    - Trigger on both console pages
    - Verify identical error handling and UI response

- [ ] 11. Checkpoint - Verify both console pages work
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 12. Create multilingual test page
  - [ ] 12.1 Create `frontend/console-aria-test.html`
    - Add test sections for EN/ID/AR introduction
    - Add test sections for language-specific responses
    - Add test section for language switching
    - Add test section for business-centric responses
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_
  
  - [ ] 12.2 Implement test functions in console-aria-test.html
    - testEnglishIntro() - verify ARIA introduces in English
    - testIndonesianResponse() - verify Indonesian response
    - testArabicResponse() - verify Arabic response
    - testLanguageSwitching() - verify language switch works
    - testBusinessCentric() - verify Aivory-focused responses
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.1_
  
  - [ ] 12.3 Add visual test result indicators
    - Show pass/fail status for each test
    - Display response text for manual verification
    - Show detected language for each message
    - _Requirements: 8.3, 8.4_
  
  - [ ]* 12.4 Write unit tests for test page functionality
    - Test page loads correctly
    - Test buttons trigger test functions
    - Test results display correctly
    - _Requirements: 8.2, 8.3, 8.4, 8.5, 8.6_

- [ ] 13. Implement ARIA identity verification
  - [ ] 13.1 Add verifyARIAIdentity() helper method
    - Check if text contains "ARIA"
    - Check if text contains "Aivory"
    - Check if text does NOT contain "ChatGPT", "Claude", "OpenAI", "Anthropic"
    - Return boolean result
    - _Requirements: 4.1, 4.2, 4.3_
  
  - [ ]* 13.2 Write property test for ARIA identity consistency
    - **Property 4: ARIA Identity Consistency**
    - **Validates: Requirements 4.2, 4.3**
    - Generate random introduction scenarios
    - Verify ARIA name is used correctly
    - Verify no other model names appear in responses

- [ ] 14. Implement credit management integration
  - [ ] 14.1 Add credit tracking to ARIAAgent
    - Store current credits in config
    - Deduct 1 credit after successful message
    - Update config.credits after each message
    - _Requirements: 12.1_
  
  - [ ] 14.2 Add credit validation before sending
    - Check if credits > 0 before sending message
    - Throw insufficient credits error if credits = 0
    - _Requirements: 12.3, 12.4_
  
  - [ ] 14.3 Add updateCredits() callback support
    - Allow passing callback to ARIAAgent constructor
    - Call callback after credit deduction
    - Pass new credit balance to callback
    - _Requirements: 12.2_
  
  - [ ]* 14.4 Write property test for credit management
    - **Property 11: Credit Deduction and UI Update**
    - **Validates: Requirements 12.1, 12.2**
    - Generate random messages
    - Verify credit deduction happens for each message
    - Verify callback is called with new balance
  
  - [ ]* 14.5 Write unit tests for credit validation
    - Test message sending blocked when credits = 0
    - Test insufficient credits modal shown
    - Test credit balance fetched on page load
    - _Requirements: 12.3, 12.4, 12.5_

- [ ] 15. Clean up legacy code
  - [ ] 15.1 Deprecate console-streaming.js
    - Add deprecation comment at top of file
    - Document that logic is now in console-aria.js
    - Keep file temporarily for reference
    - _Requirements: 5.1_
  
  - [ ] 15.2 Remove duplicate functions from console.js
    - Remove old sendMessageWithSimulatedStreaming() if fully replaced
    - Remove old streamText() if using ARIAAgent version
    - Remove old language detection if using ARIAAgent version
    - Keep UI-specific functions (addMessage, showTypingIndicator, etc.)
    - _Requirements: 5.2_
  
  - [ ] 15.3 Remove duplicate functions from console-premium.js
    - Remove simulateAIResponse() if using ARIAAgent
    - Remove old streamText() if using ARIAAgent version
    - Keep UI-specific functions
    - _Requirements: 5.2_
  
  - [ ] 15.4 Update documentation
    - Create CONSOLE_ARIA_MIGRATION.md documenting changes
    - List deprecated files and their replacements
    - Document new ARIAAgent API
    - Add migration guide for future console pages
    - _Requirements: 5.3_
  
  - [ ] 15.5 Verify no orphaned code references
    - Search for references to deprecated functions
    - Update or remove orphaned references
    - Ensure all console pages use unified module
    - _Requirements: 5.4, 5.5_

- [ ] 16. Final checkpoint - End-to-end verification
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 17. Write comprehensive test suite
  - [ ]* 17.1 Write property test for code highlighting
    - **Property 9: Code Highlighting After Streaming**
    - **Validates: Requirements 10.5**
    - Generate random responses with code blocks
    - Verify syntax highlighting is applied after streaming completes
    - Test multiple languages (JavaScript, Python, JSON, etc.)
  
  - [ ]* 17.2 Write integration tests for full message flow
    - Test: User sends message → ARIA responds → Conversation saved
    - Test: Page reload → Conversation restored → Messages display correctly
    - Test: Language detection → Correct language response
    - Test: Error occurs → Error message displayed → Error logged
  
  - [ ]* 17.3 Write edge case tests
    - Test empty message handling
    - Test very long messages (>10,000 characters)
    - Test rapid message sending
    - Test network timeout scenarios
    - Test invalid API responses
  
  - [ ]* 17.4 Configure property tests for CI
    - Set minimum 100 iterations per property test
    - Add property test tags for all 11 properties
    - Configure timeout for long-running tests
    - Add test coverage reporting

- [ ] 18. Manual testing and QA
  - [ ] 18.1 Test English conversation flow
    - Open console.html
    - Send "Hello" and verify ARIA introduces itself
    - Send follow-up questions and verify responses
    - Verify no emojis in responses
    - Verify conversation persists after reload
  
  - [ ] 18.2 Test Indonesian conversation flow
    - Open console.html
    - Send "Halo, saya ingin membuat workflow"
    - Verify response is in Indonesian
    - Verify ARIA introduces itself in Indonesian
    - Test language switching to English
  
  - [ ] 18.3 Test Arabic conversation flow
    - Open console.html
    - Send "مرحباً، أريد إنشاء سير عمل"
    - Verify response is in Arabic
    - Verify ARIA introduces itself in Arabic
    - Test language switching to English
  
  - [ ] 18.4 Test premium console
    - Open console-premium.html
    - Verify same behavior as console.html
    - Verify premium UI styling is maintained
    - Verify conversation persistence works
  
  - [ ] 18.5 Test error scenarios
    - Test with backend offline (should fallback to Zenclaw)
    - Test with zero credits (should show modal)
    - Test with rate limit error (should show message)
    - Test with network disconnected (should show error)

## Notes

- Tasks marked with `*` are optional test-related sub-tasks and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The implementation follows an incremental approach: core module → backend integration → console integration → testing → cleanup
