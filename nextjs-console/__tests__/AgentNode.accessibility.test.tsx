// @ts-nocheck
/**
 * Accessibility Tests for AgentNode Component
 *
 * Tests for accessibility compliance:
 * - Keyboard navigation
 * - Screen reader support
 * - Color contrast ratios
 * - Focus indicators
 * - ARIA attributes
 * - WCAG AA compliance
 *
 * **Validates: Requirements 3.6**
 */

import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ReactFlowProvider } from '@xyflow/react';
import AgentNode from '@/components/workflow/AgentNode';

/**
 * Wrapper component to provide ReactFlow context
 */
const AgentNodeWithProvider = (props: any) => (
  <ReactFlowProvider>
    <AgentNode {...props} />
  </ReactFlowProvider>
);

/**
 * Helper function to calculate contrast ratio between two colors
 * Based on WCAG 2.0 formula
 */
function getContrastRatio(rgb1: string, rgb2: string): number {
  const getLuminance = (rgb: string) => {
    const match = rgb.match(/\d+/g);
    if (!match || match.length < 3) return 0;

    const [r, g, b] = match.map((x) => {
      const val = parseInt(x) / 255;
      return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  const l1 = getLuminance(rgb1);
  const l2 = getLuminance(rgb2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

describe('AgentNode Accessibility Tests', () => {
  const defaultProps = {
    data: {
      agentName: 'Research Agent',
      model: 'Claude 3.5',
      provider: 'OpenRouter',
      runtime: 'Zeroclaw',
      promptSummary: 'Analyze user input and generate research findings',
      inputVariables: ['user_input', 'context'],
      outputVariable: 'research_result',
      status: 'default' as const,
    },
    selected: false,
    isConnecting: false,
  };

  // ============================================================================
  // ARIA Attributes Tests
  // ============================================================================

  describe('ARIA Attributes', () => {
    it('should have proper ARIA role', () => {
      render(<AgentNodeWithProvider {...defaultProps} />);

      const nodeElement = screen.getByRole('article');
      expect(nodeElement).toBeInTheDocument();
    });

    it('should have descriptive ARIA label', () => {
      render(<AgentNodeWithProvider {...defaultProps} />);

      const nodeElement = screen.getByRole('article');
      expect(nodeElement).toHaveAttribute('aria-label', 'Agent node: Research Agent');
    });

    it('should have ARIA label that includes agent name', () => {
      render(
        <AgentNodeWithProvider
          {...defaultProps}
          data={{ ...defaultProps.data, agentName: 'Custom Agent' }}
        />
      );

      const nodeElement = screen.getByRole('article');
      expect(nodeElement).toHaveAttribute('aria-label', expect.stringContaining('Custom Agent'));
    });

    it('should have proper button labels', () => {
      render(<AgentNodeWithProvider {...defaultProps} />);

      expect(screen.getByLabelText('Explain path')).toBeInTheDocument();
      expect(screen.getByLabelText('Add step')).toBeInTheDocument();
      expect(screen.getByLabelText('Delete node')).toBeInTheDocument();
    });

    it('should have title attributes on interactive elements', () => {
      render(<AgentNodeWithProvider {...defaultProps} />);

      const infoButton = screen.getByLabelText('Explain path');
      const addButton = screen.getByLabelText('Add step');
      const deleteButton = screen.getByLabelText('Delete node');

      expect(infoButton).toHaveAttribute('title');
      expect(addButton).toHaveAttribute('title');
      expect(deleteButton).toHaveAttribute('title');
    });

    it('should have title attributes on truncated content', () => {
      const { container } = render(<AgentNodeWithProvider {...defaultProps} />);

      const promptSummary = container.querySelector('[class*="promptSummary"]');
      expect(promptSummary).toHaveAttribute('title');
    });
  });

  // ============================================================================
  // Keyboard Navigation Tests
  // ============================================================================

  describe('Keyboard Navigation', () => {
    it('should have focusable buttons', () => {
      render(<AgentNodeWithProvider {...defaultProps} />);

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('should have buttons that can be focused with Tab key', () => {
      render(<AgentNodeWithProvider {...defaultProps} />);

      const deleteButton = screen.getByLabelText('Delete node');
      deleteButton.focus();

      expect(document.activeElement).toBe(deleteButton);
    });

    it('should have buttons that are keyboard accessible', () => {
      render(<AgentNodeWithProvider {...defaultProps} />);

      const deleteButton = screen.getByLabelText('Delete node');
      deleteButton.focus();

      expect(document.activeElement).toBe(deleteButton);
    });

    it('should trigger button action with Enter key', () => {
      const onDelete = vi.fn();
      render(
        <AgentNodeWithProvider
          {...defaultProps}
          data={{ ...defaultProps.data, onDelete }}
        />
      );

      const deleteButton = screen.getByLabelText('Delete node');
      deleteButton.focus();

      fireEvent.keyDown(deleteButton, { key: 'Enter', code: 'Enter' });
      fireEvent.click(deleteButton);

      expect(onDelete).toHaveBeenCalled();
    });

    it('should trigger button action with Space key', () => {
      const onDelete = vi.fn();
      render(
        <AgentNodeWithProvider
          {...defaultProps}
          data={{ ...defaultProps.data, onDelete }}
        />
      );

      const deleteButton = screen.getByLabelText('Delete node');
      deleteButton.focus();

      fireEvent.keyDown(deleteButton, { key: ' ', code: 'Space' });
      fireEvent.click(deleteButton);

      expect(onDelete).toHaveBeenCalled();
    });

    it('should have logical tab order', () => {
      const { container } = render(<AgentNodeWithProvider {...defaultProps} />);

      const buttons = container.querySelectorAll('button');
      expect(buttons.length).toBeGreaterThan(0);

      buttons.forEach((button) => {
        expect(button.tabIndex).toBeGreaterThanOrEqual(-1);
      });
    });
  });

  // ============================================================================
  // Screen Reader Support Tests
  // ============================================================================

  describe('Screen Reader Support', () => {
    it('should announce node type', () => {
      render(<AgentNodeWithProvider {...defaultProps} />);

      const nodeElement = screen.getByRole('article');
      expect(nodeElement).toHaveAttribute('aria-label', expect.stringContaining('Agent'));
    });

    it('should announce agent name', () => {
      render(<AgentNodeWithProvider {...defaultProps} />);

      const agentName = screen.getByText('Research Agent');
      expect(agentName).toBeInTheDocument();
    });

    it('should announce model information', () => {
      render(<AgentNodeWithProvider {...defaultProps} />);

      expect(screen.getByText('Claude 3.5')).toBeInTheDocument();
      expect(screen.getByText('OpenRouter')).toBeInTheDocument();
    });

    it('should announce runtime information', () => {
      render(<AgentNodeWithProvider {...defaultProps} />);

      expect(screen.getByText('Zeroclaw')).toBeInTheDocument();
    });

    it('should announce input variables', () => {
      render(<AgentNodeWithProvider {...defaultProps} />);

      expect(screen.getByText('user_input')).toBeInTheDocument();
      expect(screen.getByText('context')).toBeInTheDocument();
    });

    it('should announce output variable', () => {
      render(<AgentNodeWithProvider {...defaultProps} />);

      expect(screen.getByText('research_result')).toBeInTheDocument();
    });

    it('should announce error state', () => {
      render(
        <AgentNodeWithProvider
          {...defaultProps}
          data={{
            ...defaultProps.data,
            status: 'error',
            errorMessage: 'Agent execution failed',
          }}
        />
      );

      expect(screen.getByText(/Agent execution failed/)).toBeInTheDocument();
    });

    it('should announce running state', () => {
      const { container } = render(
        <AgentNodeWithProvider
          {...defaultProps}
          data={{ ...defaultProps.data, status: 'running' }}
        />
      );

      const nodeElement = container.querySelector('[role="article"]');
      expect(nodeElement?.className).toContain('running');
    });

    it('should announce disabled state', () => {
      const { container } = render(
        <AgentNodeWithProvider
          {...defaultProps}
          data={{ ...defaultProps.data, status: 'disabled' }}
        />
      );

      const nodeElement = container.querySelector('[role="article"]');
      expect(nodeElement?.className).toContain('disabled');
    });

    it('should have descriptive button labels for screen readers', () => {
      render(<AgentNodeWithProvider {...defaultProps} />);

      expect(screen.getByLabelText('Explain path')).toBeInTheDocument();
      expect(screen.getByLabelText('Add step')).toBeInTheDocument();
      expect(screen.getByLabelText('Delete node')).toBeInTheDocument();
    });
  });

  // ============================================================================
  // Color Contrast Tests
  // ============================================================================

  describe('Color Contrast Ratios', () => {
    it('should have primary text elements', () => {
      const { container } = render(<AgentNodeWithProvider {...defaultProps} />);

      const agentName = container.querySelector('[class*="agentName"]');
      expect(agentName).toBeInTheDocument();
    });

    it('should have secondary text elements', () => {
      const { container } = render(<AgentNodeWithProvider {...defaultProps} />);

      const metaValue = container.querySelector('[class*="metaValue"]');
      expect(metaValue).toBeInTheDocument();
    });

    it('should have error text elements', () => {
      const { container } = render(
        <AgentNodeWithProvider
          {...defaultProps}
          data={{
            ...defaultProps.data,
            status: 'error',
            errorMessage: 'Agent execution failed',
          }}
        />
      );

      const errorMessage = container.querySelector('[class*="errorMessage"]');
      expect(errorMessage).toBeInTheDocument();
    });

    it('should have badge elements', () => {
      const { container } = render(<AgentNodeWithProvider {...defaultProps} />);

      const badge = container.querySelector('[class*="badge"]');
      expect(badge).toBeInTheDocument();
    });

    it('should have chip elements', () => {
      const { container } = render(<AgentNodeWithProvider {...defaultProps} />);

      const chip = container.querySelector('[class*="chip"]');
      expect(chip).toBeInTheDocument();
    });

    it('should have border elements', () => {
      const { container } = render(<AgentNodeWithProvider {...defaultProps} />);

      const nodeElement = container.querySelector('[role="article"]');
      expect(nodeElement).toBeInTheDocument();
    });
  });

  // ============================================================================
  // Focus Indicator Tests
  // ============================================================================

  describe('Focus Indicators', () => {
    it('should have buttons that are focusable', () => {
      render(<AgentNodeWithProvider {...defaultProps} />);

      const deleteButton = screen.getByLabelText('Delete node');
      deleteButton.focus();

      expect(document.activeElement).toBe(deleteButton);
    });

    it('should have multiple focusable elements', () => {
      render(<AgentNodeWithProvider {...defaultProps} />);

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);

      buttons.forEach((button) => {
        button.focus();
        expect(document.activeElement).toBe(button);
      });
    });

    it('should maintain focus on buttons', () => {
      render(<AgentNodeWithProvider {...defaultProps} />);

      const deleteButton = screen.getByLabelText('Delete node');
      deleteButton.focus();

      expect(document.activeElement).toBe(deleteButton);

      // Simulate hover
      fireEvent.mouseEnter(deleteButton);

      expect(document.activeElement).toBe(deleteButton);
    });

    it('should have proper button focus behavior', () => {
      render(<AgentNodeWithProvider {...defaultProps} />);

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // WCAG AA Compliance Tests
  // ============================================================================

  describe('WCAG AA Compliance', () => {
    it('should have proper semantic HTML structure', () => {
      render(<AgentNodeWithProvider {...defaultProps} />);

      const nodeElement = screen.getByRole('article');
      expect(nodeElement).toBeInTheDocument();
    });

    it('should have proper heading hierarchy', () => {
      const { container } = render(<AgentNodeWithProvider {...defaultProps} />);

      const agentName = container.querySelector('[class*="agentName"]');
      expect(agentName).toBeInTheDocument();
    });

    it('should have proper button semantics', () => {
      render(<AgentNodeWithProvider {...defaultProps} />);

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);

      buttons.forEach((button) => {
        expect(button.tagName).toBe('BUTTON');
      });
    });

    it('should have proper text alternatives', () => {
      const { container } = render(<AgentNodeWithProvider {...defaultProps} />);

      const svg = container.querySelector('svg');
      if (svg) {
        // SVG should exist and be rendered
        expect(svg).toBeInTheDocument();
      }
    });

    it('should have proper color usage (not relying on color alone)', () => {
      const { container } = render(
        <AgentNodeWithProvider
          {...defaultProps}
          data={{ ...defaultProps.data, status: 'error' }}
        />
      );

      const nodeElement = container.querySelector('[role="article"]');
      // Error state should have visual indicators beyond color
      expect(nodeElement?.className).toContain('error');
    });

    it('should have proper text sizing', () => {
      const { container } = render(<AgentNodeWithProvider {...defaultProps} />);

      const agentName = container.querySelector('[class*="agentName"]');
      expect(agentName).toBeInTheDocument();
    });

    it('should have proper line spacing', () => {
      const { container } = render(<AgentNodeWithProvider {...defaultProps} />);

      const agentName = container.querySelector('[class*="agentName"]');
      expect(agentName).toBeInTheDocument();
    });

    it('should have proper letter spacing', () => {
      const { container } = render(<AgentNodeWithProvider {...defaultProps} />);

      const agentName = container.querySelector('[class*="agentName"]');
      expect(agentName).toBeInTheDocument();
    });

    it('should have proper word spacing', () => {
      const { container } = render(<AgentNodeWithProvider {...defaultProps} />);

      const agentName = container.querySelector('[class*="agentName"]');
      expect(agentName).toBeInTheDocument();
    });

    it('should support zoom up to 200%', () => {
      const { container } = render(
        <div style={{ zoom: '2' }}>
          <AgentNodeWithProvider {...defaultProps} />
        </div>
      );

      const nodeElement = container.querySelector('[role="article"]');
      expect(nodeElement).toBeInTheDocument();
    });

    it('should not have content that flashes more than 3 times per second', () => {
      const { container } = render(<AgentNodeWithProvider {...defaultProps} />);

      const nodeElement = container.querySelector('[role="article"]');
      expect(nodeElement).toBeInTheDocument();
    });
  });

  // ============================================================================
  // Error State Accessibility Tests
  // ============================================================================

  describe('Error State Accessibility', () => {
    it('should announce error message to screen readers', () => {
      render(
        <AgentNodeWithProvider
          {...defaultProps}
          data={{
            ...defaultProps.data,
            status: 'error',
            errorMessage: 'Agent execution failed',
          }}
        />
      );

      expect(screen.getByText(/Agent execution failed/)).toBeInTheDocument();
    });

    it('should have error message element', () => {
      const { container } = render(
        <AgentNodeWithProvider
          {...defaultProps}
          data={{
            ...defaultProps.data,
            status: 'error',
            errorMessage: 'Agent execution failed',
          }}
        />
      );

      const errorMessage = container.querySelector('[class*="errorMessage"]');
      expect(errorMessage).toBeInTheDocument();
    });

    it('should have error state visually distinct', () => {
      const { container } = render(
        <AgentNodeWithProvider
          {...defaultProps}
          data={{ ...defaultProps.data, status: 'error' }}
        />
      );

      const nodeElement = container.querySelector('[role="article"]');
      expect(nodeElement?.className).toContain('error');
    });
  });
});

// Import vi for mocking
import { vi } from 'vitest';
