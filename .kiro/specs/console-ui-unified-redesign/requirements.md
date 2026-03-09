# Requirements Document: Console UI Unified Redesign

## Introduction

This specification defines the requirements for redesigning the Aivory AI Console dashboard UI to achieve a clean, premium, minimalist dark theme similar to modern AI interfaces like Manus, Grok, Perplexity, and ChatGPT. The redesign uses pure custom CSS (no Tailwind library) with a focus on consistency, readability, and professional aesthetics.

## Glossary

- **Console**: The main AI chat interface where users interact with the Aivory AI system
- **Sidebar**: The left navigation panel containing menu items and icons
- **Top_Bar**: The horizontal header bar displaying user information and controls
- **Input_Bar**: The fixed bottom text input area for user messages
- **Message_Bubble**: Individual chat message containers for user and AI responses
- **Dropdown_Menu**: The file attachment options menu triggered from the input bar
- **Thinking_Animation**: Visual indicator shown while AI is processing a response
- **Avatar**: The visual icon representing the AI agent in chat messages
- **Custom_CSS**: Hand-written CSS without framework dependencies (no Tailwind)
- **Outline_Icon**: Minimalist line-style icon with transparent fill
- **Solid_Icon**: Filled icon with opaque background

## Requirements

### Requirement 1: Sidebar Visual Consistency

**User Story:** As a user, I want a consistent sidebar appearance across all pages, so that the interface feels cohesive and professional.

#### Acceptance Criteria

