// @ts-nocheck
/**
 * Unit Tests for Visual Consistency Across Pages
 * 
 * Tests that background colors are consistent across Console, Workflows, and Integrations pages
 * Requirements: 2.1, 2.2, 2.3
 * Feature: integrations-canvas-polish
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

describe('Visual Consistency - Background Colors', () => {
  // Helper function to extract background color from CSS
  const extractBackgroundColor = (cssContent: string, className: string): string | null => {
    // Match the class and extract background property
    const classRegex = new RegExp(`\\.${className}\\s*\\{[^}]*background:\\s*([^;]+);`, 's')
    const match = cssContent.match(classRegex)
    return match ? match[1].trim() : null
  }

  it('should use var(--bg-main, #1e1d1a) for Integrations page background', () => {
    // Read the integrations CSS file
    const integrationsCSS = readFileSync(
      join(process.cwd(), 'app/integrations/integrations.module.css'),
      'utf-8'
    )
    
    // Extract background color from .page class
    const backgroundColor = extractBackgroundColor(integrationsCSS, 'page')
    
    // Verify it uses the design system variable
    expect(backgroundColor).toBe('var(--bg-main, #1e1d1a)')
  })

  it('should NOT use pure black (#0a0a0a) for Integrations page', () => {
    // Read the integrations CSS file
    const integrationsCSS = readFileSync(
      join(process.cwd(), 'app/integrations/integrations.module.css'),
      'utf-8'
    )
    
    // Extract background color from .page class
    const backgroundColor = extractBackgroundColor(integrationsCSS, 'page')
    
    // Verify it does NOT use pure black
    expect(backgroundColor).not.toBe('#0a0a0a')
  })

  it('should use consistent background color across Console page', () => {
    // Read the console top bar CSS file (console uses global styles)
    const consoleTopBarCSS = readFileSync(
      join(process.cwd(), 'components/console/ConsoleTopBar.module.css'),
      'utf-8'
    )
    
    // Check for the design system variable
    // Console uses var(--bg-main) which is defined in globals.css
    expect(consoleTopBarCSS).toContain('var(--bg-main)')
  })

  it('should use consistent background color across Workflows page', () => {
    // Read the workflows CSS file
    const workflowsCSS = readFileSync(
      join(process.cwd(), 'app/workflows/workflows.module.css'),
      'utf-8'
    )
    
    // Check for the design system variable (with any fallback color)
    expect(workflowsCSS).toContain('var(--bg-main')
  })

  it('should have matching background colors across all three pages', () => {
    // Read all three CSS files
    const integrationsCSS = readFileSync(
      join(process.cwd(), 'app/integrations/integrations.module.css'),
      'utf-8'
    )
    const consoleTopBarCSS = readFileSync(
      join(process.cwd(), 'components/console/ConsoleTopBar.module.css'),
      'utf-8'
    )
    const workflowsCSS = readFileSync(
      join(process.cwd(), 'app/workflows/workflows.module.css'),
      'utf-8'
    )
    
    // Extract the background color value from Integrations
    const integrationsBackground = extractBackgroundColor(integrationsCSS, 'page')
    
    // Verify Integrations uses the design system variable with correct fallback
    expect(integrationsBackground).toBe('var(--bg-main, #1e1d1a)')
    
    // Verify Console uses the design system variable
    expect(consoleTopBarCSS).toContain('var(--bg-main)')
    
    // Verify Workflows uses the design system variable
    expect(workflowsCSS).toContain('var(--bg-main')
  })

  it('should use CSS variable with fallback for theme consistency', () => {
    // Read the integrations CSS file
    const integrationsCSS = readFileSync(
      join(process.cwd(), 'app/integrations/integrations.module.css'),
      'utf-8'
    )
    
    // Extract background color
    const backgroundColor = extractBackgroundColor(integrationsCSS, 'page')
    
    // Verify it uses CSS variable syntax with fallback
    expect(backgroundColor).toMatch(/^var\(--[a-z-]+,\s*#[0-9a-f]{6}\)$/)
  })

  it('should have warm dark gray (#1e1d1a) as the fallback color', () => {
    // Read the integrations CSS file
    const integrationsCSS = readFileSync(
      join(process.cwd(), 'app/integrations/integrations.module.css'),
      'utf-8'
    )
    
    // Extract background color
    const backgroundColor = extractBackgroundColor(integrationsCSS, 'page')
    
    // Verify the fallback color is the warm dark gray
    expect(backgroundColor).toContain('#1e1d1a')
  })

  it('should use --bg-main CSS variable name', () => {
    // Read the integrations CSS file
    const integrationsCSS = readFileSync(
      join(process.cwd(), 'app/integrations/integrations.module.css'),
      'utf-8'
    )
    
    // Extract background color
    const backgroundColor = extractBackgroundColor(integrationsCSS, 'page')
    
    // Verify it uses the --bg-main variable
    expect(backgroundColor).toContain('--bg-main')
  })

  it('should maintain visual consistency when navigating between pages', () => {
    // This test verifies that all pages use the same color system
    const expectedVariable = 'var(--bg-main, #1e1d1a)'
    
    // Read all CSS files
    const integrationsCSS = readFileSync(
      join(process.cwd(), 'app/integrations/integrations.module.css'),
      'utf-8'
    )
    const consoleTopBarCSS = readFileSync(
      join(process.cwd(), 'components/console/ConsoleTopBar.module.css'),
      'utf-8'
    )
    const workflowsCSS = readFileSync(
      join(process.cwd(), 'app/workflows/workflows.module.css'),
      'utf-8'
    )
    
    // Verify Integrations page uses the variable with correct fallback
    const integrationsBackground = extractBackgroundColor(integrationsCSS, 'page')
    expect(integrationsBackground).toBe(expectedVariable)
    
    // Verify Console page uses the design system variable
    expect(consoleTopBarCSS).toContain('var(--bg-main)')
    
    // Verify Workflows page uses the design system variable
    expect(workflowsCSS).toContain('var(--bg-main')
    
    // All pages should reference the design system variable
    expect(integrationsCSS).toContain('var(--bg-main')
    expect(consoleTopBarCSS).toContain('var(--bg-main)')
    expect(workflowsCSS).toContain('var(--bg-main')
  })
})
