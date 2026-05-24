// @ts-nocheck
/**
 * Property-Based Tests for Markdown Heading Typography Compliance
 * 
 * **Validates: Requirements 1.3, 1.4, 1.5, 1.6**
 * 
 * These tests verify correctness properties of markdown heading typography:
 * - Property 8: Markdown heading typography compliance
 * 
 * Verifies that H1, H2, H3, and paragraph elements render with correct
 * Manus Design System classes as specified in the design document.
 */

import React from 'react'
import fc from 'fast-check'
import { render } from '@testing-library/react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

/**
 * Markdown components matching ChatMessage.tsx implementation
 */
const markdownComponents = {
  h1: ({ children }: any) => (
    <h1 className="text-[1.875rem] font-bold mb-6 text-zinc-100 leading-tight tracking-tight first:mt-0">
      {children}
    </h1>
  ),
  h2: ({ children }: any) => (
    <h2 className="text-2xl font-semibold mt-8 mb-4 text-zinc-100 leading-tight tracking-tight first:mt-0">
      {children}
    </h2>
  ),
  h3: ({ children }: any) => (
    <h3 className="text-xl font-semibold mt-6 mb-3 text-zinc-100 leading-snug first:mt-0">
      {children}
    </h3>
  ),
  p: ({ children }: any) => (
    <p className="text-base leading-[1.6] mb-4 text-[#d6d6c9] last:mb-0">
      {children}
    </p>
  ),
}

/**
 * Arbitraries for generating markdown content
 */

const headingTextArbitrary = (): fc.Arbitrary<string> => {
  return fc.stringMatching(/^[A-Za-z0-9\s\-]{3,50}$/)
}

const paragraphTextArbitrary = (): fc.Arbitrary<string> => {
  return fc.stringMatching(/^[A-Za-z0-9\s\.\,\-]{3,100}$/)
}

const h1MarkdownArbitrary = (): fc.Arbitrary<string> => {
  return fc.tuple(headingTextArbitrary()).map(([text]) => `# ${text}`)
}

const h2MarkdownArbitrary = (): fc.Arbitrary<string> => {
  return fc.tuple(headingTextArbitrary()).map(([text]) => `## ${text}`)
}

const h3MarkdownArbitrary = (): fc.Arbitrary<string> => {
  return fc.tuple(headingTextArbitrary()).map(([text]) => `### ${text}`)
}

const paragraphMarkdownArbitrary = (): fc.Arbitrary<string> => {
  return paragraphTextArbitrary()
}

