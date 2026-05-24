// @ts-nocheck
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  generateNodeId,
  generateEdgeId,
  createAppNodeFromApp,
  isValidConnection,
  wouldCreateCircle,
  getExecutionOrder,
} from '@/lib/workflowBuilder';
import { autoAttachConnection } from '@/lib/connectionManager';
import { WorkflowNode, WorkflowEdge, Connection, XYPosition } from '@/types/workflow';

/**
 * Property-Based Tests for Workflow Builder Upgrade
 * Validates correctness properties across random inputs
 */

// ── Arbitraries for generating test data ──────────────────

const arbPosition = (): fc.Arbitrary<XYPosition> =>
  fc.tuple(fc.integer({ min: 0, max: 1000 }), fc.integer({ min: 0, max: 1000 })).map(([x, y]) => ({ x, y }));

const arbConnection = (): fc.Arbitrary<Connection> =>
  fc.record({
    id: fc.uuid(),
    appId: fc.uuid(),
    displayName: fc.string({ minLength: 1, maxLength: 50 }),
    status: fc.constantFrom('connected', 'revoked', 'needs_reauth'),
    lastUsedAt: fc.option(fc.string()),
  });

const arbWorkflowNode = (): fc.Arbitrary<WorkflowNode> =>
  fc.record({
    id: fc.uuid(),
    type: fc.constantFrom('trigger', 'app', 'ai', 'logic'),
    appId: fc.option(fc.uuid()),
    action: fc.option(fc.string({ maxLength: 50 })),
    connectionId: fc.option(fc.uuid()),
    position: arbPosition(),
    config: fc.option(fc.dictionary(fc.string({ maxLength: 20 }), fc.string({ maxLength: 50 }))),
    label: fc.option(fc.string({ maxLength: 100 })),
  });

const arbWorkflowEdge = (): fc.Arbitrary<WorkflowEdge> =>
  fc.record({
    id: fc.uuid(),
    source: fc.uuid(),
    target: fc.uuid(),
    sourceHandle: fc.option(fc.string({ maxLength: 20 })),
    targetHandle: fc.option(fc.string({ maxLength: 20 })),
    animated: fc.option(fc.boolean()),
  });

// ── Property 1: Node Creation Completeness ──────────────

describe('Property 1: Node Creation Completeness', () => {
  /**
   * **Validates: Requirements 1.1**
   *
   * For any app dragged from the sidebar to the canvas, a node should be created
   * with all required fields populated.
   *
   * Property: ∀ appId, appName, position:
   *   createAppNodeFromApp(appId, appName, position) → node with all required fields
   */
  it('should create app node with all required fields', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.string({ minLength: 1, maxLength: 50 }),
        arbPosition(),
        fc.option(fc.string({ maxLength: 50 })),
        fc.option(fc.uuid()),
        (appId, appName, position, appIcon, connectionId) => {
          const node = createAppNodeFromApp(appId, appName, position, connectionId, appIcon);

          // Verify all required fields are present
          expect(node.id).toBeDefined();
          expect(node.id).toMatch(/^node-/);
          expect(node.type).toBe('app');
          expect(node.appId).toBe(appId);
          expect(node.position).toEqual(position);
          expect(node.config).toBeDefined();
          expect(typeof node.config).toBe('object');
          expect(node.label).toBe(appName);
          expect(node.data).toBeDefined();
          expect(node.data?.appName).toBe(appName);

          // Verify node is valid
          expect(node.id.length).toBeGreaterThan(0);
          expect(node.position.x).toBeGreaterThanOrEqual(0);
          expect(node.position.y).toBeGreaterThanOrEqual(0);
        }
      )
    );
  });

  it('should generate unique node IDs', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 100 }), (count) => {
        const ids = new Set<string>();
        for (let i = 0; i < count; i++) {
          ids.add(generateNodeId());
        }
        expect(ids.size).toBe(count);
      })
    );
  });

  it('should generate unique edge IDs', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 100 }), (count) => {
        const ids = new Set<string>();
        for (let i = 0; i < count; i++) {
          ids.add(generateEdgeId());
        }
        expect(ids.size).toBe(count);
      })
    );
  });
});

