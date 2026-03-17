'use client';

import React, { memo } from 'react';
import { Handle, Position, useReactFlow, useNodeId } from '@xyflow/react';
import { WorkflowNode } from '@/types/workflow';
import styles from './AppNode.module.css';

/**
 * Props for the AppNode component
 */
interface AppNodeProps {
  data: WorkflowNode['data'] & {
    appName?: string;
    appIcon?: string;
    connectionName?: string;
    action?: string;
    onActionChange?: (action: string) => void;
    onConnectionChange?: (connectionId: string) => void;
    onDelete?: () => void;
    onAddStep?: () => void;
    onExplainPath?: () => void;
  };
  selected: boolean;
  isConnecting: boolean;
}

/**
 * AppNode Component
 * Renders an app node on the workflow canvas with handles, action selector, and connection display
 */
const AppNode = memo(
  ({ data, selected, isConnecting }: AppNodeProps) => {
    const {
      appName = 'App',
      appIcon = '',
      connectionName,
      action,
      onActionChange,
      onConnectionChange,
      onDelete,
      onAddStep,
      onExplainPath,
    } = data;

    const { setNodes, setEdges } = useReactFlow();
    const nodeId = useNodeId();

    const handleDelete = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (onDelete) {
        onDelete();
      } else if (nodeId) {
        setNodes((nds) => nds.filter((n) => n.id !== nodeId));
        setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
      }
    };

    return (
      <div
        className={`${styles.appNode} ${selected ? styles.selected : ''} ${
          isConnecting ? styles.connecting : ''
        }`}
      >
        {/* Input Handle — left (target) */}
        <Handle
          type="target"
          position={Position.Left}
          className={styles.handle}
          isConnectable={!isConnecting}
        />

        {/* Node Header */}
        <div className={styles.nodeHeader}>
          <div className={styles.nodeIcon}>
            {appIcon ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={appIcon} alt="" width={16} height={16} style={{ borderRadius: 3, objectFit: 'contain' }} />
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
                <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
              </svg>
            )}
          </div>
          <div className={styles.nodeName}>{appName}</div>
        </div>

        {/* Node Content */}
        <div className={styles.nodeContent}>
          {/* Action Selector */}
          <div className={styles.nodeField}>
            <label className={styles.nodeLabel}>Action</label>
            <select
              className={styles.nodeSelect}
              value={action || ''}
              onChange={(e) => onActionChange?.(e.target.value)}
            >
              <option value="">Select Action</option>
              <option value="send_message">Send Message</option>
              <option value="create_item">Create Item</option>
              <option value="update_item">Update Item</option>
              <option value="delete_item">Delete Item</option>
            </select>
          </div>

          {/* Connection Display - Clickable */}
          <div className={styles.nodeField}>
            <label className={styles.nodeLabel}>Connection</label>
            {connectionName ? (
              <div 
                className={styles.connectionDisplay}
                onClick={() => onConnectionChange?.('')}
                title="Click to change connection"
                style={{ cursor: 'pointer' }}
              >
                {connectionName}
              </div>
            ) : (
              <div 
                className={styles.connectionWarning}
                onClick={() => onConnectionChange?.('')}
                title="Click to select a connection"
                style={{ cursor: 'pointer' }}
              >
                ⚠ No connection
              </div>
            )}
          </div>
        </div>

        {/* Action buttons — visible on hover via CSS */}
        <button
          className={styles.infoButton}
          onClick={onExplainPath}
          title="Explain workflow path to this step"
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </button>
        <button
          className={styles.addButton}
          onClick={onAddStep}
          title="Add follow-up step with AIRA"
        >
          +
        </button>
        <button
          className={styles.deleteButton}
          onClick={handleDelete}
          title="Delete node"
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
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

AppNode.displayName = 'AppNode';

export default AppNode;
