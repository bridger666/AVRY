// @ts-nocheck
/**
 * Property-Based Tests for Console Copilot Memory Fix
 *
 * Validates all 7 correctness properties from the design document using fast-check.
 */

import fc from 'fast-check'
import {
  storeWorkflowSpec,
  retrieveWorkflowSpec,
  clearWorkflowSpec,
  convertHandoffToNodes,
} from '@/lib/workflowHandoff'
import type { ConsoleWorkflowStep, HandoffEdge } from '@/lib/workflowHandoff'
import {
  saveSessionMessages,
  loadSessionMessages,
  listSessions,
  deleteSession,
} from '@/lib/chatPersistence'
import type { Message } from '@/lib/chatPersistence'

// ── localStorage mock ─────────────────────────────────────────────────────────

const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} },
    get length() { return Object.keys(store).length },
    key: (i: number) => Object.keys(store)[i] ?? null,
  }
})()
Object.defineProperty(global, 'localStorage', { value: localStorageMock })

beforeEach(() => {
  localStorageMock.clear()
})

// ── Arbitrary Generators ──────────────────────────────────────────────────────

const arbStep = fc.record({
  id: fc.string({ minLength: 1, maxLength: 20 }).map(s => `step_${s.replace(/[^a-zA-Z0-9]/g, 'x')}`),
  type: fc.constantFrom('trigger', 'action', 'ai', 'filter'),
  appId: fc.string({ minLength: 1, maxLength: 20 }),
  actionId: fc.string({ minLength: 1, maxLength: 20 }),
  connectionId: fc.option(fc.string({ minLength: 1, maxLength: 20 }), { nil: undefined }),
  inputs: fc.option(
    fc.dictionary(fc.string({ minLength: 1, maxLength: 10 }), fc.jsonValue()),
    { nil: undefined },
  ),
  position: fc.option(
    fc.record({ x: fc.integer({ min: 0, max: 2000 }), y: fc.integer({ min: 0, max: 5000 }) }),
    { nil: undefined },
  ),
})

const arbSteps = fc.array(arbStep, { minLength: 1, maxLength: 8 }).map(steps =>
  steps.map((s, i) => ({ ...s, id: `step_${i}` })),
)

function arbEdgesForSteps(steps: ConsoleWorkflowStep[]) {
  if (steps.length < 2) return fc.constant([] as HandoffEdge[])
  const ids = steps.map(s => s.id)
  return fc.array(
    fc.record({
      from: fc.constantFrom(...ids),
      to: fc.constantFrom(...ids),
      label: fc.option(fc.string({ minLength: 1, maxLength: 20 }), { nil: undefined }),
    }).filter(e => e.from !== e.to),
    { minLength: 0, maxLength: steps.length },
  )
}

const arbMessage: fc.Arbitrary<Message> = fc.record({
  id: fc.string({ minLength: 1, maxLength: 20 }),
  role: fc.constantFrom('user' as const, 'assistant' as const),
  content: fc.string({ minLength: 0, maxLength: 200 }),
})

const arbSessionId = fc.string({ minLength: 1, maxLength: 30 }).map(
  s => `session_${s.replace(/[^a-zA-Z0-9]/g, 'x')}`,
)

// ── Property 1: Handoff Roundtrip ─────────────────────────────────────────────

/**
 * Validates: Requirements 1.1, 1.2, 1.4
 *
 * For any valid WorkflowSpec with steps and edges, storeWorkflowSpec then
 * retrieveWorkflowSpec preserves all step fields and edges.
 */
