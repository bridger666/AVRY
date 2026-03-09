'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  Background,
  Controls,
  MiniMap,
  ConnectionLineType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { WorkflowStepNode } from './WorkflowStepNode';
import { StepInspector } from './StepInspector';
import { n8nToReactFlow, reactFlowToN8n } from '@/lib/n8nMapper';
import type { WorkflowNodeData } from '@/types/workflow-node';

type Props = {
  workflowId: string;
  isActive?: boolean;
  n8nWorkflowId?: string;
  fallbackSteps?: Array<{ step: number; action: string; tool: string; output: string; type?: string }>;
};

type SyncState = 'idle' | 'loading' | 'saving' | 'saved' | 'error';

// ── Shared header bar style — matches canvasHeader in workflows.module.css ──
const innerHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  height: 52,
  padding: '0 16px',
  borderBottom: '1px solid rgba(255,255,255,0.06)',
  background: 'rgba(255,255,255,0.025)',
  flexShrink: 0,
  gap: 12,
};

// FIXED: STRICT MODE SAFE — removed duplicate 'border' property that caused object literal error
const pillStyle = (active: boolean): React.CSSProperties => ({
  borderRadius: 6,
  padding: '3px 9px',
  fontSize: 11,
  fontWeight: 500,
  cursor: active ? 'pointer' : 'default',
  background: active ? 'rgba(0,229,158,0.1)' : 'rgba(255,255,255,0.04)',
  color: active ? '#00e59e' : '#a8a6a2',
  border: `1px solid ${active ? 'rgba(0,229,158,0.25)' : 'rgba(255,255,255,0.06)'}`,
  transition: 'all 0.15s',
  fontFamily: 'inherit',
  whiteSpace: 'nowrap' as const,
});

const iconBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 28,
  height: 28,
  background: 'transparent',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 7,
  color: '#a8a6a2',
  cursor: 'pointer',
  flexShrink: 0,
  transition: 'all 0.15s',
  fontSize: 12,
};

