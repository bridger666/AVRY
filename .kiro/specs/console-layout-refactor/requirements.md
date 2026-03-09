# Requirements Document: Console Layout Refactor

## Introduction

The Console Layout Refactor transforms the AIVORY AI Console from an inner-scrolling container layout to a modern page-level scrolling layout inspired by ChatGPT, Manus, and Grok. This refactor addresses critical UX issues where the input bar scrolled out of view, the sidebar overlapped content, and messages were pushed out of view after sending.

This is a pure frontend UX improvement that maintains all existing console functionality while providing a superior user experience through:
- Page-level scrolling (only browser scrollbar)
- Sticky input bar always visible at bottom
- Centered message column (~780px max width)
- Modern Tailwind-style spacing and aesthetics
- CSS Grid layout for topbar + sidebar + main structure

### Current Problems

1. **Inner Scrollbar Issue**: Console had inner container scrolling, creating nested scrollbars
2. **Input Bar Visibility**: Input bar scrolled out of view when conversation grew
3. **Sidebar Overlap**: Sidebar overlapped chat area on hover
4. **Message Visibility**: New messages pushed out of view after sending
5. **Layout Structure**: Simple flexbox couldn't handle topbar + sidebar + main grid

### Design Goals

- Only browser scrollbar (no inner scrollbars)
- Input bar always visible at bottom (sticky positioning)
- New messages always visible after sending (auto-scroll to bottom)
- Sidebar never overlaps chat area
- Centered column layout (~780px max width for readability)
- Modern Tailwind-style spacing and aesthetics
- ChatGPT/Manus/Grok-quality feel

## Glossary

- **Page-Level Scrolling**: Browser window scrolls, not inner containers
- **Sticky Input Bar**: Input bar fixed at bottom of viewport using CSS `position: sticky`
- **CSS Grid Layout**: Grid structure with topbar spanning full width, sidebar + main below
- **Centered Column**: Messages constrained to ~780px max width for optimal readability
- **Auto-Scroll**: JavaScript scrolls page to bottom after new message appears
- **Grid Areas**: Named CSS grid regions (topbar, sidebar, main)

## Requirements

### Requirement 1: Page-Level Scrolling

**User Story:** As a user, I want the page to scroll naturally, so that I don't have nested scrollbars and confusing scroll behavior.

#### Acceptance Criteria

1. THE Console SHALL use page-level scrolling (browser scrollbar only)
2. THE Console SHALL NOT have inner container scrollbars
3. THE main content area SHALL have `overflow: visible !important`
4. THE body/html SHALL allow natural scrolling
5. THE Console SHALL remove any `max-height` restrictions on main containers
6. THE scroll behavior SHALL feel natural like ChatGPT/Manus/Grok

### Requirement 2: CSS Grid Layout Structure

**User Story:** As a user, I want a proper layout structure, so that the topbar, sidebar, and main content are positioned correctly.

#### Acceptance Criteria

1. THE Console SHALL use CSS Grid layout with 3 areas: topbar, sidebar, main
2. THE topbar SHALL span full width across both columns
3. THE sidebar SHALL be 260px wide in left column
4. THE main content SHALL fill remaining space in right column
5. THE grid SHALL use template areas: "topbar topbar" / "sidebar main"
6. THE grid SHALL use template columns: 260px 1fr
7. THE grid SHALL use template rows: auto 1fr

### Requirement 3: Sticky Input Bar

**User Story:** As a user, I want the input bar always visible, so that I can send messages without scrolling.

#### Acceptance Criteria

1. THE input bar SHALL use `position: sticky` with `bottom: 0`
2. THE input bar SHALL remain visible when scrolling page
3. THE input bar SHALL have high z-index (25) to stay above content
4. THE input bar SHALL have gradient background for visual separation
5. THE input bar SHALL have backdrop-filter blur for modern aesthetic
6. THE input bar SHALL span full width of main content area

### Requirement 4: Auto-Scroll After Message

**User Story:** As a user, I want to see new messages immediately, so that I don't miss AI responses.

#### Acceptance Criteria

1. WHEN user sends message, THE page SHALL auto-scroll to bottom
2. WHEN AI responds, THE page SHALL auto-scroll to show new message
3. THE auto-scroll SHALL use `window.scrollTo()` for page-level scrolling
4. THE auto-scroll SHALL use smooth behavior for better UX
5. THE auto-scroll SHALL scroll to `document.body.scrollHeight`
6. THE auto-scroll SHALL trigger after message is rendered

### Requirement 5: Centered Message Column

**User Story:** As a user, I want messages centered in a readable column, so that long lines don't span the entire screen.

#### Acceptance Criteria

1. THE message bubbles SHALL have max-width of 780px
2. THE message bubbles SHALL be centered using `margin: 0 auto`
3. THE message column SHALL maintain consistent width across all messages
4. THE message column SHALL provide optimal readability
5. THE message column SHALL match ChatGPT/Manus aesthetic

### Requirement 6: Topbar Visibility and Styling

**User Story:** As a user, I want to see the topbar with tier and credits, so that I can monitor my account status.

