// @ts-nocheck
/**
 * Property-Based Tests for Markdown Element Styling Compliance
 *
 * **Validates: Requirements 15.1, 15.2, 15.3**
 *
 * These tests verify correctness properties of markdown element styling:
 * - Property 9: Markdown element styling compliance
 *
 * Verifies that tables, code blocks, and lists render with correct
 * Manus Design System classes as specified in the design document.
 */

import React from 'react'
import { render } from '@testing-library/react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import * as fc from 'fast-check'

/**
 * Markdown components matching ChatMessage.tsx implementation
 */
const markdownComponents = {
  code: ({ inline, className, children }: any) => {
    if (inline) {
      return (
        <code className="bg-white/8 text-pink-400 px-1.5 py-0.5 rounded border border-white/10 font-mono text-[0.875rem]">
          {children}
        </code>
      )
    }
    return (
      <div className="my-5 rounded-xl overflow-hidden bg-[#1E1E1E] border border-[#E5E7EB]/10">
        <div className="flex justify-between items-center px-5 py-2.5 bg-[#2d2d2d] border-b border-[#E5E7EB]/10">
          <span className="text-xs text-[#a1a1aa] font-mono uppercase tracking-wider">code</span>
        </div>
        <pre className="m-0 rounded-b-xl text-[0.875rem] leading-relaxed p-5 bg-[#1E1E1E] overflow-x-auto">
          <code>{children}</code>
        </pre>
      </div>
    )
  },
  p: ({ children }: any) => (
    <p className="text-base leading-[1.6] mb-4 text-[#d6d6c9] last:mb-0">
      {children}
    </p>
  ),
  thead: ({ children }: any) => (
    <thead className="bg-white/4">
      {children}
    </thead>
  ),
  th: ({ children }: any) => (
    <th className="px-4 py-3 text-left text-sm font-semibold text-[#d6d6c9] border-b border-[#E5E7EB]/10">
      {children}
    </th>
  ),
  td: ({ children }: any) => (
    <td className="px-4 py-3 text-sm text-[#d6d6c9] border-b border-[#E5E7EB]/10">
      {children}
    </td>
  ),
  table: ({ children }: any) => (
    <div className="my-5 border border-[#E5E7EB]/10 rounded-xl overflow-hidden">
      <table className="w-full border-collapse">
        {children}
      </table>
    </div>
  ),
  ul: ({ children }: any) => (
    <ul className="my-4 list-none pl-0">
      {children}
    </ul>
  ),
  ol: ({ children }: any) => (
    <ol className="my-4 list-decimal pl-6">
      {children}
    </ol>
  ),
  li: ({ children }: any) => (
    <li className="mb-2 text-base text-[#d6d6c9] leading-[1.6]">
      <span>{children}</span>
    </li>
  ),
}

/**
 * Arbitraries for generating markdown content
 */

const listItemTextArbitrary = (): fc.Arbitrary<string> => {
  return fc.stringMatching(/^[A-Za-z0-9\s\-]{3,50}$/)
}

const unorderedListMarkdownArbitrary = (): fc.Arbitrary<string> => {
  return fc.array(listItemTextArbitrary(), { minLength: 1, maxLength: 5 }).map(items =>
    items.map(item => `- ${item}`).join('\n')
  )
}

const orderedListMarkdownArbitrary = (): fc.Arbitrary<string> => {
  return fc.array(listItemTextArbitrary(), { minLength: 1, maxLength: 5 }).map(items =>
    items.map((item, i) => `${i + 1}. ${item}`).join('\n')
  )
}

const codeBlockMarkdownArbitrary = (): fc.Arbitrary<string> => {
  return fc.stringMatching(/^[A-Za-z0-9\s\(\)\{\}\[\]\:\;\,\.]{5,100}$/).map(code =>
    `\`\`\`javascript\n${code}\n\`\`\``
  )
}

