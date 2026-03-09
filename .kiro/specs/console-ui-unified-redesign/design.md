# Design Document: Console UI Unified Redesign

## Overview

The Console UI Unified Redesign transforms the Aivory AI Console into a premium, minimalist dark-themed interface using pure custom CSS. The design prioritizes visual consistency, readability, and professional aesthetics while maintaining functionality across all pages (Console, Dashboard, Workflows, Logs, Settings).

The architecture follows a component-based approach with centralized CSS variables, utility-style class names, and a mobile-first responsive strategy. The design eliminates visual noise (glowing effects, excessive animations) in favor of clean, flat design principles inspired by modern AI interfaces.

## Architecture

### Component Hierarchy

```
Console Application
├── Sidebar (Navigation)
│   ├── Logo/Brand Icon (solid)
│   ├── Navigation Items (outline icons)
│   └── Text Labels
├── Top Bar (Header)
│   ├── Tier Display
│   ├── Credits Display
│   ├── Language Selector
│   ├── Username/Guest
│   └── Logout Button
├── Main Content Area
│   ├── Message List Container
│   │   ├── User Message Bubbles
│   │   └── AI Message Bubbles (with avatar)
│   └── Thinking Animation (conditional)
├── Input Bar (Fixed Bottom)
│   ├── File Attachment Icon
│   ├── Text Input (multi-line)
│   └── Send Button
└── Dropdown Menu (conditional)
    └── File Source Options
```

### Layout Strategy

**Fixed Elements:**
- Sidebar: Fixed left, full height
- Top Bar: Fixed top, spans width minus sidebar
- Input Bar: Fixed bottom, spans width minus sidebar

**Scrollable Elements:**
- Main Content Area: Scrolls vertically at page level
- Message List: Inherits scroll from parent container

**Z-Index Layers:**
1. Base layer (0): Main content, message bubbles
2. Elevated layer (10): Input bar with subtle shadow
3. Navigation layer (100): Sidebar, top bar
4. Overlay layer (1000): Dropdown menu

### CSS Architecture

**Variable System:**
All colors, spacing, and typography values are defined in `:root` CSS variables for easy theming and maintenance.

**Class Naming Convention:**
- Component classes: `.sidebar`, `.top-bar`, `.chat-container`
- Element classes: `.message-user`, `.message-ai`, `.input-bar`
- Modifier classes: `.message-ai--thinking`, `.dropdown--open`
- Utility classes: `.text-white`, `.text-muted`, `.gap-lg`

**No Framework Dependencies:**
Pure custom CSS without Tailwind, Bootstrap, or other CSS frameworks. All styling is hand-written for maximum control and minimal bundle size.

## Components and Interfaces

### 1. Sidebar Component

**Purpose:** Provides consistent navigation across all pages.

**Visual Properties:**
- Background: `#1b1b1c` (darker gray)
- Width: `260px` (desktop), collapses on mobile
- Icons: White outline style (except brand icon)
- Text: `#ffffff` or `#e0e0e0`
- Padding: `2rem 1.5rem`

**HTML Structure:**
```html
<aside class="sidebar">
  <div class="sidebar-brand">
    <img src="Aivory_console_pic.svg" alt="Aivory" class="brand-icon">
  </div>
  <nav class="sidebar-nav">
    <a href="/console" class="nav-item">
      <i class="icon-outline icon-console"></i>
      <span>Console</span>
    </a>
    <!-- Additional nav items -->
  </nav>
</aside>
```

**CSS Interface:**
```css
.sidebar {
  background: var(--color-sidebar-bg);
  width: var(--sidebar-width);
  position: fixed;
  left: 0;
  top: 0;
  height: 100vh;
  padding: var(--spacing-lg);
}
```

### 2. Top Bar Component

**Purpose:** Displays user information and account controls.

**Visual Properties:**
- Background: `#272728` (main background)
- Height: `60px`
- Layout: Flexbox, right-aligned items
- Border-bottom: `1px solid #333338`

**HTML Structure:**
```html
<header class="top-bar">
  <div class="top-bar-content">
    <span class="tier-badge">Pro Tier</span>
    <span class="credits-display">1,000 credits</span>
    <select class="language-selector">
      <option value="en">EN</option>
      <option value="id">ID</option>
    </select>
    <span class="username">Guest</span>
    <button class="logout-btn">Logout</button>
  </div>
</header>
```

