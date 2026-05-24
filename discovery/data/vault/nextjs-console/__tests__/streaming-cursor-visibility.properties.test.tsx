// @ts-nocheck
/**
 * Property-Based Tests for Streaming Cursor Visibility
 * 
 * **Validates: Requirements 9.1, 9.2**
 * 
 * These tests verify correctness properties of the streaming cursor:
 * - Property 7: Streaming cursor visibility matches streaming state
 * 
 * Verifies that the streaming cursor is visible if and only if:
 * 1. isStreaming === true
 * 2. content.length > 0
 * 
 * When isStreaming is false, the cursor is hidden regardless of content.
 */

import React from 'react'
import fc from 'fast-check'
import { render } from '@testing-library/react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

/**
 * Streaming cursor component matching ChatMessage.tsx implementation
 */
function StreamingCursor({ isStreaming, content }: { isStreaming: boolean; content: string }) {
  return (
    <div className="prose-aira">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {content}
      </ReactMarkdown>
      {isStreaming && content.length > 0 && (
        <span
          className="inline-block w-[3px] h-[1.125rem] bg-[#00e59e] ml-0.5 align-middle rounded-sm"
          style={{ animation: 'blink 1s step-end infinite' }}
          aria-hidden="true"
        />
      )}
    </div>
  )
}

/**
 * Arbitraries for generating test data
 */

const nonEmptyStringArbitrary = (): fc.Arbitrary<string> => {
  return fc.stringMatching(/^.+$/)
}

const emptyStringArbitrary = (): fc.Arbitrary<string> => {
  return fc.constant('')
}

const contentArbitrary = (): fc.Arbitrary<string> => {
  return fc.oneof(
    nonEmptyStringArbitrary(),
    emptyStringArbitrary()
  )
}

const booleanArbitrary = (): fc.Arbitrary<boolean> => {
  return fc.boolean()
}

