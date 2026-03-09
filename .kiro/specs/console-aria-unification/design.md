# Design Document: Console ARIA Unification

## Overview

This design unifies the AI Console agent logic to use a single ARIA implementation, eliminating the behavioral split caused by multiple JavaScript files with different prompts and logic. The solution creates one unified ARIA module that loads the ARIA Protocol v2.0 system prompt from the backend, handles multilingual support (EN/ID/AR), manages LLM API calls, and implements streaming responses consistently across all console pages.

The key architectural change is moving from three separate JavaScript implementations (`console.js`, `console-premium.js`, `console-streaming.js`) to a single unified module (`console-aria.js`) that serves as the single source of truth for all ARIA agent behavior.

## Architecture

### Current Architecture (Problem)

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Layer                            │
├─────────────────────────────────────────────────────────────┤
│  console.html          console-premium.html                  │
│       │                        │                             │
│       ├─ console.js            ├─ console-premium.js         │
│       │  (849 lines)           │  (mock responses)           │
│       │  - Zenclaw endpoint    │  - Different prompts        │
│       │  - Own prompt logic    │  - Different streaming      │
│       │                        │                             │
│       └─ console-streaming.js (shared, but inconsistent)     │
│          - Direct Zenclaw calls                              │
│          - Hardcoded AIVORY_SYSTEM_PROMPT                    │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend Layer                             │
├─────────────────────────────────────────────────────────────┤
│  app/api/routes/console.py                                   │
│       │                                                      │
│       ├─ /api/console/message                               │
│       │                                                      │
│       ▼                                                      │
│  app/services/console_service.py                            │
│       │                                                      │
│       ├─ Uses get_console_system_prompt()                   │
│       │                                                      │
│       ▼                                                      │
│  app/prompts/console_prompts.py                             │
│       │                                                      │
│       └─ ARIA Protocol v2.0 (CORRECT IMPLEMENTATION)        │
│          - Multilingual support                              │
│          - Branded identity                                  │
│          - Business-centric behavior                         │
└─────────────────────────────────────────────────────────────┘

PROBLEM: Frontend has multiple implementations with different prompts,
         not consistently using the backend ARIA Protocol v2.0
```

### Target Architecture (Solution)

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Layer                            │
├─────────────────────────────────────────────────────────────┤
│  console.html          console-premium.html                  │
│       │                        │                             │
│       └────────┬───────────────┘                             │
│                │                                             │
│                ▼                                             │
│       ┌──────────────────────────────────┐                  │
│       │   console-aria.js (UNIFIED)      │                  │
│       │   - Single source of truth       │                  │
│       │   - Loads backend ARIA prompt    │                  │
│       │   - Multilingual detection       │                  │
│       │   - Streaming implementation     │                  │
│       │   - API communication            │                  │
│       └──────────────────────────────────┘                  │
│                │                                             │
│                ├─ Primary: Backend Endpoint                  │
│                │  (http://localhost:8081/api/console/message)│
│                │                                             │
│                └─ Fallback: Direct Zenclaw                   │
│                   (http://43.156.108.96:8080/chat)          │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend Layer                             │
├─────────────────────────────────────────────────────────────┤
│  app/api/routes/console.py                                   │
│       │                                                      │
│       ├─ /api/console/message                               │
│       ├─ /api/console/prompt (NEW)                          │
│       │                                                      │
│       ▼                                                      │
│  app/services/console_service.py                            │
│       │                                                      │
│       ├─ Uses get_console_system_prompt()                   │
│       │                                                      │
│       ▼                                                      │
│  app/prompts/console_prompts.py                             │
│       │                                                      │
│       └─ ARIA Protocol v2.0 (SINGLE SOURCE OF TRUTH)        │
│          - Multilingual support                              │
│          - Branded identity                                  │
│          - Business-centric behavior                         │
└─────────────────────────────────────────────────────────────┘

SOLUTION: One unified module, backend ARIA prompt as source of truth,
          consistent behavior across all console pages
```

### Communication Flow

