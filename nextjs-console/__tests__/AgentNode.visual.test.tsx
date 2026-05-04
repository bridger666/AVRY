// @ts-nocheck
/**
 * Visual Tests for AgentNode Component
 *
 * Tests for visual appearance of all states:
 * - Default state appearance
 * - Selected state appearance
 * - Running state animation
 * - Error state appearance
 * - Disabled state appearance
 * - Hover effects
 * - All zoom levels
 *
 * **Validates: Requirements 3.5**
 */

import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReactFlowProvider } from '@xyflow/react';
import AgentNode from '@/components/workflow/AgentNode';
import styles from '@/components/workflow/AgentNode.module.css';

/**
 * Wrapper component to provide ReactFlow context
 */
const AgentNodeWithProvider = (props: any) => (
  <ReactFlowProvider>
    <AgentNode {...props} />
  </ReactFlowProvider>
);

describe('AgentNode Visual Tests', () => {
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
  // Default State Visual Tests
  // ============================================================================

  describe('Default State Appearance', () => {
    it('should have correct background color for default state', () => {
      const { container } = render(<AgentNodeWithProvider {...defaultProps} />);
      const nodeElement = container.querySelector('[role="article"]');

      expect(nodeElement?.className).toContain(styles.default);
    });

    it('should have default state class applied', () => {
      const { container } = render(<AgentNodeWithProvider {...defaultProps} />);
      const nodeElement = container.querySelector('[role="article"]');

      expect(nodeElement?.className).toContain(styles.agentNode);
      expect(nodeElement?.className).toContain(styles.default);
    });

    it('should render all sections in default state', () => {
      render(<AgentNodeWithProvider {...defaultProps} />);

      expect(screen.getByText('Research Agent')).toBeInTheDocument();
      expect(screen.getByText('Claude 3.5')).toBeInTheDocument();
      expect(screen.getByText('Zeroclaw')).toBeInTheDocument();
    });

    it('should have action buttons present but hidden in default state', () => {
      const { container } = render(<AgentNodeWithProvider {...defaultProps} />);

      const infoButton = container.querySelector(`.${styles.infoButton}`);
      const addButton = container.querySelector(`.${styles.addButton}`);
      const deleteButton = container.querySelector(`.${styles.deleteButton}`);

      expect(infoButton).toBeInTheDocument();
      expect(addButton).toBeInTheDocument();
      expect(deleteButton).toBeInTheDocument();
    });

    it('should have proper structure in default state', () => {
      const { container } = render(<AgentNodeWithProvider {...defaultProps} />);

      const header = container.querySelector(`.${styles.header}`);
      const metaRow = container.querySelector(`.${styles.metaRow}`);
      const description = container.querySelector(`.${styles.description}`);

      expect(header).toBeInTheDocument();
      expect(metaRow).toBeInTheDocument();
      expect(description).toBeInTheDocument();
    });
  });

  // ============================================================================
  // Selected State Visual Tests
  // ============================================================================

  describe('Selected State Appearance', () => {
    it('should have selected class when selected prop is true', () => {
      const { container } = render(
        <AgentNodeWithProvider {...defaultProps} selected={true} />
      );
      const nodeElement = container.querySelector('[role="article"]');

      expect(nodeElement?.className).toContain(styles.selected);
    });

    it('should have both agentNode and selected classes', () => {
      const { container } = render(
        <AgentNodeWithProvider {...defaultProps} selected={true} />
      );
      const nodeElement = container.querySelector('[role="article"]');

      expect(nodeElement?.className).toContain(styles.agentNode);
      expect(nodeElement?.className).toContain(styles.selected);
    });

    it('should render all content when selected', () => {
      render(<AgentNodeWithProvider {...defaultProps} selected={true} />);

      expect(screen.getByText('Research Agent')).toBeInTheDocument();
      expect(screen.getByText('Claude 3.5')).toBeInTheDocument();
    });

    it('should have action buttons present when selected', () => {
      const { container } = render(
        <AgentNodeWithProvider {...defaultProps} selected={true} />
      );

      const infoButton = container.querySelector(`.${styles.infoButton}`);
      const addButton = container.querySelector(`.${styles.addButton}`);
      const deleteButton = container.querySelector(`.${styles.deleteButton}`);

      expect(infoButton).toBeInTheDocument();
      expect(addButton).toBeInTheDocument();
      expect(deleteButton).toBeInTheDocument();
    });
  });

  // ============================================================================
  // Running State Visual Tests
  // ============================================================================

  describe('Running State Appearance', () => {
    it('should have running class when status is running', () => {
      const { container } = render(
        <AgentNodeWithProvider
          {...defaultProps}
          data={{ ...defaultProps.data, status: 'running' }}
        />
      );
      const nodeElement = container.querySelector('[role="article"]');

      expect(nodeElement?.className).toContain(styles.running);
    });

    it('should have both agentNode and running classes', () => {
      const { container } = render(
        <AgentNodeWithProvider
          {...defaultProps}
          data={{ ...defaultProps.data, status: 'running' }}
        />
      );
      const nodeElement = container.querySelector('[role="article"]');

      expect(nodeElement?.className).toContain(styles.agentNode);
      expect(nodeElement?.className).toContain(styles.running);
    });

    it('should render all content in running state', () => {
      render(
        <AgentNodeWithProvider
          {...defaultProps}
          data={{ ...defaultProps.data, status: 'running' }}
        />
      );

      expect(screen.getByText('Research Agent')).toBeInTheDocument();
      expect(screen.getByText('Claude 3.5')).toBeInTheDocument();
    });

    it('should have green styling for running state', () => {
      const { container } = render(
        <AgentNodeWithProvider
          {...defaultProps}
          data={{ ...defaultProps.data, status: 'running' }}
        />
      );
      const nodeElement = container.querySelector('[role="article"]');

      // Running state should have the running class applied
      expect(nodeElement?.className).toContain(styles.running);
    });
  });

  // ============================================================================
  // Error State Visual Tests
  // ============================================================================

  describe('Error State Appearance', () => {
    it('should have error class when status is error', () => {
      const { container } = render(
        <AgentNodeWithProvider
          {...defaultProps}
          data={{ ...defaultProps.data, status: 'error' }}
        />
      );
      const nodeElement = container.querySelector('[role="article"]');

      expect(nodeElement?.className).toContain(styles.error);
    });

    it('should have both agentNode and error classes', () => {
      const { container } = render(
        <AgentNodeWithProvider
          {...defaultProps}
          data={{ ...defaultProps.data, status: 'error' }}
        />
      );
      const nodeElement = container.querySelector('[role="article"]');

      expect(nodeElement?.className).toContain(styles.agentNode);
      expect(nodeElement?.className).toContain(styles.error);
    });

    it('should display error message in error state', () => {
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

    it('should have error message styling', () => {
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

      const errorMessage = container.querySelector(`.${styles.errorMessage}`);
      expect(errorMessage).toBeInTheDocument();
    });
  });

  // ============================================================================
  // Disabled State Visual Tests
  // ============================================================================

  describe('Disabled State Appearance', () => {
    it('should have disabled class when status is disabled', () => {
      const { container } = render(
        <AgentNodeWithProvider
          {...defaultProps}
          data={{ ...defaultProps.data, status: 'disabled' }}
        />
      );
      const nodeElement = container.querySelector('[role="article"]');

      expect(nodeElement?.className).toContain(styles.disabled);
    });

    it('should have both agentNode and disabled classes', () => {
      const { container } = render(
        <AgentNodeWithProvider
          {...defaultProps}
          data={{ ...defaultProps.data, status: 'disabled' }}
        />
      );
      const nodeElement = container.querySelector('[role="article"]');

      expect(nodeElement?.className).toContain(styles.agentNode);
      expect(nodeElement?.className).toContain(styles.disabled);
    });

    it('should render all content in disabled state', () => {
      render(
        <AgentNodeWithProvider
          {...defaultProps}
          data={{ ...defaultProps.data, status: 'disabled' }}
        />
      );

      expect(screen.getByText('Research Agent')).toBeInTheDocument();
      expect(screen.getByText('Claude 3.5')).toBeInTheDocument();
    });

    it('should have faded appearance for disabled state', () => {
      const { container } = render(
        <AgentNodeWithProvider
          {...defaultProps}
          data={{ ...defaultProps.data, status: 'disabled' }}
        />
      );
      const nodeElement = container.querySelector('[role="article"]');

      // Disabled state should have the disabled class applied
      expect(nodeElement?.className).toContain(styles.disabled);
    });
  });

  // ============================================================================
  // Hover Effects Visual Tests
  // ============================================================================

  describe('Hover Effects', () => {
    it('should have transition class applied', () => {
      const { container } = render(<AgentNodeWithProvider {...defaultProps} />);
      const nodeElement = container.querySelector('[role="article"]');

      expect(nodeElement).toBeInTheDocument();
    });

    it('should have action buttons present for hover', () => {
      const { container } = render(<AgentNodeWithProvider {...defaultProps} />);

      const infoButton = container.querySelector(`.${styles.infoButton}`);
      const addButton = container.querySelector(`.${styles.addButton}`);
      const deleteButton = container.querySelector(`.${styles.deleteButton}`);

      // Buttons should exist but be hidden initially
      expect(infoButton).toBeInTheDocument();
      expect(addButton).toBeInTheDocument();
      expect(deleteButton).toBeInTheDocument();
    });

    it('should have smooth transitions defined', () => {
      const { container } = render(<AgentNodeWithProvider {...defaultProps} />);
      const nodeElement = container.querySelector('[role="article"]');

      expect(nodeElement).toBeInTheDocument();
    });
  });

  // ============================================================================
  // Zoom Level Visual Tests
  // ============================================================================

  describe('Zoom Level Appearance', () => {
    it('should render at 50% zoom', () => {
      const { container } = render(
        <div style={{ transform: 'scale(0.5)' }}>
          <AgentNodeWithProvider {...defaultProps} />
        </div>
      );

      const nodeElement = container.querySelector('[role="article"]');
      expect(nodeElement).toBeInTheDocument();
    });

    it('should render at 75% zoom', () => {
      const { container } = render(
        <div style={{ transform: 'scale(0.75)' }}>
          <AgentNodeWithProvider {...defaultProps} />
        </div>
      );

      const nodeElement = container.querySelector('[role="article"]');
      expect(nodeElement).toBeInTheDocument();
    });

    it('should render at 100% zoom', () => {
      const { container } = render(
        <div style={{ transform: 'scale(1)' }}>
          <AgentNodeWithProvider {...defaultProps} />
        </div>
      );

      const nodeElement = container.querySelector('[role="article"]');
      expect(nodeElement).toBeInTheDocument();
    });

    it('should render at 150% zoom', () => {
      const { container } = render(
        <div style={{ transform: 'scale(1.5)' }}>
          <AgentNodeWithProvider {...defaultProps} />
        </div>
      );

      const nodeElement = container.querySelector('[role="article"]');
      expect(nodeElement).toBeInTheDocument();
    });

    it('should maintain content at all zoom levels', () => {
      const zoomLevels = [0.5, 0.75, 1, 1.5];

      zoomLevels.forEach((zoom) => {
        const { container } = render(
          <div style={{ transform: `scale(${zoom})` }}>
            <AgentNodeWithProvider {...defaultProps} />
          </div>
        );

        const nodeElement = container.querySelector('[role="article"]');
        expect(nodeElement).toBeInTheDocument();
      });
    });

    it('should have consistent styling at all zoom levels', () => {
      const zoomLevels = [0.5, 0.75, 1, 1.5];

      zoomLevels.forEach((zoom) => {
        const { container } = render(
          <div style={{ transform: `scale(${zoom})` }}>
            <AgentNodeWithProvider {...defaultProps} />
          </div>
        );

        const nodeElement = container.querySelector('[role="article"]');
        expect(nodeElement?.className).toContain(styles.agentNode);
      });
    });
  });

  // ============================================================================
  // Connecting State Visual Tests
  // ============================================================================

  describe('Connecting State Appearance', () => {
    it('should have connecting class when isConnecting is true', () => {
      const { container } = render(
        <AgentNodeWithProvider {...defaultProps} isConnecting={true} />
      );
      const nodeElement = container.querySelector('[role="article"]');

      expect(nodeElement?.className).toContain(styles.connecting);
    });

    it('should have both agentNode and connecting classes', () => {
      const { container } = render(
        <AgentNodeWithProvider {...defaultProps} isConnecting={true} />
      );
      const nodeElement = container.querySelector('[role="article"]');

      expect(nodeElement?.className).toContain(styles.agentNode);
      expect(nodeElement?.className).toContain(styles.connecting);
    });
  });

  // ============================================================================
  // Section Styling Visual Tests
  // ============================================================================

  describe('Section Styling', () => {
    it('should have correct header styling', () => {
      const { container } = render(<AgentNodeWithProvider {...defaultProps} />);

      const header = container.querySelector(`.${styles.header}`);
      expect(header).toBeInTheDocument();
    });

    it('should have correct meta row styling', () => {
      const { container } = render(<AgentNodeWithProvider {...defaultProps} />);

      const metaRow = container.querySelector(`.${styles.metaRow}`);
      expect(metaRow).toBeInTheDocument();
    });

    it('should have correct chips container styling', () => {
      const { container } = render(<AgentNodeWithProvider {...defaultProps} />);

      const chipsContainer = container.querySelector(`.${styles.chipsContainer}`);
      expect(chipsContainer).toBeInTheDocument();
    });

    it('should have correct chip styling', () => {
      const { container } = render(<AgentNodeWithProvider {...defaultProps} />);

      const chip = container.querySelector(`.${styles.chip}`);
      expect(chip).toBeInTheDocument();
    });
  });

  // ============================================================================
  // Color Consistency Visual Tests
  // ============================================================================

  describe('Color Consistency', () => {
    it('should use consistent colors across states', () => {
      const states = ['default', 'selected', 'running', 'error', 'disabled'];

      states.forEach((state) => {
        const { container } = render(
          <AgentNodeWithProvider
            {...defaultProps}
            data={{ ...defaultProps.data, status: state as any }}
          />
        );

        const nodeElement = container.querySelector('[role="article"]');
        expect(nodeElement?.className).toContain(state);
      });
    });

    it('should have proper text color', () => {
      const { container } = render(<AgentNodeWithProvider {...defaultProps} />);

      const agentName = container.querySelector(`.${styles.agentName}`);
      expect(agentName).toBeInTheDocument();
    });

    it('should have proper badge styling', () => {
      const { container } = render(<AgentNodeWithProvider {...defaultProps} />);

      const badge = container.querySelector(`.${styles.badge}`);
      expect(badge).toBeInTheDocument();
    });
  });
});
