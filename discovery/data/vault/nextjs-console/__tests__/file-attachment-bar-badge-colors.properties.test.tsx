// @ts-nocheck
/**
 * Property-Based Tests for FileAttachmentBar Badge Colors
 * 
 * **Validates: Requirements 7.3, 7.4, 7.5**
 * 
 * These tests verify correctness properties of file action badge color rendering:
 * - Property 10: File action badge color mapping
 * 
 * Verifies that:
 * - When action === 'read', a blue badge (bg-blue-500/20 text-blue-400) is rendered
 * - When action === 'written', an amber badge (bg-amber-500/20 text-amber-400) is rendered
 * - When action === 'created', an emerald badge (bg-emerald-500/20 text-emerald-400) is rendered
 * - Badge displays the action text correctly
 * - Badge styling is applied consistently
 */

import React from 'react'
import fc from 'fast-check'
import { render } from '@testing-library/react'
import FileAttachmentBar from '@/components/console/FileAttachmentBar'

/**
 * Arbitraries for generating test data
 */

const filenameArbitrary = (): fc.Arbitrary<string> => {
  return fc.stringMatching(/^[a-zA-Z0-9\-_.]{3,30}\.(txt|md|json|js|ts|py|java|cpp|c|go|rs|rb|php|cs)$/)
}

const actionArbitrary = (): fc.Arbitrary<'read' | 'written' | 'created'> => {
  return fc.oneof(fc.constant('read'), fc.constant('written'), fc.constant('created'))
}

const readActionArbitrary = (): fc.Arbitrary<'read'> => {
  return fc.constant('read')
}

const writtenActionArbitrary = (): fc.Arbitrary<'written'> => {
  return fc.constant('written')
}

const createdActionArbitrary = (): fc.Arbitrary<'created'> => {
  return fc.constant('created')
}

