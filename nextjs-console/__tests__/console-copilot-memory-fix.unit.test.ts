// @ts-nocheck
/**
 * Unit and Edge-Case Tests for Console Copilot Memory Fix
 *
 * Tests TTL expiry, dangling edge filtering, corrupted localStorage,
 * and prompt sync between console_prompt.txt and zeroclawClient.js.
 */

import {
  storeWorkflowSpec,
  retrieveWorkflowSpec,
  clearWorkflowSpec,
  convertHandoffToNodes,
} from '@/lib/workflowHandoff'
import type { ConsoleWorkflowStep } from '@/lib/workflowHandoff'
import {
  saveSessionMessages,
  loadSessionMessages,
  listSessions,
} from '@/lib/chatPersistence'
import type { Message } from '@/lib/chatPersistence'
import * as fs from 'fs'
import * as path from 'path'

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

// ── Test 8.2: TTL Expiry ──────────────────────────────────────────────────────

/**
 * Validates: Requirement 1.3
 */
describe('TTL Expiry', () => {
  it('should return null when spec is older than 5 minutes', () => {
    const spec = {
      name: 'Test',
      description: 'test',
      source: 'console',
      intent: 'test',
      steps: [
        {
          id: 'step_1',
          type: 'trigger' as const,
          appId: 'webhook',
          actionId: 'receive',
          connectionId: 'c1',
          inputs: {},
          position: { x: 400, y: 300 },
        },
      ],
    }
    storeWorkflowSpec(spec)

    // Mock time forward by 6 minutes
    const realDateNow = Date.now
    Date.now = () => realDateNow() + 6 * 60 * 1000

    const result = retrieveWorkflowSpec()
    expect(result).toBeNull()

    Date.now = realDateNow // restore
  })

  it('should return the spec when within the 5-minute TTL', () => {
    const spec = {
      name: 'Test',
      description: 'test',
      source: 'console',
      intent: 'test',
      steps: [
        {
          id: 'step_1',
          type: 'trigger' as const,
          appId: 'webhook',
          actionId: 'receive',
          connectionId: 'c1',
          inputs: {},
          position: { x: 400, y: 300 },
        },
      ],
    }
    storeWorkflowSpec(spec)

    const result = retrieveWorkflowSpec()
    expect(result).not.toBeNull()
    expect(result!.spec.steps).toHaveLength(1)
    expect(result!.spec.steps[0].id).toBe('step_1')
  })
})

// ── Test 8.3: Dangling Edge Filtering ─────────────────────────────────────────

/**
 * Validates: Requirement 3.2
 */
describe('Dangling Edge Filtering', () => {
  it('should omit edges referencing non-existent step IDs', () => {
    const steps: ConsoleWorkflowStep[] = [
      { id: 'step_1', type: 'trigger', appId: 'webhook', actionId: 'receive' },
      { id: 'step_2', type: 'action', appId: 'gmail', actionId: 'send' },
    ]
    const edges = [
      { from: 'step_1', to: 'step_2' },      // valid
      { from: 'step_1', to: 'step_999' },     // dangling target
      { from: 'step_888', to: 'step_2' },     // dangling source
      { from: 'step_777', to: 'step_999' },   // both dangling
    ]

    const result = convertHandoffToNodes(steps, edges)
    expect(result.edges).toHaveLength(1)
    expect(result.edges[0].source).toBe('step_1')
    expect(result.edges[0].target).toBe('step_2')
  })

  it('should return empty edges when all edges are dangling', () => {
    const steps: ConsoleWorkflowStep[] = [
      { id: 'step_1', type: 'trigger', appId: 'webhook', actionId: 'receive' },
    ]
    const edges = [
      { from: 'step_1', to: 'step_999' },
      { from: 'step_888', to: 'step_1' },
    ]

    const result = convertHandoffToNodes(steps, edges)
    // step_1 -> step_999 is dangling (step_999 doesn't exist)
    // step_888 -> step_1 is dangling (step_888 doesn't exist)
    expect(result.edges).toHaveLength(0)
  })

  it('should keep all edges when all are valid', () => {
    const steps: ConsoleWorkflowStep[] = [
      { id: 'step_1', type: 'trigger', appId: 'webhook', actionId: 'receive' },
      { id: 'step_2', type: 'action', appId: 'gmail', actionId: 'send' },
      { id: 'step_3', type: 'action', appId: 'slack', actionId: 'post' },
    ]
    const edges = [
      { from: 'step_1', to: 'step_2' },
      { from: 'step_2', to: 'step_3' },
    ]

    const result = convertHandoffToNodes(steps, edges)
    expect(result.edges).toHaveLength(2)
  })
})

// ── Test 8.4: Corrupted localStorage ──────────────────────────────────────────

/**
 * Validates: Requirement 7.1
 */
describe('Corrupted localStorage', () => {
  it('should return empty array when sessions data is invalid JSON', () => {
    localStorageMock.setItem('aira_chat_sessions', '{invalid json!!!}')
    const result = loadSessionMessages('any-session')
    expect(result).toEqual([])
  })

  it('should return empty sessions list when data is corrupted', () => {
    localStorageMock.setItem('aira_chat_sessions', 'not-json')
    const result = listSessions()
    expect(result).toEqual([])
  })

  it('should allow saving after corrupted data is present', () => {
    localStorageMock.setItem('aira_chat_sessions', '{broken}')
    const messages: Message[] = [
      { id: 'msg1', role: 'user', content: 'Hello' },
    ]
    // Should not throw — loadAllSessions returns [] on parse error,
    // then save creates a fresh sessions array
    expect(() => saveSessionMessages('session-1', messages)).not.toThrow()

    const loaded = loadSessionMessages('session-1')
    expect(loaded).toHaveLength(1)
    expect(loaded[0].content).toBe('Hello')
  })
})

// ── Test 8.5: Prompt Sync ─────────────────────────────────────────────────────

/**
 * Validates: Requirement 4.3
 */
describe('Prompt Sync', () => {
  it('should have identical prompt in console_prompt.txt and zeroclawClient.js', () => {
    const promptPath = path.resolve(__dirname, '../../zeroclaw-routing-patch/console_prompt.txt')
    const clientPath = path.resolve(__dirname, '../../vps-bridge/zeroclawClient.js')

    const promptContent = fs.readFileSync(promptPath, 'utf-8').trim()
    const clientContent = fs.readFileSync(clientPath, 'utf-8')

    // Extract CONSOLE_SYSTEM_PROMPT from zeroclawClient.js
    // The prompt is between backtick template literal after "const CONSOLE_SYSTEM_PROMPT = `" and "`.trim();"
    const match = clientContent.match(/const CONSOLE_SYSTEM_PROMPT = `([\s\S]*?)`\.trim\(\)/)
    expect(match).not.toBeNull()

    // The JS file uses escaped backticks (\`) inside the template literal.
    // When read as raw file content, these appear as \` instead of `.
    // Unescape them to get the runtime-equivalent string.
    const extractedPrompt = match![1].replace(/\\`/g, '`').trim()
    expect(extractedPrompt).toBe(promptContent)
  })
})
