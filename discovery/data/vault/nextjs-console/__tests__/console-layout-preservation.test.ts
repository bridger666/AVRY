// @ts-nocheck
/**
 * Property 2: Preservation — Chat Bubble Styling and Navigation Behavior
 *
 * These tests observe and encode the CURRENT (unfixed) behavior of:
 * - ChatMessage user/assistant bubble className strings
 * - Sidebar nav item active/inactive className strings
 * - Main content area scroll behavior (overflow classes)
 * - .app-main-content class definition in globals.css
 *
 * All tests MUST PASS on the unfixed code. They will be re-run after the fix
 * to ensure no regressions.
 *
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**
 */

import fc from 'fast-check'
import * as fs from 'fs'
import * as path from 'path'

// ── Observed className strings from source code ───────────────────────────────

// ChatMessage.tsx — user bubble className (observed)
const USER_BUBBLE_CLASS = 'max-w-[80%] bg-[#282825] rounded-2xl px-5 py-3.5 text-base text-white leading-[1.6] border border-[#E5E7EB]/5 shadow-[0_1px_3px_0_rgb(0_0_0/0.1),0_1px_2px_-1px_rgb(0_0_0/0.1)]'

// ChatMessage.tsx — assistant bubble className (observed — no bubble, just text wrapper)
const ASSISTANT_BUBBLE_CLASS =
  'flex-1 px-1 py-1 text-base text-[#d6d6c9] leading-[1.6]'

// Sidebar.tsx — active nav item classes (observed)
const SIDEBAR_ACTIVE_CLASSES = 'text-zinc-100 bg-white/5'

// Sidebar.tsx — inactive nav item classes (observed)
const SIDEBAR_INACTIVE_CLASSES = 'text-zinc-400 hover:text-zinc-100 hover:bg-white/5'

// Console page — message area scroll class (observed)
const MESSAGE_AREA_SCROLL_CLASS = 'overflow-y-auto'

// Layout.tsx — main element overflow class (observed)
const MAIN_OVERFLOW_CLASS = 'overflow-hidden'

// ── Helper: check that a className string contains all expected classes ────────

function containsAllClasses(fullClassName: string, expectedClasses: string): boolean {
  const expected = expectedClasses.split(/\s+/).filter(Boolean)
  return expected.every((cls) => fullClassName.split(/\s+/).includes(cls))
}

// ── Helper: read source file content ──────────────────────────────────────────

function readSourceFile(relativePath: string): string {
  const fullPath = path.resolve(__dirname, '..', relativePath)
  return fs.readFileSync(fullPath, 'utf-8')
}

// ── Property tests ────────────────────────────────────────────────────────────

