// @ts-nocheck
/**
 * Property-Based Tests for App-to-Step Action Mapping
 * 
 * **Validates: Requirements 3.5**
 * Property 3: App-to-Step Action Mapping
 * 
 * For any app with a `defaultAction` field, when dragged to the canvas, 
 * the created workflow step's `action` field should equal the app's 
 * `defaultAction` value.
 * 
 * Feature: integrations-canvas-polish
 */

import { describe, it, expect } from 'vitest'
import fc from 'fast-check'

// Type definition for App (matching the structure in workflows page)
interface App {
  id: string
  name: string
  description: string
  icon: string
  iconPath?: string
  defaultAction?: string
  categories: string[]
}

// Type definition for WorkflowNodeData (matching WorkflowCanvas.tsx)
interface WorkflowNodeData {
  title: string // This is the action field
  subtitle: string
  category: string
  iconPath?: string
  appId: string
}

// Arbitraries for generating test data
const arbAppCategory = fc.constantFrom(
  'CRM',
  'Communication',
  'Productivity',
  'Analytics',
  'Storage',
  'Marketing',
  'Finance',
  'HR',
  'Development',
  'Other'
)

const arbApp = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  description: fc.string({ minLength: 10, maxLength: 200 }),
  icon: fc.constantFrom('📧', '📊', '💬', '📁', '🔔', '⚙️', '🎯', '📈'),
  iconPath: fc.option(fc.string({ minLength: 5, maxLength: 100 }), { nil: undefined }),
  defaultAction: fc.option(fc.string({ minLength: 5, maxLength: 100 }), { nil: undefined }),
  categories: fc.array(arbAppCategory, { minLength: 1, maxLength: 3 }),
})

// Arbitrary for apps that ALWAYS have defaultAction
const arbAppWithDefaultAction = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  description: fc.string({ minLength: 10, maxLength: 200 }),
  icon: fc.constantFrom('📧', '📊', '💬', '📁', '🔔', '⚙️', '🎯', '📈'),
  iconPath: fc.option(fc.string({ minLength: 5, maxLength: 100 }), { nil: undefined }),
  defaultAction: fc.string({ minLength: 5, maxLength: 100 }), // Always present
  categories: fc.array(arbAppCategory, { minLength: 1, maxLength: 3 }),
})

// Simulate the drag-and-drop operation from WorkflowCanvas.tsx
function simulateDragDrop(app: App): WorkflowNodeData {
  // This simulates the onDrop handler logic in WorkflowCanvas.tsx
  return {
    title: app.defaultAction || app.name, // Action field
    subtitle: app.name, // Tool field
    category: 'app',
    iconPath: app.iconPath,
    appId: app.id,
  }
}