#### Acceptance Criteria

1. THE topbar SHALL be visible at top of page
2. THE topbar SHALL span full width (both sidebar and main columns)
3. THE topbar SHALL display logo on left
4. THE topbar SHALL display tier badge and credits on right
5. THE topbar SHALL use sticky positioning at top
6. THE topbar SHALL have z-index 30 to stay above other content
7. THE topbar SHALL have backdrop-filter blur for modern aesthetic

### Requirement 7: Sidebar Positioning

**User Story:** As a user, I want the sidebar to stay in place, so that it doesn't overlap my chat messages.

#### Acceptance Criteria

1. THE sidebar SHALL be 260px wide
2. THE sidebar SHALL be positioned in left grid column
3. THE sidebar SHALL NOT overlap main content area
4. THE sidebar SHALL have `transform: none !important` to prevent overlap
5. THE sidebar SHALL disable hover effects that cause overlap
6. THE sidebar SHALL use sticky positioning
7. THE sidebar SHALL have z-index 20

### Requirement 8: Responsive Design

**User Story:** As a user on mobile, I want the console to work on small screens, so that I can use it on any device.

#### Acceptance Criteria

1. THE Console SHALL stack vertically on mobile (< 768px)
2. THE sidebar SHALL collapse to 60px on mobile
3. THE message padding SHALL reduce on mobile
4. THE input bar padding SHALL reduce on mobile
5. THE topbar logo SHALL scale down on mobile
6. THE topbar stats SHALL use smaller font on mobile

### Requirement 9: Code Block Language Labels

**User Story:** As a user, I want to see language labels on code blocks, so that I know what programming language is shown.

#### Acceptance Criteria

1. THE markdown renderer SHALL add `data-language` attribute to `<pre>` elements
2. THE CSS SHALL use `::before` pseudo-element to display language label
3. THE language label SHALL appear in header bar of code block
4. THE language label SHALL use monospace font
5. THE language label SHALL be lowercase
6. THE language label SHALL have subtle styling

### Requirement 10: Typography and Spacing

**User Story:** As a user, I want modern typography and spacing, so that the console feels polished and professional.

#### Acceptance Criteria

1. THE Console SHALL use system font stack (SF Pro Text, Inter, Segoe UI)
2. THE message text SHALL use 14.5px font size
3. THE message text SHALL use 1.7 line-height for readability
4. THE messages SHALL have 18px bottom margin
5. THE input bar SHALL have 12px padding
6. THE Console SHALL use Tailwind-style spacing scale
7. THE Console SHALL use consistent border-radius (8px, 12px, 16px)

### Requirement 11: Browser Cache Handling

**User Story:** As a user, I want to see layout changes immediately, so that I don't see stale cached CSS.

#### Acceptance Criteria

1. THE CSS file SHALL include cache-busting version parameter
2. THE documentation SHALL instruct users to hard refresh (Cmd+Shift+R / Ctrl+Shift+R)
3. THE Console SHALL load `console-layout-refactor.css?v=1`
4. THE HTML SHALL reference CSS with version parameter

### Requirement 12: Backward Compatibility

**User Story:** As a developer, I want the refactor to maintain existing functionality, so that no features break.

#### Acceptance Criteria

1. THE refactor SHALL NOT change JavaScript message handling logic
2. THE refactor SHALL NOT change API endpoints
3. THE refactor SHALL NOT change data models
4. THE refactor SHALL maintain all existing console features
5. THE refactor SHALL only modify CSS and scroll behavior
6. THE refactor SHALL maintain existing class names for JavaScript selectors

### Requirement 13: Visual Consistency

**User Story:** As a user, I want the console to match the AIVORY design system, so that it feels cohesive with the rest of the app.

#### Acceptance Criteria

1. THE Console SHALL use AIVORY brand colors (#020617 slate-950 background)
2. THE Console SHALL use consistent border colors (rgba(148, 163, 184, 0.18))
3. THE Console SHALL use gradient backgrounds for input bar and topbar
4. THE Console SHALL use backdrop-filter blur effects
5. THE Console SHALL maintain card design language
6. THE Console SHALL use consistent shadow styles

### Requirement 14: Performance

**User Story:** As a user, I want smooth scrolling and rendering, so that the console feels responsive.

#### Acceptance Criteria

1. THE auto-scroll SHALL use `requestAnimationFrame` for smooth animation
2. THE CSS SHALL use hardware-accelerated properties (transform, opacity)
3. THE Console SHALL avoid layout thrashing
4. THE Console SHALL render messages efficiently
5. THE Console SHALL maintain 60fps during scrolling

### Requirement 15: Testing and Validation

**User Story:** As a developer, I want to test the layout, so that I can verify it works correctly.

#### Acceptance Criteria

1. THE project SHALL include `console-layout-test.html` for testing
2. THE test file SHALL demonstrate all layout features
3. THE test file SHALL include sample messages
4. THE test file SHALL show sticky input bar behavior
5. THE test file SHALL demonstrate auto-scroll behavior