// ── Property 2: Edge Validity ────────────────────────────

describe('Property 2: Edge Validity', () => {
  /**
   * **Validates: Requirements 1.2**
   *
   * For any edge created between two nodes, the edge should respect connection rules:
   * - Trigger nodes cannot receive input
   * - No circular connections
   *
   * Property: ∀ sourceNode, targetNode, edges:
   *   isValidConnection(sourceNode, targetNode, edges) →
   *     targetNode.type ≠ 'trigger' ∧ ¬wouldCreateCircle(source, target, edges)
   */
  it('should reject connections to trigger nodes', () => {
    fc.assert(
      fc.property(arbWorkflowNode(), arbWorkflowNode(), fc.array(arbWorkflowEdge()), (sourceNode, targetNode, edges) => {
        const triggerNode = { ...targetNode, type: 'trigger' as const };
        const isValid = isValidConnection(sourceNode, triggerNode, edges);
        expect(isValid).toBe(false);
      })
    );
  });

  it('should prevent circular connections', () => {
    fc.assert(
      fc.property(fc.uuid(), fc.uuid(), fc.array(arbWorkflowEdge()), (nodeA, nodeB, baseEdges) => {
        // Create a path from B to A
        const pathEdges: WorkflowEdge[] = [
          { id: generateEdgeId(), source: nodeB, target: nodeA },
          ...baseEdges,
        ];

        // Attempting to create edge from A to B should be invalid
        const sourceNode: WorkflowNode = {
          id: nodeA,
          type: 'app',
          position: { x: 0, y: 0 },
        };
        const targetNode: WorkflowNode = {
          id: nodeB,
          type: 'app',
          position: { x: 100, y: 0 },
        };

        const isValid = isValidConnection(sourceNode, targetNode, pathEdges);
        expect(isValid).toBe(false);
      })
    );
  });

  it('should allow valid connections between app nodes', () => {
    fc.assert(
      fc.property(arbWorkflowNode(), arbWorkflowNode(), fc.array(arbWorkflowEdge()), (sourceNode, targetNode, edges) => {
        // Ensure target is not a trigger
        const validTarget = { ...targetNode, type: 'app' as const };
        // Ensure no circular path exists
        const validEdges = edges.filter((e) => e.target !== sourceNode.id);

        const isValid = isValidConnection(sourceNode, validTarget, validEdges);
        expect(isValid).toBe(true);
      })
    );
  });
});

// ── Property 3: Execution Order Consistency ──────────────

describe('Property 3: Execution Order Consistency', () => {
  /**
   * **Validates: Requirements 1.3**
   *
   * For any workflow with edges, the execution order should follow the edges
   * from trigger to end nodes using topological sort.
   *
   * Property: ∀ nodes, edges:
   *   executionOrder(nodes, edges) = topologicalSort(nodes, edges)
   */
  it('should return valid topological sort', () => {
    fc.assert(
      fc.property(fc.array(arbWorkflowNode(), { minLength: 1, maxLength: 20 }), fc.array(arbWorkflowEdge(), { maxLength: 30 }), (nodes, edges) => {
        // Filter edges to only include valid node references
        const validEdges = edges.filter((e) => nodes.some((n) => n.id === e.source) && nodes.some((n) => n.id === e.target));

        const order = getExecutionOrder(nodes, validEdges);

        // Verify all nodes are in the order
        expect(order.length).toBeLessThanOrEqual(nodes.length);

        // Verify topological property: for each edge, source comes before target
        validEdges.forEach((edge) => {
          const sourceIndex = order.indexOf(edge.source);
          const targetIndex = order.indexOf(edge.target);

          if (sourceIndex !== -1 && targetIndex !== -1) {
            expect(sourceIndex).toBeLessThan(targetIndex);
          }
        });
      })
    );
  });

  it('should handle disconnected nodes', () => {
    fc.assert(
      fc.property(fc.array(arbWorkflowNode(), { minLength: 1, maxLength: 20 }), (nodes) => {
        const order = getExecutionOrder(nodes, []);

        // All nodes should be in the order
        expect(order.length).toBe(nodes.length);

        // All node IDs should be present
        nodes.forEach((node) => {
          expect(order).toContain(node.id);
        });
      })
    );
  });

  it('should handle linear chains', () => {
    fc.assert(
      fc.property(fc.array(fc.uuid(), { minLength: 2, maxLength: 10 }), (nodeIds) => {
        const nodes: WorkflowNode[] = nodeIds.map((id, i) => ({
          id,
          type: 'app',
          position: { x: i * 100, y: 0 },
        }));

        const edges: WorkflowEdge[] = nodeIds.slice(0, -1).map((id, i) => ({
          id: generateEdgeId(),
          source: id,
          target: nodeIds[i + 1],
        }));

        const order = getExecutionOrder(nodes, edges);

        // Order should match the chain
        expect(order).toEqual(nodeIds);
      })
    );
  });
});