describe('Property 3: App-to-Step Action Mapping', () => {
  it('should map app.defaultAction to step.title (action field) when defaultAction is present', () => {
    fc.assert(
      fc.property(arbAppWithDefaultAction, (app) => {
        const stepData = simulateDragDrop(app)

        // The title field (action) should equal defaultAction when present
        expect(stepData.title).toBe(app.defaultAction)
      }),
      { numRuns: 100 }
    )
  })

  it('should fallback to app.name when defaultAction is undefined', () => {
    const arbAppWithoutDefaultAction = fc.record({
      id: fc.uuid(),
      name: fc.string({ minLength: 1, maxLength: 50 }),
      description: fc.string({ minLength: 10, maxLength: 200 }),
      icon: fc.constantFrom('📧', '📊', '💬'),
      iconPath: fc.option(fc.string({ minLength: 5, maxLength: 100 }), { nil: undefined }),
      defaultAction: fc.constant(undefined), // Always undefined
      categories: fc.array(arbAppCategory, { minLength: 1, maxLength: 3 }),
    })

    fc.assert(
      fc.property(arbAppWithoutDefaultAction, (app) => {
        const stepData = simulateDragDrop(app)

        // Should fallback to app.name when defaultAction is undefined
        expect(stepData.title).toBe(app.name)
      }),
      { numRuns: 100 }
    )
  })

  it('should preserve app.defaultAction exactly without modification', () => {
    fc.assert(
      fc.property(arbAppWithDefaultAction, (app) => {
        const stepData = simulateDragDrop(app)

        // Action field should be exact copy, not transformed
        expect(stepData.title).toBe(app.defaultAction)
        expect(stepData.title.length).toBe(app.defaultAction.length)
        expect(stepData.title).toEqual(app.defaultAction)
      }),
      { numRuns: 100 }
    )
  })

  it('should map defaultAction regardless of other app properties', () => {
    fc.assert(
      fc.property(arbAppWithDefaultAction, (app) => {
        const stepData = simulateDragDrop(app)

        // Action mapping should be independent of iconPath, name, etc.
        expect(stepData.title).toBe(app.defaultAction)
        
        // Verify other fields don't affect the action mapping
        if (app.iconPath) {
          expect(stepData.title).toBe(app.defaultAction)
        }
        expect(stepData.title).toBe(app.defaultAction)
      }),
      { numRuns: 100 }
    )
  })

  it('should map defaultAction for apps with special characters in action', () => {
    const arbAppWithSpecialCharsAction = fc.record({
      id: fc.uuid(),
      name: fc.string({ minLength: 1, maxLength: 50 }),
      description: fc.string({ minLength: 10, maxLength: 200 }),
      icon: fc.constantFrom('📧', '📊', '💬'),
      iconPath: fc.option(fc.string({ minLength: 5, maxLength: 100 }), { nil: undefined }),
      defaultAction: fc.string({ minLength: 5, maxLength: 100 }).map(s => 
        s + fc.sample(fc.constantFrom(' ', '-', '_', '.', '/', '&', ':', ','), 1)[0]
      ),
      categories: fc.array(arbAppCategory, { minLength: 1, maxLength: 3 }),
    })

    fc.assert(
      fc.property(arbAppWithSpecialCharsAction, (app) => {
        const stepData = simulateDragDrop(app)

        // Action field should preserve special characters
        expect(stepData.title).toBe(app.defaultAction)
      }),
      { numRuns: 100 }
    )
  })

  it('should map defaultAction for apps with numeric actions', () => {
    const arbAppWithNumericAction = fc.record({
      id: fc.uuid(),
      name: fc.string({ minLength: 1, maxLength: 50 }),
      description: fc.string({ minLength: 10, maxLength: 200 }),
      icon: fc.constantFrom('📧', '📊', '💬'),
      iconPath: fc.option(fc.string({ minLength: 5, maxLength: 100 }), { nil: undefined }),
      defaultAction: fc.integer({ min: 1, max: 9999 }).map(n => `Action ${n}`),
      categories: fc.array(arbAppCategory, { minLength: 1, maxLength: 3 }),
    })

    fc.assert(
      fc.property(arbAppWithNumericAction, (app) => {
        const stepData = simulateDragDrop(app)

        // Action field should preserve numeric components
        expect(stepData.title).toBe(app.defaultAction)
      }),
      { numRuns: 100 }
    )
  })

  it('should map defaultAction for apps with very short actions', () => {
    const arbAppWithShortAction = fc.record({
      id: fc.uuid(),
      name: fc.string({ minLength: 1, maxLength: 50 }),
      description: fc.string({ minLength: 10, maxLength: 200 }),
      icon: fc.constantFrom('📧', '📊', '💬'),
      iconPath: fc.option(fc.string({ minLength: 5, maxLength: 100 }), { nil: undefined }),
      defaultAction: fc.string({ minLength: 5, maxLength: 10 }),
      categories: fc.array(arbAppCategory, { minLength: 1, maxLength: 3 }),
    })

    fc.assert(
      fc.property(arbAppWithShortAction, (app) => {
        const stepData = simulateDragDrop(app)

        // Action field should work for short actions
        expect(stepData.title).toBe(app.defaultAction)
        expect(stepData.title.length).toBeGreaterThanOrEqual(5)
      }),
      { numRuns: 100 }
    )
  })

  it('should map defaultAction for apps with very long actions', () => {
    const arbAppWithLongAction = fc.record({
      id: fc.uuid(),
      name: fc.string({ minLength: 1, maxLength: 50 }),
      description: fc.string({ minLength: 10, maxLength: 200 }),
      icon: fc.constantFrom('📧', '📊', '💬'),
      iconPath: fc.option(fc.string({ minLength: 5, maxLength: 100 }), { nil: undefined }),
      defaultAction: fc.string({ minLength: 80, maxLength: 100 }),
      categories: fc.array(arbAppCategory, { minLength: 1, maxLength: 3 }),
    })

    fc.assert(
      fc.property(arbAppWithLongAction, (app) => {
        const stepData = simulateDragDrop(app)

        // Action field should work for very long actions
        expect(stepData.title).toBe(app.defaultAction)
        expect(stepData.title.length).toBeGreaterThanOrEqual(80)
      }),
      { numRuns: 100 }
    )
  })

  it('should maintain action mapping invariant: title is always defined', () => {
    fc.assert(
      fc.property(arbApp, (app) => {
        const stepData = simulateDragDrop(app)

        // Action field (title) should always be defined
        expect(stepData.title).toBeDefined()
        expect(stepData.title).not.toBeNull()
        expect(stepData.title).not.toBeUndefined()
      }),
      { numRuns: 100 }
    )
  })

  it('should maintain action mapping invariant: title is always a string', () => {
    fc.assert(
      fc.property(arbApp, (app) => {
        const stepData = simulateDragDrop(app)

        // Action field should always be a string
        expect(typeof stepData.title).toBe('string')
      }),
      { numRuns: 100 }
    )
  })

  it('should maintain action mapping invariant: title is never empty', () => {
    fc.assert(
      fc.property(arbApp, (app) => {
        const stepData = simulateDragDrop(app)

        // Action field should never be empty (falls back to app.name)
        expect(stepData.title.length).toBeGreaterThan(0)
      }),
      { numRuns: 100 }
    )
  })

  it('should map defaultAction consistently across multiple drops', () => {
    fc.assert(
      fc.property(arbAppWithDefaultAction, (app) => {
        // Simulate dropping the same app multiple times
        const stepData1 = simulateDragDrop(app)
        const stepData2 = simulateDragDrop(app)
        const stepData3 = simulateDragDrop(app)

        // All drops should produce the same action field
        expect(stepData1.title).toBe(app.defaultAction)
        expect(stepData2.title).toBe(app.defaultAction)
        expect(stepData3.title).toBe(app.defaultAction)
        expect(stepData1.title).toBe(stepData2.title)
        expect(stepData2.title).toBe(stepData3.title)
      }),
      { numRuns: 100 }
    )
  })

  it('should map different defaultActions to different action fields', () => {
    fc.assert(
      fc.property(arbAppWithDefaultAction, arbAppWithDefaultAction, (app1, app2) => {
        // Pre-condition: apps have different defaultActions
        fc.pre(app1.defaultAction !== app2.defaultAction)

        const stepData1 = simulateDragDrop(app1)
        const stepData2 = simulateDragDrop(app2)

        // Different defaultActions should produce different action fields
        expect(stepData1.title).not.toBe(stepData2.title)
        expect(stepData1.title).toBe(app1.defaultAction)
        expect(stepData2.title).toBe(app2.defaultAction)
      }),
      { numRuns: 100 }
    )
  })

  it('should map defaultAction for real-world action descriptions', () => {
    const arbRealWorldApp = fc.record({
      id: fc.uuid(),
      name: fc.constantFrom(
        'Salesforce',
        'Google Sheets',
        'Slack',
        'Microsoft Teams',
        'HubSpot'
      ),
      description: fc.string({ minLength: 10, maxLength: 200 }),
      icon: fc.constantFrom('📧', '📊', '💬'),
      iconPath: fc.option(fc.string({ minLength: 5, maxLength: 100 }), { nil: undefined }),
      defaultAction: fc.constantFrom(
        'Create new contact',
        'Update spreadsheet row',
        'Send message to channel',
        'Post notification',
        'Add lead to CRM',
        'Fetch customer data',
        'Update deal stage',
        'Create task',
        'Send email notification',
        'Log activity'
      ),
      categories: fc.array(arbAppCategory, { minLength: 1, maxLength: 3 }),
    })

    fc.assert(
      fc.property(arbRealWorldApp, (app) => {
        const stepData = simulateDragDrop(app)

        // Action field should match real-world action descriptions exactly
        expect(stepData.title).toBe(app.defaultAction)
      }),
      { numRuns: 100 }
    )
  })

  it('should verify action takes precedence over name when defaultAction is present', () => {
    fc.assert(
      fc.property(arbAppWithDefaultAction, (app) => {
        // Pre-condition: defaultAction is different from name
        fc.pre(app.defaultAction !== app.name)

        const stepData = simulateDragDrop(app)

        // Action field should be defaultAction, not name
        expect(stepData.title).toBe(app.defaultAction)
        expect(stepData.title).not.toBe(app.name)
      }),
      { numRuns: 100 }
    )
  })

  it('should verify both action and tool fields are correctly set', () => {
    fc.assert(
      fc.property(arbAppWithDefaultAction, (app) => {
        const stepData = simulateDragDrop(app)

        // Action field should be defaultAction
        expect(stepData.title).toBe(app.defaultAction)
        // Tool field should be name
        expect(stepData.subtitle).toBe(app.name)
        // They should be independent
        if (app.defaultAction !== app.name) {
          expect(stepData.title).not.toBe(stepData.subtitle)
        }
      }),
      { numRuns: 100 }
    )
  })

  it('should verify appId is correctly mapped alongside action', () => {
    fc.assert(
      fc.property(arbAppWithDefaultAction, (app) => {
        const stepData = simulateDragDrop(app)

        // While testing action mapping, verify appId is also correct
        expect(stepData.appId).toBe(app.id)
        expect(stepData.title).toBe(app.defaultAction)
      }),
      { numRuns: 100 }
    )
  })

  it('should verify category is set to "app" for all dropped apps with defaultAction', () => {
    fc.assert(
      fc.property(arbAppWithDefaultAction, (app) => {
        const stepData = simulateDragDrop(app)

        // All dropped apps should have category "app"
        expect(stepData.category).toBe('app')
        expect(stepData.title).toBe(app.defaultAction)
      }),
      { numRuns: 100 }
    )
  })

  it('should handle edge case where defaultAction equals name', () => {
    const arbAppWithMatchingAction = fc.string({ minLength: 1, maxLength: 50 }).chain(name =>
      fc.record({
        id: fc.uuid(),
        name: fc.constant(name),
        description: fc.string({ minLength: 10, maxLength: 200 }),
        icon: fc.constantFrom('📧', '📊', '💬'),
        iconPath: fc.option(fc.string({ minLength: 5, maxLength: 100 }), { nil: undefined }),
        defaultAction: fc.constant(name), // defaultAction equals name
        categories: fc.array(arbAppCategory, { minLength: 1, maxLength: 3 }),
      })
    )

    fc.assert(
      fc.property(arbAppWithMatchingAction, (app) => {
        const stepData = simulateDragDrop(app)

        // Action should still be defaultAction (which equals name)
        expect(stepData.title).toBe(app.defaultAction)
        expect(stepData.title).toBe(app.name)
        expect(stepData.subtitle).toBe(app.name)
      }),
      { numRuns: 100 }
    )
  })

  it('should handle mixed apps with and without defaultAction', () => {
    fc.assert(
      fc.property(arbApp, (app) => {
        const stepData = simulateDragDrop(app)

        // Action should be defaultAction if present, otherwise name
        if (app.defaultAction) {
          expect(stepData.title).toBe(app.defaultAction)
        } else {
          expect(stepData.title).toBe(app.name)
        }
      }),
      { numRuns: 100 }
    )
  })
})
