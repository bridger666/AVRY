// @ts-nocheck
/**
 * Property-Based Tests for SubStepIndicator SVG Icons
 * 
 * **Validates: Requirements 6.2, 12.2**
 * 
 * These tests verify correctness properties of SubStepIndicator icon rendering:
 * - Property 14: SubStepIndicator renders SVG icons (no emoji)
 * 
 * Verifies that:
 * - SubStepIndicator renders an outline SVG icon for each icon type
 * - No emoji characters are present in the rendered output
 * - SVG icons have correct attributes (viewBox, stroke, etc.)
 * - Icon types map correctly to their SVG representations
 */

import React from 'react'
import fc from 'fast-check'
import { render } from '@testing-library/react'
import SubStepIndicator from '@/components/console/SubStepIndicator'
import type { SubStepIcon } from '@/types/agenticWorkflow'

/**
 * Arbitraries for generating test data
 */

const subStepIconArbitrary = (): fc.Arbitrary<SubStepIcon> => {
  return fc.oneof(
    fc.constant('thinking' as const),
    fc.constant('editing' as const),
    fc.constant('searching' as const),
    fc.constant('generating' as const),
    fc.constant('terminal' as const),
    fc.constant('file' as const)
  )
}

const labelArbitrary = (): fc.Arbitrary<string> => {
  return fc.stringMatching(/^[A-Za-z0-9\s\-]{3,30}$/)
}

const durationArbitrary = (): fc.Arbitrary<number | undefined> => {
  return fc.oneof(
    fc.constant(undefined),
    fc.integer({ min: 100, max: 10000 })
  )
}

/**
 * Helper function to check if a string contains emoji characters
 */
function containsEmoji(text: string): boolean {
  // Emoji regex pattern - matches common emoji ranges
  const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]/gu
  return emojiRegex.test(text)
}

/**
 * Helper function to get the expected SVG path for each icon type
 */
function getExpectedSvgPath(icon: SubStepIcon): string {
  switch (icon) {
    case 'thinking':
      return 'M13 2L3 14h9l-1 8 10-12h-9l1-8z'
    case 'editing':
      return 'M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z'
    case 'searching':
      // Magnifying glass has circle and line, not a single path
      return ''
    case 'generating':
      return 'M12 2l2.09 6.26L20 10l-5.91 1.74L12 18l-2.09-6.26L4 10l5.91-1.74L12 2z'
    case 'terminal':
      // Terminal has polyline and line, not a single path
      return ''
    case 'file':
      return 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z'
  }
}

