// @ts-nocheck
/**
 * Property-Based Tests for FileAttachmentBar Filename Display
 * 
 * **Validates: Requirement 7.2**
 * 
 * These tests verify correctness properties of FileAttachmentBar filename rendering:
 * - Property 16: FileAttachmentBar displays filename in monospace
 * 
 * Verifies that:
 * - Filename renders with `font-mono` class
 * - Document outline SVG icon is rendered
 * - Icon has correct SVG attributes (viewBox, stroke, etc.)
 * - Filename text is truncated if too long
 * - Icon and filename are properly aligned
 */

import React from 'react'
import fc from 'fast-check'
import { render } from '@testing-library/react'
import FileAttachmentBar from '@/components/console/FileAttachmentBar'

/**
 * Arbitraries for generating test data
 */

const filenameArbitrary = (): fc.Arbitrary<string> => {
  return fc.stringMatching(/^[a-zA-Z0-9\-_.]{1,100}\.(txt|md|json|py|ts|js|tsx|jsx|css|html|xml|yaml|yml|sh|bash)$/)
}

const shortFilenameArbitrary = (): fc.Arbitrary<string> => {
  return fc.stringMatching(/^[a-zA-Z0-9\-_.]{1,20}\.(txt|md|json|py|ts|js)$/)
}

const longFilenameArbitrary = (): fc.Arbitrary<string> => {
  return fc.stringMatching(/^[a-zA-Z0-9\-_.]{50,100}\.(txt|md|json|py|ts|js|tsx|jsx|css|html|xml|yaml|yml|sh|bash)$/)
}

const actionArbitrary = (): fc.Arbitrary<'read' | 'written' | 'created'> => {
  return fc.oneof(fc.constant('read'), fc.constant('written'), fc.constant('created'))
}