```
User Message Flow:
1. User types message in console.html or console-premium.html
2. console-aria.js captures message
3. console-aria.js detects language (EN/ID/AR)
4. console-aria.js sends to Backend Endpoint with context:
   - message
   - tier
   - user_id
   - has_snapshot
   - has_blueprint
   - detected_language
5. Backend loads ARIA prompt with tier-specific additions
6. Backend calls Zenclaw with ARIA prompt + message
7. Backend returns response
8. console-aria.js streams response character-by-character
9. console-aria.js saves conversation to localStorage

Prompt Loading Flow:
1. Page loads (console.html or console-premium.html)
2. console-aria.js initializes
3. console-aria.js fetches ARIA prompt from /api/console/prompt
4. Backend returns ARIA prompt with tier-specific additions
5. console-aria.js caches prompt in memory
6. If backend unavailable, use hardcoded fallback
```

## Components and Interfaces

### 1. Unified ARIA Module (`frontend/console-aria.js`)

The core module that handles all ARIA agent logic.

```javascript
/**
 * AIVORY AI Console - Unified ARIA Module
 * Single source of truth for ARIA agent behavior
 */

class ARIAAgent {
    constructor(config) {
        this.config = config;
        this.systemPrompt = null;
        this.conversationHistory = [];
        this.currentLanguage = 'en';
        this.isInitialized = false;
    }
    
    // Initialize agent and load ARIA prompt
    async initialize() {
        await this.loadSystemPrompt();
        this.restoreConversation();
        this.isInitialized = true;
    }
    
    // Load ARIA system prompt from backend
    async loadSystemPrompt() {
        try {
            const response = await fetch('/api/console/prompt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tier: this.config.tier,
                    has_snapshot: this.config.has_snapshot,
                    has_blueprint: this.config.has_blueprint
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                this.systemPrompt = data.prompt;
            } else {
                this.systemPrompt = this.getFallbackPrompt();
            }
        } catch (error) {
            console.warn('Failed to load ARIA prompt, using fallback');
            this.systemPrompt = this.getFallbackPrompt();
        }
    }
    
    // Detect language from message
    detectLanguage(message) {
        // Indonesian detection
        const indonesianPatterns = /\b(saya|anda|dengan|untuk|dari|yang|ini|itu|bisa|mau|ingin|tolong|bantu)\b/i;
        if (indonesianPatterns.test(message)) {
            return 'id';
        }
        
        // Arabic detection
        const arabicPattern = /[\u0600-\u06FF]/;
        if (arabicPattern.test(message)) {
            return 'ar';
        }
        
        // Default to English
        return 'en';
    }
    
    // Send message to backend
    async sendMessage(message, options = {}) {
        const language = this.detectLanguage(message);
        this.currentLanguage = language;
        
        const payload = {
            message: message,
            files: options.files || [],
            workflow: options.workflow || null,
            context: {
                tier: this.config.tier,
                user_id: this.config.userId,
                has_snapshot: this.config.has_snapshot,
                has_blueprint: this.config.has_blueprint,
                language: language,
                conversation_history: this.conversationHistory.slice(-10)
            }
        };
        
        try {
            // Try backend endpoint first
            const response = await this.callBackendEndpoint(payload);
            return response;
        } catch (error) {
            console.warn('Backend endpoint failed, trying direct Zenclaw');
            // Fallback to direct Zenclaw
            return await this.callZenclawDirect(payload);
        }
    }
    
    // Call backend endpoint
    async callBackendEndpoint(payload) {
        const response = await fetch('http://localhost:8081/api/console/message', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
            throw new Error(`Backend error: ${response.status}`);
        }
        
        return await response.json();
    }
    
    // Call Zenclaw directly (fallback)
    async callZenclawDirect(payload) {
        const history = payload.context.conversation_history.map(m => ({
            role: m.role,
            content: m.content
        }));
        
        const response = await fetch('http://43.156.108.96:8080/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: payload.message,
                history: history,
                system_prompt: this.systemPrompt
            })
        });
        
        if (!response.ok) {
            throw new Error(`Zenclaw error: ${response.status}`);
        }
        
        const data = await response.json();
        return {
            response: data.reply,
            reasoning: {
                model: data.model_used || 'unknown',
                tokens: data.reply.split(' ').length * 2,
                confidence: 0.85,
                cost: 1
            },
            credits_remaining: this.config.credits - 1
        };
    }
    
    // Stream text character-by-character
    streamText(container, text, onComplete) {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        
        if (prefersReducedMotion) {
            container.innerHTML = this.renderMarkdown(text);
            if (onComplete) onComplete();
            return;
        }
        
        let index = 0;
        const charsPerFrame = 2;
        const frameDelay = 20;
        let accumulatedText = '';
        
        const addNextChars = () => {
            if (index < text.length) {
                const nextChars = text.slice(index, index + charsPerFrame);
                accumulatedText += nextChars;
                index += charsPerFrame;
                
                container.innerHTML = this.renderMarkdown(accumulatedText);
                setTimeout(addNextChars, frameDelay);
            } else {
                container.innerHTML = this.renderMarkdown(text);
                if (onComplete) onComplete();
            }
        };
        
        addNextChars();
    }
    
    // Render markdown
    renderMarkdown(text) {
        if (typeof marked === 'undefined') {
            return this.escapeHtml(text).replace(/\n/g, '<br>');
        }
        
        // Strip emojis for professional tone
        text = this.stripEmojis(text);
        
        return marked.parse(text);
    }
    
    // Strip emojis
    stripEmojis(text) {
        return text.replace(/[\u{1F300}-\u{1FFFF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{FE00}-\u{FE0F}]|[\u{1F900}-\u{1F9FF}]/gu, '').trim();
    }
    
    // Save conversation to localStorage
    saveConversation() {
        try {
            const messagesToStore = this.conversationHistory.slice(-50);
            localStorage.setItem('aria_conversation', JSON.stringify(messagesToStore));
        } catch (error) {
            console.error('Error saving conversation:', error);
        }
    }
    
    // Restore conversation from localStorage
    restoreConversation() {
        try {
            const stored = localStorage.getItem('aria_conversation');
            if (stored) {
                this.conversationHistory = JSON.parse(stored);
            }
        } catch (error) {
            console.error('Error restoring conversation:', error);
        }
    }
    
    // Clear conversation
    clearConversation() {
        this.conversationHistory = [];
        localStorage.removeItem('aria_conversation');
    }
    
    // Get fallback prompt (cached version of ARIA Protocol v2.0)
    getFallbackPrompt() {
        return `# ARIA PROTOCOL v2.0 — Aivory Reasoning & Intelligence Assistant