describe('FileAttachmentBar Badge Colors - Property-Based Tests', () => {
  describe('Property 10: File action badge color mapping', () => {
    it('should render blue badge when action is read', () => {
      fc.assert(
        fc.property(filenameArbitrary(), readActionArbitrary(), (filename, action) => {
          const { container } = render(<FileAttachmentBar filename={filename} action={action} />)

          // Find the badge span (last span in the container)
          const spans = container.querySelectorAll('span')
          const badge = spans[spans.length - 1]

          expect(badge).not.toBeNull()
          expect(badge.textContent).toBe('read')

          // Verify badge has blue color classes
          const className = badge.getAttribute('class')
          expect(className).toContain('bg-blue-500/20')
          expect(className).toContain('text-blue-400')
        })
      )
    })

    it('should render amber badge when action is written', () => {
      fc.assert(
        fc.property(filenameArbitrary(), writtenActionArbitrary(), (filename, action) => {
          const { container } = render(<FileAttachmentBar filename={filename} action={action} />)

          // Find the badge span (last span in the container)
          const spans = container.querySelectorAll('span')
          const badge = spans[spans.length - 1]

          expect(badge).not.toBeNull()
          expect(badge.textContent).toBe('written')

          // Verify badge has amber color classes
          const className = badge.getAttribute('class')
          expect(className).toContain('bg-amber-500/20')
          expect(className).toContain('text-amber-400')
        })
      )
    })

    it('should render emerald badge when action is created', () => {
      fc.assert(
        fc.property(filenameArbitrary(), createdActionArbitrary(), (filename, action) => {
          const { container } = render(<FileAttachmentBar filename={filename} action={action} />)

          // Find the badge span (last span in the container)
          const spans = container.querySelectorAll('span')
          const badge = spans[spans.length - 1]

          expect(badge).not.toBeNull()
          expect(badge.textContent).toBe('created')

          // Verify badge has emerald color classes
          const className = badge.getAttribute('class')
          expect(className).toContain('bg-emerald-500/20')
          expect(className).toContain('text-emerald-400')
        })
      )
    })

    it('should render badge with correct styling for any valid action', () => {
      fc.assert(
        fc.property(filenameArbitrary(), actionArbitrary(), (filename, action) => {
          const { container } = render(<FileAttachmentBar filename={filename} action={action} />)

          // Find the badge span (last span in the container)
          const spans = container.querySelectorAll('span')
          const badge = spans[spans.length - 1]

          expect(badge).not.toBeNull()

          // Verify badge has common styling classes
          const className = badge.getAttribute('class')
          expect(className).toContain('rounded-full')
          expect(className).toContain('px-2')
          expect(className).toContain('py-0.5')
          expect(className).toContain('text-[10px]')
          expect(className).toContain('font-medium')
        })
      )
    })

    it('should display action text correctly in badge', () => {
      fc.assert(
        fc.property(filenameArbitrary(), actionArbitrary(), (filename, action) => {
          const { container } = render(<FileAttachmentBar filename={filename} action={action} />)

          // Find the badge span (last span in the container)
          const spans = container.querySelectorAll('span')
          const badge = spans[spans.length - 1]

          expect(badge.textContent).toBe(action)
        })
      )
    })

    it('should render badge with correct color for read action across multiple renders', () => {
      fc.assert(
        fc.property(filenameArbitrary(), readActionArbitrary(), (filename, action) => {
          const { container, rerender } = render(<FileAttachmentBar filename={filename} action={action} />)

          // Get initial badge
          let spans = container.querySelectorAll('span')
          let badge = spans[spans.length - 1]
          const initialClassName = badge.getAttribute('class')

          // Rerender with same props
          rerender(<FileAttachmentBar filename={filename} action={action} />)

          // Get badge after rerender
          spans = container.querySelectorAll('span')
          badge = spans[spans.length - 1]
          const rerenderClassName = badge.getAttribute('class')

          // Classes should remain the same
          expect(rerenderClassName).toBe(initialClassName)
          expect(rerenderClassName).toContain('bg-blue-500/20')
          expect(rerenderClassName).toContain('text-blue-400')
        })
      )
    })

    it('should render badge with correct color for written action across multiple renders', () => {
      fc.assert(
        fc.property(filenameArbitrary(), writtenActionArbitrary(), (filename, action) => {
          const { container, rerender } = render(<FileAttachmentBar filename={filename} action={action} />)

          // Get initial badge
          let spans = container.querySelectorAll('span')
          let badge = spans[spans.length - 1]
          const initialClassName = badge.getAttribute('class')

          // Rerender with same props
          rerender(<FileAttachmentBar filename={filename} action={action} />)

          // Get badge after rerender
          spans = container.querySelectorAll('span')
          badge = spans[spans.length - 1]
          const rerenderClassName = badge.getAttribute('class')

          // Classes should remain the same
          expect(rerenderClassName).toBe(initialClassName)
          expect(rerenderClassName).toContain('bg-amber-500/20')
          expect(rerenderClassName).toContain('text-amber-400')
        })
      )
    })

    it('should render badge with correct color for created action across multiple renders', () => {
      fc.assert(
        fc.property(filenameArbitrary(), createdActionArbitrary(), (filename, action) => {
          const { container, rerender } = render(<FileAttachmentBar filename={filename} action={action} />)

          // Get initial badge
          let spans = container.querySelectorAll('span')
          let badge = spans[spans.length - 1]
          const initialClassName = badge.getAttribute('class')

          // Rerender with same props
          rerender(<FileAttachmentBar filename={filename} action={action} />)

          // Get badge after rerender
          spans = container.querySelectorAll('span')
          badge = spans[spans.length - 1]
          const rerenderClassName = badge.getAttribute('class')

          // Classes should remain the same
          expect(rerenderClassName).toBe(initialClassName)
          expect(rerenderClassName).toContain('bg-emerald-500/20')
          expect(rerenderClassName).toContain('text-emerald-400')
        })
      )
    })

    it('should render badge with correct background opacity for all actions', () => {
      fc.assert(
        fc.property(filenameArbitrary(), actionArbitrary(), (filename, action) => {
          const { container } = render(<FileAttachmentBar filename={filename} action={action} />)

          // Find the badge span (last span in the container)
          const spans = container.querySelectorAll('span')
          const badge = spans[spans.length - 1]

          const className = badge.getAttribute('class')

          // Verify background opacity is /20 for all actions
          if (action === 'read') {
            expect(className).toContain('bg-blue-500/20')
          } else if (action === 'written') {
            expect(className).toContain('bg-amber-500/20')
          } else if (action === 'created') {
            expect(className).toContain('bg-emerald-500/20')
          }
        })
      )
    })

    it('should render badge with correct text color for all actions', () => {
      fc.assert(
        fc.property(filenameArbitrary(), actionArbitrary(), (filename, action) => {
          const { container } = render(<FileAttachmentBar filename={filename} action={action} />)

          // Find the badge span (last span in the container)
          const spans = container.querySelectorAll('span')
          const badge = spans[spans.length - 1]

          const className = badge.getAttribute('class')

          // Verify text color is -400 for all actions
          if (action === 'read') {
            expect(className).toContain('text-blue-400')
          } else if (action === 'written') {
            expect(className).toContain('text-amber-400')
          } else if (action === 'created') {
            expect(className).toContain('text-emerald-400')
          }
        })
      )
    })

    it('should render badge with ml-auto class for right alignment', () => {
      fc.assert(
        fc.property(filenameArbitrary(), actionArbitrary(), (filename, action) => {
          const { container } = render(<FileAttachmentBar filename={filename} action={action} />)

          // Find the badge span (last span in the container)
          const spans = container.querySelectorAll('span')
          const badge = spans[spans.length - 1]

          const className = badge.getAttribute('class')
          expect(className).toContain('ml-auto')
        })
      )
    })

    it('should render badge with flex-shrink-0 class to prevent shrinking', () => {
      fc.assert(
        fc.property(filenameArbitrary(), actionArbitrary(), (filename, action) => {
          const { container } = render(<FileAttachmentBar filename={filename} action={action} />)

          // Find the badge span (last span in the container)
          const spans = container.querySelectorAll('span')
          const badge = spans[spans.length - 1]

          const className = badge.getAttribute('class')
          expect(className).toContain('flex-shrink-0')
        })
      )
    })

    it('should not render blue badge when action is not read', () => {
      fc.assert(
        fc.property(filenameArbitrary(), fc.oneof(writtenActionArbitrary(), createdActionArbitrary()), (filename, action) => {
          const { container } = render(<FileAttachmentBar filename={filename} action={action} />)

          // Find the badge span (last span in the container)
          const spans = container.querySelectorAll('span')
          const badge = spans[spans.length - 1]

          const className = badge.getAttribute('class')
          expect(className).not.toContain('bg-blue-500/20')
          expect(className).not.toContain('text-blue-400')
        })
      )
    })

    it('should not render amber badge when action is not written', () => {
      fc.assert(
        fc.property(filenameArbitrary(), fc.oneof(readActionArbitrary(), createdActionArbitrary()), (filename, action) => {
          const { container } = render(<FileAttachmentBar filename={filename} action={action} />)

          // Find the badge span (last span in the container)
          const spans = container.querySelectorAll('span')
          const badge = spans[spans.length - 1]

          const className = badge.getAttribute('class')
          expect(className).not.toContain('bg-amber-500/20')
          expect(className).not.toContain('text-amber-400')
        })
      )
    })

    it('should not render emerald badge when action is not created', () => {
      fc.assert(
        fc.property(filenameArbitrary(), fc.oneof(readActionArbitrary(), writtenActionArbitrary()), (filename, action) => {
          const { container } = render(<FileAttachmentBar filename={filename} action={action} />)

          // Find the badge span (last span in the container)
          const spans = container.querySelectorAll('span')
          const badge = spans[spans.length - 1]

          const className = badge.getAttribute('class')
          expect(className).not.toContain('bg-emerald-500/20')
          expect(className).not.toContain('text-emerald-400')
        })
      )
    })

    it('should render badge with exactly one color scheme for any action', () => {
      fc.assert(
        fc.property(filenameArbitrary(), actionArbitrary(), (filename, action) => {
          const { container } = render(<FileAttachmentBar filename={filename} action={action} />)

          // Find the badge span (last span in the container)
          const spans = container.querySelectorAll('span')
          const badge = spans[spans.length - 1]

          const className = badge.getAttribute('class')

          // Count color scheme occurrences
          const blueCount = (className.match(/bg-blue-500\/20|text-blue-400/g) || []).length
          const amberCount = (className.match(/bg-amber-500\/20|text-amber-400/g) || []).length
          const emeraldCount = (className.match(/bg-emerald-500\/20|text-emerald-400/g) || []).length

          // Exactly one color scheme should be present
          const totalColorSchemes = (blueCount > 0 ? 1 : 0) + (amberCount > 0 ? 1 : 0) + (emeraldCount > 0 ? 1 : 0)
          expect(totalColorSchemes).toBe(1)
        })
      )
    })
  })
})