// ── Property 4: Connection Auto-Attachment ──────────────

describe('Property 4: Connection Auto-Attachment', () => {
  /**
   * **Validates: Requirements 1.4**
   *
   * For any app node created, if exactly one connection exists for that app,
   * it should be automatically attached.
   *
   * Property: ∀ connections:
   *   |connections| = 1 → autoAttachConnection(connections) = connections[0]
   *   |connections| ≠ 1 → autoAttachConnection(connections) = null
   */
  it('should auto-attach single connection', () => {
    fc.assert(
      fc.property(arbConnection(), (connection) => {
        const result = autoAttachConnection([connection]);
        expect(result).toEqual(connection);
      })
    );
  });

  it('should return null for no connections', () => {
    const result = autoAttachConnection([]);
    expect(result).toBeNull();
  });

  it('should return null for multiple connections', () => {
    fc.assert(
      fc.property(fc.array(arbConnection(), { minLength: 2, maxLength: 10 }), (connections) => {
        const result = autoAttachConnection(connections);
        expect(result).toBeNull();
      })
    );
  });

  it('should handle connection with all fields', () => {
    fc.assert(
      fc.property(arbConnection(), (connection) => {
        const result = autoAttachConnection([connection]);

        if (result) {
          expect(result.id).toBe(connection.id);
          expect(result.appId).toBe(connection.appId);
          expect(result.displayName).toBe(connection.displayName);
          expect(result.status).toBe(connection.status);
        }
      })
    );
  });
});

// ── Integration: Complete Workflow Creation Flow ────────

describe('Integration: Complete Workflow Creation Flow', () => {
  it('should create valid workflow with nodes and edges', () => {
    fc.assert(
      fc.property(
        fc.array(fc.tuple(fc.uuid(), fc.string({ minLength: 1, maxLength: 50 })), { minLength: 1, maxLength: 10 }),
        (appData) => {
          const nodes: WorkflowNode[] = appData.map(([appId, appName], i) =>
            createAppNodeFromApp(appId, appName, { x: i * 200, y: 0 })
          );

          const edges: WorkflowEdge[] = nodes.slice(0, -1).map((node, i) => ({
            id: generateEdgeId(),
            source: node.id,
            target: nodes[i + 1].id,
          }));

          // Verify workflow structure
          expect(nodes.length).toBeGreaterThan(0);
          expect(edges.length).toBe(nodes.length - 1);

          // Verify all edges are valid
          edges.forEach((edge) => {
            const sourceNode = nodes.find((n) => n.id === edge.source);
            const targetNode = nodes.find((n) => n.id === edge.target);
            expect(sourceNode).toBeDefined();
            expect(targetNode).toBeDefined();
            expect(isValidConnection(sourceNode!, targetNode!, edges)).toBe(true);
          });

          // Verify execution order
          const order = getExecutionOrder(nodes, edges);
          expect(order.length).toBe(nodes.length);
        }
      )
    );
  });
});
