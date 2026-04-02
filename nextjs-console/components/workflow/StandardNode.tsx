'use client';

import React, { memo } from 'react';
import { Handle, Position, useReactFlow, useNodeId } from '@xyflow/react';
import { WorkflowNode } from '@/types/workflow';
import styles from './AppNode.module.css';

interface StandardNodeProps {
  data: WorkflowNode['data'] & {
    label?: string;
    icon?: string;
    onDelete?: () => void;
    onAddStep?: () => void;
    onExplainPath?: () => void;
  };
  selected: boolean;
  isConnecting: boolean;
}

const StandardNode = memo(
  ({ data, selected, isConnecting }: StandardNodeProps) => {
    const {
      label = 'Step',
      icon = '',
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
        <Handle
          type="target"
          position={Position.Left}
          className={styles.handle}
          isConnectable={!isConnecting}
        />

        <div className={styles.nodeHeader}>
          <div className={styles.nodeIcon}>
            {icon ? (
              <img src={icon} alt="" width={16} height={16} style={{ borderRadius: 3, objectFit: 'contain' }} />
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 16 14"/>
              </svg>
            )}
          </div>
          <div className={styles.nodeName}>{label}</div>
        </div>

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
          title="Add follow-up step with Aivory"
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

StandardNode.displayName = 'StandardNode';

export default StandardNode;
