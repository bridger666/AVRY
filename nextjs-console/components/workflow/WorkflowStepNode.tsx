'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { WorkflowNodeData } from '@/types/workflow-node';

// ── Category config ──────────────────────────────────────
// Zapier-style: all nodes share the same card surface.
// Only the thin left accent border + label color vary by category.
const categoryConfig: Record<string, { label: string; accent: string; labelColor: string; icon: string }> = {
  trigger:   { label: 'Trigger',    accent: '#00e59e', labelColor: '#00e59e', icon: '⚡' },
  action:    { label: 'Action',     accent: 'rgba(255,255,255,0.12)', labelColor: '#a8a6a2', icon: '⚙️' },
  ai:        { label: 'AI',         accent: '#00e59e', labelColor: '#00e59e', icon: '🤖' },
  condition: { label: 'Condition',  accent: 'rgba(251,191,36,0.5)', labelColor: '#fbbf24', icon: '🔀' },
  channel:   { label: 'Channel',    accent: 'rgba(255,255,255,0.12)', labelColor: '#a8a6a2', icon: '📢' },
  system:    { label: 'System',     accent: 'rgba(255,255,255,0.12)', labelColor: '#a8a6a2', icon: '🔧' },
};

const handleStyle: React.CSSProperties = {
  background: '#00e59e',
  width: 8,
  height: 8,
  border: '2px solid #1e1d1a',
};

function WorkflowStepNodeBase({ data, selected }: NodeProps & { data: WorkflowNodeData }) {
  const cat = data.category || 'action';
  const cfg = categoryConfig[cat] ?? categoryConfig.action;
  const hasMultiOut = (data.outputs?.length ?? 0) > 1;
  const icon = data.icon || cfg.icon;

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        width: 220,
        borderRadius: 12,
        // Zapier-style: slightly elevated card surface on dark canvas
        background: 'rgba(255,255,255,0.055)',
        border: `1px solid ${selected ? 'rgba(0,229,158,0.45)' : 'rgba(255,255,255,0.09)'}`,
        borderLeft: `3px solid ${cfg.accent}`,
        boxShadow: selected
          ? '0 0 0 2px rgba(0,229,158,0.15), 0 4px 20px rgba(0,0,0,0.4)'
          : '0 2px 12px rgba(0,0,0,0.35)',
        cursor: 'pointer',
        boxSizing: 'border-box',
        overflow: 'hidden',
        backdropFilter: 'blur(4px)',
        transition: 'border-color 0.15s, box-shadow 0.15s',
      }}
    >
      {/* Input handle */}
      <Handle type="target" position={Position.Top} id="in-main" style={{ ...handleStyle, top: -5 }} />

      {/* Top bar: icon + category label */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 7,
        padding: '10px 12px 8px',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}>
        <span style={{ fontSize: 14, lineHeight: 1 }}>{icon}</span>
        <span style={{
          fontSize: 9,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.07em',
          color: cfg.labelColor,
        }}>
          {cfg.label}
        </span>
      </div>

      {/* Body: title + subtitle */}
      <div style={{ padding: '10px 12px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{
          fontSize: 13,
          fontWeight: 600,
          color: '#e8e6e3',
          lineHeight: 1.4,
          wordBreak: 'break-word',
        }}>
          {data.title}
        </div>
        {data.subtitle && (
          <div style={{
            fontSize: 11,
            color: '#a8a6a2',
            lineHeight: 1.4,
            wordBreak: 'break-word',
          }}>
            {data.subtitle}
          </div>
        )}
      </div>

      {/* Single output */}
      {!hasMultiOut && (
        <Handle type="source" position={Position.Bottom} id="out-main" style={{ ...handleStyle, bottom: -5 }} />
      )}

      {/* Multiple outputs (condition nodes) */}
      {hasMultiOut && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 8,
          padding: '6px 12px 10px',
          borderTop: '1px solid rgba(255,255,255,0.05)',
        }}>
          {data.outputs!.map((out) => (
            <div key={out.id} style={{ position: 'relative', flex: 1, textAlign: 'center' }}>
              <span style={{ fontSize: 10, color: '#a8a6a2' }}>{out.label}</span>
              <Handle
                id={out.id}
                type="source"
                position={Position.Bottom}
                style={{ ...handleStyle, bottom: -9, left: '50%', transform: 'translateX(-50%)' }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export const WorkflowStepNode = memo(WorkflowStepNodeBase);