describe('FileAttachmentBar Filename Display - Property-Based Tests', () => {
  describe('Property 16: FileAttachmentBar displays filename in monospace', () => {
    it('should render filename with font-mono class', () => {
      fc.assert(
        fc.property(filenameArbitrary(), actionArbitrary(), (filename, action) => {
          const { container } = render(<FileAttachmentBar filename={filename} action={action} />)

          // Find the filename span
          const spans = container.querySelectorAll('span')
          let filenameSpan: HTMLElement | null = null

          spans.forEach((span) => {
            if (span.textContent === filename) {
              filenameSpan = span
            }
          })

          expect(filenameSpan).not.toBeNull()
          expect(filenameSpan!.className).toContain('font-mono')
        })
      )
    })

    it('should render filename with text-zinc-300 color class', () => {
      fc.assert(
        fc.property(filenameArbitrary(), actionArbitrary(), (filename, action) => {
          const { container } = render(<FileAttachmentBar filename={filename} action={action} />)

          // Find the filename span
          const spans = container.querySelectorAll('span')
          let filenameSpan: HTMLElement | null = null

          spans.forEach((span) => {
            if (span.textContent === filename) {
              filenameSpan = span
            }
          })

          expect(filenameSpan).not.toBeNull()
          expect(filenameSpan!.className).toContain('text-zinc-300')
        })
      )
    })

    it('should render document outline SVG icon', () => {
      fc.assert(
        fc.property(filenameArbitrary(), actionArbitrary(), (filename, action) => {
          const { container } = render(<FileAttachmentBar filename={filename} action={action} />)

          // Find the SVG element
          const svg = container.querySelector('svg')
          expect(svg).not.toBeNull()
        })
      )
    })

    it('should render SVG icon with correct viewBox attribute', () => {
      fc.assert(
        fc.property(filenameArbitrary(), actionArbitrary(), (filename, action) => {
          const { container } = render(<FileAttachmentBar filename={filename} action={action} />)

          const svg = container.querySelector('svg')
          expect(svg).not.toBeNull()

          const viewBox = svg!.getAttribute('viewBox')
          expect(viewBox).toBe('0 0 24 24')
        })
      )
    })

    it('should render SVG icon with stroke attribute', () => {
      fc.assert(
        fc.property(filenameArbitrary(), actionArbitrary(), (filename, action) => {
          const { container } = render(<FileAttachmentBar filename={filename} action={action} />)

          const svg = container.querySelector('svg')
          expect(svg).not.toBeNull()

          const stroke = svg!.getAttribute('stroke')
          expect(stroke).toBe('currentColor')
        })
      )
    })

    it('should render SVG icon with stroke-width of 2', () => {
      fc.assert(
        fc.property(filenameArbitrary(), actionArbitrary(), (filename, action) => {
          const { container } = render(<FileAttachmentBar filename={filename} action={action} />)

          const svg = container.querySelector('svg')
          expect(svg).not.toBeNull()

          const strokeWidth = svg!.getAttribute('stroke-width')
          expect(strokeWidth).toBe('2')
        })
      )
    })

    it('should render SVG icon with text-[#a1a1aa] color class', () => {
      fc.assert(
        fc.property(filenameArbitrary(), actionArbitrary(), (filename, action) => {
          const { container } = render(<FileAttachmentBar filename={filename} action={action} />)

          const svg = container.querySelector('svg')
          expect(svg).not.toBeNull()

          const className = svg!.getAttribute('class')
          expect(className).toContain('text-[#a1a1aa]')
        })
      )
    })

    it('should render SVG icon with document outline paths', () => {
      fc.assert(
        fc.property(filenameArbitrary(), actionArbitrary(), (filename, action) => {
          const { container } = render(<FileAttachmentBar filename={filename} action={action} />)

          const svg = container.querySelector('svg')
          expect(svg).not.toBeNull()

          // Document outline SVG should have path and polyline elements
          const paths = svg!.querySelectorAll('path')
          const polylines = svg!.querySelectorAll('polyline')
          const lines = svg!.querySelectorAll('line')

          // Should have at least one path (document outline)
          expect(paths.length).toBeGreaterThan(0)
          // Should have polyline for the corner fold
          expect(polylines.length).toBeGreaterThan(0)
          // Should have lines for the text lines
          expect(lines.length).toBeGreaterThan(0)
        })
      )
    })

    it('should render filename text exactly as provided', () => {
      fc.assert(
        fc.property(filenameArbitrary(), actionArbitrary(), (filename, action) => {
          const { container } = render(<FileAttachmentBar filename={filename} action={action} />)

          // Find the filename span
          const spans = container.querySelectorAll('span')
          let filenameSpan: HTMLElement | null = null

          spans.forEach((span) => {
            if (span.textContent === filename) {
              filenameSpan = span
            }
          })

          expect(filenameSpan).not.toBeNull()
          expect(filenameSpan!.textContent).toBe(filename)
        })
      )
    })

    it('should apply truncate class to filename for long names', () => {
      fc.assert(
        fc.property(longFilenameArbitrary(), actionArbitrary(), (filename, action) => {
          const { container } = render(<FileAttachmentBar filename={filename} action={action} />)

          // Find the filename span
          const spans = container.querySelectorAll('span')
          let filenameSpan: HTMLElement | null = null

          spans.forEach((span) => {
            if (span.textContent === filename) {
              filenameSpan = span
            }
          })

          expect(filenameSpan).not.toBeNull()
          expect(filenameSpan!.className).toContain('truncate')
        })
      )
    })

    it('should apply truncate class to filename for short names', () => {
      fc.assert(
        fc.property(shortFilenameArbitrary(), actionArbitrary(), (filename, action) => {
          const { container } = render(<FileAttachmentBar filename={filename} action={action} />)

          // Find the filename span
          const spans = container.querySelectorAll('span')
          let filenameSpan: HTMLElement | null = null

          spans.forEach((span) => {
            if (span.textContent === filename) {
              filenameSpan = span
            }
          })

          expect(filenameSpan).not.toBeNull()
          expect(filenameSpan!.className).toContain('truncate')
        })
      )
    })

    it('should render icon and filename in flex container with gap', () => {
      fc.assert(
        fc.property(filenameArbitrary(), actionArbitrary(), (filename, action) => {
          const { container } = render(<FileAttachmentBar filename={filename} action={action} />)

          // Find the main container div
          const divs = container.querySelectorAll('div')
          let mainDiv: HTMLElement | null = null

          divs.forEach((div) => {
            if (div.className.includes('flex') && div.className.includes('items-center')) {
              mainDiv = div
            }
          })

          expect(mainDiv).not.toBeNull()
          expect(mainDiv!.className).toContain('flex')
          expect(mainDiv!.className).toContain('items-center')
          expect(mainDiv!.className).toContain('gap-2')
        })
      )
    })

    it('should render icon with flex-shrink-0 class for proper alignment', () => {
      fc.assert(
        fc.property(filenameArbitrary(), actionArbitrary(), (filename, action) => {
          const { container } = render(<FileAttachmentBar filename={filename} action={action} />)

          const svg = container.querySelector('svg')
          expect(svg).not.toBeNull()

          const className = svg!.getAttribute('class')
          expect(className).toContain('flex-shrink-0')
        })
      )
    })

    it('should render container with correct background color', () => {
      fc.assert(
        fc.property(filenameArbitrary(), actionArbitrary(), (filename, action) => {
          const { container } = render(<FileAttachmentBar filename={filename} action={action} />)

          // Find the main container div
          const divs = container.querySelectorAll('div')
          let mainDiv: HTMLElement | null = null

          divs.forEach((div) => {
            if (div.className.includes('flex') && div.className.includes('items-center')) {
              mainDiv = div
            }
          })

          expect(mainDiv).not.toBeNull()
          expect(mainDiv!.className).toContain('bg-[#6A6A6A]/20')
        })
      )
    })

    it('should render container with rounded-lg border radius', () => {
      fc.assert(
        fc.property(filenameArbitrary(), actionArbitrary(), (filename, action) => {
          const { container } = render(<FileAttachmentBar filename={filename} action={action} />)

          // Find the main container div
          const divs = container.querySelectorAll('div')
          let mainDiv: HTMLElement | null = null

          divs.forEach((div) => {
            if (div.className.includes('flex') && div.className.includes('items-center')) {
              mainDiv = div
            }
          })

          expect(mainDiv).not.toBeNull()
          expect(mainDiv!.className).toContain('rounded-lg')
        })
      )
    })

    it('should render container with correct padding', () => {
      fc.assert(
        fc.property(filenameArbitrary(), actionArbitrary(), (filename, action) => {
          const { container } = render(<FileAttachmentBar filename={filename} action={action} />)

          // Find the main container div
          const divs = container.querySelectorAll('div')
          let mainDiv: HTMLElement | null = null

          divs.forEach((div) => {
            if (div.className.includes('flex') && div.className.includes('items-center')) {
              mainDiv = div
            }
          })

          expect(mainDiv).not.toBeNull()
          expect(mainDiv!.className).toContain('py-3')
          expect(mainDiv!.className).toContain('px-4')
        })
      )
    })

    it('should render SVG with width and height attributes', () => {
      fc.assert(
        fc.property(filenameArbitrary(), actionArbitrary(), (filename, action) => {
          const { container } = render(<FileAttachmentBar filename={filename} action={action} />)

          const svg = container.querySelector('svg')
          expect(svg).not.toBeNull()

          const width = svg!.getAttribute('width')
          const height = svg!.getAttribute('height')

          expect(width).toBe('16')
          expect(height).toBe('16')
        })
      )
    })

    it('should render SVG with fill="none" for outline style', () => {
      fc.assert(
        fc.property(filenameArbitrary(), actionArbitrary(), (filename, action) => {
          const { container } = render(<FileAttachmentBar filename={filename} action={action} />)

          const svg = container.querySelector('svg')
          expect(svg).not.toBeNull()

          const fill = svg!.getAttribute('fill')
          expect(fill).toBe('none')
        })
      )
    })

    it('should render SVG with stroke-linecap and stroke-linejoin attributes', () => {
      fc.assert(
        fc.property(filenameArbitrary(), actionArbitrary(), (filename, action) => {
          const { container } = render(<FileAttachmentBar filename={filename} action={action} />)

          const svg = container.querySelector('svg')
          expect(svg).not.toBeNull()

          const strokeLinecap = svg!.getAttribute('stroke-linecap')
          const strokeLinejoin = svg!.getAttribute('stroke-linejoin')

          expect(strokeLinecap).toBe('round')
          expect(strokeLinejoin).toBe('round')
        })
      )
    })

    it('should maintain filename display across multiple renders', () => {
      fc.assert(
        fc.property(filenameArbitrary(), actionArbitrary(), (filename, action) => {
          const { container, rerender } = render(<FileAttachmentBar filename={filename} action={action} />)

          // Get initial filename
          const spans1 = container.querySelectorAll('span')
          let initialFilename = ''
          spans1.forEach((span) => {
            if (span.textContent === filename) {
              initialFilename = span.textContent || ''
            }
          })

          // Rerender with same props
          rerender(<FileAttachmentBar filename={filename} action={action} />)

          // Get filename after rerender
          const spans2 = container.querySelectorAll('span')
          let rerenderFilename = ''
          spans2.forEach((span) => {
            if (span.textContent === filename) {
              rerenderFilename = span.textContent || ''
            }
          })

          // Filename should remain the same
          expect(rerenderFilename).toBe(initialFilename)
          expect(rerenderFilename).toBe(filename)
        })
      )
    })

    it('should render action badge after filename', () => {
      fc.assert(
        fc.property(filenameArbitrary(), actionArbitrary(), (filename, action) => {
          const { container } = render(<FileAttachmentBar filename={filename} action={action} />)

          // Find the action badge span
          const spans = container.querySelectorAll('span')
          let actionBadge: HTMLElement | null = null

          spans.forEach((span) => {
            if (span.textContent === action) {
              actionBadge = span
            }
          })

          expect(actionBadge).not.toBeNull()
          expect(actionBadge!.textContent).toBe(action)
        })
      )
    })

    it('should render icon before filename in DOM order', () => {
      fc.assert(
        fc.property(filenameArbitrary(), actionArbitrary(), (filename, action) => {
          const { container } = render(<FileAttachmentBar filename={filename} action={action} />)

          // Find the main container
          const mainDiv = container.querySelector('div.flex')
          expect(mainDiv).not.toBeNull()

          // Get all children
          const children = Array.from(mainDiv!.children)

          // First child should be SVG (icon)
          expect(children[0].tagName).toBe('svg')

          // Second child should be span with filename
          expect(children[1].tagName).toBe('SPAN')
          expect(children[1].textContent).toBe(filename)
        })
      )
    })
  })
})
