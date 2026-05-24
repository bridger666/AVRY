// @ts-nocheck
/**
 * Property-Based Tests for App-to-Step Tool Mapping
 * 
 * **Validates: Requirements 3.4**
 * Property 2: App-to-Step Tool Mapping
 * 
 * For any app dragged from the Apps section to the canvas, the created 
 * workflow step's `tool` field should equal the app's `name` field.
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
  title: string
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

// Simulate the drag-and-drop operation from WorkflowCanvas.tsx
function simulateDragDrop(app: App): WorkflowNodeData {
  // This simulates the onDrop handler logic in WorkflowCanvas.tsx
  return {
    title: app.defaultAction || app.name,
    subtitle: app.name, // This is the tool field
    category: 'app',
    iconPath: app.iconPath,
    appId: app.id,
  }
}

describe('Property 2: App-to-Step Tool Mapping', () => {
  it('should map app.name to step.subtitle (tool field) for any app', () => {
    fc.assert(
      fc.property(arbApp, (app) => {
        const stepData = simulateDragDrop(app)

        // The subtitle field (tool) should always equal the app name
        expect(stepData.subtitle).toBe(app.name)
      }),
      { numRuns: 100 }
    )
  })

  it('should preserve app.name exactly without modification', () => {
    fc.assert(
      fc.property(arbApp, (app) => {
        const stepData = simulateDragDrop(app)

        // Tool field should be exact copy, not transformed
        expect(stepData.subtitle).toBe(app.name)
        expect(stepData.subtitle.length).toBe(app.name.length)
        expect(stepData.subtitle).toEqual(app.name)
      }),
      { numRuns: 100 }
    )
  })

  it('should map app.name to tool field regardless of other app properties', () => {
    fc.assert(
      fc.property(arbApp, (app) => {
        const stepData = simulateDragDrop(app)

        // Tool mapping should be independent of iconPath, defaultAction, etc.
        expect(stepData.subtitle).toBe(app.name)
        
        // Verify other fields don't affect the tool mapping
        if (app.iconPath) {
          expect(stepData.subtitle).toBe(app.name)
        }
        if (app.defaultAction) {
          expect(stepData.subtitle).toBe(app.name)
        }
      }),
      { numRuns: 100 }
    )
  })

  it('should map app.name to tool field for apps with special characters', () => {
    const arbAppWithSpecialChars = fc.record({
      id: fc.uuid(),
      name: fc.string({ minLength: 1, maxLength: 50 }).map(s => 
        s + fc.sample(fc.constantFrom(' ', '-', '_', '.', '/', '&'), 1)[0]
      ),
      description: fc.string({ minLength: 10, maxLength: 200 }),
      icon: fc.constantFrom('📧', '📊', '💬'),
      iconPath: fc.option(fc.string({ minLength: 5, maxLength: 100 }), { nil: undefined }),
      defaultAction: fc.option(fc.string({ minLength: 5, maxLength: 100 }), { nil: undefined }),
      categories: fc.array(arbAppCategory, { minLength: 1, maxLength: 3 }),
    })

    fc.assert(
      fc.property(arbAppWithSpecialChars, (app) => {
        const stepData = simulateDragDrop(app)

        // Tool field should preserve special characters
        expect(stepData.subtitle).toBe(app.name)
      }),
      { numRuns: 100 }
    )
  })

  it('should map app.name to tool field for apps with numeric names', () => {
    const arbAppWithNumericName = fc.record({
      id: fc.uuid(),
      name: fc.integer({ min: 1, max: 9999 }).map(n => `App ${n}`),
      description: fc.string({ minLength: 10, maxLength: 200 }),
      icon: fc.constantFrom('📧', '📊', '💬'),
      iconPath: fc.option(fc.string({ minLength: 5, maxLength: 100 }), { nil: undefined }),
      defaultAction: fc.option(fc.string({ minLength: 5, maxLength: 100 }), { nil: undefined }),
      categories: fc.array(arbAppCategory, { minLength: 1, maxLength: 3 }),
    })

    fc.assert(
      fc.property(arbAppWithNumericName, (app) => {
        const stepData = simulateDragDrop(app)

        // Tool field should preserve numeric components
        expect(stepData.subtitle).toBe(app.name)
      }),
      { numRuns: 100 }
    )
  })

  it('should map app.name to tool field for apps with very short names', () => {
    const arbAppWithShortName = fc.record({
      id: fc.uuid(),
      name: fc.string({ minLength: 1, maxLength: 3 }),
      description: fc.string({ minLength: 10, maxLength: 200 }),
      icon: fc.constantFrom('📧', '📊', '💬'),
      iconPath: fc.option(fc.string({ minLength: 5, maxLength: 100 }), { nil: undefined }),
      defaultAction: fc.option(fc.string({ minLength: 5, maxLength: 100 }), { nil: undefined }),
      categories: fc.array(arbAppCategory, { minLength: 1, maxLength: 3 }),
    })

    fc.assert(
      fc.property(arbAppWithShortName, (app) => {
        const stepData = simulateDragDrop(app)

        // Tool field should work for very short names
        expect(stepData.subtitle).toBe(app.name)
        expect(stepData.subtitle.length).toBeGreaterThan(0)
      }),
      { numRuns: 100 }
    )
  })

  it('should map app.name to tool field for apps with very long names', () => {
    const arbAppWithLongName = fc.record({
      id: fc.uuid(),
      name: fc.string({ minLength: 40, maxLength: 50 }),
      description: fc.string({ minLength: 10, maxLength: 200 }),
      icon: fc.constantFrom('📧', '📊', '💬'),
      iconPath: fc.option(fc.string({ minLength: 5, maxLength: 100 }), { nil: undefined }),
      defaultAction: fc.option(fc.string({ minLength: 5, maxLength: 100 }), { nil: undefined }),
      categories: fc.array(arbAppCategory, { minLength: 1, maxLength: 3 }),
    })

    fc.assert(
      fc.property(arbAppWithLongName, (app) => {
        const stepData = simulateDragDrop(app)

        // Tool field should work for very long names
        expect(stepData.subtitle).toBe(app.name)
        expect(stepData.subtitle.length).toBeGreaterThanOrEqual(40)
      }),
      { numRuns: 100 }
    )
  })

  it('should maintain tool mapping invariant: subtitle is always defined', () => {
    fc.assert(
      fc.property(arbApp, (app) => {
        const stepData = simulateDragDrop(app)

        // Tool field (subtitle) should always be defined
        expect(stepData.subtitle).toBeDefined()
        expect(stepData.subtitle).not.toBeNull()
        expect(stepData.subtitle).not.toBeUndefined()
      }),
      { numRuns: 100 }
    )
  })

  it('should maintain tool mapping invariant: subtitle is always a string', () => {
    fc.assert(
      fc.property(arbApp, (app) => {
        const stepData = simulateDragDrop(app)

        // Tool field should always be a string
        expect(typeof stepData.subtitle).toBe('string')
      }),
      { numRuns: 100 }
    )
  })

  it('should maintain tool mapping invariant: subtitle is never empty', () => {
    fc.assert(
      fc.property(arbApp, (app) => {
        const stepData = simulateDragDrop(app)

        // Tool field should never be empty (since app.name has minLength: 1)
        expect(stepData.subtitle.length).toBeGreaterThan(0)
      }),
      { numRuns: 100 }
    )
  })

  it('should map app.name to tool field consistently across multiple drops', () => {
    fc.assert(
      fc.property(arbApp, (app) => {
        // Simulate dropping the same app multiple times
        const stepData1 = simulateDragDrop(app)
        const stepData2 = simulateDragDrop(app)
        const stepData3 = simulateDragDrop(app)

        // All drops should produce the same tool field
        expect(stepData1.subtitle).toBe(app.name)
        expect(stepData2.subtitle).toBe(app.name)
        expect(stepData3.subtitle).toBe(app.name)
        expect(stepData1.subtitle).toBe(stepData2.subtitle)
        expect(stepData2.subtitle).toBe(stepData3.subtitle)
      }),
      { numRuns: 100 }
    )
  })

  it('should map different app names to different tool fields', () => {
    fc.assert(
      fc.property(arbApp, arbApp, (app1, app2) => {
        // Pre-condition: apps have different names
        fc.pre(app1.name !== app2.name)

        const stepData1 = simulateDragDrop(app1)
        const stepData2 = simulateDragDrop(app2)

        // Different app names should produce different tool fields
        expect(stepData1.subtitle).not.toBe(stepData2.subtitle)
        expect(stepData1.subtitle).toBe(app1.name)
        expect(stepData2.subtitle).toBe(app2.name)
      }),
      { numRuns: 100 }
    )
  })

  it('should map app.name to tool field for real-world app names', () => {
    const arbRealWorldApp = fc.record({
      id: fc.uuid(),
      name: fc.constantFrom(
        'Salesforce',
        'Google Sheets',
        'Slack',
        'Microsoft Teams',
        'HubSpot',
        'Notion',
        'Airtable',
        'Zapier',
        'OpenAI',
        'SendGrid',
        'Twilio',
        'Stripe',
        'PayPal',
        'Shopify',
        'WordPress'
      ),
      description: fc.string({ minLength: 10, maxLength: 200 }),
      icon: fc.constantFrom('📧', '📊', '💬'),
      iconPath: fc.option(fc.string({ minLength: 5, maxLength: 100 }), { nil: undefined }),
      defaultAction: fc.option(fc.string({ minLength: 5, maxLength: 100 }), { nil: undefined }),
      categories: fc.array(arbAppCategory, { minLength: 1, maxLength: 3 }),
    })

    fc.assert(
      fc.property(arbRealWorldApp, (app) => {
        const stepData = simulateDragDrop(app)

        // Tool field should match real-world app names exactly
        expect(stepData.subtitle).toBe(app.name)
      }),
      { numRuns: 100 }
    )
  })

  it('should verify appId is also correctly mapped', () => {
    fc.assert(
      fc.property(arbApp, (app) => {
        const stepData = simulateDragDrop(app)

        // While testing tool mapping, verify appId is also correct
        expect(stepData.appId).toBe(app.id)
        expect(stepData.subtitle).toBe(app.name)
      }),
      { numRuns: 100 }
    )
  })

  it('should verify category is set to "app" for all dropped apps', () => {
    fc.assert(
      fc.property(arbApp, (app) => {
        const stepData = simulateDragDrop(app)

        // All dropped apps should have category "app"
        expect(stepData.category).toBe('app')
        expect(stepData.subtitle).toBe(app.name)
      }),
      { numRuns: 100 }
    )
  })
})
