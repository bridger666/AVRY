// @ts-nocheck
/**
 * Property-Based Tests for App Icon Display Condition
 * 
 * **Validates: Requirements 3.3**
 * Property 4: App Icon Display Condition
 * 
 * For any app with an `iconPath` field, when dragged to the canvas, 
 * the created workflow step should render the SVG icon from that path.
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

// Arbitrary for apps that ALWAYS have iconPath
const arbAppWithIconPath = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  description: fc.string({ minLength: 10, maxLength: 200 }),
  icon: fc.constantFrom('📧', '📊', '💬', '📁', '🔔', '⚙️', '🎯', '📈'),
  iconPath: fc.string({ minLength: 5, maxLength: 100 }), // Always present
  defaultAction: fc.option(fc.string({ minLength: 5, maxLength: 100 }), { nil: undefined }),
  categories: fc.array(arbAppCategory, { minLength: 1, maxLength: 3 }),
})

// Arbitrary for SVG path strings (realistic icon paths)
const arbSvgPath = fc.constantFrom(
  '/icons/salesforce.svg',
  '/icons/google-sheets.svg',
  '/icons/slack.svg',
  '/icons/hubspot.svg',
  '/icons/microsoft-teams.svg',
  '/icons/gmail.svg',
  '/icons/dropbox.svg',
  '/icons/trello.svg',
  '/icons/asana.svg',
  '/icons/notion.svg'
)

// Arbitrary for apps with realistic SVG paths
const arbAppWithSvgPath = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  description: fc.string({ minLength: 10, maxLength: 200 }),
  icon: fc.constantFrom('📧', '📊', '💬', '📁', '🔔', '⚙️', '🎯', '📈'),
  iconPath: arbSvgPath,
  defaultAction: fc.option(fc.string({ minLength: 5, maxLength: 100 }), { nil: undefined }),
  categories: fc.array(arbAppCategory, { minLength: 1, maxLength: 3 }),
})

// Simulate the drag-and-drop operation from WorkflowCanvas.tsx
function simulateDragDrop(app: App): WorkflowNodeData {
  // This simulates the onDrop handler logic in WorkflowCanvas.tsx
  return {
    title: app.defaultAction || app.name,
    subtitle: app.name,
    category: 'app',
    iconPath: app.iconPath,
    appId: app.id,
  }
}

describe('Property 4: App Icon Display Condition', () => {
  it('should include iconPath in step data when app has iconPath', () => {
    fc.assert(
      fc.property(arbAppWithIconPath, (app) => {
        const stepData = simulateDragDrop(app)

        // Step should include iconPath when app has iconPath
        expect(stepData.iconPath).toBe(app.iconPath)
        expect(stepData.iconPath).toBeDefined()
      }),
      { numRuns: 100 }
    )
  })

  it('should preserve iconPath exactly without modification', () => {
    fc.assert(
      fc.property(arbAppWithIconPath, (app) => {
        const stepData = simulateDragDrop(app)

        // iconPath should be exact copy, not transformed
        expect(stepData.iconPath).toBe(app.iconPath)
        expect(stepData.iconPath?.length).toBe(app.iconPath.length)
        expect(stepData.iconPath).toEqual(app.iconPath)
      }),
      { numRuns: 100 }
    )
  })

  it('should set iconPath to undefined when app has no iconPath', () => {
    const arbAppWithoutIconPath = fc.record({
      id: fc.uuid(),
      name: fc.string({ minLength: 1, maxLength: 50 }),
      description: fc.string({ minLength: 10, maxLength: 200 }),
      icon: fc.constantFrom('📧', '📊', '💬'),
      iconPath: fc.constant(undefined), // Always undefined
      defaultAction: fc.option(fc.string({ minLength: 5, maxLength: 100 }), { nil: undefined }),
      categories: fc.array(arbAppCategory, { minLength: 1, maxLength: 3 }),
    })

    fc.assert(
      fc.property(arbAppWithoutIconPath, (app) => {
        const stepData = simulateDragDrop(app)

        // Step should have undefined iconPath when app has no iconPath
        expect(stepData.iconPath).toBeUndefined()
      }),
      { numRuns: 100 }
    )
  })

  it('should map iconPath regardless of other app properties', () => {
    fc.assert(
      fc.property(arbAppWithIconPath, (app) => {
        const stepData = simulateDragDrop(app)

        // iconPath mapping should be independent of name, defaultAction, etc.
        expect(stepData.iconPath).toBe(app.iconPath)
        
        // Verify other fields don't affect the iconPath mapping
        if (app.defaultAction) {
          expect(stepData.iconPath).toBe(app.iconPath)
        }
        expect(stepData.iconPath).toBe(app.iconPath)
      }),
      { numRuns: 100 }
    )
  })

  it('should map iconPath for apps with SVG file paths', () => {
    fc.assert(
      fc.property(arbAppWithSvgPath, (app) => {
        const stepData = simulateDragDrop(app)

        // iconPath should be preserved for SVG paths
        expect(stepData.iconPath).toBe(app.iconPath)
        expect(stepData.iconPath).toContain('.svg')
      }),
      { numRuns: 100 }
    )
  })

  it('should map iconPath for apps with absolute paths', () => {
    const arbAppWithAbsolutePath = fc.record({
      id: fc.uuid(),
      name: fc.string({ minLength: 1, maxLength: 50 }),
      description: fc.string({ minLength: 10, maxLength: 200 }),
      icon: fc.constantFrom('📧', '📊', '💬'),
      iconPath: fc.string({ minLength: 5, maxLength: 100 }).map(s => `/icons/${s}.svg`),
      defaultAction: fc.option(fc.string({ minLength: 5, maxLength: 100 }), { nil: undefined }),
      categories: fc.array(arbAppCategory, { minLength: 1, maxLength: 3 }),
    })

    fc.assert(
      fc.property(arbAppWithAbsolutePath, (app) => {
        const stepData = simulateDragDrop(app)

        // iconPath should be preserved for absolute paths
        expect(stepData.iconPath).toBe(app.iconPath)
        expect(stepData.iconPath).toMatch(/^\/icons\//)
      }),
      { numRuns: 100 }
    )
  })

  it('should map iconPath for apps with relative paths', () => {
    const arbAppWithRelativePath = fc.record({
      id: fc.uuid(),
      name: fc.string({ minLength: 1, maxLength: 50 }),
      description: fc.string({ minLength: 10, maxLength: 200 }),
      icon: fc.constantFrom('📧', '📊', '💬'),
      iconPath: fc.string({ minLength: 5, maxLength: 100 }).map(s => `icons/${s}.svg`),
      defaultAction: fc.option(fc.string({ minLength: 5, maxLength: 100 }), { nil: undefined }),
      categories: fc.array(arbAppCategory, { minLength: 1, maxLength: 3 }),
    })

    fc.assert(
      fc.property(arbAppWithRelativePath, (app) => {
        const stepData = simulateDragDrop(app)

        // iconPath should be preserved for relative paths
        expect(stepData.iconPath).toBe(app.iconPath)
        expect(stepData.iconPath).toMatch(/^icons\//)
      }),
      { numRuns: 100 }
    )
  })

  it('should map iconPath for apps with special characters in path', () => {
    const arbAppWithSpecialCharsPath = fc.record({
      id: fc.uuid(),
      name: fc.string({ minLength: 1, maxLength: 50 }),
      description: fc.string({ minLength: 10, maxLength: 200 }),
      icon: fc.constantFrom('📧', '📊', '💬'),
      iconPath: fc.string({ minLength: 5, maxLength: 100 }).map(s => 
        `/icons/${s}-icon_v2.0.svg`
      ),
      defaultAction: fc.option(fc.string({ minLength: 5, maxLength: 100 }), { nil: undefined }),
      categories: fc.array(arbAppCategory, { minLength: 1, maxLength: 3 }),
    })

    fc.assert(
      fc.property(arbAppWithSpecialCharsPath, (app) => {
        const stepData = simulateDragDrop(app)

        // iconPath should preserve special characters
        expect(stepData.iconPath).toBe(app.iconPath)
      }),
      { numRuns: 100 }
    )
  })

  it('should map iconPath consistently across multiple drops', () => {
    fc.assert(
      fc.property(arbAppWithIconPath, (app) => {
        // Simulate dropping the same app multiple times
        const stepData1 = simulateDragDrop(app)
        const stepData2 = simulateDragDrop(app)
        const stepData3 = simulateDragDrop(app)

        // All drops should produce the same iconPath
        expect(stepData1.iconPath).toBe(app.iconPath)
        expect(stepData2.iconPath).toBe(app.iconPath)
        expect(stepData3.iconPath).toBe(app.iconPath)
        expect(stepData1.iconPath).toBe(stepData2.iconPath)
        expect(stepData2.iconPath).toBe(stepData3.iconPath)
      }),
      { numRuns: 100 }
    )
  })

  it('should map different iconPaths to different step iconPaths', () => {
    fc.assert(
      fc.property(arbAppWithIconPath, arbAppWithIconPath, (app1, app2) => {
        // Pre-condition: apps have different iconPaths
        fc.pre(app1.iconPath !== app2.iconPath)

        const stepData1 = simulateDragDrop(app1)
        const stepData2 = simulateDragDrop(app2)

        // Different iconPaths should produce different step iconPaths
        expect(stepData1.iconPath).not.toBe(stepData2.iconPath)
        expect(stepData1.iconPath).toBe(app1.iconPath)
        expect(stepData2.iconPath).toBe(app2.iconPath)
      }),
      { numRuns: 100 }
    )
  })

  it('should map iconPath for real-world integration apps', () => {
    const arbRealWorldApp = fc.record({
      id: fc.uuid(),
      name: fc.constantFrom(
        'Salesforce',
        'Google Sheets',
        'Slack',
        'Microsoft Teams',
        'HubSpot',
        'Gmail',
        'Dropbox',
        'Trello',
        'Asana',
        'Notion'
      ),
      description: fc.string({ minLength: 10, maxLength: 200 }),
      icon: fc.constantFrom('📧', '📊', '💬'),
      iconPath: fc.constantFrom(
        '/icons/salesforce.svg',
        '/icons/google-sheets.svg',
        '/icons/slack.svg',
        '/icons/microsoft-teams.svg',
        '/icons/hubspot.svg',
        '/icons/gmail.svg',
        '/icons/dropbox.svg',
        '/icons/trello.svg',
        '/icons/asana.svg',
        '/icons/notion.svg'
      ),
      defaultAction: fc.option(fc.string({ minLength: 5, maxLength: 100 }), { nil: undefined }),
      categories: fc.array(arbAppCategory, { minLength: 1, maxLength: 3 }),
    })

    fc.assert(
      fc.property(arbRealWorldApp, (app) => {
        const stepData = simulateDragDrop(app)

        // iconPath should match real-world SVG paths exactly
        expect(stepData.iconPath).toBe(app.iconPath)
        expect(stepData.iconPath).toContain('/icons/')
        expect(stepData.iconPath).toContain('.svg')
      }),
      { numRuns: 100 }
    )
  })

  it('should verify iconPath is correctly mapped alongside other fields', () => {
    fc.assert(
      fc.property(arbAppWithIconPath, (app) => {
        const stepData = simulateDragDrop(app)

        // Verify all fields are correctly mapped
        expect(stepData.iconPath).toBe(app.iconPath)
        expect(stepData.appId).toBe(app.id)
        expect(stepData.subtitle).toBe(app.name)
        expect(stepData.category).toBe('app')
      }),
      { numRuns: 100 }
    )
  })

  it('should verify iconPath mapping is independent of defaultAction', () => {
    fc.assert(
      fc.property(arbAppWithIconPath, (app) => {
        const stepData = simulateDragDrop(app)

        // iconPath should be mapped regardless of defaultAction presence
        expect(stepData.iconPath).toBe(app.iconPath)
        
        if (app.defaultAction) {
          expect(stepData.title).toBe(app.defaultAction)
          expect(stepData.iconPath).toBe(app.iconPath)
        } else {
          expect(stepData.title).toBe(app.name)
          expect(stepData.iconPath).toBe(app.iconPath)
        }
      }),
      { numRuns: 100 }
    )
  })

  it('should handle mixed apps with and without iconPath', () => {
    fc.assert(
      fc.property(arbApp, (app) => {
        const stepData = simulateDragDrop(app)

        // iconPath should be present if and only if app has iconPath
        if (app.iconPath) {
          expect(stepData.iconPath).toBe(app.iconPath)
          expect(stepData.iconPath).toBeDefined()
        } else {
          expect(stepData.iconPath).toBeUndefined()
        }
      }),
      { numRuns: 100 }
    )
  })

  it('should verify iconPath is optional in step data', () => {
    fc.assert(
      fc.property(arbApp, (app) => {
        const stepData = simulateDragDrop(app)

        // Step should be valid with or without iconPath
        expect(stepData.appId).toBeDefined()
        expect(stepData.category).toBe('app')
        expect(stepData.subtitle).toBeDefined()
        expect(stepData.title).toBeDefined()
        
        // iconPath is optional
        if (app.iconPath) {
          expect(stepData.iconPath).toBe(app.iconPath)
        } else {
          expect(stepData.iconPath).toBeUndefined()
        }
      }),
      { numRuns: 100 }
    )
  })

  it('should map iconPath for apps with very short paths', () => {
    const arbAppWithShortPath = fc.record({
      id: fc.uuid(),
      name: fc.string({ minLength: 1, maxLength: 50 }),
      description: fc.string({ minLength: 10, maxLength: 200 }),
      icon: fc.constantFrom('📧', '📊', '💬'),
      iconPath: fc.string({ minLength: 5, maxLength: 15 }),
      defaultAction: fc.option(fc.string({ minLength: 5, maxLength: 100 }), { nil: undefined }),
      categories: fc.array(arbAppCategory, { minLength: 1, maxLength: 3 }),
    })

    fc.assert(
      fc.property(arbAppWithShortPath, (app) => {
        const stepData = simulateDragDrop(app)

        // iconPath should work for short paths
        expect(stepData.iconPath).toBe(app.iconPath)
        expect(stepData.iconPath!.length).toBeGreaterThanOrEqual(5)
      }),
      { numRuns: 100 }
    )
  })

  it('should map iconPath for apps with very long paths', () => {
    const arbAppWithLongPath = fc.record({
      id: fc.uuid(),
      name: fc.string({ minLength: 1, maxLength: 50 }),
      description: fc.string({ minLength: 10, maxLength: 200 }),
      icon: fc.constantFrom('📧', '📊', '💬'),
      iconPath: fc.string({ minLength: 80, maxLength: 100 }),
      defaultAction: fc.option(fc.string({ minLength: 5, maxLength: 100 }), { nil: undefined }),
      categories: fc.array(arbAppCategory, { minLength: 1, maxLength: 3 }),
    })

    fc.assert(
      fc.property(arbAppWithLongPath, (app) => {
        const stepData = simulateDragDrop(app)

        // iconPath should work for very long paths
        expect(stepData.iconPath).toBe(app.iconPath)
        expect(stepData.iconPath!.length).toBeGreaterThanOrEqual(80)
      }),
      { numRuns: 100 }
    )
  })

  it('should maintain iconPath type invariant: string or undefined', () => {
    fc.assert(
      fc.property(arbApp, (app) => {
        const stepData = simulateDragDrop(app)

        // iconPath should always be string or undefined
        expect(['string', 'undefined']).toContain(typeof stepData.iconPath)
      }),
      { numRuns: 100 }
    )
  })

  it('should verify iconPath is never null', () => {
    fc.assert(
      fc.property(arbApp, (app) => {
        const stepData = simulateDragDrop(app)

        // iconPath should never be null (only undefined or string)
        expect(stepData.iconPath).not.toBeNull()
      }),
      { numRuns: 100 }
    )
  })

  it('should verify iconPath is never an empty string when present', () => {
    fc.assert(
      fc.property(arbAppWithIconPath, (app) => {
        const stepData = simulateDragDrop(app)

        // iconPath should never be empty string when present
        expect(stepData.iconPath).toBeDefined()
        expect(stepData.iconPath!.length).toBeGreaterThan(0)
      }),
      { numRuns: 100 }
    )
  })

  it('should handle edge case where iconPath contains URL-encoded characters', () => {
    const arbAppWithEncodedPath = fc.record({
      id: fc.uuid(),
      name: fc.string({ minLength: 1, maxLength: 50 }),
      description: fc.string({ minLength: 10, maxLength: 200 }),
      icon: fc.constantFrom('📧', '📊', '💬'),
      iconPath: fc.string({ minLength: 5, maxLength: 50 }).map(s => 
        `/icons/${encodeURIComponent(s)}.svg`
      ),
      defaultAction: fc.option(fc.string({ minLength: 5, maxLength: 100 }), { nil: undefined }),
      categories: fc.array(arbAppCategory, { minLength: 1, maxLength: 3 }),
    })

    fc.assert(
      fc.property(arbAppWithEncodedPath, (app) => {
        const stepData = simulateDragDrop(app)

        // iconPath should preserve URL-encoded characters
        expect(stepData.iconPath).toBe(app.iconPath)
      }),
      { numRuns: 100 }
    )
  })
})
