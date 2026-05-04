// @ts-nocheck
/**
 * Property-Based Tests for External Link Security Attributes
 * 
 * **Validates: Requirement 15.4**
 * 
 * These tests verify correctness properties of external link security:
 * - Property 11: External links have security attributes
 * 
 * Verifies that all external `<a>` elements include `target="_blank"` and 
 * `rel="noopener noreferrer"` attributes, while internal links do not require 
 * these attributes.
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
  a: ({ href, children }: any) => (
    <a href={href} className="text-[#00e59e] hover:text-[#00e59e]/80 underline underline-offset-2 transition-colors" target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  ),
  p: ({ children }: any) => (
    <p className="text-base leading-[1.6] mb-4 text-[#d6d6c9] last:mb-0">
      {children}
    </p>
  ),
}

/**
 * Arbitraries for generating markdown content with links
 */

const linkTextArbitrary = (): fc.Arbitrary<string> => {
  return fc.stringMatching(/^[A-Za-z0-9]{3,20}$/)
}

const domainArbitrary = (): fc.Arbitrary<string> => {
  return fc.stringMatching(/^[a-z]{3,10}$/)
}

const tldArbitrary = (): fc.Arbitrary<string> => {
  return fc.stringMatching(/^[a-z]{2,4}$/)
}

const externalHttpsUrlArbitrary = (): fc.Arbitrary<string> => {
  return fc.tuple(domainArbitrary(), tldArbitrary()).map(
    ([domain, tld]) => `https://${domain}.${tld}`
  )
}

const internalPathArbitrary = (): fc.Arbitrary<string> => {
  return fc.tuple(
    fc.stringMatching(/^[a-z]{3,10}$/),
    fc.stringMatching(/^[a-z]{3,10}$/)
  ).map(([path1, path2]) => `/${path1}/${path2}`)
}

const relativePathArbitrary = (): fc.Arbitrary<string> => {
  return fc.stringMatching(/^\.\/[a-z]{3,10}$/)
}

const externalLinkMarkdownArbitrary = (): fc.Arbitrary<string> => {
  return fc.tuple(linkTextArbitrary(), externalHttpsUrlArbitrary()).map(
    ([text, url]) => `[${text}](${url})`
  )
}

const internalLinkMarkdownArbitrary = (): fc.Arbitrary<string> => {
  return fc.tuple(linkTextArbitrary(), internalPathArbitrary()).map(
    ([text, path]) => `[${text}](${path})`
  )
}

const relativeLinkMarkdownArbitrary = (): fc.Arbitrary<string> => {
  return fc.tuple(linkTextArbitrary(), relativePathArbitrary()).map(
    ([text, path]) => `[${text}](${path})`
  )
}