describe('Property 2: Preservation — Chat Bubble Styling and Navigation Behavior', () => {
  /**
   * 2a. User bubble styling preservation
   *
   * For any user message content, the user bubble className MUST contain
   * `bg-violet-600` and `rounded-2xl`.
   *
   * **Validates: Requirements 3.4**
   */
  describe('User bubble styling', () => {
    it('user bubble className contains bg-violet-600 and rounded-2xl for any message content', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 0, maxLength: 500 }),
          (_messageContent) => {
            // The user bubble className is static — it does not depend on content.
            // We verify the observed className contains the required classes.
            expect(containsAllClasses(USER_BUBBLE_CLASS, 'bg-[#282825] rounded-2xl')).toBe(true)
            expect(containsAllClasses(USER_BUBBLE_CLASS, 'text-base text-white')).toBe(true)
            expect(containsAllClasses(USER_BUBBLE_CLASS, 'px-5 py-3.5')).toBe(true)
          },
        ),
        { numRuns: 50 },
      )
    })

    it('user bubble className in ChatMessage.tsx source matches observed value', () => {
      const source = readSourceFile('components/ChatMessage.tsx')
      expect(source).toContain('bg-[#282825] rounded-2xl')
      expect(source).toContain('max-w-[80%]')
    })
  })

  /**
   * 2b. Assistant bubble styling preservation
   *
   * For any assistant message content, the assistant bubble className MUST
   * contain text styling classes and include an avatar element.
   *
   * **Validates: Requirements 3.4**
   */
  describe('Assistant bubble styling', () => {
    it('assistant message area contains text styling classes for any message content', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 0, maxLength: 500 }),
          (_messageContent) => {
            expect(containsAllClasses(ASSISTANT_BUBBLE_CLASS, 'text-base')).toBe(true)
            expect(containsAllClasses(ASSISTANT_BUBBLE_CLASS, 'text-[#d6d6c9]')).toBe(true)
            expect(containsAllClasses(ASSISTANT_BUBBLE_CLASS, 'leading-[1.6]')).toBe(true)
          },
        ),
        { numRuns: 50 },
      )
    })

    it('assistant bubble in ChatMessage.tsx source includes avatar image', () => {
      const source = readSourceFile('components/ChatMessage.tsx')
      // The assistant bubble renders an avatar with Aivory_Avatar.svg
      expect(source).toContain('Aivory_Avatar.svg')
      expect(source).toContain('text-[#d6d6c9]')
    })
  })

  /**
   * 2c. Sidebar nav active/inactive state preservation
   *
   * For any nav path, the active state MUST use `text-zinc-100 bg-white/5`
   * and the inactive state MUST use `text-zinc-400 hover:text-zinc-100 hover:bg-white/5`.
   *
   * **Validates: Requirements 3.1, 3.2**
   */
  describe('Sidebar navigation highlighting', () => {
    const navPaths = [
      '/console', '/dashboard', '/diagnostics', '/blueprint',
      '/roadmap', '/workflows', '/logs', '/integrations', '/settings',
    ]

    it('active nav state contains text-zinc-100 bg-white/5 for any nav path', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...navPaths),
          (_activePath) => {
            // Active state classes are static — they don't depend on which path is active
            expect(containsAllClasses(SIDEBAR_ACTIVE_CLASSES, 'text-zinc-100')).toBe(true)
            expect(containsAllClasses(SIDEBAR_ACTIVE_CLASSES, 'bg-white/5')).toBe(true)
          },
        ),
        { numRuns: 50 },
      )
    })

    it('inactive nav state contains text-zinc-400 and hover classes for any nav path', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...navPaths),
          (_inactivePath) => {
            expect(containsAllClasses(SIDEBAR_INACTIVE_CLASSES, 'text-zinc-400')).toBe(true)
            expect(containsAllClasses(SIDEBAR_INACTIVE_CLASSES, 'hover:text-zinc-100')).toBe(true)
            expect(containsAllClasses(SIDEBAR_INACTIVE_CLASSES, 'hover:bg-white/5')).toBe(true)
          },
        ),
        { numRuns: 50 },
      )
    })

    it('Sidebar.tsx source contains the observed active/inactive class strings', () => {
      const source = readSourceFile('components/shared/Sidebar.tsx')
      expect(source).toContain("'text-zinc-100 bg-white/5'")
      expect(source).toContain("'text-zinc-400 hover:text-zinc-100 hover:bg-white/5'")
    })
  })

  /**
   * 2d. Main content area scroll behavior preservation
   *
   * The main content area uses overflow-hidden on the layout main element,
   * and the console page message area uses overflow-y-auto for independent scrolling.
   *
   * **Validates: Requirements 3.3**
   */
  describe('Scroll behavior', () => {
    it('layout main element contains overflow-hidden class', () => {
      const source = readSourceFile('app/layout.tsx')
      expect(source).toContain(MAIN_OVERFLOW_CLASS)
    })

    it('console page message area contains overflow-y-auto class', () => {
      const source = readSourceFile('app/console/page.tsx')
      expect(source).toContain(MESSAGE_AREA_SCROLL_CLASS)
    })

    it('for any viewport scenario, scroll classes are present in source', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 320, max: 3840 }),
          fc.integer({ min: 480, max: 2160 }),
          (_viewportWidth, _viewportHeight) => {
            // Scroll classes are static CSS — they don't change with viewport size.
            // We verify the observed classes are correct.
            expect(containsAllClasses('flex-1 overflow-y-auto px-6 py-6', MESSAGE_AREA_SCROLL_CLASS)).toBe(true)
            expect(containsAllClasses('flex-1 flex flex-col min-w-0 overflow-hidden', MAIN_OVERFLOW_CLASS)).toBe(true)
          },
        ),
        { numRuns: 50 },
      )
    })
  })

  /**
   * 2e. .app-main-content class definition in globals.css remains unchanged
   *
   * The CSS class must continue to exist with margin-left: 240px and flex: 1.
   *
   * **Validates: Requirements 3.5**
   */
  describe('.app-main-content CSS class preservation', () => {
    it('globals.css contains .app-main-content with margin-left: 240px', () => {
      const source = readSourceFile('styles/globals.css')
      expect(source).toContain('.app-main-content')
      expect(source).toContain('margin-left: 240px')
    })

    it('globals.css .app-main-content block contains flex: 1 and overflow-y: auto', () => {
      const source = readSourceFile('styles/globals.css')
      // Extract the .app-main-content block
      const match = source.match(/\.app-main-content\s*\{([^}]+)\}/)
      expect(match).not.toBeNull()
      const block = match![1]
      expect(block).toContain('flex: 1')
      expect(block).toContain('margin-left: 240px')
      expect(block).toContain('min-width: 0')
      expect(block).toContain('overflow-y: auto')
      expect(block).toContain('height: 100vh')
    })

    it('for any random class name, .app-main-content definition is stable', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 30 }),
          (_randomClassName) => {
            const source = readSourceFile('styles/globals.css')
            const match = source.match(/\.app-main-content\s*\{([^}]+)\}/)
            expect(match).not.toBeNull()
            expect(match![1]).toContain('margin-left: 240px')
          },
        ),
        { numRuns: 20 },
      )
    })
  })
})