## CORE IDENTITY

You are ARIA – the built-in AI workspace assistant inside Aivory.

**Full identity:** "ARIA – Aivory Reasoning & Intelligence Assistant" (short: ARIA)

**On the first reply of each new conversation/session, you MUST introduce yourself clearly:**

Examples:
- English: "Hi, I'm ARIA – Aivory's Reasoning & Intelligence Assistant. How can I help you with your workflows or workspace today?"
- Bahasa Indonesia: "Halo, saya ARIA – Aivory Reasoning & Intelligence Assistant. Saya bisa bantu kamu mengatur workflow, blueprint, dan otomatisasi di Aivory. Mau mulai dari mana?"
- Arabic: "مرحباً، أنا ARIA – مساعد الذكاء والتفكير في منصة Aivory. يمكنني مساعدتك في إدارة مسارات العمل والمهام والتكاملات لديك. كيف تحب أن نبدأ؟"

## MULTILINGUAL BEHAVIOR (CRITICAL)

You are a multilingual assistant and MUST adapt to the user's language.

**Supported languages:**
- English
- Bahasa Indonesia
- Arabic (العربية)

**Language detection rules:**
1. Detect the language of the user's message and reply in that SAME language
2. If the user explicitly asks to switch languages, switch and continue
3. If the user mixes languages, prefer the language they most recently requested explicitly

## BEHAVIOR AND TONE (Claude Opus-style)

**Be business-centric, professional, and focused on practical outcomes:**

1. MINIMIZE HALLUCINATIONS - If unsure, say so clearly
2. BE SOLUTION-ORIENTED - Propose clear plans with concrete steps
3. STRUCTURE AND CLARITY - Lead with direct answer, then details
4. PROFESSIONAL TONE - No emoji, no filler phrases, no informal address

## AIVORY-CENTRIC SOLUTIONS (CRITICAL)