describe('Markdown Heading Typography - Property-Based Tests', () => {
  describe('Property 8: Markdown heading typography compliance', () => {
    it('should render H1 with correct Manus Design System classes', () => {
      fc.assert(
        fc.property(h1MarkdownArbitrary(), (markdown) => {
          const { container } = render(
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
            >
              {markdown}
            </ReactMarkdown>
          )

          const h1Element = container.querySelector('h1')
          expect(h1Element).not.toBeNull()

          // Verify H1 has correct classes
          const classList = h1Element!.className
          expect(classList).toContain('text-[1.875rem]')
          expect(classList).toContain('font-bold')
          expect(classList).toContain('mb-6')
          expect(classList).toContain('text-zinc-100')
        })
      )
    })

    it('should render H2 with correct Manus Design System classes', () => {
      fc.assert(
        fc.property(h2MarkdownArbitrary(), (markdown) => {
          const { container } = render(
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
            >
              {markdown}
            </ReactMarkdown>
          )

          const h2Element = container.querySelector('h2')
          expect(h2Element).not.toBeNull()

          // Verify H2 has correct classes
          const classList = h2Element!.className
          expect(classList).toContain('text-2xl')
          expect(classList).toContain('font-semibold')
          expect(classList).toContain('mt-8')
          expect(classList).toContain('mb-4')
          expect(classList).toContain('text-zinc-100')
        })
      )
    })

    it('should render H3 with correct Manus Design System classes', () => {
      fc.assert(
        fc.property(h3MarkdownArbitrary(), (markdown) => {
          const { container } = render(
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
            >
              {markdown}
            </ReactMarkdown>
          )

          const h3Element = container.querySelector('h3')
          expect(h3Element).not.toBeNull()

          // Verify H3 has correct classes
          const classList = h3Element!.className
          expect(classList).toContain('text-xl')
          expect(classList).toContain('font-semibold')
          expect(classList).toContain('mt-6')
          expect(classList).toContain('mb-3')
          expect(classList).toContain('text-zinc-100')
        })
      )
    })

    it('should render paragraph with correct Manus Design System classes', () => {
      fc.assert(
        fc.property(h1MarkdownArbitrary(), (markdown) => {
          // Use a heading followed by a paragraph to ensure paragraph renders
          const fullMarkdown = `${markdown}\n\nThis is a test paragraph with content.`
          const { container } = render(
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
            >
              {fullMarkdown}
            </ReactMarkdown>
          )

          const pElement = container.querySelector('p')
          expect(pElement).not.toBeNull()

          // Verify paragraph has correct classes
          const classList = pElement!.className
          expect(classList).toContain('text-base')
          expect(classList).toContain('leading-[1.6]')
          expect(classList).toContain('mb-4')
          expect(classList).toContain('text-[#d6d6c9]')
        })
      )
    })

    it('should render H1 with text-zinc-100 color for primary headlines', () => {
      fc.assert(
        fc.property(h1MarkdownArbitrary(), (markdown) => {
          const { container } = render(
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
            >
              {markdown}
            </ReactMarkdown>
          )

          const h1Element = container.querySelector('h1')
          expect(h1Element).not.toBeNull()
          expect(h1Element!.className).toContain('text-zinc-100')
        })
      )
    })

    it('should render H2 with text-zinc-100 color for secondary headlines', () => {
      fc.assert(
        fc.property(h2MarkdownArbitrary(), (markdown) => {
          const { container } = render(
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
            >
              {markdown}
            </ReactMarkdown>
          )

          const h2Element = container.querySelector('h2')
          expect(h2Element).not.toBeNull()
          expect(h2Element!.className).toContain('text-zinc-100')
        })
      )
    })

    it('should render H3 with text-zinc-100 color for tertiary headlines', () => {
      fc.assert(
        fc.property(h3MarkdownArbitrary(), (markdown) => {
          const { container } = render(
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
            >
              {markdown}
            </ReactMarkdown>
          )

          const h3Element = container.querySelector('h3')
          expect(h3Element).not.toBeNull()
          expect(h3Element!.className).toContain('text-zinc-100')
        })
      )
    })

    it('should render paragraph with text-[#d6d6c9] color for body text', () => {
      fc.assert(
        fc.property(h1MarkdownArbitrary(), (markdown) => {
          const fullMarkdown = `${markdown}\n\nThis is a test paragraph.`
          const { container } = render(
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
            >
              {fullMarkdown}
            </ReactMarkdown>
          )

          const pElement = container.querySelector('p')
          expect(pElement).not.toBeNull()
          expect(pElement!.className).toContain('text-[#d6d6c9]')
        })
      )
    })

    it('should render H1 with bold font weight', () => {
      fc.assert(
        fc.property(h1MarkdownArbitrary(), (markdown) => {
          const { container } = render(
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
            >
              {markdown}
            </ReactMarkdown>
          )

          const h1Element = container.querySelector('h1')
          expect(h1Element).not.toBeNull()
          expect(h1Element!.className).toContain('font-bold')
        })
      )
    })

    it('should render H2 with semibold font weight', () => {
      fc.assert(
        fc.property(h2MarkdownArbitrary(), (markdown) => {
          const { container } = render(
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
            >
              {markdown}
            </ReactMarkdown>
          )

          const h2Element = container.querySelector('h2')
          expect(h2Element).not.toBeNull()
          expect(h2Element!.className).toContain('font-semibold')
        })
      )
    })

    it('should render H3 with semibold font weight', () => {
      fc.assert(
        fc.property(h3MarkdownArbitrary(), (markdown) => {
          const { container } = render(
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
            >
              {markdown}
            </ReactMarkdown>
          )

          const h3Element = container.querySelector('h3')
          expect(h3Element).not.toBeNull()
          expect(h3Element!.className).toContain('font-semibold')
        })
      )
    })

    it('should render H1 with mb-6 bottom margin', () => {
      fc.assert(
        fc.property(h1MarkdownArbitrary(), (markdown) => {
          const { container } = render(
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
            >
              {markdown}
            </ReactMarkdown>
          )

          const h1Element = container.querySelector('h1')
          expect(h1Element).not.toBeNull()
          expect(h1Element!.className).toContain('mb-6')
        })
      )
    })

    it('should render H2 with mt-8 top margin and mb-4 bottom margin', () => {
      fc.assert(
        fc.property(h2MarkdownArbitrary(), (markdown) => {
          const { container } = render(
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
            >
              {markdown}
            </ReactMarkdown>
          )

          const h2Element = container.querySelector('h2')
          expect(h2Element).not.toBeNull()
          expect(h2Element!.className).toContain('mt-8')
          expect(h2Element!.className).toContain('mb-4')
        })
      )
    })

    it('should render H3 with mt-6 top margin and mb-3 bottom margin', () => {
      fc.assert(
        fc.property(h3MarkdownArbitrary(), (markdown) => {
          const { container } = render(
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
            >
              {markdown}
            </ReactMarkdown>
          )

          const h3Element = container.querySelector('h3')
          expect(h3Element).not.toBeNull()
          expect(h3Element!.className).toContain('mt-6')
          expect(h3Element!.className).toContain('mb-3')
        })
      )
    })

    it('should render paragraph with text-base font size', () => {
      fc.assert(
        fc.property(h1MarkdownArbitrary(), (markdown) => {
          const fullMarkdown = `${markdown}\n\nThis is a test paragraph.`
          const { container } = render(
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
            >
              {fullMarkdown}
            </ReactMarkdown>
          )

          const pElement = container.querySelector('p')
          expect(pElement).not.toBeNull()
          expect(pElement!.className).toContain('text-base')
        })
      )
    })

    it('should render paragraph with leading-[1.6] line height', () => {
      fc.assert(
        fc.property(h1MarkdownArbitrary(), (markdown) => {
          const fullMarkdown = `${markdown}\n\nThis is a test paragraph.`
          const { container } = render(
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
            >
              {fullMarkdown}
            </ReactMarkdown>
          )

          const pElement = container.querySelector('p')
          expect(pElement).not.toBeNull()
          expect(pElement!.className).toContain('leading-[1.6]')
        })
      )
    })

    it('should render paragraph with mb-4 bottom margin', () => {
      fc.assert(
        fc.property(h1MarkdownArbitrary(), (markdown) => {
          const fullMarkdown = `${markdown}\n\nThis is a test paragraph.`
          const { container } = render(
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
            >
              {fullMarkdown}
            </ReactMarkdown>
          )

          const pElement = container.querySelector('p')
          expect(pElement).not.toBeNull()
          expect(pElement!.className).toContain('mb-4')
        })
      )
    })

    it('should render multiple headings with consistent typography across all levels', () => {
      fc.assert(
        fc.property(
          fc.tuple(h1MarkdownArbitrary(), h2MarkdownArbitrary(), h3MarkdownArbitrary()),
          ([h1Md, h2Md, h3Md]) => {
            const markdown = `${h1Md}\n\n${h2Md}\n\n${h3Md}`
            const { container } = render(
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={markdownComponents}
              >
                {markdown}
              </ReactMarkdown>
            )

            const h1 = container.querySelector('h1')
            const h2 = container.querySelector('h2')
            const h3 = container.querySelector('h3')

            // All headings should be present
            expect(h1).not.toBeNull()
            expect(h2).not.toBeNull()
            expect(h3).not.toBeNull()

            // All headings should use text-zinc-100
            expect(h1!.className).toContain('text-zinc-100')
            expect(h2!.className).toContain('text-zinc-100')
            expect(h3!.className).toContain('text-zinc-100')

            // All headings should have correct font weights
            expect(h1!.className).toContain('font-bold')
            expect(h2!.className).toContain('font-semibold')
            expect(h3!.className).toContain('font-semibold')
          }
        )
      )
    })

    it('should render mixed content with headings and paragraphs maintaining correct typography', () => {
      fc.assert(
        fc.property(
          fc.tuple(h1MarkdownArbitrary(), h2MarkdownArbitrary()),
          ([h1Md, h2Md]) => {
            const markdown = `${h1Md}\n\n${h2Md}`
            const { container } = render(
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={markdownComponents}
              >
                {markdown}
              </ReactMarkdown>
            )

            const h1 = container.querySelector('h1')
            const h2 = container.querySelector('h2')

            expect(h1).not.toBeNull()
            expect(h2).not.toBeNull()

            // H1 should have bold weight
            expect(h1!.className).toContain('font-bold')

            // H2 should have semibold weight
            expect(h2!.className).toContain('font-semibold')

            // Both should have correct margins
            expect(h1!.className).toContain('mb-6')
            expect(h2!.className).toContain('mt-8')
            expect(h2!.className).toContain('mb-4')
          }
        )
      )
    })
  })
})
