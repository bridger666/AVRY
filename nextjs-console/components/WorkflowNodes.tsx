'use client'

import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'

// ── Category detection from action text ─────────────────
function guessCategory(action: string): 'trigger' | 'ai' | 'condition' | 'channel' | 'action' {
  const a = action.toLowerCase()
  if (a.includes('ai') || a.includes('analyz') || a.includes('process') || a.includes('classif') || a.includes('generat')) return 'ai'
  if (a.includes('decide') || a.includes('check') || a.includes('evaluat') || a.includes('route') || a.includes('if ')) return 'condition'
  if (a.includes('send') || a.includes('notif') || a.includes('alert') || a.includes('email') || a.includes('sms')) return 'channel'
  return 'action'
}

const categoryLabel: Record<string, string> = {
  trigger:   'When this happens...',
  action:    'Run action',
  ai:        'AI analysis',
  condition: 'Condition',
  channel:   'Channel',
}

const categoryBorderColor: Record<string, string> = {
  trigger:   '#10b981',
  action:    '#4b5563',
  ai:        '#6366f1',
  condition: '#f59e0b',
  channel:   '#14b8a6',
}

const categoryLabelColor: Record<string, string> = {
  trigger:   '#6ee7b7',
  action:    '#9ca3af',
  ai:        '#a5b4fc',
  condition: '#fcd34d',
  channel:   '#5eead4',
}

const handleStyle: React.CSSProperties = {
  background: '#2dd4bf',
  width: 8,
  height: 8,
  border: '2px solid #1e293b',
}

// ── Trigger Node ─────────────────────────────────────────
export const TriggerNode = memo(({ data }: any) => {
  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        width: 200,
        minHeight: 210,
        borderRadius: 14,
        border: '1.5px solid #10b981',
        background: 'rgba(15, 23, 42, 0.92)',
        padding: '12px 14px',
        boxShadow: data.isSelected
          ? '0 0 0 2px #2dd4bf, 0 4px 16px rgba(0,0,0,0.4)'
          : '0 2px 8px rgba(0,0,0,0.35)',
        cursor: 'pointer',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6ee7b7', marginBottom: 6 }}>
        When this happens...
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9', whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.4, flex: 1 }}>
        {data.label}
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ ...handleStyle, bottom: -5 }}
      />
    </div>
  )
})
TriggerNode.displayName = 'TriggerNode'

// ── Step Node ────────────────────────────────────────────
export const StepNode = memo(({ data }: any) => {
  const cat = guessCategory(data.label || '')
  const label = categoryLabel[cat] ?? 'Run action'
  const borderColor = categoryBorderColor[cat] ?? '#4b5563'
  const labelColor = categoryLabelColor[cat] ?? '#9ca3af'

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        width: 200,
        minHeight: 210,
        borderRadius: 14,
        border: `1.5px solid ${borderColor}`,
        background: 'rgba(15, 23, 42, 0.92)',
        padding: '12px 14px',
        boxShadow: data.isSelected
          ? '0 0 0 2px #2dd4bf, 0 4px 16px rgba(0,0,0,0.4)'
          : '0 2px 8px rgba(0,0,0,0.35)',
        cursor: 'pointer',
        boxSizing: 'border-box',
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{ ...handleStyle, top: -5 }}
      />
      <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: labelColor, marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9', whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.4, flex: 1 }}>
        {data.label}
      </div>
      {data.tool && (
        <div style={{ marginTop: 6, fontSize: 11, color: '#94a3b8', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {data.tool}
        </div>
      )}
      <div style={{ marginTop: 'auto', paddingTop: 8, textAlign: 'right' }}>
        <span style={{ fontSize: 10, color: '#475569', fontFamily: 'monospace' }}>{data.index + 1}</span>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ ...handleStyle, bottom: -5 }}
      />
    </div>
  )
})
StepNode.displayName = 'StepNode'