**Your first instinct must ALWAYS be: "How can this be solved inside Aivory / Zenclaw / n8n?"**

- All automation solutions should use Aivory/Zenclaw/n8n ecosystem
- Do NOT routinely recommend random free tools or external services
- Focus on what can be built within the Aivory platform`;
    }
    
    // Escape HTML
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Export for use in console pages
window.ARIAAgent = ARIAAgent;
```

### 2. Backend Prompt Endpoint (`app/api/routes/console.py`)

New endpoint to serve the ARIA system prompt to the frontend.

```python
@router.post("/prompt")
async def get_prompt(request: PromptRequest):
    """
    Get ARIA system prompt with tier-specific additions.
    
    Returns the complete ARIA Protocol v2.0 prompt configured
    for the user's tier and state.
    """
    try:
        prompt = get_console_system_prompt(
            tier=request.tier,
            has_snapshot=request.has_snapshot,
            has_blueprint=request.has_blueprint
        )
        
        return {
            "prompt": prompt,
            "version": "2.0",
            "tier": request.tier
        }
        
    except Exception as e:
        logger.error(f"Error fetching prompt: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch prompt")

class PromptRequest(BaseModel):
    tier: str
    has_snapshot: bool = False
    has_blueprint: bool = False
```

### 3. Console Page Integration

Both `console.html` and `console-premium.html` will use the unified module.

```html
<!-- Load unified ARIA module -->
<script src="console-aria.js"></script>

<script>
// Initialize ARIA agent
const ariaAgent = new ARIAAgent({
    tier: getUserTier(),
    userId: getUserId(),
    has_snapshot: hasSnapshot(),
    has_blueprint: hasBlueprint(),
    credits: getCredits()
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    await ariaAgent.initialize();
    setupEventListeners();
});

// Send message handler
async function handleSend() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    // Clear input
    input.value = '';
    
    // Add user message to UI
    addUserMessage(message);
    
    // Show typing indicator
    showTypingIndicator();
    
    try {
        // Send to ARIA
        const response = await ariaAgent.sendMessage(message);
        
        // Hide typing indicator
        hideTypingIndicator();
        
        // Stream AI response
        addAIMessage(response.response, response.reasoning);
        
        // Update credits
        updateCredits(response.credits_remaining);
        
        // Save conversation
        ariaAgent.saveConversation();
        
    } catch (error) {
        hideTypingIndicator();
        showErrorMessage(error.message);
    }
}
</script>
```

### 4. Multilingual Test Page (`frontend/console-aria-test.html`)

Internal test page for verifying multilingual behavior.

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>ARIA Multilingual Test</title>
    <style>
        body {
            font-family: 'Inter', sans-serif;
            background: #0a0118;
            color: white;
            padding: 2rem;
        }
        .test-section {
            background: rgba(255,255,255,0.05);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 12px;
            padding: 1.5rem;
            margin-bottom: 1rem;
        }
        .test-result {
            padding: 1rem;
            margin-top: 1rem;
            border-radius: 8px;
        }
        .test-pass {
            background: rgba(7, 209, 151, 0.1);
            border: 1px solid #07d197;
        }
        .test-fail {
            background: rgba(255, 68, 68, 0.1);
            border: 1px solid #ff4444;
        }
    </style>