describe('SubStepIndicator SVG Icons - Property-Based Tests', () => {
  describe('Property 14: SubStepIndicator renders SVG icons (no emoji)', () => {
    it('should render an SVG element for each icon type', () => {
      fc.assert(
        fc.property(
          fc.tuple(subStepIconArbitrary(), labelArbitrary()),
          ([icon, label]) => {
            const { container } = render(
              <SubStepIndicator icon={icon} label={label} />
            )

            // Find all SVG elements
            const svgs = container.querySelectorAll('svg')
            expect(svgs.length).toBeGreaterThan(0)

            // At least one SVG should be present for the icon
            const iconSvg = svgs[0]
            expect(iconSvg).not.toBeNull()
            expect(iconSvg.tagName).toBe('svg')
          }
        )
      )
    })

    it('should render SVG with correct viewBox attribute', () => {
      fc.assert(
        fc.property(
          fc.tuple(subStepIconArbitrary(), labelArbitrary()),
          ([icon, label]) => {
            const { container } = render(
              <SubStepIndicator icon={icon} label={label} />
            )

            const svg = container.querySelector('svg')
            expect(svg).not.toBeNull()

            // All SVG icons should have viewBox="0 0 24 24"
            const viewBox = svg!.getAttribute('viewBox')
            expect(viewBox).toBe('0 0 24 24')
          }
        )
      )
    })

    it('should render SVG with stroke-based styling (not fill)', () => {
      fc.assert(
        fc.property(
          fc.tuple(subStepIconArbitrary(), labelArbitrary()),
          ([icon, label]) => {
            const { container } = render(
              <SubStepIndicator icon={icon} label={label} />
            )

            const svg = container.querySelector('svg')
            expect(svg).not.toBeNull()

            // SVG should have fill="none" for outline style
            const fill = svg!.getAttribute('fill')
            expect(fill).toBe('none')

            // SVG should have stroke attribute
            const stroke = svg!.getAttribute('stroke')
            expect(stroke).toBe('currentColor')
          }
        )
      )
    })

    it('should render SVG with correct stroke width', () => {
      fc.assert(
        fc.property(
          fc.tuple(subStepIconArbitrary(), labelArbitrary()),
          ([icon, label]) => {
            const { container } = render(
              <SubStepIndicator icon={icon} label={label} />
            )

            const svg = container.querySelector('svg')
            expect(svg).not.toBeNull()

            // SVG should have strokeWidth="2"
            const strokeWidth = svg!.getAttribute('stroke-width')
            expect(strokeWidth).toBe('2')
          }
        )
      )
    })

    it('should render SVG with correct stroke line cap and join', () => {
      fc.assert(
        fc.property(
          fc.tuple(subStepIconArbitrary(), labelArbitrary()),
          ([icon, label]) => {
            const { container } = render(
              <SubStepIndicator icon={icon} label={label} />
            )

            const svg = container.querySelector('svg')
            expect(svg).not.toBeNull()

            // SVG should have strokeLinecap="round"
            const strokeLinecap = svg!.getAttribute('stroke-linecap')
            expect(strokeLinecap).toBe('round')

            // SVG should have strokeLinejoin="round"
            const strokeLinejoin = svg!.getAttribute('stroke-linejoin')
            expect(strokeLinejoin).toBe('round')
          }
        )
      )
    })

    it('should not contain any emoji characters in rendered output', () => {
      fc.assert(
        fc.property(
          fc.tuple(subStepIconArbitrary(), labelArbitrary(), durationArbitrary()),
          ([icon, label, duration]) => {
            const { container } = render(
              <SubStepIndicator icon={icon} label={label} duration={duration} />
            )

            // Get all text content
            const textContent = container.textContent || ''

            // Check for emoji characters
            expect(containsEmoji(textContent)).toBe(false)
          }
        )
      )
    })

    it('should render thinking icon with lightning bolt path', () => {
      fc.assert(
        fc.property(labelArbitrary(), (label) => {
          const { container } = render(
            <SubStepIndicator icon="thinking" label={label} />
          )

          const svg = container.querySelector('svg')
          const path = svg!.querySelector('path')

          expect(path).not.toBeNull()
          expect(path!.getAttribute('d')).toBe('M13 2L3 14h9l-1 8 10-12h-9l1-8z')
        })
      )
    })

    it('should render editing icon with pencil path', () => {
      fc.assert(
        fc.property(labelArbitrary(), (label) => {
          const { container } = render(
            <SubStepIndicator icon="editing" label={label} />
          )

          const svg = container.querySelector('svg')
          const path = svg!.querySelector('path')

          expect(path).not.toBeNull()
          expect(path!.getAttribute('d')).toBe('M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z')
        })
      )
    })

    it('should render searching icon with circle and path', () => {
      fc.assert(
        fc.property(labelArbitrary(), (label) => {
          const { container } = render(
            <SubStepIndicator icon="searching" label={label} />
          )

          const svg = container.querySelector('svg')
          const circle = svg!.querySelector('circle')
          const path = svg!.querySelector('path')

          expect(circle).not.toBeNull()
          expect(path).not.toBeNull()

          // Verify circle attributes
          expect(circle!.getAttribute('cx')).toBe('11')
          expect(circle!.getAttribute('cy')).toBe('11')
          expect(circle!.getAttribute('r')).toBe('8')

          // Verify path attributes (magnifying glass handle)
          expect(path!.getAttribute('d')).toBe('M21 21l-4.35-4.35')
        })
      )
    })

    it('should render generating icon with sparkle path', () => {
      fc.assert(
        fc.property(labelArbitrary(), (label) => {
          const { container } = render(
            <SubStepIndicator icon="generating" label={label} />
          )

          const svg = container.querySelector('svg')
          const path = svg!.querySelector('path')

          expect(path).not.toBeNull()
          expect(path!.getAttribute('d')).toBe('M12 2l2.09 6.26L20 10l-5.91 1.74L12 18l-2.09-6.26L4 10l5.91-1.74L12 2z')
        })
      )
    })

    it('should render terminal icon with polyline and line', () => {
      fc.assert(
        fc.property(labelArbitrary(), (label) => {
          const { container } = render(
            <SubStepIndicator icon="terminal" label={label} />
          )

          const svg = container.querySelector('svg')
          const polyline = svg!.querySelector('polyline')
          const line = svg!.querySelector('line')

          expect(polyline).not.toBeNull()
          expect(line).not.toBeNull()

          // Verify polyline attributes
          expect(polyline!.getAttribute('points')).toBe('4 17 10 11 4 5')

          // Verify line attributes
          expect(line!.getAttribute('x1')).toBe('12')
          expect(line!.getAttribute('y1')).toBe('19')
          expect(line!.getAttribute('x2')).toBe('20')
          expect(line!.getAttribute('y2')).toBe('19')
        })
      )
    })

    it('should render file icon with path and polyline', () => {
      fc.assert(
        fc.property(labelArbitrary(), (label) => {
          const { container } = render(
            <SubStepIndicator icon="file" label={label} />
          )

          const svg = container.querySelector('svg')
          const path = svg!.querySelector('path')
          const polyline = svg!.querySelector('polyline')

          expect(path).not.toBeNull()
          expect(polyline).not.toBeNull()

          // Verify path
          expect(path!.getAttribute('d')).toBe('M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z')

          // Verify polyline
          expect(polyline!.getAttribute('points')).toBe('14 2 14 8 20 8')
        })
      )
    })

    it('should render label text without emoji', () => {
      fc.assert(
        fc.property(
          fc.tuple(subStepIconArbitrary(), labelArbitrary()),
          ([icon, label]) => {
            const { container } = render(
              <SubStepIndicator icon={icon} label={label} />
            )

            // Find the label span (second span in the component)
            const spans = container.querySelectorAll('span')
            expect(spans.length).toBeGreaterThan(1)

            const labelSpan = spans[1]
            expect(labelSpan.textContent).toBe(label)
            expect(containsEmoji(labelSpan.textContent || '')).toBe(false)
          }
        )
      )
    })

    it('should render duration text without emoji when provided', () => {
      fc.assert(
        fc.property(
          fc.tuple(subStepIconArbitrary(), labelArbitrary(), fc.integer({ min: 100, max: 10000 })),
          ([icon, label, duration]) => {
            const { container } = render(
              <SubStepIndicator icon={icon} label={label} duration={duration} />
            )

            // Find all spans
            const spans = container.querySelectorAll('span')
            expect(spans.length).toBeGreaterThan(2)

            // Duration should be in the third span
            const durationSpan = spans[2]
            const durationText = durationSpan.textContent || ''

            // Should contain duration format like "(Xs)" or "(X.Xs)"
            expect(durationText).toMatch(/^\(\d+\.?\d*s\)$/)
            expect(containsEmoji(durationText)).toBe(false)
          }
        )
      )
    })

    it('should render SVG with correct width and height attributes', () => {
      fc.assert(
        fc.property(
          fc.tuple(subStepIconArbitrary(), labelArbitrary()),
          ([icon, label]) => {
            const { container } = render(
              <SubStepIndicator icon={icon} label={label} />
            )

            const svg = container.querySelector('svg')
            expect(svg).not.toBeNull()

            // SVG should have width="16" and height="16"
            expect(svg!.getAttribute('width')).toBe('16')
            expect(svg!.getAttribute('height')).toBe('16')
          }
        )
      )
    })

    it('should render component with correct container styling', () => {
      fc.assert(
        fc.property(
          fc.tuple(subStepIconArbitrary(), labelArbitrary()),
          ([icon, label]) => {
            const { container } = render(
              <SubStepIndicator icon={icon} label={label} />
            )

            // Find the main container div
            const mainDiv = container.querySelector('div')
            expect(mainDiv).not.toBeNull()

            // Should have correct Tailwind classes
            expect(mainDiv!.className).toContain('inline-flex')
            expect(mainDiv!.className).toContain('items-center')
            expect(mainDiv!.className).toContain('gap-2')
            expect(mainDiv!.className).toContain('bg-[#5A5A5A]')
            expect(mainDiv!.className).toContain('rounded-md')
            expect(mainDiv!.className).toContain('px-3')
            expect(mainDiv!.className).toContain('py-2')
            expect(mainDiv!.className).toContain('text-sm')
            expect(mainDiv!.className).toContain('font-medium')
          }
        )
      )
    })

    it('should render icon span with correct styling', () => {
      fc.assert(
        fc.property(
          fc.tuple(subStepIconArbitrary(), labelArbitrary()),
          ([icon, label]) => {
            const { container } = render(
              <SubStepIndicator icon={icon} label={label} />
            )

            // Find the icon span (first span)
            const spans = container.querySelectorAll('span')
            const iconSpan = spans[0]

            expect(iconSpan).not.toBeNull()
            expect(iconSpan.className).toContain('flex-shrink-0')
            expect(iconSpan.className).toContain('text-zinc-300')
          }
        )
      )
    })

    it('should render all icon types without errors', () => {
      const iconTypes: SubStepIcon[] = ['thinking', 'editing', 'searching', 'generating', 'terminal', 'file']

      iconTypes.forEach((icon) => {
        const { container } = render(
          <SubStepIndicator icon={icon} label="Test" />
        )

        const svg = container.querySelector('svg')
        expect(svg).not.toBeNull()
        expect(containsEmoji(container.textContent || '')).toBe(false)
      })
    })

    it('should maintain SVG structure across multiple renders', () => {
      fc.assert(
        fc.property(
          fc.tuple(subStepIconArbitrary(), labelArbitrary()),
          ([icon, label]) => {
            const { container, rerender } = render(
              <SubStepIndicator icon={icon} label={label} />
            )

            // Get initial SVG
            const svg1 = container.querySelector('svg')
            const viewBox1 = svg1!.getAttribute('viewBox')

            // Rerender with same props
            rerender(<SubStepIndicator icon={icon} label={label} />)

            // Get SVG after rerender
            const svg2 = container.querySelector('svg')
            const viewBox2 = svg2!.getAttribute('viewBox')

            // ViewBox should remain the same
            expect(viewBox2).toBe(viewBox1)
          }
        )
      )
    })

    it('should render correct number of child elements', () => {
      fc.assert(
        fc.property(
          fc.tuple(subStepIconArbitrary(), labelArbitrary(), durationArbitrary()),
          ([icon, label, duration]) => {
            const { container } = render(
              <SubStepIndicator icon={icon} label={label} duration={duration} />
            )

            // Find the main container
            const mainDiv = container.querySelector('div')
            const children = mainDiv!.children

            // Should have: icon span, label span, and optionally duration span
            const expectedCount = duration != null ? 3 : 2
            expect(children.length).toBe(expectedCount)
          }
        )
      )
    })

    it('should not render emoji in any text content', () => {
      fc.assert(
        fc.property(
          fc.tuple(subStepIconArbitrary(), labelArbitrary(), durationArbitrary()),
          ([icon, label, duration]) => {
            const { container } = render(
              <SubStepIndicator icon={icon} label={label} duration={duration} />
            )

            // Get all text nodes
            const walker = document.createTreeWalker(
              container,
              NodeFilter.SHOW_TEXT,
              null
            )

            let node
            while ((node = walker.nextNode())) {
              const text = node.textContent || ''
              expect(containsEmoji(text)).toBe(false)
            }
          }
        )
      )
    })

    it('should render SVG as first child of icon span', () => {
      fc.assert(
        fc.property(
          fc.tuple(subStepIconArbitrary(), labelArbitrary()),
          ([icon, label]) => {
            const { container } = render(
              <SubStepIndicator icon={icon} label={label} />
            )

            // Find the icon span (first span)
            const spans = container.querySelectorAll('span')
            const iconSpan = spans[0]

            // SVG should be the first child of icon span
            const svg = iconSpan.querySelector('svg')
            expect(svg).not.toBeNull()
            expect(svg).toBe(iconSpan.firstChild)
          }
        )
      )
    })
  })
})