**CSS Interface:**
```css
.top-bar {
  background: var(--color-main-bg);
  height: var(--topbar-height);
  position: fixed;
  top: 0;
  left: var(--sidebar-width);
  right: 0;
  border-bottom: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 var(--spacing-lg);
}
```

### 3. Message Bubble Component

**Purpose:** Displays user and AI messages with proper styling and avatars.

**Visual Properties:**
- User messages: Right-aligned, subtle background
- AI messages: Left-aligned, includes avatar
- Padding: `1.25rem 1.5rem`
- Border-radius: `12px`
- Gap between messages: `1.5rem`

**HTML Structure:**
```html
<!-- User Message -->
<div class="message-bubble message-user">
  <div class="message-content">User message text</div>
</div>

<!-- AI Message -->
<div class="message-bubble message-ai">
  <img src="Aivory_console_pic.svg" alt="AI" class="message-avatar">
  <div class="message-content">AI response text</div>
</div>
```

**CSS Interface:**
```css
.message-bubble {
  display: flex;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
  line-height: var(--line-height-relaxed);
}

.message-user {
  justify-content: flex-end;
}

.message-ai {
  justify-content: flex-start;
}
```

### 4. Input Bar Component

**Purpose:** Provides text input with file attachment and send functionality.

**Visual Properties:**
- Background: `#272728`
- Position: Fixed bottom
- Elevation: Subtle flat shadow
- Height: Auto (expands with content)
- Max-height: `200px` (scrollable if exceeded)

**HTML Structure:**
```html
<div class="input-bar">
  <button class="attach-btn" id="attachBtn">
    <i class="icon-outline icon-paperclip"></i>
  </button>
  <textarea 
    class="input-field" 
    placeholder="Type your message..."
    rows="1"
    id="messageInput"
  ></textarea>
  <button class="send-btn" id="sendBtn">
    <i class="icon-outline icon-send"></i>
  </button>
</div>
```

**CSS Interface:**
```css
.input-bar {
  background: var(--color-main-bg);
  position: fixed;
  bottom: 0;
  left: var(--sidebar-width);
  right: 0;
  padding: var(--spacing-md) var(--spacing-lg);
  display: flex;
  align-items: flex-end;
  gap: var(--spacing-md);
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.2);
}
```

**JavaScript Interface:**
```javascript
class InputBar {
  constructor(elementId) {
    this.input = document.getElementById(elementId);
    this.attachHandlers();
  }
  
  attachHandlers() {
    this.input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });
  }
  
  sendMessage() {
    const message = this.input.value.trim();
    if (message) {
      // Send message logic
      this.input.value = '';
    }
  }
}
```

### 5. Dropdown Menu Component

**Purpose:** Displays file attachment source options.

**Visual Properties:**
- Background: `#1b1b1c`
- Border: `1px solid #333338`
- Border-radius: `8px`
- Position: Absolute, above attach button
- Shadow: `0 4px 12px rgba(0, 0, 0, 0.3)`

**HTML Structure:**
```html
<div class="add-dropdown" id="addDropdown" style="display: none;">
  <button class="dropdown-item" data-source="figma">
    <i class="icon-outline icon-figma"></i>
    <span>Add from Figma</span>
  </button>
  <button class="dropdown-item" data-source="onedrive">
    <i class="icon-outline icon-onedrive"></i>
    <span>Add from OneDrive files</span>
  </button>
  <button class="dropdown-item" data-source="gdrive">
    <i class="icon-outline icon-gdrive"></i>
    <span>Add from Google Drive files</span>
  </button>
  <button class="dropdown-item" data-source="skills">
    <i class="icon-outline icon-skills"></i>
    <span>Use Skills</span>
  </button>
  <button class="dropdown-item" data-source="local">
    <i class="icon-outline icon-upload"></i>
    <span>Add from local files</span>
  </button>
</div>
```

**JavaScript Interface:**
```javascript
class DropdownMenu {
  constructor(triggerId, dropdownId) {
    this.trigger = document.getElementById(triggerId);
    this.dropdown = document.getElementById(dropdownId);
    this.attachHandlers();
  }
  
  attachHandlers() {
    this.trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggle();
    });
    
    document.addEventListener('click', () => {
      this.close();
    });
  }
  
  toggle() {
    const isVisible = this.dropdown.style.display !== 'none';
    this.dropdown.style.display = isVisible ? 'none' : 'block';
  }
  
  close() {
    this.dropdown.style.display = 'none';
  }
}
```