</head>
<body>
    <h1>ARIA Multilingual Test Suite</h1>
    
    <div class="test-section">
        <h2>Test 1: English Introduction</h2>
        <button onclick="testEnglishIntro()">Run Test</button>
        <div id="test1-result" class="test-result"></div>
    </div>
    
    <div class="test-section">
        <h2>Test 2: Indonesian Response</h2>
        <button onclick="testIndonesianResponse()">Run Test</button>
        <div id="test2-result" class="test-result"></div>
    </div>
    
    <div class="test-section">
        <h2>Test 3: Arabic Response</h2>
        <button onclick="testArabicResponse()">Run Test</button>
        <div id="test3-result" class="test-result"></div>
    </div>
    
    <div class="test-section">
        <h2>Test 4: Language Switching</h2>
        <button onclick="testLanguageSwitching()">Run Test</button>
        <div id="test4-result" class="test-result"></div>
    </div>
    
    <div class="test-section">
        <h2>Test 5: Business-Centric Responses</h2>
        <button onclick="testBusinessCentric()">Run Test</button>
        <div id="test5-result" class="test-result"></div>
    </div>
    
    <script src="console-aria.js"></script>
    <script>
        const ariaAgent = new ARIAAgent({
            tier: 'enterprise',
            userId: 'test_user',
            has_snapshot: false,
            has_blueprint: false,
            credits: 100
        });
        
        async function testEnglishIntro() {
            const result = document.getElementById('test1-result');
            result.textContent = 'Testing...';
            
            try {
                await ariaAgent.initialize();
                const response = await ariaAgent.sendMessage('Hello');
                
                const hasARIA = response.response.includes('ARIA');
                const hasIntro = response.response.toLowerCase().includes('aivory');
                const noEmoji = !/[\u{1F300}-\u{1FFFF}]/u.test(response.response);
                
                if (hasARIA && hasIntro && noEmoji) {
                    result.className = 'test-result test-pass';
                    result.textContent = '✅ PASS: ARIA introduced correctly in English';
                } else {
                    result.className = 'test-result test-fail';
                    result.textContent = '❌ FAIL: Missing ARIA introduction or contains emoji';
                }
            } catch (error) {
                result.className = 'test-result test-fail';
                result.textContent = `❌ ERROR: ${error.message}`;
            }
        }
        
        async function testIndonesianResponse() {
            const result = document.getElementById('test2-result');
            result.textContent = 'Testing...';
            
            try {
                const response = await ariaAgent.sendMessage('Halo, saya ingin membuat workflow');
                
                const indonesianWords = ['saya', 'anda', 'bisa', 'untuk', 'dengan'];
                const hasIndonesian = indonesianWords.some(word => 
                    response.response.toLowerCase().includes(word)
                );
                
                if (hasIndonesian) {
                    result.className = 'test-result test-pass';
                    result.textContent = '✅ PASS: Responded in Indonesian';
                } else {
                    result.className = 'test-result test-fail';
                    result.textContent = '❌ FAIL: Did not respond in Indonesian';
                }
            } catch (error) {
                result.className = 'test-result test-fail';
                result.textContent = `❌ ERROR: ${error.message}`;
            }
        }
        
        async function testArabicResponse() {
            const result = document.getElementById('test3-result');
            result.textContent = 'Testing...';
            
            try {
                const response = await ariaAgent.sendMessage('مرحباً، أريد إنشاء سير عمل');
                
                const hasArabic = /[\u0600-\u06FF]/.test(response.response);
                
                if (hasArabic) {
                    result.className = 'test-result test-pass';
                    result.textContent = '✅ PASS: Responded in Arabic';
                } else {
                    result.className = 'test-result test-fail';
                    result.textContent = '❌ FAIL: Did not respond in Arabic';
                }
            } catch (error) {
                result.className = 'test-result test-fail';
                result.textContent = `❌ ERROR: ${error.message}`;
            }
        }
        
        async function testLanguageSwitching() {
            const result = document.getElementById('test4-result');
            result.textContent = 'Testing...';
            
            try {
                await ariaAgent.sendMessage('Hello');
                const response = await ariaAgent.sendMessage('Can you answer in Indonesian?');
                
                const indonesianWords = ['saya', 'anda', 'bisa'];
                const hasIndonesian = indonesianWords.some(word => 
                    response.response.toLowerCase().includes(word)
                );
                
                if (hasIndonesian) {
                    result.className = 'test-result test-pass';
                    result.textContent = '✅ PASS: Successfully switched to Indonesian';
                } else {
                    result.className = 'test-result test-fail';
                    result.textContent = '❌ FAIL: Did not switch language';
                }
            } catch (error) {
                result.className = 'test-result test-fail';
                result.textContent = `❌ ERROR: ${error.message}`;
            }
        }
        
        async function testBusinessCentric() {
            const result = document.getElementById('test5-result');
            result.textContent = 'Testing...';
            
            try {
                const response = await ariaAgent.sendMessage('I need automation');
                
                const hasAivory = response.response.toLowerCase().includes('aivory');
                const hasZenclaw = response.response.toLowerCase().includes('zenclaw') || 
                                  response.response.toLowerCase().includes('n8n');
                const noExternalTools = !response.response.toLowerCase().includes('zapier') &&
                                       !response.response.toLowerCase().includes('make.com');
                
                if ((hasAivory || hasZenclaw) && noExternalTools) {
                    result.className = 'test-result test-pass';
                    result.textContent = '✅ PASS: Business-centric, Aivory-focused response';
                } else {
                    result.className = 'test-result test-fail';
                    result.textContent = '❌ FAIL: Not Aivory-focused or recommends external tools';
                }
            } catch (error) {
                result.className = 'test-result test-fail';
                result.textContent = `❌ ERROR: ${error.message}`;
            }
        }
    </script>
