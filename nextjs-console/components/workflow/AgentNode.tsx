'use client';

import React, { memo } from 'react';
import { Handle, Position, useReactFlow, useNodeId } from '@xyflow/react';
import { WorkflowNode } from '@/types/workflow';
import styles from './AgentNode.module.css';

/**
 * Props for the AgentNode component
 * @interface AgentNodeProps
 * @property {Object} data - Node data containing agent metadata
 * @property {string} data.agentName - Name of the agent
 * @property {string} [data.agentIcon] - Optional icon URL for the agent
 * @property {string} data.model - LLM model name (e.g., "Claude 3.5")
 * @property {string} data.provider - LLM provider (e.g., "OpenRouter")
 * @property {string} data.runtime - Runtime environment (e.g., "Zeroclaw")
 * @property {string} data.promptSummary - Truncated prompt summary
 * @property {string[]} data.inputVariables - Array of input variable names
 * @property {string} data.outputVariable - Output variable name
 * @property {'default' | 'running' | 'error' | 'disabled'} [data.status] - Current node status
 * @property {string} [data.errorMessage] - Error message if status is 'error'
 * @property {() => void} [data.onDelete] - Callback when delete button is clicked
 * @property {() => void} [data.onAddStep] - Callback when add button is clicked
 * @property {() => void} [data.onExplainPath] - Callback when info button is clicked
 * @property {boolean} selected - Whether the node is currently selected
 * @property {boolean} isConnecting - Whether a connection is being made
 */
interface AgentNodeProps {
  data: WorkflowNode['data'] & {
    agentName: string;
    agentIcon?: string;
    model: string;
    provider: string;
    runtime: string;
    promptSummary: string;
    inputVariables: string[];
    outputVariable: string;
    status?: 'default' | 'running' | 'error' | 'disabled';
    errorMessage?: string;
    onDelete?: () => void;
    onAddStep?: () => void;
    onExplainPath?: () => void;
  };
  selected: boolean;
  isConnecting: boolean;
}

/**
 * AgentNode Component
 * 
 * Renders an AI agent node on the workflow canvas with metadata display,
 * visual states (default, selected, running, error, disabled), and action buttons.
 * 
 * Features:
 * - Displays agent metadata (model, runtime, prompt, I/O variables)
 * - Supports 5 visual states with smooth transitions
 * - Shows/hides action buttons based on selection/hover
 * - Provides tooltips for truncated content
 * - Handles user interactions (delete, add step, explain path)
 * - Preserves existing handle behavior (left/right connection points)
 * 
 * @component
 * @example
 * ```tsx
 * <AgentNode
 *   data={{
 *     agentName: "Research Agent",
 *     model: "Claude 3.5",
 *     provider: "OpenRouter",
 *     runtime: "Zeroclaw",
 *     promptSummary: "Analyze user input and generate research...",
 *     inputVariables: ["user_input", "context"],
 *     outputVariable: "research_result",
 *     status: "default",
 *     onDelete: () => console.log('delete'),
 *     onAddStep: () => console.log('add'),
 *     onExplainPath: () => console.log('explain'),
 *   }}
 *   selected={false}
 *   isConnecting={false}
 * />
 * ```
 */