### 6. Thinking Animation Component

**Purpose:** Indicates AI processing state.

**Visual Properties:**
- Style: Simple dots or "Thinking..." text
- Animation: Fade or pulse (no glow)
- Color: `#a0a0a8` (muted)
- Position: Within AI message bubble

**HTML Structure:**
```html
<div class="message-bubble message-ai message-ai--thinking">
  <img src="Aivory_console_pic.svg" alt="AI" class="message-avatar">
  <div class="thinking-animation">
    <span class="thinking-dot"></span>
    <span class="thinking-dot"></span>
    <span class="thinking-dot"></span>
  </div>
</div>
```

**CSS Interface:**
```css
.thinking-animation {
  display: flex;
  gap: 0.5rem;
  padding: 1rem;
}

.thinking-dot {
  width: 8px;
  height: 8px;
  background: var(--color-text-muted);
  border-radius: 50%;
  animation: thinking-pulse 1.4s ease-in-out infinite;
}

.thinking-dot:nth-child(2) {
  animation-delay: 0.2s;
}

.thinking-dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes thinking-pulse {
  0%, 80%, 100% { opacity: 0.3; }
  40% { opacity: 1; }
}
```

### 7. Table Rendering Component

**Purpose:** Displays structured data in AI responses.

**Visual Properties:**
- Row gap: `1rem`
- Cell padding: `1.25rem 1.5rem`
- Header background: `#1b1b1c`
- Border: `1px solid #333338`
- Hover: Light background change

**HTML Structure:**
```html
<table class="table-ai">
  <thead>
    <tr>
      <th>Column 1</th>
      <th>Column 2</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Data 1</td>
      <td>Data 2</td>
    </tr>
  </tbody>
</table>
```

**CSS Interface:**
```css
.table-ai {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  margin: var(--spacing-lg) 0;
}

.table-ai th {
  background: var(--color-sidebar-bg);
  padding: 1.25rem 1.5rem;
  text-align: left;
  border: 1px solid var(--color-border);
}

.table-ai td {
  padding: 1.25rem 1.5rem;
  border: 1px solid var(--color-border);
}

.table-ai tbody tr:hover {
  background: rgba(255, 255, 255, 0.03);
}
```

## Data Models

### CSS Variables Model

```css
:root {
  /* Colors */
  --color-main-bg: #272728;
  --color-sidebar-bg: #1b1b1c;
  --color-border: #333338;
  --color-text-primary: #ffffff;
  --color-text-secondary: #e0e0e0;
  --color-text-muted: #a0a0a8;
  
  /* Spacing */
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
  
  /* Typography */
  --font-family: 'Inter Tight', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-size-base: 15px;
  --font-weight-light: 200;
  --font-weight-normal: 300;
  --font-weight-regular: 400;
  --font-weight-semibold: 600;
  --line-height-normal: 1.5;
  --line-height-relaxed: 1.7;
  --line-height-loose: 1.8;
  
  /* Layout */
  --sidebar-width: 260px;
  --topbar-height: 60px;
  --input-bar-max-height: 200px;
  
  /* Effects */
  --shadow-subtle: 0 -2px 8px rgba(0, 0, 0, 0.2);
  --shadow-dropdown: 0 4px 12px rgba(0, 0, 0, 0.3);
  --border-radius-sm: 8px;
  --border-radius-md: 12px;
}
```

### Message Data Model

```javascript
interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  avatar?: string; // For AI messages
  isThinking?: boolean; // For AI processing state
}
```

### Dropdown Option Model

```javascript
interface DropdownOption {
  id: string;
  label: string;
  icon: string;
  source: 'figma' | 'onedrive' | 'gdrive' | 'skills' | 'local';
  handler: () => void;
}
```

### User State Model

```javascript
interface UserState {
  tier: string; // 'Free', 'Pro', 'Enterprise'
  credits: number;
  language: 'en' | 'id';
  username: string;
  isGuest: boolean;
}
```

## Correctness Properties


*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, several redundancies were identified:

- **Sidebar background color** (1.1) and **Sidebar background in color scheme** (6.2) test the same property - consolidated into one
- **Input bar width** (8.2) and **Top bar width** (3.5) test the same layout calculation pattern - can be combined into a single layout property
- **Message gap** (7.4) and **Message gap in scrolling** (9.3) are duplicate - consolidated
- **Fixed positioning** tests for Top Bar (3.4) and Input Bar (8.1) follow the same pattern - combined into fixed element property
- Multiple "example" tests for specific CSS values can be verified through a single comprehensive styling property