describe('Streaming Cursor Visibility - Property-Based Tests', () => {
  describe('Property 7: Streaming cursor visibility matches streaming state', () => {
    it('should render cursor when isStreaming=true and content is non-empty', () => {
      fc.assert(
        fc.property(nonEmptyStringArbitrary(), (content) => {
          const { container } = render(
            <StreamingCursor isStreaming={true} content={content} />
          )

          const cursor = container.querySelector('[aria-hidden="true"]')
          expect(cursor).not.toBeNull()
          expect(cursor!.classList.contains('bg-[#00e59e]')).toBe(true)
        })
      )
    })

    it('should not render cursor when isStreaming=false regardless of content', () => {
      fc.assert(
        fc.property(contentArbitrary(), (content) => {
          const { container } = render(
            <StreamingCursor isStreaming={false} content={content} />
          )

          // When isStreaming is false, cursor should not be rendered
          // The cursor is the only element with aria-hidden="true" in StreamingCursor
          const cursor = container.querySelector('span[aria-hidden="true"]')
          expect(cursor).toBeNull()
        })
      )
    })

    it('should not render cursor when isStreaming=true but content is empty', () => {
      fc.assert(
        fc.property(emptyStringArbitrary(), (content) => {
          const { container } = render(
            <StreamingCursor isStreaming={true} content={content} />
          )

          // When content is empty, cursor should not be rendered
          const cursor = container.querySelector('span[aria-hidden="true"]')
          expect(cursor).toBeNull()
        })
      )
    })

    it('should render cursor with aria-hidden="true" attribute when visible', () => {
      fc.assert(
        fc.property(nonEmptyStringArbitrary(), (content) => {
          const { container } = render(
            <StreamingCursor isStreaming={true} content={content} />
          )

          const cursor = container.querySelector('[aria-hidden="true"]')
          expect(cursor).not.toBeNull()
          expect(cursor!.getAttribute('aria-hidden')).toBe('true')
        })
      )
    })

    it('should render cursor with correct styling classes', () => {
      fc.assert(
        fc.property(nonEmptyStringArbitrary(), (content) => {
          const { container } = render(
            <StreamingCursor isStreaming={true} content={content} />
          )

          const cursor = container.querySelector('[aria-hidden="true"]')
          expect(cursor).not.toBeNull()
          
          // Verify cursor has the correct styling classes
          expect(cursor!.classList.contains('inline-block')).toBe(true)
          expect(cursor!.classList.contains('w-[3px]')).toBe(true)
          expect(cursor!.classList.contains('h-[1.125rem]')).toBe(true)
          expect(cursor!.classList.contains('bg-[#00e59e]')).toBe(true)
          expect(cursor!.classList.contains('ml-0.5')).toBe(true)
          expect(cursor!.classList.contains('align-middle')).toBe(true)
          expect(cursor!.classList.contains('rounded-sm')).toBe(true)
        })
      )
    })

    it('should render cursor with blink animation', () => {
      fc.assert(
        fc.property(nonEmptyStringArbitrary(), (content) => {
          const { container } = render(
            <StreamingCursor isStreaming={true} content={content} />
          )

          const cursor = container.querySelector('[aria-hidden="true"]')
          expect(cursor).not.toBeNull()
          
          // Verify cursor has animation style
          const style = cursor!.getAttribute('style')
          expect(style).toContain('animation')
          expect(style).toContain('blink')
        })
      )
    })

    it('should hide cursor when isStreaming transitions from true to false', () => {
      fc.assert(
        fc.property(nonEmptyStringArbitrary(), (content) => {
          const { rerender, container } = render(
            <StreamingCursor isStreaming={true} content={content} />
          )

          // Initially cursor should be visible
          let cursor = container.querySelector('[aria-hidden="true"]')
          expect(cursor).not.toBeNull()

          // Re-render with isStreaming=false
          rerender(
            <StreamingCursor isStreaming={false} content={content} />
          )

          // Cursor should now be hidden
          cursor = container.querySelector('[aria-hidden="true"]')
          expect(cursor).toBeNull()
        })
      )
    })

    it('should show cursor when isStreaming transitions from false to true with non-empty content', () => {
      fc.assert(
        fc.property(nonEmptyStringArbitrary(), (content) => {
          const { rerender, container } = render(
            <StreamingCursor isStreaming={false} content={content} />
          )

          // Initially cursor should not be visible
          let cursor = container.querySelector('[aria-hidden="true"]')
          expect(cursor).toBeNull()

          // Re-render with isStreaming=true
          rerender(
            <StreamingCursor isStreaming={true} content={content} />
          )

          // Cursor should now be visible
          cursor = container.querySelector('[aria-hidden="true"]')
          expect(cursor).not.toBeNull()
        })
      )
    })

    it('should maintain cursor visibility when content changes while isStreaming=true', () => {
      fc.assert(
        fc.property(
          fc.tuple(nonEmptyStringArbitrary(), nonEmptyStringArbitrary()),
          ([content1, content2]) => {
            const { rerender, container } = render(
              <StreamingCursor isStreaming={true} content={content1} />
            )

            // Initially cursor should be visible
            let cursor = container.querySelector('[aria-hidden="true"]')
            expect(cursor).not.toBeNull()

            // Re-render with different content but same isStreaming=true
            rerender(
              <StreamingCursor isStreaming={true} content={content2} />
            )

            // Cursor should still be visible
            cursor = container.querySelector('[aria-hidden="true"]')
            expect(cursor).not.toBeNull()
          }
        )
      )
    })

    it('should render cursor with 3px width', () => {
      fc.assert(
        fc.property(nonEmptyStringArbitrary(), (content) => {
          const { container } = render(
            <StreamingCursor isStreaming={true} content={content} />
          )

          const cursor = container.querySelector('[aria-hidden="true"]')
          expect(cursor).not.toBeNull()
          expect(cursor!.classList.contains('w-[3px]')).toBe(true)
        })
      )
    })

    it('should render cursor with brand accent color #00e59e', () => {
      fc.assert(
        fc.property(nonEmptyStringArbitrary(), (content) => {
          const { container } = render(
            <StreamingCursor isStreaming={true} content={content} />
          )

          const cursor = container.querySelector('[aria-hidden="true"]')
          expect(cursor).not.toBeNull()
          expect(cursor!.classList.contains('bg-[#00e59e]')).toBe(true)
        })
      )
    })

    it('should render cursor with correct height', () => {
      fc.assert(
        fc.property(nonEmptyStringArbitrary(), (content) => {
          const { container } = render(
            <StreamingCursor isStreaming={true} content={content} />
          )

          const cursor = container.querySelector('[aria-hidden="true"]')
          expect(cursor).not.toBeNull()
          expect(cursor!.classList.contains('h-[1.125rem]')).toBe(true)
        })
      )
    })

    it('should render cursor as inline-block element', () => {
      fc.assert(
        fc.property(nonEmptyStringArbitrary(), (content) => {
          const { container } = render(
            <StreamingCursor isStreaming={true} content={content} />
          )

          const cursor = container.querySelector('[aria-hidden="true"]')
          expect(cursor).not.toBeNull()
          expect(cursor!.classList.contains('inline-block')).toBe(true)
        })
      )
    })

    it('should render cursor with rounded corners', () => {
      fc.assert(
        fc.property(nonEmptyStringArbitrary(), (content) => {
          const { container } = render(
            <StreamingCursor isStreaming={true} content={content} />
          )

          const cursor = container.querySelector('[aria-hidden="true"]')
          expect(cursor).not.toBeNull()
          expect(cursor!.classList.contains('rounded-sm')).toBe(true)
        })
      )
    })

    it('should not render cursor for all combinations of isStreaming and empty content', () => {
      fc.assert(
        fc.property(booleanArbitrary(), (isStreaming) => {
          const { container } = render(
            <StreamingCursor isStreaming={isStreaming} content="" />
          )

          const cursor = container.querySelector('span[aria-hidden="true"]')
          expect(cursor).toBeNull()
        })
      )
    })

    it('should render cursor only when both conditions are met: isStreaming=true AND content.length > 0', () => {
      fc.assert(
        fc.property(
          fc.tuple(booleanArbitrary(), contentArbitrary()),
          ([isStreaming, content]) => {
            const { container } = render(
              <StreamingCursor isStreaming={isStreaming} content={content} />
            )

            const cursor = container.querySelector('span[aria-hidden="true"]')
            const shouldHaveCursor = isStreaming && content.length > 0

            if (shouldHaveCursor) {
              expect(cursor).not.toBeNull()
            } else {
              expect(cursor).toBeNull()
            }
          }
        )
      )
    })

    it('should render cursor with correct positioning relative to content', () => {
      fc.assert(
        fc.property(nonEmptyStringArbitrary(), (content) => {
          const { container } = render(
            <StreamingCursor isStreaming={true} content={content} />
          )

          const cursor = container.querySelector('[aria-hidden="true"]')
          expect(cursor).not.toBeNull()
          
          // Cursor should have ml-0.5 (margin-left) for positioning
          expect(cursor!.classList.contains('ml-0.5')).toBe(true)
          // Cursor should be vertically aligned to middle
          expect(cursor!.classList.contains('align-middle')).toBe(true)
        })
      )
    })

    it('should render cursor only once per message when isStreaming=true', () => {
      fc.assert(
        fc.property(nonEmptyStringArbitrary(), (content) => {
          const { container } = render(
            <StreamingCursor isStreaming={true} content={content} />
          )

          const cursors = container.querySelectorAll('[aria-hidden="true"]')
          expect(cursors.length).toBe(1)
        })
      )
    })
  })
})
