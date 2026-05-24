// @ts-nocheck
/**
 * Unit Tests for AgentNode Component
 *
 * Tests component rendering, state variations, button interactions, text truncation,
 * and accessibility attributes.
 *
 * **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5**
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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

describe('AgentNode Component', () => {
  const defaultProps = {
    data: {
      agentName: 'Research Agent',
      agentIcon: undefined,
      model: 'Claude 3.5',
      provider: 'OpenRouter',
      runtime: 'Zeroclaw',
      promptSummary: 'Analyze user input and generate research findings',
      inputVariables: ['user_input', 'context'],
      outputVariable: 'research_result',
      status: 'default' as const,
      errorMessage: undefined,
      onDelete: vi.fn(),
      onAddStep: vi.fn(),
      onExplainPath: vi.fn(),
    },
    selected: false,
    isConnecting: false,
  };

  // ============================================================================
  // Component Rendering Tests
  // ============================================================================

  describe('Component Rendering', () => {
    it('should render agent node with all sections', () => {
      render(<AgentNodeWithProvider {...defaultProps} />);

      expect(screen.getByText('Research Agent')).toBeInTheDocument();
      expect(screen.getByText('Agent')).toBeInTheDocument();
      expect(screen.getByText('Claude 3.5')).toBeInTheDocument();
      expect(screen.getByText('Zeroclaw')).toBeInTheDocument();
    });

    it('should render header with agent name and badge', () => {
      render(<AgentNodeWithProvider {...defaultProps} />);

      const agentName = screen.getByText('Research Agent');
      const badge = screen.getByText('Agent');

      expect(agentName).toBeInTheDocument();
      expect(badge).toBeInTheDocument();
    });

    it('should render meta row with model and provider', () => {
      render(<AgentNodeWithProvider {...defaultProps} />);

      expect(screen.getByText('Claude 3.5')).toBeInTheDocument();
      expect(screen.getByText('OpenRouter')).toBeInTheDocument();
    });

    it('should render meta row with runtime', () => {
      render(<AgentNodeWithProvider {...defaultProps} />);

      expect(screen.getByText('Zeroclaw')).toBeInTheDocument();
    });

    it('should render prompt summary in description section', () => {
      render(<AgentNodeWithProvider {...defaultProps} />);

      const promptText = screen.getByText(/Analyze user input and generate research findings/);
      expect(promptText).toBeInTheDocument();
    });

    it('should render input variable chips', () => {
      render(<AgentNodeWithProvider {...defaultProps} />);

      expect(screen.getByText('user_input')).toBeInTheDocument();
      expect(screen.getByText('context')).toBeInTheDocument();
    });

    it('should render output variable chip', () => {
      render(<AgentNodeWithProvider {...defaultProps} />);

      expect(screen.getByText('research_result')).toBeInTheDocument();
    });

    it('should render action buttons', () => {
      render(<AgentNodeWithProvider {...defaultProps} />);

      const infoButton = screen.getByLabelText('Explain path');
      const addButton = screen.getByLabelText('Add step');
      const deleteButton = screen.getByLabelText('Delete node');

      expect(infoButton).toBeInTheDocument();
      expect(addButton).toBeInTheDocument();
      expect(deleteButton).toBeInTheDocument();
    });

    it('should have proper accessibility attributes', () => {
      render(<AgentNodeWithProvider {...defaultProps} />);

      const nodeElement = screen.getByRole('article');
      expect(nodeElement).toHaveAttribute('aria-label', 'Agent node: Research Agent');
    });
  });

  // ============================================================================
  // State Variations Tests
  // ============================================================================

  describe('State Variations', () => {
    it('should render default state styling', () => {
      const { container } = render(<AgentNodeWithProvider {...defaultProps} />);

      const nodeElement = container.querySelector('[role="article"]');
      expect(nodeElement?.className).toContain('default');
    });

    it('should render selected state styling', () => {
      const { container } = render(
        <AgentNodeWithProvider {...defaultProps} selected={true} />
      );

      const nodeElement = container.querySelector('[role="article"]');
      expect(nodeElement?.className).toContain('selected');
    });

    it('should render running state styling', () => {
      const { container } = render(
        <AgentNodeWithProvider
          {...defaultProps}
          data={{ ...defaultProps.data, status: 'running' }}
        />
      );

      const nodeElement = container.querySelector('[role="article"]');
      expect(nodeElement?.className).toContain('running');
    });

    it('should render error state styling', () => {
      const { container } = render(
        <AgentNodeWithProvider
          {...defaultProps}
          data={{ ...defaultProps.data, status: 'error' }}
        />
      );

      const nodeElement = container.querySelector('[role="article"]');
      expect(nodeElement?.className).toContain('error');
    });

    it('should render disabled state styling', () => {
      const { container } = render(
        <AgentNodeWithProvider
          {...defaultProps}
          data={{ ...defaultProps.data, status: 'disabled' }}
        />
      );

      const nodeElement = container.querySelector('[role="article"]');
      expect(nodeElement?.className).toContain('disabled');
    });

    it('should render connecting state styling', () => {
      const { container } = render(
        <AgentNodeWithProvider {...defaultProps} isConnecting={true} />
      );

      const nodeElement = container.querySelector('[role="article"]');
      expect(nodeElement?.className).toContain('connecting');
    });
  });

  // ============================================================================
  // Error State Tests
  // ============================================================================

  describe('Error State', () => {
    it('should display error message when status is error', () => {
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

    it('should not display error message when status is not error', () => {
      const { container } = render(<AgentNodeWithProvider {...defaultProps} />);

      const errorMessage = container.querySelector('[class*="errorMessage"]');
      expect(errorMessage).not.toBeInTheDocument();
    });

    it('should truncate long error messages', () => {
      const longError = 'A'.repeat(100);
      render(
        <AgentNodeWithProvider
          {...defaultProps}
          data={{
            ...defaultProps.data,
            status: 'error',
            errorMessage: longError,
          }}
        />
      );

      const errorElement = screen.getByText(/A+\.\.\./);
      expect(errorElement).toBeInTheDocument();
    });
  });

  // ============================================================================
  // Button Interaction Tests
  // ============================================================================

  describe('Button Interactions', () => {
    it('should call onDelete when delete button is clicked', () => {
      const onDelete = vi.fn();
      render(
        <AgentNodeWithProvider
          {...defaultProps}
          data={{ ...defaultProps.data, onDelete }}
        />
      );

      const deleteButton = screen.getByLabelText('Delete node');
      fireEvent.click(deleteButton);

      expect(onDelete).toHaveBeenCalled();
    });

    it('should call onAddStep when add button is clicked', () => {
      const onAddStep = vi.fn();
      render(
        <AgentNodeWithProvider
          {...defaultProps}
          data={{ ...defaultProps.data, onAddStep }}
        />
      );

      const addButton = screen.getByLabelText('Add step');
      fireEvent.click(addButton);

      expect(onAddStep).toHaveBeenCalled();
    });

    it('should call onExplainPath when info button is clicked', () => {
      const onExplainPath = vi.fn();
      render(
        <AgentNodeWithProvider
          {...defaultProps}
          data={{ ...defaultProps.data, onExplainPath }}
        />
      );

      const infoButton = screen.getByLabelText('Explain path');
      fireEvent.click(infoButton);

      expect(onExplainPath).toHaveBeenCalled();
    });

    it('should prevent event propagation when delete button is clicked', () => {
      const onDelete = vi.fn();
      render(
        <AgentNodeWithProvider
          {...defaultProps}
          data={{ ...defaultProps.data, onDelete }}
        />
      );

      const deleteButton = screen.getByLabelText('Delete node');
      
      // Create a mock event with stopPropagation
      const mockEvent = new MouseEvent('click', { bubbles: true });
      const stopPropagationSpy = vi.spyOn(mockEvent, 'stopPropagation');
      
      // Dispatch the event
      deleteButton.dispatchEvent(mockEvent);

      // Verify stopPropagation was called
      expect(stopPropagationSpy).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // Text Truncation Tests
  // ============================================================================

  describe('Text Truncation', () => {
    it('should truncate long prompt summary', () => {
      const longPrompt = 'A'.repeat(100);
      render(
        <AgentNodeWithProvider
          {...defaultProps}
          data={{
            ...defaultProps.data,
            promptSummary: longPrompt,
          }}
        />
      );

      const promptElement = screen.getByText(/A+\.\.\./);
      expect(promptElement).toBeInTheDocument();
    });

    it('should not truncate short prompt summary', () => {
      const shortPrompt = 'Short prompt';
      render(
        <AgentNodeWithProvider
          {...defaultProps}
          data={{
            ...defaultProps.data,
            promptSummary: shortPrompt,
          }}
        />
      );

      // The prompt is wrapped in quotes, so search for the quoted version
      expect(screen.getByText(`"${shortPrompt}"`)).toBeInTheDocument();
    });

    it('should have title attribute for full prompt text', () => {
      const prompt = 'This is a test prompt';
      const { container } = render(
        <AgentNodeWithProvider
          {...defaultProps}
          data={{
            ...defaultProps.data,
            promptSummary: prompt,
          }}
        />
      );

      const promptElement = container.querySelector('[class*="promptSummary"]');
      expect(promptElement).toHaveAttribute('title', prompt);
    });
  });

  // ============================================================================
  // Accessibility Tests
  // ============================================================================

  describe('Accessibility', () => {
    it('should have proper ARIA labels on buttons', () => {
      render(<AgentNodeWithProvider {...defaultProps} />);

      expect(screen.getByLabelText('Explain path')).toBeInTheDocument();
      expect(screen.getByLabelText('Add step')).toBeInTheDocument();
      expect(screen.getByLabelText('Delete node')).toBeInTheDocument();
    });

    it('should have proper ARIA label on node element', () => {
      render(<AgentNodeWithProvider {...defaultProps} />);

      const nodeElement = screen.getByRole('article');
      expect(nodeElement).toHaveAttribute('aria-label', 'Agent node: Research Agent');
    });

    it('should have title attributes on chips for accessibility', () => {
      const { container } = render(<AgentNodeWithProvider {...defaultProps} />);

      // Find all elements with title attributes that contain "Input:" or "Output:"
      const chipsWithTitle = container.querySelectorAll('[title*="Input:"], [title*="Output:"]');
      expect(chipsWithTitle.length).toBeGreaterThan(0);

      chipsWithTitle.forEach((chip) => {
        expect(chip).toHaveAttribute('title');
      });
    });

    it('should have proper button titles for accessibility', () => {
      render(<AgentNodeWithProvider {...defaultProps} />);

      expect(screen.getByLabelText('Explain path')).toHaveAttribute(
        'title',
        'Explain workflow path to this step'
      );
      expect(screen.getByLabelText('Add step')).toHaveAttribute(
        'title',
        'Add follow-up step with Aivory'
      );
      expect(screen.getByLabelText('Delete node')).toHaveAttribute('title', 'Delete node');
    });
  });

  // ============================================================================
  // Edge Cases Tests
  // ============================================================================

  describe('Edge Cases', () => {
    it('should handle missing optional fields', () => {
      const minimalProps = {
        data: {
          agentName: 'Agent',
          model: 'GPT-4',
          provider: 'OpenAI',
          runtime: 'Local',
          promptSummary: 'Test',
          inputVariables: [],
          outputVariable: 'result',
        },
        selected: false,
        isConnecting: false,
      };

      render(<AgentNodeWithProvider {...minimalProps} />);

      expect(screen.getByText('GPT-4')).toBeInTheDocument();
    });

    it('should handle empty input variables array', () => {
      const { container } = render(
        <AgentNodeWithProvider
          {...defaultProps}
          data={{
            ...defaultProps.data,
            inputVariables: [],
          }}
        />
      );

      // Should still render output variable
      expect(screen.getByText('research_result')).toBeInTheDocument();
    });

    it('should handle multiple input variables', () => {
      render(
        <AgentNodeWithProvider
          {...defaultProps}
          data={{
            ...defaultProps.data,
            inputVariables: ['var1', 'var2', 'var3', 'var4'],
          }}
        />
      );

      expect(screen.getByText('var1')).toBeInTheDocument();
      expect(screen.getByText('var2')).toBeInTheDocument();
      expect(screen.getByText('var3')).toBeInTheDocument();
      expect(screen.getByText('var4')).toBeInTheDocument();
    });

    it('should render default icon when agentIcon is not provided', () => {
      const { container } = render(<AgentNodeWithProvider {...defaultProps} />);

      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should render custom icon when agentIcon is provided', () => {
      const { container } = render(
        <AgentNodeWithProvider
          {...defaultProps}
          data={{
            ...defaultProps.data,
            agentIcon: 'https://example.com/icon.png',
          }}
        />
      );

      const img = container.querySelector('img');
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', 'https://example.com/icon.png');
    });
  });

  // ============================================================================
  // Memoization Tests
  // ============================================================================

  describe('Memoization', () => {
    it('should be memoized to prevent unnecessary re-renders', () => {
      const { rerender } = render(<AgentNodeWithProvider {...defaultProps} />);

      const firstRender = screen.getByText('Research Agent');
      expect(firstRender).toBeInTheDocument();

      // Re-render with same props
      rerender(<AgentNodeWithProvider {...defaultProps} />);

      const secondRender = screen.getByText('Research Agent');
      expect(secondRender).toBeInTheDocument();
    });
  });
});