describe('Property 1 — Handoff Roundtrip', () => {
  it('should preserve all step fields and edges through store/retrieve', () => {
    fc.assert(
      fc.property(arbSteps, (steps) =>
        fc.assert(
          fc.property(arbEdgesForSteps(steps as ConsoleWorkflowStep[]), (edges) => {
            localStorageMock.clear()

            const spec = {
              name: 'Test Workflow',
              description: 'desc',
              source: 'console',
              intent: 'test',
              steps: steps.map(s => ({
                id: s.id,
                type: s.type as 'trigger' | 'action' | 'ai' | 'filter',
                appId: s.appId,
                actionId: s.actionId,
                connectionId: s.connectionId ?? s.id,
                inputs: s.inputs ?? {},
                position: s.position ?? { x: 0, y: 0 },
              })),
            }

            storeWorkflowSpec(spec, edges)
            const result = retrieveWorkflowSpec()

            expect(result).not.toBeNull()
            expect(result!.spec.steps).toHaveLength(spec.steps.length)

            for (let i = 0; i < spec.steps.length; i++) {
              const orig = spec.steps[i]
              const got = result!.spec.steps[i]
              expect(got.id).toBe(orig.id)
              expect(got.type).toBe(orig.type)
              expect(got.appId).toBe(orig.appId)
              expect(got.actionId).toBe(orig.actionId)
              expect(got.connectionId).toBe(orig.connectionId)
              expect(JSON.stringify(got.inputs)).toBe(JSON.stringify(orig.inputs))
              expect(JSON.stringify(got.position)).toBe(JSON.stringify(orig.position))
            }

            expect(result!.edges).toHaveLength(edges.length)
            for (let i = 0; i < edges.length; i++) {
              expect(result!.edges[i].from).toBe(edges[i].from)
              expect(result!.edges[i].to).toBe(edges[i].to)
            }
          }),
          { numRuns: 5 },
        ),
      ),
      { numRuns: 50 },
    )
  })
})

// ── Property 2: Converter Count Preservation ──────────────────────────────────

/**
 * Validates: Requirements 2.2, 2.5
 *
 * For any steps array and valid edges, convertHandoffToNodes returns
 * nodes.length === steps.length and edges.length === validEdges.length.
 */
describe('Property 2 — Converter Count Preservation', () => {
  it('should produce exactly one node per step and one edge per valid input edge', () => {
    fc.assert(
      fc.property(arbSteps, (steps) =>
        fc.assert(
          fc.property(arbEdgesForSteps(steps as ConsoleWorkflowStep[]), (edges) => {
            const result = convertHandoffToNodes(steps as ConsoleWorkflowStep[], edges)

            expect(result.nodes).toHaveLength(steps.length)

            // Valid edges are those whose from/to both exist in step IDs
            const ids = new Set(steps.map(s => s.id))
            const validEdges = edges.filter(e => ids.has(e.from) && ids.has(e.to))
            expect(result.edges).toHaveLength(validEdges.length)
          }),
          { numRuns: 5 },
        ),
      ),
      { numRuns: 50 },
    )
  })
})

// ── Property 3: Position Assignment ───────────────────────────────────────────

/**
 * Validates: Requirements 2.3, 2.4
 *
 * For any step with position, node uses that position; for any step without
 * position at index i, node has { x: 400, y: 300 + i * 180 }.
 */
describe('Property 3 — Position Assignment', () => {
  it('should use step position when present, default otherwise', () => {
    fc.assert(
      fc.property(arbSteps, (steps) => {
        const result = convertHandoffToNodes(steps as ConsoleWorkflowStep[], [])

        for (let i = 0; i < steps.length; i++) {
          const step = steps[i]
          const node = result.nodes[i]

          if (step.position) {
            expect(node.position).toEqual(step.position)
          } else {
            expect(node.position).toEqual({ x: 400, y: 300 + i * 180 })
          }
        }
      }),
      { numRuns: 50 },
    )
  })
})

// ── Property 4: Edge Referential Integrity ────────────────────────────────────

/**
 * Validates: Requirements 3.1
 *
 * For any output of convertHandoffToNodes, every edge's source and target
 * exist in the output node IDs.
 */
describe('Property 4 — Edge Referential Integrity', () => {
  it('should only produce edges referencing existing node IDs', () => {
    fc.assert(
      fc.property(arbSteps, (steps) =>
        fc.assert(
          fc.property(arbEdgesForSteps(steps as ConsoleWorkflowStep[]), (edges) => {
            const result = convertHandoffToNodes(steps as ConsoleWorkflowStep[], edges)
            const nodeIds = new Set(result.nodes.map(n => n.id))

            for (const edge of result.edges) {
              expect(nodeIds.has(edge.source)).toBe(true)
              expect(nodeIds.has(edge.target)).toBe(true)
            }
          }),
          { numRuns: 5 },
        ),
      ),
      { numRuns: 50 },
    )
  })
})

// ── Property 5: Session Message Persistence Roundtrip ─────────────────────────

/**
 * Validates: Requirements 5.1, 6.3
 *
 * For any session ID and messages array, saveSessionMessages then
 * loadSessionMessages returns identical messages.
 */