The following properties represent the unique, non-redundant validation requirements:

### Property 1: Sidebar Consistency Across Pages

*For any* page in the application (Console, Dashboard, Workflows, Logs, Settings), the sidebar element should have identical computed styles for background-color (#1b1b1c), padding, and typography properties.

**Validates: Requirements 1.1, 1.5**

### Property 2: Text Color Compliance

*For any* text element in the interface, the computed color value should be one of the three approved colors: #ffffff (primary), #e0e0e0 (secondary), or #a0a0a8 (muted).

**Validates: Requirements 1.4, 6.4**

### Property 3: AI Message Avatar Presence

*For any* AI-generated message bubble, the message should contain an img element with src="Aivory_console_pic.svg" and the avatar should have consistent dimensions across all AI messages.

**Validates: Requirements 2.1, 2.3**

### Property 4: Dropdown Toggle Behavior

*For any* click event on the attachment icon, the dropdown menu visibility should toggle (hidden to visible or visible to hidden), and for any click event outside the dropdown area when the dropdown is visible, the dropdown should close.

**Validates: Requirements 4.2, 4.5**

### Property 5: Dropdown Option Click Handling

*For any* dropdown option element, clicking it should trigger the corresponding file selection handler function.

**Validates: Requirements 4.4**

### Property 6: Thinking State Display

*For any* AI message in a "thinking" state (isThinking: true), the message bubble should display a thinking animation element, and when the state changes to complete, the animation should be replaced with actual content.

**Validates: Requirements 5.1**

### Property 7: Border Color Uniformity

*For any* element with a border in the interface, the border-color should be #333338.

**Validates: Requirements 6.3**

### Property 8: No Glowing Effects

*For any* UI element in the interface, the computed box-shadow and text-shadow properties should not contain values with blur radius > 8px and spread radius > 0px (which create glow effects).

**Validates: Requirements 6.5, 5.3**

### Property 9: Line Height Consistency

*For any* text content element (paragraphs, message content, labels), the computed line-height should be between 1.7 and 1.8.

**Validates: Requirements 7.1**

### Property 10: Message Spacing Consistency

*For any* pair of consecutive message bubbles, the vertical gap between them should be between 1.5rem and 2rem.

**Validates: Requirements 7.4, 9.3**

### Property 11: Keyboard Input Handling

*For any* Enter keypress event in the input field without Shift modifier, the system should call the send message function and clear the input, and for any Enter keypress with Shift modifier, the system should insert a newline without sending.

**Validates: Requirements 8.4, 8.5**

### Property 12: Auto-Scroll on New Message

*For any* new message added to the message list, the scroll position should automatically adjust to show the bottom of the message container (scrollTop should equal scrollHeight minus clientHeight).

**Validates: Requirements 9.2**

### Property 13: CSS Variable Centralization

*For all* color and spacing values used in the CSS, they should be defined as CSS custom properties in the :root selector, and no duplicate selector definitions should exist in the stylesheet.

**Validates: Requirements 11.3, 11.4**

### Property 14: No Emoji in AI Responses

*For any* AI-generated response text, the content should not contain characters in the emoji unicode ranges (U+1F600-U+1F64F, U+1F300-U+1F5FF, U+1F680-U+1F6FF, U+2600-U+26FF, U+2700-U+27BF).

**Validates: Requirements 12.1**

### Property 15: Responsive Fixed Positioning

*For any* screen size (including mobile breakpoints), the input bar should maintain position: fixed and bottom: 0, and message content should scroll independently above it.

**Validates: Requirements 13.3, 13.4**

## Error Handling

### CSS Loading Failures

**Scenario:** Custom CSS file fails to load or is blocked.

**Handling Strategy:**
- Implement inline critical CSS in HTML head for basic layout
- Add fallback system fonts if Inter Tight fails to load
- Use `@supports` queries for progressive enhancement
- Log CSS load failures to console for debugging

**Example:**
```html
<style>
  /* Critical inline CSS */
  body { 
    font-family: 'Inter Tight', -apple-system, BlinkMacSystemFont, sans-serif;
    background: #272728;
    color: #ffffff;
  }
</style>
<link rel="stylesheet" href="console-unified.css" onerror="console.error('CSS failed to load')">
```

### Icon Loading Failures

**Scenario:** SVG icons or avatar images fail to load.

**Handling Strategy:**
- Provide text fallbacks for icons (e.g., "📎" for attachment, "➤" for send)
- Use alt text for avatar images
- Implement onerror handlers to replace broken images with initials
- Consider inlining critical SVGs in HTML

**Example:**
```javascript
document.querySelectorAll('img.message-avatar').forEach(img => {
  img.onerror = function() {
    this.style.display = 'none';
    const fallback = document.createElement('div');
    fallback.className = 'avatar-fallback';
    fallback.textContent = 'AI';
    this.parentNode.insertBefore(fallback, this);
  };
});
```

### JavaScript Initialization Failures

**Scenario:** JavaScript fails to load or execute, breaking interactivity.

**Handling Strategy:**
- Ensure basic HTML form functionality works without JS
- Use progressive enhancement approach
- Add try-catch blocks around initialization code
- Display user-friendly error messages

**Example:**
```javascript
try {
  const inputBar = new InputBar('messageInput');
  const dropdown = new DropdownMenu('attachBtn', 'addDropdown');
} catch (error) {
  console.error('Failed to initialize UI components:', error);
  document.getElementById('errorMessage').textContent = 
    'Some features may not work. Please refresh the page.';
}
```

### Responsive Layout Breakage

**Scenario:** Layout breaks on unexpected screen sizes or orientations.

**Handling Strategy:**
- Use CSS Grid and Flexbox with fallbacks
- Test on multiple devices and browsers
- Implement container queries where supported
- Add overflow handling to prevent content overflow

**Example:**
```css
.chat-container {
  display: flex;
  flex-direction: column;
  min-height: 0; /* Prevent flex item overflow */
  overflow-y: auto;
}

@supports (container-type: inline-size) {
  .message-bubble {
    container-type: inline-size;
  }
}
```

### Message Rendering Failures

**Scenario:** AI response contains malformed HTML or breaks layout.

**Handling Strategy:**
- Sanitize all AI-generated content before rendering
- Use textContent instead of innerHTML for user input
- Implement content security policy (CSP)
- Add max-width and word-break for long strings

**Example:**
```javascript
function sanitizeMessage(content) {
  const div = document.createElement('div');
  div.textContent = content; // Escapes HTML
  return div.innerHTML;
}

function renderMessage(message) {
  const bubble = document.createElement('div');
  bubble.className = `message-bubble message-${message.type}`;
  bubble.innerHTML = sanitizeMessage(message.content);
  return bubble;
}
```

### Dropdown Menu Positioning Issues

**Scenario:** Dropdown menu appears off-screen or in wrong position.

**Handling Strategy:**
- Calculate available space before positioning
- Flip dropdown direction if insufficient space below
- Use CSS `position: fixed` with dynamic coordinates
- Add viewport boundary detection

**Example:**
```javascript
function positionDropdown(trigger, dropdown) {
  const rect = trigger.getBoundingClientRect();
  const spaceBelow = window.innerHeight - rect.bottom;
  const dropdownHeight = dropdown.offsetHeight;
  
  if (spaceBelow < dropdownHeight) {
    // Position above trigger
    dropdown.style.bottom = `${window.innerHeight - rect.top}px`;
    dropdown.style.top = 'auto';
  } else {
    // Position below trigger
    dropdown.style.top = `${rect.bottom}px`;
    dropdown.style.bottom = 'auto';
  }
  
  dropdown.style.left = `${rect.left}px`;
}
```

### Auto-Scroll Failures

**Scenario:** New messages don't trigger auto-scroll or scroll position is incorrect.

**Handling Strategy:**
- Use `scrollIntoView` with smooth behavior
- Add debouncing to prevent scroll thrashing
- Check if user has manually scrolled up (don't auto-scroll if so)
- Handle async message rendering

**Example:**
```javascript
class MessageList {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.userHasScrolled = false;
    
    this.container.addEventListener('scroll', () => {
      const isAtBottom = this.container.scrollHeight - this.container.scrollTop 
        === this.container.clientHeight;
      this.userHasScrolled = !isAtBottom;
    });
  }
  
  addMessage(message) {
    const bubble = this.renderMessage(message);
    this.container.appendChild(bubble);
    
    if (!this.userHasScrolled) {
      bubble.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }
}
```

## Testing Strategy

### Dual Testing Approach

The testing strategy employs both unit tests and property-based tests to ensure comprehensive coverage:

- **Unit tests**: Verify specific examples, edge cases, and error conditions
- **Property tests**: Verify universal properties across all inputs

Both approaches are complementary and necessary. Unit tests catch concrete bugs in specific scenarios, while property tests verify general correctness across a wide range of inputs.

### Property-Based Testing Configuration

**Library Selection:** 
- **JavaScript/TypeScript**: Use `fast-check` library for property-based testing
- **Browser Testing**: Use Playwright or Cypress with fast-check integration

**Test Configuration:**
- Minimum 100 iterations per property test (due to randomization)
- Each property test must reference its design document property
- Tag format: `// Feature: console-ui-unified-redesign, Property {number}: {property_text}`

**Example Property Test:**
```javascript
import fc from 'fast-check';
import { test, expect } from '@playwright/test';

// Feature: console-ui-unified-redesign, Property 2: Text Color Compliance
test('all text elements use approved colors', async ({ page }) => {
  await page.goto('/console');
  
  await fc.assert(
    fc.asyncProperty(
      fc.constantFrom('p', 'span', 'div', 'label', 'button'),
      async (selector) => {
        const elements = await page.locator(selector).all();
        
        for (const element of elements) {
          const color = await element.evaluate(el => 
            window.getComputedStyle(el).color
          );
          
          const approvedColors = [
            'rgb(255, 255, 255)',    // #ffffff
            'rgb(224, 224, 224)',    // #e0e0e0
            'rgb(160, 160, 168)'     // #a0a0a8
          ];
          
          expect(approvedColors).toContain(color);
        }
      }
    ),
    { numRuns: 100 }
  );
});
```

### Unit Testing Strategy

**Focus Areas:**
- Specific UI component rendering (sidebar, top bar, input bar)
- Event handler attachment and execution
- Dropdown menu interactions
- Message bubble rendering with avatars
- Keyboard shortcuts (Enter, Shift+Enter)
- Responsive breakpoint behavior

**Example Unit Test:**
```javascript
import { test, expect } from '@playwright/test';

test('dropdown opens on attachment icon click', async ({ page }) => {
  await page.goto('/console');
  
  const dropdown = page.locator('#addDropdown');
  await expect(dropdown).toBeHidden();
  
  await page.click('#attachBtn');
  await expect(dropdown).toBeVisible();
  
  await page.click('body');
  await expect(dropdown).toBeHidden();
});

test('Enter key sends message', async ({ page }) => {
  await page.goto('/console');
  
  const input = page.locator('#messageInput');
  await input.fill('Test message');
  await input.press('Enter');
  
  await expect(input).toHaveValue('');
  await expect(page.locator('.message-user').last()).toContainText('Test message');
});

test('Shift+Enter inserts newline', async ({ page }) => {
  await page.goto('/console');
  
  const input = page.locator('#messageInput');
  await input.fill('Line 1');
  await input.press('Shift+Enter');
  await input.type('Line 2');
  
  const value = await input.inputValue();
  expect(value).toBe('Line 1\nLine 2');
});
```

### CSS Testing Strategy

**Visual Regression Testing:**
- Use Playwright screenshots for visual comparison
- Test across multiple browsers (Chrome, Firefox, Safari)
- Test responsive breakpoints (mobile, tablet, desktop)

**CSS Property Testing:**
- Verify computed styles match design specifications
- Check CSS variable definitions in :root
- Validate no duplicate selectors
- Ensure no Tailwind classes present

**Example CSS Test:**
```javascript
test('sidebar uses correct background color on all pages', async ({ page }) => {
  const pages = ['/console', '/dashboard', '/workflows', '/logs', '/settings'];
  
  for (const url of pages) {
    await page.goto(url);
    const sidebar = page.locator('.sidebar');
    const bgColor = await sidebar.evaluate(el => 
      window.getComputedStyle(el).backgroundColor
    );
    expect(bgColor).toBe('rgb(27, 27, 28)'); // #1b1b1c
  }
});

test('no glowing effects on any elements', async ({ page }) => {
  await page.goto('/console');
  
  const allElements = await page.locator('*').all();
  
  for (const element of allElements) {
    const boxShadow = await element.evaluate(el => 
      window.getComputedStyle(el).boxShadow
    );
    
    if (boxShadow !== 'none') {
      // Parse shadow values and check blur/spread
      const shadowParts = boxShadow.match(/(\d+)px/g);
      if (shadowParts && shadowParts.length >= 3) {
        const blur = parseInt(shadowParts[2]);
        const spread = shadowParts[3] ? parseInt(shadowParts[3]) : 0;
        expect(blur).toBeLessThanOrEqual(8);
        expect(spread).toBeLessThanOrEqual(0);
      }
    }
  }
});
```

### Integration Testing

**End-to-End Flows:**
- Complete message send/receive cycle
- File attachment selection flow
- Multi-page navigation with sidebar consistency
- Responsive layout transitions

**Example Integration Test:**
```javascript
test('complete chat interaction flow', async ({ page }) => {
  await page.goto('/console');
  
  // Send user message
  await page.fill('#messageInput', 'Hello AI');
  await page.press('#messageInput', 'Enter');
  
  // Verify user message appears
  await expect(page.locator('.message-user').last()).toContainText('Hello AI');
  
  // Verify thinking animation appears
  await expect(page.locator('.thinking-animation')).toBeVisible();
  
  // Wait for AI response
  await page.waitForSelector('.message-ai:not(.message-ai--thinking)', { timeout: 10000 });
  
  // Verify AI message has avatar
  const aiMessage = page.locator('.message-ai').last();
  await expect(aiMessage.locator('img[src*="Aivory_console_pic.svg"]')).toBeVisible();
  
  // Verify auto-scroll to bottom
  const scrollTop = await page.evaluate(() => {
    const container = document.querySelector('.chat-container');
    return container.scrollTop + container.clientHeight >= container.scrollHeight - 10;
  });
  expect(scrollTop).toBe(true);
});
```

### Accessibility Testing

**WCAG Compliance:**
- Keyboard navigation support
- Screen reader compatibility
- Color contrast ratios
- Focus indicators

**Example Accessibility Test:**
```javascript
test('keyboard navigation works', async ({ page }) => {
  await page.goto('/console');
  
  // Tab through interactive elements
  await page.keyboard.press('Tab');
  let focused = await page.evaluate(() => document.activeElement.className);
  expect(focused).toContain('nav-item');
  
  await page.keyboard.press('Tab');
  focused = await page.evaluate(() => document.activeElement.className);
  expect(focused).toContain('attach-btn');
  
  await page.keyboard.press('Tab');
  focused = await page.evaluate(() => document.activeElement.id);
  expect(focused).toBe('messageInput');
});

test('color contrast meets WCAG AA', async ({ page }) => {
  await page.goto('/console');
  
  // Check text on dark background
  const textColor = 'rgb(255, 255, 255)'; // #ffffff
  const bgColor = 'rgb(39, 39, 40)'; // #272728
  
  // Calculate contrast ratio (simplified)
  const contrast = calculateContrastRatio(textColor, bgColor);
  expect(contrast).toBeGreaterThanOrEqual(4.5); // WCAG AA standard
});
```

### Performance Testing

**Metrics to Monitor:**
- CSS file size (should be < 50KB)
- First Contentful Paint (FCP)
- Time to Interactive (TTI)
- Message rendering performance (should handle 100+ messages)

**Example Performance Test:**
```javascript
test('handles large message history efficiently', async ({ page }) => {
  await page.goto('/console');
  
  // Add 100 messages
  for (let i = 0; i < 100; i++) {
    await page.evaluate((index) => {
      const container = document.querySelector('.message-list');
      const bubble = document.createElement('div');
      bubble.className = 'message-bubble message-user';
      bubble.textContent = `Message ${index}`;
      container.appendChild(bubble);
    }, i);
  }
  
  // Measure scroll performance
  const startTime = Date.now();
  await page.evaluate(() => {
    document.querySelector('.chat-container').scrollTop = 0;
  });
  const scrollTime = Date.now() - startTime;
  
  expect(scrollTime).toBeLessThan(100); // Should scroll in < 100ms
});
```

### Browser Compatibility Testing

**Target Browsers:**
- Chrome/Edge (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Mobile Safari (iOS 14+)
- Chrome Mobile (Android 10+)

**Testing Matrix:**
- Desktop: 1920x1080, 1366x768
- Tablet: 768x1024
- Mobile: 375x667, 414x896

Each property test and critical unit test should run across all target browsers and screen sizes.