const AgentNode = memo(
  ({ data, selected, isConnecting }: AgentNodeProps) => {
    const {
      agentName = 'Agent',
      agentIcon = '',
      model = '',
      provider = '',
      runtime = '',
      promptSummary = '',
      inputVariables = [],
      outputVariable = '',
      status = 'default',
      errorMessage = '',
      onDelete,
      onAddStep,
      onExplainPath,
    } = data;

    const { setNodes, setEdges } = useReactFlow();
    const nodeId = useNodeId();

    /**
     * Handle node deletion
     * Removes the node and all connected edges from the canvas
     */
    const handleDelete = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (onDelete) {
        onDelete();
      } else if (nodeId) {
        setNodes((nds) => nds.filter((n) => n.id !== nodeId));
        setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
      }
    };

    /**
     * Truncate text to specified length with ellipsis
     */
    const truncateText = (text: string, maxLength: number = 80): string => {
      if (text.length <= maxLength) return text;
      return text.substring(0, maxLength) + '...';
    };

    return (
      <div
        className={`${styles.agentNode} ${styles[status]} ${selected ? styles.selected : ''} ${
          isConnecting ? styles.connecting : ''
        }`}
        role="article"
        aria-label={`Agent node: ${agentName}`}
      >
        {/* Input Handle — left (target) */}
        <Handle
          type="target"
          position={Position.Left}
          className={styles.handle}
          isConnectable={!isConnecting}
        />

        {/* Header Section */}
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <div className={styles.iconContainer}>
              {agentIcon ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={agentIcon}
                  alt=""
                  width={32}
                  height={32}
                  className={styles.icon}
                />
              ) : (
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={styles.icon}
                >
                  <circle cx="12" cy="12" r="1" />
                  <path d="M12 1v6m0 6v6" />
                  <path d="M4.22 4.22l4.24 4.24m5.08 5.08l4.24 4.24" />
                  <path d="M1 12h6m6 0h6" />
                  <path d="M4.22 19.78l4.24-4.24m5.08-5.08l4.24-4.24" />
                </svg>
              )}
            </div>
            <div className={styles.headerText}>
              <div className={styles.agentName}>{agentName}</div>
              <div className={styles.badge}>Agent</div>
            </div>
          </div>
        </div>

        {/* Meta Row */}
        <div className={styles.metaRow}>
          <div className={styles.metaLine}>
            <span className={styles.metaLabel}>Model:</span>
            <span className={styles.metaValue}>{model}</span>
            {provider && (
              <>
                <span className={styles.metaSeparator}>via</span>
                <span className={styles.metaValue}>{provider}</span>
              </>
            )}
          </div>
          <div className={styles.metaLine}>
            <span className={styles.metaLabel}>Runtime:</span>
            <span className={styles.metaValue}>{runtime}</span>
          </div>
        </div>

        {/* Description Section */}
        {promptSummary && (
          <div className={styles.description}>
            <div
              className={styles.promptSummary}
              title={promptSummary}
            >
              "{truncateText(promptSummary)}"
            </div>
          </div>
        )}

        {/* Input/Output Chips */}
        <div className={styles.chipsContainer}>
          {inputVariables.length > 0 && (
            <div className={styles.chipsRow}>
              {inputVariables.map((variable: string, idx: number) => (
                <div
                  key={`input-${idx}`}
                  className={styles.chip}
                  title={`Input: ${variable}`}
                >
                  <span className={styles.chipLabel}>Input:</span>
                  <span className={styles.chipValue}>{variable}</span>
                </div>
              ))}
            </div>
          )}
          {outputVariable && (
            <div className={styles.chipsRow}>
              <div
                className={styles.chip}
                title={`Output: ${outputVariable}`}
              >
                <span className={styles.chipLabel}>Output:</span>
                <span className={styles.chipValue}>{outputVariable}</span>
              </div>
            </div>
          )}
        </div>

        {/* Error Message (if error state) */}
        {status === 'error' && errorMessage && (
          <div className={styles.errorMessage} title={errorMessage}>
            {truncateText(errorMessage, 60)}
          </div>
        )}

        {/* Action Buttons — visible on hover/select */}
        <button
          className={styles.infoButton}
          onClick={onExplainPath}
          title="Explain workflow path to this step"
          aria-label="Explain path"
        >
          <svg
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </button>
        <button
          className={styles.addButton}
          onClick={onAddStep}
          title="Add follow-up step with Aivory"
          aria-label="Add step"
        >
          +
        </button>
        <button
          className={styles.deleteButton}
          onClick={handleDelete}
          title="Delete node"
          aria-label="Delete node"
        >
          <svg
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Output Handle — right (source) */}
        <Handle
          type="source"
          position={Position.Right}
          className={styles.handle}
          isConnectable={!isConnecting}
        />
      </div>
    );
  }
);

AgentNode.displayName = 'AgentNode';

export default AgentNode;
