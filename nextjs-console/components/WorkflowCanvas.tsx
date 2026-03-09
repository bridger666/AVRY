'use client'

import { useCallback, useMemo } from 'react'
import {
  ReactFlow,
  Node,
  Edge,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  ConnectionLineType,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { SavedWorkflow } from '@/hooks/useWorkflows'
import { TriggerNode, StepNode } from './WorkflowNodes'

const nodeTypes = {
  triggerNode: TriggerNode,
  stepNode: StepNode,
}

const defaultEdgeOptions = {
  type: 'smoothstep' as const,
  animated: true,
  style: { stroke: '#4ade80', strokeWidth: 1.5 },
}

interface WorkflowCanvasProps {
  workflow: SavedWorkflow
  editTarget: { type: 'trigger' | 'step'; index?: number } | null
  onSelectTrigger: () => void
  onSelectStep: (index: number) => void
}

const NODE_W = 200
const H_GAP = 60  // horizontal gap between nodes

export function WorkflowCanvas({
  workflow,
  editTarget,
  onSelectTrigger,
  onSelectStep,
}: WorkflowCanvasProps) {
  // Horizontal linear layout: trigger → step-0 → step-1 → ...
  const initialNodes = useMemo(() => {
    const nodes: Node[] = []
    let xPos = 0

    nodes.push({
      id: 'trigger',
      data: {
        label: workflow.trigger,
        type: 'trigger',
        isSelected: editTarget?.type === 'trigger',
      },
      position: { x: xPos, y: 0 },
      type: 'triggerNode',
    })

    xPos += NODE_W + H_GAP

    workflow.steps.forEach((step, index) => {
      nodes.push({
        id: `step-${index}`,
        data: {
          label: step.action,
          tool: step.tool,
          type: 'step',
          index,
          isSelected: editTarget?.type === 'step' && editTarget.index === index,
        },
        position: { x: xPos, y: 0 },
        type: 'stepNode',
      })
      xPos += NODE_W + H_GAP
    })

    return nodes
  }, [workflow, editTarget])

  const initialEdges = useMemo(() => {
    const edges: Edge[] = []
    workflow.steps.forEach((_, index) => {
      edges.push({
        id: index === 0 ? 'trigger-step-0' : `step-${index - 1}-step-${index}`,
        source: index === 0 ? 'trigger' : `step-${index - 1}`,
        target: `step-${index}`,
        type: 'smoothstep',
        animated: true,
        style: { stroke: '#4ade80', strokeWidth: 1.5 },
      })
    })
    return edges
  }, [workflow.steps])

  const [nodes, , onNodesChange] = useNodesState(initialNodes)
  const [edges, , onEdgesChange] = useEdgesState(initialEdges)

  const onNodeClick = useCallback(
    (_: any, node: Node<any>) => {
      if (node.data.type === 'trigger') onSelectTrigger()
      else if (node.data.type === 'step') onSelectStep(node.data.index as number)
    },
    [onSelectTrigger, onSelectStep]
  )

  return (
    <div style={{ width: '100%', minHeight: 500, height: 'calc(100vh - 280px)', flex: 1, alignSelf: 'stretch' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        connectionLineType={ConnectionLineType.SmoothStep}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.3}
      >
        <Background color="#2a2a2a" gap={24} />
        <Controls />
        <MiniMap pannable zoomable nodeColor="#334155" />
      </ReactFlow>
    </div>
  )
}
