/**
 * Unit Tests for SyncStatus Component
 * 
 * Tests all state transitions, UI rendering for each state, and retry button functionality.
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SyncStatus, type SyncState } from '@/components/workflow/SyncStatus'

// Mock user event for testing
const mockUserEvent = {
  click: vi.fn(),
}

describe('SyncStatus Component', () => {
  // ============================================================================
  // Synced State Tests
  // ============================================================================

  describe('Synced state', () => {
    it('should render synced indicator', () => {
      render(<SyncStatus state="synced" />)

      expect(screen.getByText('Synced')).toBeInTheDocument()
    })

    it('should display green indicator for synced state', () => {
      const { container } = render(<SyncStatus state="synced" />)

      const indicator = container.querySelector('.bg-emerald-500')
      expect(indicator).toBeInTheDocument()
    })

    it('should use emerald color for synced state', () => {
      const { container } = render(<SyncStatus state="synced" />)

      const statusDiv = container.querySelector('.text-emerald-500')
      expect(statusDiv).toBeInTheDocument()
    })

    it('should not show error message in synced state', () => {
      render(<SyncStatus state="synced" errorMessage="Some error" />)

      expect(screen.queryByText(/Some error/)).not.toBeInTheDocument()
    })

    it('should not show retry button in synced state', () => {
      const onRetry = vi.fn()
      render(<SyncStatus state="synced" onRetry={onRetry} />)

      const retryButton = screen.queryByRole('button')
      expect(retryButton).not.toBeInTheDocument()
    })
  })

  // ============================================================================
  // Unsaved State Tests
  // ============================================================================

  describe('Unsaved state', () => {
    it('should render unsaved changes indicator', () => {
      render(<SyncStatus state="unsaved" />)

      expect(screen.getByText('Unsaved changes')).toBeInTheDocument()
    })

    it('should display yellow indicator for unsaved state', () => {
      const { container } = render(<SyncStatus state="unsaved" />)

      const indicator = container.querySelector('.bg-amber-500')
      expect(indicator).toBeInTheDocument()
    })

    it('should use amber color for unsaved state', () => {
      const { container } = render(<SyncStatus state="unsaved" />)

      const statusDiv = container.querySelector('.text-amber-500')
      expect(statusDiv).toBeInTheDocument()
    })

    it('should not show retry button in unsaved state', () => {
      const onRetry = vi.fn()
      render(<SyncStatus state="unsaved" onRetry={onRetry} />)

      const retryButton = screen.queryByRole('button')
      expect(retryButton).not.toBeInTheDocument()
    })
  })

  // ============================================================================
  // Saving State Tests
  // ============================================================================

  describe('Saving state', () => {
    it('should render saving indicator', () => {
      render(<SyncStatus state="saving" />)

      expect(screen.getByText('Saving...')).toBeInTheDocument()
    })

    it('should display hourglass emoji in saving state', () => {
      render(<SyncStatus state="saving" />)

      expect(screen.getByText('⏳')).toBeInTheDocument()
    })

    it('should use muted color for saving state', () => {
      const { container } = render(<SyncStatus state="saving" />)

      const statusDiv = container.querySelector('.text-muted-foreground')
      expect(statusDiv).toBeInTheDocument()
    })

    it('should have pulse animation in saving state', () => {
      const { container } = render(<SyncStatus state="saving" />)

      const pulseElement = container.querySelector('.animate-pulse')
      expect(pulseElement).toBeInTheDocument()
    })

    it('should not show retry button in saving state', () => {
      const onRetry = vi.fn()
      render(<SyncStatus state="saving" onRetry={onRetry} />)

      const retryButton = screen.queryByRole('button')
      expect(retryButton).not.toBeInTheDocument()
    })
  })

  // ============================================================================
  // Save Success State Tests
  // ============================================================================

  describe('Save success state', () => {
    it('should render synced text in save-success state', () => {
      render(<SyncStatus state="save-success" />)

      expect(screen.getByText('Synced')).toBeInTheDocument()
    })

    it('should display green indicator in save-success state', () => {
      const { container } = render(<SyncStatus state="save-success" />)

      const indicator = container.querySelector('.bg-emerald-500')
      expect(indicator).toBeInTheDocument()
    })

    it('should have pulse animation in save-success state', () => {
      const { container } = render(<SyncStatus state="save-success" />)

      const pulseElement = container.querySelector('.animate-pulse')
      expect(pulseElement).toBeInTheDocument()
    })

    it('should use emerald color in save-success state', () => {
      const { container } = render(<SyncStatus state="save-success" />)

      const statusDiv = container.querySelector('.text-emerald-500')
      expect(statusDiv).toBeInTheDocument()
    })
  })

  // ============================================================================
  // Save Error State Tests
  // ============================================================================

  describe('Save error state', () => {
    it('should render error message', () => {
      render(<SyncStatus state="save-error" />)

      expect(screen.getByText(/Sync failed — retry/)).toBeInTheDocument()
    })

    it('should display red indicator for error state', () => {
      const { container } = render(<SyncStatus state="save-error" />)

      const indicator = container.querySelector('.bg-red-500')
      expect(indicator).toBeInTheDocument()
    })

    it('should use red color for error state', () => {
      const { container } = render(<SyncStatus state="save-error" />)

      const statusDiv = container.querySelector('.text-red-500')
      expect(statusDiv).toBeInTheDocument()
    })

    it('should render retry button', () => {
      render(<SyncStatus state="save-error" />)

      const retryButton = screen.getByRole('button')
      expect(retryButton).toBeInTheDocument()
    })

    it('should call onRetry when retry button is clicked', async () => {
      const onRetry = vi.fn()
      render(<SyncStatus state="save-error" onRetry={onRetry} />)

      const retryButton = screen.getByRole('button')
      retryButton.click()

      expect(onRetry).toHaveBeenCalledOnce()
    })

    it('should display error message when provided', () => {
      render(
        <SyncStatus
          state="save-error"
          errorMessage="Connection timeout"
        />
      )

      expect(screen.getByText(/Connection timeout/)).toBeInTheDocument()
    })

    it('should truncate long error messages', () => {
      const longError = 'This is a very long error message that should be truncated'
      const { container } = render(
        <SyncStatus state="save-error" errorMessage={longError} />
      )

      const errorSpan = container.querySelector('.max-w-\\[220px\\]')
      expect(errorSpan).toBeInTheDocument()
    })

    it('should have hover effect on retry button', () => {
      const { container } = render(<SyncStatus state="save-error" />)

      const retryButton = container.querySelector('button')
      expect(retryButton?.className).toContain('hover:underline')
    })
  })

  // ============================================================================
  // State Transition Tests
  // ============================================================================

  describe('State transitions', () => {
    it('should transition from unsaved to saving', () => {
      const { rerender } = render(<SyncStatus state="unsaved" />)

      expect(screen.getByText('Unsaved changes')).toBeInTheDocument()

      rerender(<SyncStatus state="saving" />)

      expect(screen.getByText('Saving...')).toBeInTheDocument()
    })

    it('should transition from saving to synced', () => {
      const { rerender } = render(<SyncStatus state="saving" />)

      expect(screen.getByText('Saving...')).toBeInTheDocument()

      rerender(<SyncStatus state="synced" />)

      expect(screen.getByText('Synced')).toBeInTheDocument()
    })

    it('should transition from saving to save-error', () => {
      const { rerender } = render(<SyncStatus state="saving" />)

      expect(screen.getByText('Saving...')).toBeInTheDocument()

      rerender(<SyncStatus state="save-error" errorMessage="Failed" />)

      expect(screen.getByText(/Sync failed — retry/)).toBeInTheDocument()
    })

    it('should transition from save-error to saving on retry', async () => {
      const onRetry = vi.fn()
      const { rerender } = render(
        <SyncStatus state="save-error" onRetry={onRetry} />
      )

      const retryButton = screen.getByRole('button')
      retryButton.click()

      rerender(<SyncStatus state="saving" />)

      expect(screen.getByText('Saving...')).toBeInTheDocument()
    })

    it('should transition from synced to unsaved', () => {
      const { rerender } = render(<SyncStatus state="synced" />)

      expect(screen.getByText('Synced')).toBeInTheDocument()

      rerender(<SyncStatus state="unsaved" />)

      expect(screen.getByText('Unsaved changes')).toBeInTheDocument()
    })
  })

  // ============================================================================
  // Props Tests
  // ============================================================================

  describe('Props handling', () => {
    it('should accept state prop', () => {
      const states: SyncState[] = [
        'synced',
        'unsaved',
        'saving',
        'save-success',
        'save-error',
      ]

      states.forEach((state) => {
        const { unmount } = render(<SyncStatus state={state} />)
        unmount()
      })
    })

    it('should accept optional errorMessage prop', () => {
      render(
        <SyncStatus
          state="save-error"
          errorMessage="Test error message"
        />
      )

      expect(screen.getByText(/Test error message/)).toBeInTheDocument()
    })

    it('should accept optional onRetry callback', async () => {
      const onRetry = vi.fn()
      render(<SyncStatus state="save-error" onRetry={onRetry} />)

      const retryButton = screen.getByRole('button')
      await userEvent.click(retryButton)

      expect(onRetry).toHaveBeenCalled()
    })

    it('should handle null errorMessage', () => {
      render(<SyncStatus state="save-error" errorMessage={null} />)

      expect(screen.getByText(/Sync failed — retry/)).toBeInTheDocument()
    })

    it('should handle undefined errorMessage', () => {
      render(<SyncStatus state="save-error" errorMessage={undefined} />)

      expect(screen.getByText(/Sync failed — retry/)).toBeInTheDocument()
    })

    it('should handle undefined onRetry', async () => {
      render(<SyncStatus state="save-error" />)

      const retryButton = screen.getByRole('button')
      // Should not throw when clicking without onRetry handler
      retryButton.click()
    })
  })

  // ============================================================================
  // Accessibility Tests
  // ============================================================================

  describe('Accessibility', () => {
    it('should have proper button role for retry', () => {
      render(<SyncStatus state="save-error" />)

      const retryButton = screen.getByRole('button')
      expect(retryButton).toHaveAttribute('type', 'button')
    })

    it('should have readable text for all states', () => {
      const states: SyncState[] = [
        'synced',
        'unsaved',
        'saving',
        'save-success',
        'save-error',
      ]

      states.forEach((state) => {
        const { unmount } = render(<SyncStatus state={state} />)
        const text = screen.getByText(/Synced|Unsaved|Saving|Sync failed/)
        expect(text).toBeInTheDocument()
        unmount()
      })
    })

    it('should have semantic HTML structure', () => {
      const { container } = render(<SyncStatus state="synced" />)

      const div = container.querySelector('div')
      expect(div).toBeInTheDocument()
    })
  })

  // ============================================================================
  // Visual Tests
  // ============================================================================

  describe('Visual rendering', () => {
    it('should render with flex layout', () => {
      const { container } = render(<SyncStatus state="synced" />)

      const statusDiv = container.querySelector('.flex')
      expect(statusDiv).toBeInTheDocument()
    })

    it('should have gap between indicator and text', () => {
      const { container } = render(<SyncStatus state="synced" />)

      const statusDiv = container.querySelector('.gap-1')
      expect(statusDiv).toBeInTheDocument()
    })

    it('should use small text size', () => {
      const { container } = render(<SyncStatus state="synced" />)

      const statusDiv = container.querySelector('.text-xs')
      expect(statusDiv).toBeInTheDocument()
    })

    it('should have circular indicator', () => {
      const { container } = render(<SyncStatus state="synced" />)

      const indicator = container.querySelector('.rounded-full')
      expect(indicator).toBeInTheDocument()
    })

    it('should have fixed indicator size', () => {
      const { container } = render(<SyncStatus state="synced" />)

      const indicator = container.querySelector('.h-2.w-2')
      expect(indicator).toBeInTheDocument()
    })
  })
})