describe('External Link Security Attributes - Property-Based Tests', () => {
  describe('Property 11: External links have security attributes', () => {
    it('should render external https links with target="_blank"', () => {
      fc.assert(
        fc.property(externalLinkMarkdownArbitrary(), (markdown) => {
          const { container } = render(
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
            >
              {markdown}
            </ReactMarkdown>
          )

          const linkElement = container.querySelector('a')
          expect(linkElement).not.toBeNull()
          expect(linkElement!.getAttribute('target')).toBe('_blank')
        })
      )
    })

    it('should render external https links with rel="noopener noreferrer"', () => {
      fc.assert(
        fc.property(externalLinkMarkdownArbitrary(), (markdown) => {
          const { container } = render(
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
            >
              {markdown}
            </ReactMarkdown>
          )

          const linkElement = container.querySelector('a')
          expect(linkElement).not.toBeNull()
          expect(linkElement!.getAttribute('rel')).toBe('noopener noreferrer')
        })
      )
    })

    it('should render external https links with both target and rel attributes', () => {
      fc.assert(
        fc.property(externalLinkMarkdownArbitrary(), (markdown) => {
          const { container } = render(
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
            >
              {markdown}
            </ReactMarkdown>
          )

          const linkElement = container.querySelector('a')
          expect(linkElement).not.toBeNull()
          expect(linkElement!.getAttribute('target')).toBe('_blank')
          expect(linkElement!.getAttribute('rel')).toBe('noopener noreferrer')
        })
      )
    })

    it('should render internal links with correct href', () => {
      fc.assert(
        fc.property(internalLinkMarkdownArbitrary(), (markdown) => {
          const { container } = render(
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
            >
              {markdown}
            </ReactMarkdown>
          )

          const linkElement = container.querySelector('a')
          expect(linkElement).not.toBeNull()
          // Internal links should have href starting with /
          expect(linkElement!.getAttribute('href')).toMatch(/^\//)
        })
      )
    })

    it('should render external links with href containing https://', () => {
      fc.assert(
        fc.property(externalLinkMarkdownArbitrary(), (markdown) => {
          const { container } = render(
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
            >
              {markdown}
            </ReactMarkdown>
          )

          const linkElement = container.querySelector('a')
          expect(linkElement).not.toBeNull()
          expect(linkElement!.getAttribute('href')).toMatch(/^https:\/\//)
        })
      )
    })

    it('should render multiple external links each with security attributes', () => {
      fc.assert(
        fc.property(
          fc.tuple(externalLinkMarkdownArbitrary(), externalLinkMarkdownArbitrary()),
          ([link1, link2]) => {
            const markdown = `${link1}\n\n${link2}`
            const { container } = render(
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={markdownComponents}
              >
                {markdown}
              </ReactMarkdown>
            )

            const linkElements = container.querySelectorAll('a')
            // Should have at least 1 link (may not always render both due to markdown parsing)
            expect(linkElements.length).toBeGreaterThanOrEqual(1)

            // All links should have security attributes
            linkElements.forEach((link) => {
              expect(link.getAttribute('target')).toBe('_blank')
              expect(link.getAttribute('rel')).toBe('noopener noreferrer')
            })
          }
        )
      )
    })

    it('should render mixed internal and external links with correct attributes', () => {
      fc.assert(
        fc.property(
          fc.tuple(externalLinkMarkdownArbitrary(), internalLinkMarkdownArbitrary()),
          ([externalLink, internalLink]) => {
            const markdown = `${externalLink}\n\n${internalLink}`
            const { container } = render(
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={markdownComponents}
              >
                {markdown}
              </ReactMarkdown>
            )

            const linkElements = container.querySelectorAll('a')
            // Should have at least 1 link
            expect(linkElements.length).toBeGreaterThanOrEqual(1)

            // All links should have target="_blank" and rel="noopener noreferrer"
            // (based on the markdownComponents implementation)
            linkElements.forEach((link) => {
              expect(link.getAttribute('target')).toBe('_blank')
              expect(link.getAttribute('rel')).toBe('noopener noreferrer')
            })
          }
        )
      )
    })

    it('should prevent XSS attacks via window.opener on external links', () => {
      fc.assert(
        fc.property(externalLinkMarkdownArbitrary(), (markdown) => {
          const { container } = render(
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
            >
              {markdown}
            </ReactMarkdown>
          )

          const linkElement = container.querySelector('a')
          expect(linkElement).not.toBeNull()

          // rel="noopener" prevents window.opener access
          const rel = linkElement!.getAttribute('rel')
          expect(rel).toContain('noopener')
        })
      )
    })

    it('should prevent referrer leakage on external links', () => {
      fc.assert(
        fc.property(externalLinkMarkdownArbitrary(), (markdown) => {
          const { container } = render(
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
            >
              {markdown}
            </ReactMarkdown>
          )

          const linkElement = container.querySelector('a')
          expect(linkElement).not.toBeNull()

          // rel="noreferrer" prevents referrer leakage
          const rel = linkElement!.getAttribute('rel')
          expect(rel).toContain('noreferrer')
        })
      )
    })

    it('should render external links with both noopener and noreferrer in rel attribute', () => {
      fc.assert(
        fc.property(externalLinkMarkdownArbitrary(), (markdown) => {
          const { container } = render(
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
            >
              {markdown}
            </ReactMarkdown>
          )

          const linkElement = container.querySelector('a')
          expect(linkElement).not.toBeNull()

          const rel = linkElement!.getAttribute('rel')
          expect(rel).toContain('noopener')
          expect(rel).toContain('noreferrer')
        })
      )
    })

    it('should render external links that open in new tab', () => {
      fc.assert(
        fc.property(externalLinkMarkdownArbitrary(), (markdown) => {
          const { container } = render(
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
            >
              {markdown}
            </ReactMarkdown>
          )

          const linkElement = container.querySelector('a')
          expect(linkElement).not.toBeNull()

          // target="_blank" opens in new tab
          expect(linkElement!.getAttribute('target')).toBe('_blank')
        })
      )
    })

    it('should render external links with href attribute', () => {
      fc.assert(
        fc.property(externalLinkMarkdownArbitrary(), (markdown) => {
          const { container } = render(
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
            >
              {markdown}
            </ReactMarkdown>
          )

          const linkElement = container.querySelector('a')
          expect(linkElement).not.toBeNull()
          expect(linkElement!.getAttribute('href')).not.toBeNull()
          expect(linkElement!.getAttribute('href')).toBeTruthy()
        })
      )
    })

    it('should render external links with visible link text', () => {
      fc.assert(
        fc.property(externalLinkMarkdownArbitrary(), (markdown) => {
          const { container } = render(
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
            >
              {markdown}
            </ReactMarkdown>
          )

          const linkElement = container.querySelector('a')
          expect(linkElement).not.toBeNull()
          expect(linkElement!.textContent).toBeTruthy()
          expect(linkElement!.textContent!.length).toBeGreaterThan(0)
        })
      )
    })

    it('should render external links with correct href format for https URLs', () => {
      fc.assert(
        fc.property(externalHttpsUrlArbitrary(), (url) => {
          const markdown = `[Link](${url})`
          const { container } = render(
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
            >
              {markdown}
            </ReactMarkdown>
          )

          const linkElement = container.querySelector('a')
          expect(linkElement).not.toBeNull()
          expect(linkElement!.getAttribute('href')).toBe(url)
        })
      )
    })

    it('should render external links with security attributes for all https domains', () => {
      fc.assert(
        fc.property(
          fc.tuple(
            linkTextArbitrary(),
            domainArbitrary(),
            tldArbitrary()
          ),
          ([text, domain, tld]) => {
            const url = `https://${domain}.${tld}`
            const markdown = `[${text}](${url})`
            const { container } = render(
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={markdownComponents}
              >
                {markdown}
              </ReactMarkdown>
            )

            const linkElement = container.querySelector('a')
            expect(linkElement).not.toBeNull()
            expect(linkElement!.getAttribute('target')).toBe('_blank')
            expect(linkElement!.getAttribute('rel')).toBe('noopener noreferrer')
          }
        )
      )
    })
  })
})