describe('Property 5 — Session Message Persistence Roundtrip', () => {
  it('should preserve messages through save/load cycle', () => {
    fc.assert(
      fc.property(
        arbSessionId,
        fc.array(arbMessage, { minLength: 0, maxLength: 10 }),
        (sessionId, messages) => {
          localStorageMock.clear()

          saveSessionMessages(sessionId, messages)
          const loaded = loadSessionMessages(sessionId)

          expect(loaded).toHaveLength(messages.length)
          for (let i = 0; i < messages.length; i++) {
            expect(loaded[i].id).toBe(messages[i].id)
            expect(loaded[i].role).toBe(messages[i].role)
            expect(loaded[i].content).toBe(messages[i].content)
          }
        },
      ),
      { numRuns: 50 },
    )
  })
})

// ── Property 6: Session Metadata Correctness ──────────────────────────────────

/**
 * Validates: Requirements 5.4, 5.5
 *
 * For any saved session, updatedAt is recent and title equals first user
 * message content truncated to 50 chars.
 */
describe('Property 6 — Session Metadata Correctness', () => {
  it('should set updatedAt to recent time and derive title from first user message', () => {
    fc.assert(
      fc.property(
        arbSessionId,
        fc.array(arbMessage, { minLength: 1, maxLength: 10 }),
        (sessionId, messages) => {
          localStorageMock.clear()

          const before = Date.now()
          saveSessionMessages(sessionId, messages)
          const after = Date.now()

          const sessions = listSessions()
          const session = sessions.find(s => s.id === sessionId)
          expect(session).toBeDefined()

          // updatedAt should be between before and after
          expect(session!.updatedAt).toBeGreaterThanOrEqual(before)
          expect(session!.updatedAt).toBeLessThanOrEqual(after)

          // Title should be first user message truncated to 50 chars, or "New chat"
          // The implementation uses `content.slice(0,50) || "New chat"`, so empty
          // content also results in "New chat" (empty string is falsy).
          const firstUserMsg = messages.find(m => m.role === 'user')
          const expectedTitle = firstUserMsg?.content.slice(0, 50) || 'New chat'
          expect(session!.title).toBe(expectedTitle)
        },
      ),
      { numRuns: 50 },
    )
  })
})

// ── Property 7: Session Isolation ─────────────────────────────────────────────

/**
 * Validates: Requirements 8.1, 8.2
 *
 * For any two distinct session IDs, saving to one does not affect the other,
 * and deleting one leaves the other intact.
 */
describe('Property 7 — Session Isolation', () => {
  it('should not affect session B when saving to session A', () => {
    fc.assert(
      fc.property(
        arbSessionId,
        arbSessionId,
        fc.array(arbMessage, { minLength: 1, maxLength: 5 }),
        fc.array(arbMessage, { minLength: 1, maxLength: 5 }),
        (idA, idB, msgsA, msgsB) => {
          // Ensure distinct IDs
          fc.pre(idA !== idB)

          localStorageMock.clear()

          saveSessionMessages(idA, msgsA)
          saveSessionMessages(idB, msgsB)

          // Verify B is intact after saving A again with new data
          const newMsgsA: Message[] = [{ id: 'new', role: 'user', content: 'updated' }]
          saveSessionMessages(idA, newMsgsA)

          const loadedB = loadSessionMessages(idB)
          expect(loadedB).toHaveLength(msgsB.length)
          for (let i = 0; i < msgsB.length; i++) {
            expect(loadedB[i].id).toBe(msgsB[i].id)
            expect(loadedB[i].role).toBe(msgsB[i].role)
            expect(loadedB[i].content).toBe(msgsB[i].content)
          }
        },
      ),
      { numRuns: 50 },
    )
  })

  it('should not affect session B when deleting session A', () => {
    fc.assert(
      fc.property(
        arbSessionId,
        arbSessionId,
        fc.array(arbMessage, { minLength: 1, maxLength: 5 }),
        fc.array(arbMessage, { minLength: 1, maxLength: 5 }),
        (idA, idB, msgsA, msgsB) => {
          fc.pre(idA !== idB)

          localStorageMock.clear()

          saveSessionMessages(idA, msgsA)
          saveSessionMessages(idB, msgsB)

          deleteSession(idA)

          const loadedA = loadSessionMessages(idA)
          expect(loadedA).toHaveLength(0)

          const loadedB = loadSessionMessages(idB)
          expect(loadedB).toHaveLength(msgsB.length)
          for (let i = 0; i < msgsB.length; i++) {
            expect(loadedB[i].id).toBe(msgsB[i].id)
            expect(loadedB[i].content).toBe(msgsB[i].content)
          }
        },
      ),
      { numRuns: 50 },
    )
  })
})
