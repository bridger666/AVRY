# Tasks: Console Layout Refactor

## Task 1: CSS Grid Layout Implementation
- [x] 1.1 Create console-layout-refactor.css file
- [x] 1.2 Implement CSS Grid structure with topbar, sidebar, main areas
- [x] 1.3 Configure grid-template-columns: 260px 1fr
- [x] 1.4 Configure grid-template-rows: auto 1fr
- [x] 1.5 Define grid-template-areas: "topbar topbar" / "sidebar main"
- [x] 1.6 Assign grid-area to topbar, sidebar, main elements
- [x] 1.7 Set min-height: 100vh on console-layout

## Task 2: Page-Level Scrolling Setup
- [x] 2.1 Set html, body to allow natural scrolling
- [x] 2.2 Remove overflow restrictions from .console-main
- [x] 2.3 Set .console-main overflow: visible !important
- [x] 2.4 Remove overflow restrictions from .thread-messages
- [x] 2.5 Set .thread-messages overflow: visible !important
- [x] 2.6 Remove max-height restrictions from main containers
- [x] 2.7 Test that only browser scrollbar appears

## Task 3: Topbar Styling and Positioning
- [x] 3.1 Style topbar to span full width
- [x] 3.2 Add sticky positioning (position: sticky, top: 0)
- [x] 3.3 Set z-index: 30 for topbar
- [x] 3.4 Add gradient background to topbar
- [x] 3.5 Add backdrop-filter blur to topbar
- [x] 3.6 Style topbar-left (logo) and topbar-right (tier, credits)
- [x] 3.7 Add border-bottom to topbar
- [x] 3.8 Test topbar visibility and positioning

## Task 4: Sidebar Positioning and Overlap Prevention
- [x] 4.1 Set sidebar width to 260px
- [x] 4.2 Position sidebar in left grid column
- [x] 4.3 Add transform: none !important to prevent overlap
- [x] 4.4 Disable hover effects that cause overlap
- [x] 4.5 Set sidebar z-index: 20
- [x] 4.6 Add sticky positioning to sidebar
- [x] 4.7 Test sidebar does not overlap main content

## Task 5: Sticky Input Bar Implementation
- [x] 5.1 Add position: sticky to .chat-input-wrapper
- [x] 5.2 Set bottom: 0 on .chat-input-wrapper
- [x] 5.3 Set z-index: 25 on .chat-input-wrapper
- [x] 5.4 Add gradient background to input bar
- [x] 5.5 Add backdrop-filter blur to input bar
- [x] 5.6 Add border-top to input bar
- [x] 5.7 Test input bar stays visible during scroll

## Task 6: Centered Message Column
- [x] 6.1 Set max-width: 780px on .message-bubble
- [x] 6.2 Center messages with margin: 0 auto
- [x] 6.3 Test message width consistency
- [x] 6.4 Verify readability on different screen sizes

## Task 7: JavaScript Scroll Behavior Update
- [x] 7.1 Update sendMessage() to use window.scrollTo()
- [x] 7.2 Change scroll target to document.body.scrollHeight
- [x] 7.3 Add requestAnimationFrame for smooth animation
- [x] 7.4 Set behavior: 'smooth' on scrollTo
- [x] 7.5 Test auto-scroll after user message
- [x] 7.6 Test auto-scroll after AI response

## Task 8: Markdown Renderer Enhancement
- [x] 8.1 Update renderer.code to add data-language attribute
- [x] 8.2 Add data-language to <pre> elements
- [x] 8.3 Create CSS ::before pseudo-element for language labels
- [x] 8.4 Style language labels with monospace font
- [x] 8.5 Set language labels to lowercase
- [x] 8.6 Test code blocks with various languages

## Task 9: Typography and Spacing
- [x] 9.1 Set system font stack on .console-layout
- [x] 9.2 Set message text font-size: 14.5px
- [x] 9.3 Set message text line-height: 1.7
- [x] 9.4 Set message bottom margin: 18px
- [x] 9.5 Set input bar padding: 12px 24px 16px
- [x] 9.6 Apply Tailwind-style spacing scale
- [x] 9.7 Use consistent border-radius values

## Task 10: Responsive Design for Mobile
- [x] 10.1 Add media query for max-width: 768px
- [x] 10.2 Collapse sidebar to 60px on mobile
- [x] 10.3 Update grid-template-columns for mobile
- [x] 10.4 Reduce message padding on mobile
- [x] 10.5 Reduce input bar padding on mobile
- [x] 10.6 Scale down topbar logo on mobile
- [x] 10.7 Reduce topbar stat font size on mobile
- [x] 10.8 Test on various mobile screen sizes

## Task 11: Visual Consistency with AIVORY Design
- [x] 11.1 Use #020617 (slate-950) for background
- [x] 11.2 Use rgba(148, 163, 184, 0.18) for borders
- [x] 11.3 Apply gradient backgrounds consistently
- [x] 11.4 Use backdrop-filter blur effects
- [x] 11.5 Maintain card design language
- [x] 11.6 Use consistent shadow styles