1. THE Sidebar SHALL use background color #1b1b1c across all pages (Console, Dashboard, Workflows, Logs, Settings)
2. WHEN displaying navigation icons, THE Sidebar SHALL render them in white outline/minimalist line style
3. THE Sidebar SHALL display the Aivory_console_pic.svg icon as a solid (non-outline) exception
4. THE Sidebar SHALL render all text labels in pure white (#ffffff) or light gray (#e0e0e0)
5. THE Sidebar SHALL maintain identical styling properties (padding, spacing, typography) across all pages

### Requirement 2: AI Agent Avatar Display

**User Story:** As a user, I want to see the Aivory brand icon in AI responses, so that I can easily distinguish AI messages from my own.

#### Acceptance Criteria

1. WHEN the AI sends a message, THE Message_Bubble SHALL display the Aivory_console_pic.svg avatar
2. THE Avatar SHALL replace any default blue "A" icon in AI message bubbles
3. THE Avatar SHALL maintain consistent size and positioning across all AI messages

### Requirement 3: Top Bar Layout and Content

**User Story:** As a user, I want a clean top bar with essential information, so that I can quickly access my account details without visual clutter.

#### Acceptance Criteria

1. THE Top_Bar SHALL display elements in a flat, right-aligned layout
2. THE Top_Bar SHALL show the following information in order: Tier, Credits, Language (EN/ID), Username/Guest, Logout
3. THE Top_Bar SHALL use subtle text and icons with minimal styling (no large rounded pills)
4. THE Top_Bar SHALL remain fixed at the top of the viewport
5. THE Top_Bar SHALL span the full width minus the sidebar width

### Requirement 4: File Attachment Dropdown

**User Story:** As a user, I want to attach files from multiple sources, so that I can provide context to the AI from various platforms.

#### Acceptance Criteria

1. THE Input_Bar SHALL display a file attachment icon (outline white paperclip or plus icon)
2. WHEN the attachment icon is clicked, THE System SHALL display a dropdown menu
3. THE Dropdown_Menu SHALL contain the following options: "Add from Figma", "Add from OneDrive files", "Add from Google Drive files", "Use Skills", "Add from local files"
4. WHEN a dropdown option is clicked, THE System SHALL trigger the corresponding file selection flow
5. THE Dropdown_Menu SHALL close when the user clicks outside the menu area

### Requirement 5: Thinking Animation Simplicity

**User Story:** As a user, I want a subtle thinking indicator, so that I know the AI is processing without visual distraction.

#### Acceptance Criteria

1. WHEN the AI is processing, THE System SHALL display a simple thinking animation
2. THE Thinking_Animation SHALL use plain dots or text "Thinking..." without glowing effects
3. THE Thinking_Animation SHALL NOT include blur, glow, or neon shadow effects
4. THE Thinking_Animation SHALL be positioned within the AI message area

### Requirement 6: Color Scheme Standardization

**User Story:** As a user, I want a consistent dark theme color palette, so that the interface is comfortable for extended use.

#### Acceptance Criteria

1. THE Console SHALL use #272728 as the main background color
2. THE Sidebar SHALL use #1b1b1c as the background color
3. THE System SHALL use #333338 for subtle borders throughout the interface
4. THE System SHALL use #ffffff for primary text, #e0e0e0 for secondary text, and #a0a0a8 for muted text
5. THE System SHALL NOT apply glowing effects to any UI elements

### Requirement 7: Typography and Spacing Standards

**User Story:** As a user, I want readable text with comfortable spacing, so that I can easily scan and read content.

#### Acceptance Criteria

1. THE System SHALL apply line-height of 1.7-1.8 to all text content
2. THE System SHALL use 1.5rem margin between paragraphs
3. THE System SHALL apply 2rem padding to container elements
4. THE System SHALL maintain 1.5-2rem gap between message bubbles
5. THE System SHALL use Inter Tight font family with 15px base size and weights 200/300/400/600

### Requirement 8: Input Bar Functionality

**User Story:** As a user, I want a fixed input bar with multi-line support, so that I can compose longer messages comfortably.

#### Acceptance Criteria

1. THE Input_Bar SHALL remain fixed at the bottom of the viewport
2. THE Input_Bar SHALL span the full width minus the sidebar width
3. THE Input_Bar SHALL support multi-line text input
4. WHEN the user presses Enter, THE System SHALL send the message
5. WHEN the user presses Shift+Enter, THE System SHALL insert a new line without sending
6. THE Input_Bar SHALL display a send button icon aligned to the right
7. THE Input_Bar SHALL show a subtle placeholder text when empty
8. THE Input_Bar SHALL have a subtle flat shadow elevation (no glow)

### Requirement 9: Chat Message Scrolling

**User Story:** As a user, I want smooth scrolling through chat history, so that I can review previous conversations easily.

#### Acceptance Criteria

1. THE Console SHALL implement scrolling at the page/sidebar level (not inner scrollbar)
2. WHEN a new message is received, THE System SHALL auto-scroll to the bottom
3. THE System SHALL maintain 1.5-2rem gap between consecutive messages
4. THE Message_Bubble SHALL display with generous vertical spacing for readability

### Requirement 10: Table Rendering Standards

**User Story:** As a user, I want well-formatted tables in AI responses, so that structured data is easy to read.

#### Acceptance Criteria

1. THE System SHALL apply 1rem gap between table rows
2. THE System SHALL apply 1.25rem vertical and 1.5rem horizontal padding to table cells
3. THE System SHALL use a subtle background color for table headers
4. THE System SHALL use thin borders for table cells
5. WHEN hovering over a table row, THE System SHALL apply a light background change

### Requirement 11: Custom CSS Architecture

**User Story:** As a developer, I want maintainable custom CSS, so that the styling is easy to update and extend.

#### Acceptance Criteria

1. THE System SHALL use pure custom CSS without Tailwind library dependencies
2. THE System SHALL define utility-style short class names (.sidebar, .top-bar, .chat-container, .message-list, .input-bar, .message-user, .message-ai, .table-ai, .add-dropdown)
3. THE System SHALL define all color and spacing values in a single :root CSS variables section
4. THE System SHALL NOT contain duplicate CSS rule definitions
5. THE System SHALL organize CSS rules by component grouping

### Requirement 12: Content Professionalism

**User Story:** As a user, I want professional AI responses, so that the interface maintains a business-appropriate tone.

#### Acceptance Criteria

1. THE System SHALL NOT generate emojis or emoticons in AI response text
2. THE System SHALL maintain clean and professional language in all generated content

### Requirement 13: Responsive Design Behavior

**User Story:** As a mobile user, I want a functional interface on small screens, so that I can use the console on any device.

#### Acceptance Criteria

1. WHEN viewed on mobile, THE Input_Bar SHALL span full width
2. WHEN viewed on mobile, THE Sidebar SHALL collapse to a bottom navigation bar or hamburger menu
3. THE Input_Bar SHALL remain visible and fixed at the bottom on all screen sizes
4. THE Message_Bubble SHALL scroll above the fixed input bar on all screen sizes
5. THE System SHALL maintain the dark minimalist aesthetic on all screen sizes