export function WorkflowCanvas({ workflowId, isActive = false, n8nWorkflowId, fallbackSteps }: Props) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<WorkflowNodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [rawWorkflow, setRawWorkflow] = useState<any>(null);
  const [syncState, setSyncState] = useState<SyncState>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isEmpty, setIsEmpty] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'canvas' | 'executions'>('canvas');
  const [executions, setExecutions] = useState<any[]>([]);
  const [execLoading, setExecLoading] = useState(false);
  const [execError, setExecError] = useState<string | null>(null);
  // Collapse state for the Edit Step inspector panel
  const [inspectorCollapsed, setInspectorCollapsed] = useState(false);

  // ── Fetch workflow ───────────────────────────────────────
  useEffect(() => {
    if (!isActive) {
      const steps = Array.isArray(fallbackSteps) ? fallbackSteps : [];
      if (steps.length > 0) {
        const rfNodes = steps.map((s, i) => {
          const categoryMap: Record<string, WorkflowNodeData['category']> = {
            ingestion: 'action', ai_processing: 'ai', decision: 'condition',
            execution: 'action', notification: 'channel', human_review: 'system',
          };
          const iconMap: Record<string, string> = {
            ingestion: '📥', ai_processing: '🤖', decision: '🔀',
            execution: '⚙️', notification: '📢', human_review: '👤',
          };
          const cat = categoryMap[s.type || ''] ?? 'action';
          const icon = iconMap[s.type || ''] ?? '⚙️';
          return {
            id: `step-${i}`,
            type: 'workflowStep' as const,
            position: { x: i * 260, y: 0 },
            data: {
              title: s.action || `Step ${i + 1}`,
              subtitle: s.tool && s.tool !== 'N/A' ? s.tool : undefined,
              description: s.output || undefined,
              category: cat,
              icon,
            } as WorkflowNodeData,
          };
        });
        const rfEdges = steps.slice(0, -1).map((_, i) => ({
          id: `e-${i}-${i + 1}`,
          source: `step-${i}`,
          target: `step-${i + 1}`,
          animated: true,
          type: 'smoothstep' as const,
        }));
        setNodes(rfNodes);
        setEdges(rfEdges);
        setIsEmpty(false);
      } else {
        setIsEmpty(true);
      }
      setSyncState('idle');
      return;
    }

    const fetchId = n8nWorkflowId || workflowId;
    if (!fetchId) return;
    let cancelled = false;

    const load = async () => {
      setSyncState('loading');
      setErrorMsg(null);
      try {
        const res = await fetch(`/api/n8n/workflow/${fetchId}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const wf = await res.json();
        if (cancelled) return;
        setRawWorkflow(wf);
        if (!wf.nodes || wf.nodes.length === 0) {
          setNodes([]); setEdges([]); setIsEmpty(true); setSyncState('idle'); return;
        }
        const { nodes: rfNodes, edges: rfEdges } = n8nToReactFlow(wf);
        setNodes(rfNodes); setEdges(rfEdges); setIsEmpty(false); setSyncState('idle');
      } catch (err: any) {
        if (!cancelled) { setErrorMsg(err?.message ?? 'Failed to load workflow'); setSyncState('error'); }
      }
    };
    load();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, n8nWorkflowId, workflowId, JSON.stringify(fallbackSteps)]);

  // ── Save to n8n ──────────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (!rawWorkflow || !isActive) return;
    const saveId = n8nWorkflowId || workflowId;
    setSyncState('saving'); setErrorMsg(null);
    try {
      const payload = reactFlowToN8n(nodes, edges, rawWorkflow);
      const res = await fetch(`/api/n8n/workflow/${saveId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message || body?.error || `HTTP ${res.status}`);
      }
      const updated = await res.json();
      setRawWorkflow(updated); setSyncState('saved');
      setTimeout(() => setSyncState('idle'), 1500);
    } catch (err: any) {
      setErrorMsg(err?.message ?? 'Save failed'); setSyncState('error');
    }
  }, [rawWorkflow, nodes, edges, workflowId]);

  const handleInspectorChange = useCallback(
    (updates: Partial<WorkflowNodeData>) => {
      if (!selectedNodeId) return;
      setNodes((nds) => nds.map((n) => n.id === selectedNodeId ? { ...n, data: { ...n.data, ...updates } } : n));
    },
    [selectedNodeId, setNodes]
  );

  const loadExecutions = useCallback(async () => {
    const fetchId = n8nWorkflowId || workflowId;
    setExecLoading(true); setExecError(null);
    try {
      const res = await fetch(`/api/n8n/workflow/${fetchId}/executions?limit=20`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setExecutions(data.data || []);
    } catch (err: any) {
      setExecError(err?.message ?? 'Failed to load executions');
    } finally {
      setExecLoading(false);
    }
  }, [n8nWorkflowId, workflowId]);

  const nodeTypes = useMemo(() => ({ workflowStep: WorkflowStepNode }), []);
  const defaultEdgeOptions = useMemo(() => ({ type: 'smoothstep' as const, animated: true }), []);
  const selectedNodeData = useMemo(() => nodes.find((n) => n.id === selectedNodeId)?.data ?? null, [nodes, selectedNodeId]);

  const syncLabel =
    syncState === 'loading' ? 'Loading…' :
    syncState === 'saving'  ? 'Saving…' :
    syncState === 'saved'   ? 'Saved ✓' :
    syncState === 'error'   ? `Error: ${errorMsg}` : '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
      {/* ── Inner canvas header bar ── */}
      <div style={innerHeaderStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
          {/* Sync status */}
          {syncLabel && (
            <span style={{ fontSize: 11, color: syncState === 'error' ? '#f87171' : syncState === 'saved' ? '#00e59e' : '#5a5a58', whiteSpace: 'nowrap' }}>
              {syncLabel}
            </span>
          )}
          {/* Mode pill — neutral, not high-contrast */}
          {!isActive && (
            <span style={{
              fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 5,
              background: 'rgba(255,255,255,0.04)', color: '#a8a6a2',
              border: '1px solid rgba(255,255,255,0.07)', letterSpacing: '0.2px', whiteSpace: 'nowrap',
            }}>
              Preview
            </span>
          )}
          {/* Tab pills */}
          <div style={{ display: 'flex', gap: 4, marginLeft: 4 }}>
            <button type="button" style={pillStyle(activeTab === 'canvas')} onClick={() => setActiveTab('canvas')}>
              Canvas
            </button>
            <button
              type="button"
              style={{ ...pillStyle(activeTab === 'executions'), opacity: !isActive ? 0.4 : 1, cursor: !isActive ? 'not-allowed' : 'pointer' }}
              onClick={() => { if (!isActive) return; setActiveTab('executions'); if (!executions.length) loadExecutions(); }}
              title={!isActive ? 'Available after activation' : undefined}
            >
              Execution Logs
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {isActive && (
            <button
              type="button"
              onClick={handleSave}
              disabled={syncState === 'saving' || syncState === 'loading'}
              style={{
                borderRadius: 7, background: 'rgba(0,229,158,0.1)', padding: '5px 14px',
                fontSize: 11, fontWeight: 600, color: '#00e59e',
                border: '1px solid rgba(0,229,158,0.3)', cursor: 'pointer', fontFamily: 'inherit',
                opacity: (syncState === 'saving' || syncState === 'loading') ? 0.5 : 1,
                transition: 'all 0.15s',
              }}
            >
              Save changes
            </button>
          )}
          {/* Collapse inspector toggle */}
          {activeTab === 'canvas' && (
            <button
              type="button"
              style={iconBtnStyle}
              onClick={() => setInspectorCollapsed(v => !v)}
              title={inspectorCollapsed ? 'Show Edit Step panel' : 'Hide Edit Step panel'}
              aria-label={inspectorCollapsed ? 'Show Edit Step panel' : 'Hide Edit Step panel'}
            >
              {inspectorCollapsed ? '›' : '‹'}
            </button>
          )}
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
        {/* Canvas */}
        <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
          {activeTab === 'canvas' ? (
            <div style={{ height: '100%', width: '100%' }}>
              {syncState === 'loading' ? (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 13, color: '#a8a6a2' }}>Loading workflow…</span>
                </div>
              ) : syncState === 'error' ? (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: 13, color: '#f87171', marginBottom: 8 }}>
                      {errorMsg?.includes('502') || errorMsg?.includes('404')
                        ? 'Workflow graph not available in preview mode'
                        : errorMsg}
                    </p>
                    {!errorMsg?.includes('502') && !errorMsg?.includes('404') && (
                      <button onClick={() => window.location.reload()} style={{ fontSize: 11, color: '#a8a6a2', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                        Retry
                      </button>
                    )}
                  </div>
                </div>
              ) : isEmpty ? (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: 13, color: '#a8a6a2', marginBottom: 4 }}>This workflow has no steps yet</p>
                    <p style={{ fontSize: 11, color: '#5a5a58' }}>Edit the workflow to add nodes.</p>
                  </div>
                </div>
              ) : (
                <ReactFlow
                  nodeTypes={nodeTypes}
                  defaultEdgeOptions={defaultEdgeOptions}
                  nodes={nodes}
                  edges={edges}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  onNodeClick={(_, node) => {
                    setSelectedNodeId(node.id);
                    setInspectorCollapsed(false);
                  }}
                  onSelectionChange={(p) => setSelectedNodeId(p.nodes?.[0]?.id ?? null)}
                  connectionLineType={ConnectionLineType.SmoothStep}
                  proOptions={{ hideAttribution: true }}
                  fitView
                >
                  <Background color="rgba(255,255,255,0.06)" gap={24} size={1} />
                  <Controls />
                  <MiniMap
                    pannable
                    zoomable
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8 }}
                    maskColor="rgba(0,0,0,0.4)"
                    nodeColor="rgba(255,255,255,0.08)"
                  />
                </ReactFlow>
              )}
            </div>
          ) : (
            <div style={{ height: '100%', overflowY: 'auto', padding: 16 }}>
              {execLoading ? (
                <p style={{ fontSize: 13, color: '#a8a6a2' }}>Loading executions…</p>
              ) : execError ? (
                <p style={{ fontSize: 13, color: '#f87171' }}>{execError}</p>
              ) : executions.length === 0 ? (
                <p style={{ fontSize: 13, color: '#a8a6a2' }}>No executions found.</p>
              ) : (
                <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      {['ID', 'Status', 'Started', 'Stopped'].map(h => (
                        <th key={h} style={{ padding: '6px 12px', textAlign: 'left', color: '#5a5a58', fontWeight: 600, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {executions.map((exec: any) => (
                      <tr key={exec.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '7px 12px', fontFamily: 'monospace', fontSize: 11, color: '#a8a6a2' }}>{exec.id}</td>
                        <td style={{ padding: '7px 12px' }}>
                          <span style={{
                            display: 'inline-block', borderRadius: 5, padding: '2px 8px', fontSize: 10, fontWeight: 600,
                            background: exec.status === 'success' ? 'rgba(0,229,158,0.1)' : exec.status === 'error' ? 'rgba(248,113,113,0.1)' : 'rgba(251,191,36,0.1)',
                            color: exec.status === 'success' ? '#00e59e' : exec.status === 'error' ? '#f87171' : '#fbbf24',
                            border: `1px solid ${exec.status === 'success' ? 'rgba(0,229,158,0.2)' : exec.status === 'error' ? 'rgba(248,113,113,0.2)' : 'rgba(251,191,36,0.2)'}`,
                          }}>
                            {exec.status}
                          </span>
                        </td>
                        <td style={{ padding: '7px 12px', fontSize: 11, color: '#a8a6a2' }}>{new Date(exec.startedAt || exec.startTime).toLocaleString()}</td>
                        <td style={{ padding: '7px 12px', fontSize: 11, color: '#a8a6a2' }}>{exec.stoppedAt || exec.endTime ? new Date(exec.stoppedAt || exec.endTime).toLocaleString() : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>

        {/* ── Edit Step inspector panel ── */}
        {activeTab === 'canvas' && (
          <div style={{
            width: inspectorCollapsed ? 44 : 280,
            minWidth: inspectorCollapsed ? 44 : 280,
            borderLeft: '1px solid rgba(255,255,255,0.06)',
            background: 'rgba(255,255,255,0.015)',
            flexShrink: 0,
            transition: 'width 0.2s ease, min-width 0.2s ease',
            overflow: 'hidden',
          }}>
            {inspectorCollapsed ? (
              // Slim collapsed state — just a re-open button
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 14, gap: 8 }}>
                <button
                  type="button"
                  style={{ ...iconBtnStyle, width: 28, height: 28 }}
                  onClick={() => setInspectorCollapsed(false)}
                  title="Show Edit Step panel"
                  aria-label="Show Edit Step panel"
                >
                  ‹
                </button>
              </div>
            ) : (
              <StepInspector
                selectedNodeId={selectedNodeId}
                nodeData={selectedNodeData}
                onChange={handleInspectorChange}
                collapsed={false}
                onToggleCollapse={() => setInspectorCollapsed(true)}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