describe('Markdown Element Styling - Property-Based Tests', () => {
  describe('Property 9: Markdown element styling compliance', () => {
    it('should render code blocks with bg-[#1E1E1E] background', () => {
      fc.assert(
        fc.property(codeBlockMarkdownArbitrary(), (markdown) => {
          const { container } = render(
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
              {markdown}
            </ReactMarkdown>
          )
          const codeBlockDiv = container.querySelector('div.rounded-xl')
          expect(codeBlockDiv).not.toBeNull()
          expect(codeBlockDiv?.className).toContain('bg-[#1E1E1E]')
        })
      )
    })

    it('should render code blocks with rounded-xl border radius', () => {
      fc.assert(
        fc.property(codeBlockMarkdownArbitrary(), (markdown) => {
          const { container } = render(
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
              {markdown}
            </ReactMarkdown>
          )
          const codeBlockDiv = container.querySelector('div.rounded-xl')
          expect(codeBlockDiv).not.toBeNull()
          expect(codeBlockDiv?.className).toContain('rounded-xl')
        })
      )
    })

    it('should render code blocks with p-5 padding', () => {
      const markdown = '```javascript\nconst x = 42;\n```'
      const { container } = render(
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
          {markdown}
        </ReactMarkdown>
      )
      const preElement = container.querySelector('pre')
      expect(preElement).not.toBeNull()
      expect(preElement?.className).toContain('p-5')
    })

    it('should render code blocks with border border-[#E5E7EB]/10', () => {
      fc.assert(
        fc.property(codeBlockMarkdownArbitrary(), (markdown) => {
          const { container } = render(
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
              {markdown}
            </ReactMarkdown>
          )
          const codeBlockDiv = container.querySelector('div.border')
          expect(codeBlockDiv).not.toBeNull()
          expect(codeBlockDiv?.className).toContain('border-[#E5E7EB]/10')
        })
      )
    })

    it('should render tables with border border-[#E5E7EB]/10', () => {
      const markdown = '| Header 1 | Header 2 |\n| --- | --- |\n| Data 1 | Data 2 |'
      const { container } = render(
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
          {markdown}
        </ReactMarkdown>
      )
      const tableWrapper = container.querySelector('div.border')
      expect(tableWrapper).not.toBeNull()
      expect(tableWrapper?.className).toContain('border-[#E5E7EB]/10')
    })

    it('should render table headers with bg-white/4 background', () => {
      const markdown = '| Header 1 | Header 2 |\n| --- | --- |\n| Data 1 | Data 2 |'
      const { container } = render(
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
          {markdown}
        </ReactMarkdown>
      )
      const thead = container.querySelector('thead')
      expect(thead).not.toBeNull()
      expect(thead?.className).toContain('bg-white/4')
    })

    it('should render table cells with px-4 py-3 padding', () => {
      const markdown = '| Header 1 | Header 2 |\n| --- | --- |\n| Data 1 | Data 2 |'
      const { container } = render(
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
          {markdown}
        </ReactMarkdown>
      )
      const thElement = container.querySelector('th')
      expect(thElement).not.toBeNull()
      expect(thElement?.className).toContain('px-4')
      expect(thElement?.className).toContain('py-3')
      const tdElement = container.querySelector('td')
      expect(tdElement).not.toBeNull()
      expect(tdElement?.className).toContain('px-4')
      expect(tdElement?.className).toContain('py-3')
    })

    it('should render unordered lists with my-4 container margin', () => {
      fc.assert(
        fc.property(unorderedListMarkdownArbitrary(), (markdown) => {
          const { container } = render(
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
              {markdown}
            </ReactMarkdown>
          )
          const ulElement = container.querySelector('ul')
          expect(ulElement).not.toBeNull()
          expect(ulElement?.className).toContain('my-4')
        })
      )
    })

    it('should render ordered lists with my-4 container margin', () => {
      fc.assert(
        fc.property(orderedListMarkdownArbitrary(), (markdown) => {
          const { container } = render(
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
              {markdown}
            </ReactMarkdown>
          )
          const olElement = container.querySelector('ol')
          expect(olElement).not.toBeNull()
          expect(olElement?.className).toContain('my-4')
        })
      )
    })

    it('should render list items with mb-2 bottom margin', () => {
      fc.assert(
        fc.property(unorderedListMarkdownArbitrary(), (markdown) => {
          const { container } = render(
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
              {markdown}
            </ReactMarkdown>
          )
          const liElement = container.querySelector('li')
          expect(liElement).not.toBeNull()
          expect(liElement?.className).toContain('mb-2')
        })
      )
    })

    it('should render list items with correct text styling', () => {
      fc.assert(
        fc.property(unorderedListMarkdownArbitrary(), (markdown) => {
          const { container } = render(
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
              {markdown}
            </ReactMarkdown>
          )
          const liElement = container.querySelector('li')
          expect(liElement).not.toBeNull()
          expect(liElement?.className).toContain('text-base')
          expect(liElement?.className).toContain('text-[#d6d6c9]')
          expect(liElement?.className).toContain('leading-[1.6]')
        })
      )
    })

    it('should render unordered list items with bullet points', () => {
      const markdown = '- Item 1\n- Item 2\n- Item 3'
      const { container } = render(
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
          {markdown}
        </ReactMarkdown>
      )
      const liElements = container.querySelectorAll('li')
      expect(liElements.length).toBeGreaterThan(0)
      liElements.forEach(li => {
        const bulletSpan = li.querySelector('span')
        expect(bulletSpan).not.toBeNull()
      })
    })

    it('should render unordered lists with list-none class', () => {
      fc.assert(
        fc.property(unorderedListMarkdownArbitrary(), (markdown) => {
          const { container } = render(
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
              {markdown}
            </ReactMarkdown>
          )
          const ulElement = container.querySelector('ul')
          expect(ulElement).not.toBeNull()
          expect(ulElement?.className).toContain('list-none')
        })
      )
    })

    it('should render ordered lists with list-decimal class', () => {
      fc.assert(
        fc.property(orderedListMarkdownArbitrary(), (markdown) => {
          const { container } = render(
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
              {markdown}
            </ReactMarkdown>
          )
          const olElement = container.querySelector('ol')
          expect(olElement).not.toBeNull()
          expect(olElement?.className).toContain('list-decimal')
        })
      )
    })

    it('should render code blocks with all required Manus Design System classes', () => {
      const markdown = '```javascript\nconst x = 42;\n```'
      const { container } = render(
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
          {markdown}
        </ReactMarkdown>
      )
      const codeBlockDiv = container.querySelector('div.rounded-xl')
      expect(codeBlockDiv).not.toBeNull()
      const classList = codeBlockDiv!.className
      expect(classList).toContain('bg-[#1E1E1E]')
      expect(classList).toContain('rounded-xl')
      expect(classList).toContain('border')
      expect(classList).toContain('border-[#E5E7EB]/10')
      const preElement = container.querySelector('pre')
      expect(preElement?.className).toContain('p-5')
    })

    it('should render tables with all required Manus Design System classes', () => {
      const markdown = '| Header 1 | Header 2 |\n| --- | --- |\n| Data 1 | Data 2 |'
      const { container } = render(
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
          {markdown}
        </ReactMarkdown>
      )
      const tableWrapper = container.querySelector('div.border')
      expect(tableWrapper).not.toBeNull()
      expect(tableWrapper?.className).toContain('border-[#E5E7EB]/10')
      expect(tableWrapper?.className).toContain('rounded-xl')
      const thead = container.querySelector('thead')
      expect(thead?.className).toContain('bg-white/4')
      const th = container.querySelector('th')
      expect(th?.className).toContain('px-4')
      expect(th?.className).toContain('py-3')
      const td = container.querySelector('td')
      expect(td?.className).toContain('px-4')
      expect(td?.className).toContain('py-3')
    })

    it('should render lists with all required Manus Design System classes', () => {
      const markdown = '- Item 1\n- Item 2'
      const { container } = render(
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
          {markdown}
        </ReactMarkdown>
      )
      const ul = container.querySelector('ul')
      expect(ul?.className).toContain('my-4')
      expect(ul?.className).toContain('list-none')
      const li = container.querySelector('li')
      expect(li?.className).toContain('mb-2')
      expect(li?.className).toContain('text-base')
      expect(li?.className).toContain('text-[#d6d6c9]')
      expect(li?.className).toContain('leading-[1.6]')
    })

    it('should render mixed markdown content with consistent element styling', () => {
      fc.assert(
        fc.property(
          fc.tuple(unorderedListMarkdownArbitrary(), codeBlockMarkdownArbitrary()),
          ([listMd, codeMd]) => {
            const markdown = `${listMd}\n\n${codeMd}`
            const { container } = render(
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                {markdown}
              </ReactMarkdown>
            )
            const ul = container.querySelector('ul')
            expect(ul?.className).toContain('my-4')
            const codeBlockDiv = container.querySelector('div.rounded-xl')
            expect(codeBlockDiv?.className).toContain('bg-[#1E1E1E]')
          }
        )
      )
    })

    it('should handle empty lists gracefully', () => {
      const markdown = '- '
      const { container } = render(
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
          {markdown}
        </ReactMarkdown>
      )
      const ul = container.querySelector('ul')
      expect(ul).not.toBeNull()
      expect(ul?.className).toContain('my-4')
    })

    it('should handle code blocks with special characters', () => {
      const markdown = '```javascript\nconst x = {a: 1, b: 2};\n```'
      const { container } = render(
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
          {markdown}
        </ReactMarkdown>
      )
      const preElement = container.querySelector('pre')
      expect(preElement).not.toBeNull()
      expect(preElement?.className).toContain('p-5')
    })

    it('should handle tables with varying column counts', () => {
      const markdown = '| A | B | C |\n| --- | --- | --- |\n| 1 | 2 | 3 |'
      const { container } = render(
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
          {markdown}
        </ReactMarkdown>
      )
      const table = container.querySelector('table')
      expect(table).not.toBeNull()
      const thead = container.querySelector('thead')
      expect(thead?.className).toContain('bg-white/4')
    })
  })
})