</body>
</html>
```

## Data Models

### ARIAConfig

Configuration object for initializing the ARIA agent.

```typescript
interface ARIAConfig {
    tier: string;              // User's subscription tier
    userId: string;            // User identifier
    has_snapshot: boolean;     // Whether user has AI Snapshot
    has_blueprint: boolean;    // Whether user has AI Blueprint
    credits: number;           // Current credit balance
}
```

### ConversationMessage

Message object stored in conversation history.

```typescript
interface ConversationMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
    files?: string[];
    reasoning?: ReasoningMetadata;
    blueprint?: any;
}
```

### ReasoningMetadata

Metadata about AI response for display in reasoning panel.

```typescript
interface ReasoningMetadata {
    model: string;
    tokens: number;
    confidence: number;
    cost: number;
    thinkingTime?: number;
}
```

### MessagePayload

Payload sent to backend API.

```typescript
interface MessagePayload {
    message: string;
    files: string[];
    workflow: string | null;
    context: {
        tier: string;
        user_id: string;
        has_snapshot: boolean;
        has_blueprint: boolean;
        language: string;
        conversation_history: ConversationMessage[];
    };
}
```

### APIResponse

Response from backend API.

```typescript
interface APIResponse {
    response: string;
    reasoning: ReasoningMetadata;
    credits_remaining: number;
    timestamp: string;
}
```


## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: Multilingual Detection and Response

*For any* message in a supported language (EN/ID/AR), the system should detect the language correctly and respond in that same language.

**Validates: Requirements 1.3, 3.2, 3.3, 3.4**

### Property 2: API Request Context Completeness

*For all* API requests to the backend, the request payload must include tier, user_id, has_snapshot, has_blueprint, and language fields.

**Validates: Requirements 2.3, 2.4, 3.6, 7.3**

### Property 3: Emoji-Free Professional Responses

*For any* AI response, the text should contain no emoji characters, maintaining a professional tone.

**Validates: Requirements 4.4**

### Property 4: ARIA Identity Consistency

*For any* AI response where the agent introduces itself, it must use "ARIA" or "ARIA – Aivory Reasoning & Intelligence Assistant" and never refer to itself as ChatGPT, Claude, or any other model name.

**Validates: Requirements 4.2, 4.3**

### Property 5: Consistent Behavior Across Console Pages

*For any* operation (message sending, streaming, conversation persistence), both console.html and console-premium.html should produce identical behavior.

**Validates: Requirements 6.3, 6.4, 6.5**

### Property 6: Consistent Error Handling Across Pages

*For any* error type (rate limit, insufficient credits, network failure), both console pages should handle it identically with the same UI response.

**Validates: Requirements 7.4, 7.5**

### Property 7: Conversation Persistence

*For any* message sent, the conversation should be saved to localStorage, and all message metadata (timestamp, reasoning, files) should be preserved.

**Validates: Requirements 9.1, 9.4**

### Property 8: Streaming Text Rendering

*For any* AI response, text should stream character-by-character with progressive markdown rendering, unless prefers-reduced-motion is set.

**Validates: Requirements 1.5, 10.1, 10.2**

### Property 9: Code Highlighting After Streaming

*For any* AI response containing code blocks, syntax highlighting should be applied after streaming completes.

**Validates: Requirements 10.5**

### Property 10: Error Logging

*For all* errors that occur, the system should log them to the console with console.error for debugging purposes.

**Validates: Requirements 11.5**

### Property 11: Credit Deduction and UI Update

*For any* message sent successfully, the system should deduct 1 credit from the user's balance and update the credit display in the UI.

**Validates: Requirements 12.1, 12.2**

## Error Handling

### Error Categories

1. **Network Errors**
   - Backend endpoint unavailable → Fallback to direct Zenclaw
   - Zenclaw endpoint unavailable → Display connection error message
   - Timeout errors → Display timeout message with retry option

2. **API Errors**
   - Rate limit (429) → Display rate limit modal with wait time
   - Insufficient credits (402) → Display upgrade modal
   - Authentication errors (401/403) → Redirect to login
   - Server errors (500) → Display generic error message

3. **Client Errors**
   - Invalid file type → Display file type error toast
   - File too large → Display file size error toast
   - Empty message → Silently prevent sending
   - Zero credits → Display insufficient credits modal

### Error Recovery Strategies

1. **Automatic Fallback**
   - Primary: Backend endpoint (`http://localhost:8081/api/console/message`)
   - Fallback: Direct Zenclaw (`http://43.156.108.96:8080/chat`)
   - If both fail: Display error message with manual retry option