## Task 12: HTML Integration
- [x] 12.1 Add CSS link to console.html
- [x] 12.2 Add version parameter ?v=1 for cache busting
- [x] 12.3 Verify CSS load order (after existing CSS)
- [x] 12.4 Test HTML structure compatibility

## Task 13: Testing and Validation
- [ ] 13.1 Create console-layout-test.html file
- [ ] 13.2 Add sample messages to test file
- [ ] 13.3 Test sticky input bar behavior
- [ ] 13.4 Test auto-scroll behavior
- [ ] 13.5 Test in Chrome browser
- [ ] 13.6 Test in Firefox browser
- [ ] 13.7 Test in Safari browser
- [ ] 13.8 Test on mobile devices
- [ ] 13.9 Verify backward compatibility

## Task 14: Documentation
- [x] 14.1 Create CONSOLE_LAYOUT_REFACTOR_COMPLETE.md
- [x] 14.2 Create CONSOLE_LAYOUT_VISUAL_GUIDE.md
- [x] 14.3 Create CONSOLE_LAYOUT_QUICK_START.md
- [x] 14.4 Create CONSOLE_LAYOUT_FIX_APPLIED.md
- [x] 14.5 Document hard refresh requirement
- [x] 14.6 Document layout structure
- [x] 14.7 Document testing instructions

## Task 15: Property-Based Testing
- [ ] 15.1 Set up fast-check testing framework
- [ ] 15.2 Write property test for page-level scrolling (Property 1)
- [ ] 15.3 Write property test for sticky input bar visibility (Property 2)
- [ ] 15.4 Write property test for auto-scroll after message (Property 3)
- [ ] 15.5 Write property test for centered message column width (Property 4)
- [ ] 15.6 Write property test for CSS Grid layout structure (Property 5)
- [ ] 15.7 Write property test for topbar visibility (Property 6)
- [ ] 15.8 Write property test for sidebar positioning (Property 7)
- [ ] 15.9 Write property test for code block language labels (Property 8)
- [ ] 15.10 Write property test for responsive mobile layout (Property 9)
- [ ] 15.11 Write property test for overflow visibility (Property 10)
- [ ] 15.12 Write property test for scroll behavior (Property 11)
- [ ] 15.13 Write property test for input bar z-index (Property 12)
- [ ] 15.14 Write property test for topbar z-index (Property 13)
- [ ] 15.15 Write property test for sidebar z-index (Property 14)
- [ ] 15.16 Write property test for CSS file cache busting (Property 15)
- [ ] 15.17 Write property test for backward compatibility (Property 16)
- [ ] 15.18 Write property test for typography consistency (Property 17)
- [ ] 15.19 Write property test for spacing consistency (Property 18)
- [ ] 15.20 Write property test for brand color consistency (Property 19)
- [ ] 15.21 Write property test for gradient background (Property 20)

## Task 16: Unit Testing
- [ ] 16.1 Write unit test for empty message list
- [ ] 16.2 Write unit test for single message
- [ ] 16.3 Write unit test for many messages (100+)
- [ ] 16.4 Write unit test for long message content
- [ ] 16.5 Write unit test for code blocks with various languages
- [ ] 16.6 Write unit test for markdown rendering
- [ ] 16.7 Write unit test for scroll position after message
- [ ] 16.8 Write unit test for input bar visibility during scroll
- [ ] 16.9 Write unit test for mobile responsive breakpoints
- [ ] 16.10 Write unit test for browser compatibility

## Task 17: Performance Optimization
- [ ] 17.1 Verify 60fps scrolling performance
- [ ] 17.2 Optimize CSS for hardware acceleration
- [ ] 17.3 Minimize layout thrashing
- [ ] 17.4 Test with large message history (500+ messages)
- [ ] 17.5 Profile rendering performance
- [ ] 17.6 Optimize auto-scroll animation

## Task 18: Deployment Preparation
- [ ] 18.1 Minify CSS for production
- [ ] 18.2 Test in staging environment
- [ ] 18.3 Verify cache busting works
- [ ] 18.4 Create rollback plan
- [ ] 18.5 Prepare deployment checklist
- [ ] 18.6 Document deployment steps

## Task 19: User Acceptance Testing
- [ ] 19.1 Test with real users
- [ ] 19.2 Gather feedback on layout
- [ ] 19.3 Verify input bar usability
- [ ] 19.4 Verify message readability
- [ ] 19.5 Verify scroll behavior feels natural
- [ ] 19.6 Address any user-reported issues

## Task 20: Final Verification
- [ ] 20.1 Verify all acceptance criteria met
- [ ] 20.2 Verify all properties validated
- [ ] 20.3 Verify backward compatibility maintained
- [ ] 20.4 Verify no regressions in existing features
- [ ] 20.5 Verify documentation complete
- [ ] 20.6 Mark spec as complete