2. **Prompt Loading Fallback**
   - Primary: Fetch from `/api/console/prompt`
   - Fallback: Use hardcoded ARIA Protocol v2.0 in `getFallbackPrompt()`
   - Cache prompt in memory for session duration

3. **Graceful Degradation**
   - If streaming fails: Display response instantly
   - If markdown rendering fails: Display plain text
   - If syntax highlighting fails: Display code without highlighting

### Error Messages

All error messages should be:
- Clear and user-friendly (no technical jargon)
- Actionable (tell user what to do next)
- Multilingual (match user's detected language)
- Logged to console for debugging

Example error messages:

```javascript
const ERROR_MESSAGES = {
    en: {
        rate_limit: "The AI model is temporarily rate-limited. Please try again in a moment.",
        insufficient_credits: "You don't have enough credits for this operation.",
        network_error: "Unable to reach the AI service. Please check your connection.",
        file_too_large: "File is too large for your tier.",
        invalid_file_type: "Invalid file type. Only PDF, DOCX, CSV, TXT, PNG, JPG supported."
    },
    id: {
        rate_limit: "Model AI sedang dibatasi sementara. Silakan coba lagi sebentar.",
        insufficient_credits: "Kredit Anda tidak cukup untuk operasi ini.",
        network_error: "Tidak dapat terhubung ke layanan AI. Periksa koneksi Anda.",
        file_too_large: "File terlalu besar untuk tier Anda.",
        invalid_file_type: "Tipe file tidak valid. Hanya PDF, DOCX, CSV, TXT, PNG, JPG yang didukung."
    },
    ar: {
        rate_limit: "نموذج الذكاء الاصطناعي محدود مؤقتًا. يرجى المحاولة مرة أخرى بعد قليل.",
        insufficient_credits: "ليس لديك رصيد كافٍ لهذه العملية.",
        network_error: "غير قادر على الوصول إلى خدمة الذكاء الاصطناعي. يرجى التحقق من اتصالك.",
        file_too_large: "الملف كبير جدًا بالنسبة لمستواك.",
        invalid_file_type: "نوع ملف غير صالح. يدعم فقط PDF و DOCX و CSV و TXT و PNG و JPG."
    }
};
```

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests for comprehensive coverage:

- **Unit tests**: Verify specific examples, edge cases, and error conditions
- **Property tests**: Verify universal properties across all inputs

Both testing approaches are complementary and necessary. Unit tests catch concrete bugs in specific scenarios, while property tests verify general correctness across a wide range of inputs.

### Unit Testing

Unit tests should focus on:

1. **Specific Examples**
   - First message introduces ARIA in English
   - Backend endpoint unavailable triggers fallback
   - Zero credits prevents message sending
   - Rate limit error shows modal
   - Page reload restores last 50 messages

2. **Edge Cases**
   - Empty message handling
   - Very long messages (>10,000 characters)
   - Rapid message sending
   - Network timeout scenarios
   - Invalid API responses

3. **Error Conditions**
   - Backend returns 429 (rate limit)
   - Backend returns 402 (insufficient credits)
   - Backend returns 500 (server error)
   - Network connection fails
   - File upload fails

4. **Integration Points**
   - ARIA module loads correctly in both console pages
   - localStorage persistence works across page reloads
   - Credit balance updates after messages
   - Language detection triggers correct responses

### Property-Based Testing

Property tests should be configured to run minimum 100 iterations per test due to randomization. Each test must reference its design document property using the tag format:

**Feature: console-aria-unification, Property {number}: {property_text}**

Property tests should focus on:

1. **Property 1: Multilingual Detection and Response**
   - Generate random messages in EN/ID/AR
   - Verify language detection is correct
   - Verify response is in same language
   - Tag: **Feature: console-aria-unification, Property 1: For any message in a supported language, the system should detect the language correctly and respond in that same language**

2. **Property 2: API Request Context Completeness**
   - Generate random user states (tier, has_snapshot, has_blueprint)
   - Send messages with different contexts
   - Verify all API requests include required fields
   - Tag: **Feature: console-aria-unification, Property 2: For all API requests, required context fields must be present**

3. **Property 3: Emoji-Free Professional Responses**
   - Generate random AI responses (mock or real)
   - Verify no emoji characters in output
   - Tag: **Feature: console-aria-unification, Property 3: For any AI response, the text should contain no emoji characters**

4. **Property 4: ARIA Identity Consistency**
   - Generate random introduction scenarios
   - Verify ARIA name is used correctly
   - Verify no other model names appear
   - Tag: **Feature: console-aria-unification, Property 4: For any AI response where the agent introduces itself, it must use ARIA and never other model names**

5. **Property 5: Consistent Behavior Across Console Pages**
   - Generate random operations (send message, stream response, save conversation)
   - Execute on both console.html and console-premium.html
   - Verify identical behavior
   - Tag: **Feature: console-aria-unification, Property 5: For any operation, both console pages should behave identically**

6. **Property 6: Consistent Error Handling Across Pages**
   - Generate random error scenarios
   - Trigger on both console pages
   - Verify identical error handling
   - Tag: **Feature: console-aria-unification, Property 6: For any error type, both console pages should handle it identically**

7. **Property 7: Conversation Persistence**
   - Generate random conversations
   - Save to localStorage
   - Verify all metadata is preserved
   - Tag: **Feature: console-aria-unification, Property 7: For any message sent, conversation and metadata should be preserved in localStorage**

8. **Property 8: Streaming Text Rendering**
   - Generate random AI responses
   - Verify streaming happens character-by-character
   - Verify markdown renders progressively
   - Tag: **Feature: console-aria-unification, Property 8: For any AI response, text should stream with progressive markdown rendering**

9. **Property 9: Code Highlighting After Streaming**
   - Generate random responses with code blocks
   - Verify syntax highlighting is applied after streaming
   - Tag: **Feature: console-aria-unification, Property 9: For any response with code blocks, syntax highlighting should be applied after streaming**

10. **Property 10: Error Logging**
    - Generate random error scenarios
    - Verify console.error is called for each error
    - Tag: **Feature: console-aria-unification, Property 10: For all errors, the system should log them to the console**

11. **Property 11: Credit Deduction and UI Update**
    - Generate random messages
    - Verify credit deduction happens
    - Verify UI updates
    - Tag: **Feature: console-aria-unification, Property 11: For any message sent, credits should be deducted and UI updated**

### Testing Tools

- **Unit Testing**: Jest or Vitest for JavaScript unit tests
- **Property Testing**: fast-check (JavaScript property-based testing library)
- **Integration Testing**: Playwright or Cypress for end-to-end tests
- **Manual Testing**: Use `console-aria-test.html` for multilingual verification

### Test Coverage Goals

- Unit test coverage: >80% of code paths
- Property test coverage: All 11 correctness properties
- Integration test coverage: All user flows (send message, upload file, clear conversation)
- Manual test coverage: All three languages (EN/ID/AR) verified by QA

### Continuous Integration

All tests should run automatically on:
- Pull request creation
- Merge to main branch
- Nightly builds

Property tests should run with 100 iterations in CI, and 1000 iterations in nightly builds for deeper coverage.
