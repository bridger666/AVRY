// @ts-nocheck
import { describe, it, expect } from 'vitest'
import { detectNodeIntent, mapIntentToN8nNode } from '@/lib/workflows/nodeMapper'
import type { MapContext } from '@/lib/workflows/nodeMapper'

describe('detectNodeIntent', () => {
  it('detects email intent', () => {
    expect(detectNodeIntent('Send email notification')).toBe('email')
    expect(detectNodeIntent('Forward to inbox')).toBe('email')
    expect(detectNodeIntent('SMTP relay message')).toBe('email')
  })

  it('detects respond intent', () => {
    expect(detectNodeIntent('Send response to caller')).toBe('respond')
    expect(detectNodeIntent('Return result')).toBe('respond')
    expect(detectNodeIntent('Respond with JSON')).toBe('respond')
    expect(detectNodeIntent('Deliver result to webhook')).toBe('respond')
  })

  it('detects filter intent', () => {
    expect(detectNodeIntent('Check if valid')).toBe('filter')
    expect(detectNodeIntent('Validate input data')).toBe('filter')
    expect(detectNodeIntent('Decision branch')).toBe('filter')
    expect(detectNodeIntent('Filter results')).toBe('filter')
  })

  it('detects http intent', () => {
    expect(detectNodeIntent('Call API endpoint')).toBe('http')
    expect(detectNodeIntent('HTTP POST to service')).toBe('http')
    expect(detectNodeIntent('Fetch data from API')).toBe('http')
  })

  it('detects ai intent', () => {
    expect(detectNodeIntent('Analyze customer data')).toBe('ai')
    expect(detectNodeIntent('Summarize report')).toBe('ai')
    expect(detectNodeIntent('Classify ticket priority')).toBe('ai')
    expect(detectNodeIntent('Process with LLM')).toBe('ai')
  })

  it('detects messaging intent', () => {
    expect(detectNodeIntent('Send Slack message')).toBe('messaging')
    expect(detectNodeIntent('Post to Discord channel')).toBe('messaging')
    expect(detectNodeIntent('Telegram notification')).toBe('messaging')
  })

  it('detects schedule intent', () => {
    expect(detectNodeIntent('Run daily at 9am')).toBe('schedule')
    expect(detectNodeIntent('Schedule cron job')).toBe('schedule')
  })

  it('detects transform intent', () => {
    expect(detectNodeIntent('Transform data format')).toBe('transform')
    expect(detectNodeIntent('Parse JSON response')).toBe('transform')
    expect(detectNodeIntent('Extract fields')).toBe('transform')
  })

  it('defaults to ai for unrecognized actions', () => {
    expect(detectNodeIntent('Do something complex')).toBe('ai')
    expect(detectNodeIntent('Handle the thing')).toBe('ai')
  })

  it('uses tool field for detection', () => {
    expect(detectNodeIntent('Step 1', 'email_sender')).toBe('email')
    expect(detectNodeIntent('Step 2', 'slack_bot')).toBe('messaging')
  })
})

describe('mapIntentToN8nNode', () => {
  const makeStep = (action: string) => ({
    step: 1,
    action,
    tool: '',
    output: '',
  })

  const baseCtx: MapContext = { stepIndex: 0, aiNodeCount: 0, isLast: false }

  it('maps respond intent to respondToWebhook', () => {
    const node = mapIntentToN8nNode('respond', makeStep('Send response'), baseCtx)
    expect(node.type).toBe('n8n-nodes-base.respondToWebhook')
    expect(node.parameters.respondWith).toBe('json')
  })

  it('maps filter intent to IF node', () => {
    const node = mapIntentToN8nNode('filter', makeStep('Check condition'), baseCtx)
    expect(node.type).toBe('n8n-nodes-base.if')
  })

  it('maps email intent to emailSend without credentials (user assigns in n8n)', () => {
    const node = mapIntentToN8nNode('email', makeStep('Send email'), baseCtx)
    expect(node.type).toBe('n8n-nodes-base.emailSend')
    expect(node.typeVersion).toBe(2.1)
    expect(node.credentials).toBeUndefined()
    expect(node.parameters.resource).toBe('email')
    expect(node.parameters.operation).toBe('send')
    expect(node.parameters.fromEmail).toBe('support@example.com')
    expect(node.parameters.toEmail).toContain('$json.to')
    expect(node.parameters.subject).toContain('Aivory notification')
    expect(node.parameters.message).toContain('$json.reply_text')
  })

  it('maps ai intent to httpRequest with Zeroclaw URL', () => {
    const node = mapIntentToN8nNode('ai', makeStep('Analyze data'), baseCtx)
    expect(node.type).toBe('n8n-nodes-base.httpRequest')
    expect(node.parameters.url).toBe('http://43.156.108.96:3003/webhook')
    expect(node.parameters.method).toBe('POST')
  })

  it('first AI node references webhook trigger input', () => {
    const node = mapIntentToN8nNode('ai', makeStep('Analyze'), { ...baseCtx, aiNodeCount: 0 })
    const body = JSON.parse(node.parameters.jsonBody)
    expect(body.message).toContain('$("Webhook Trigger").item.json.body')
  })

  it('subsequent AI nodes reference previous response', () => {
    const node = mapIntentToN8nNode('ai', makeStep('Summarize'), { ...baseCtx, aiNodeCount: 1 })
    const body = JSON.parse(node.parameters.jsonBody)
    expect(body.message).toContain('$json.response')
  })

  it('maps http intent to httpRequest', () => {
    const node = mapIntentToN8nNode('http', makeStep('Call API'), baseCtx)
    expect(node.type).toBe('n8n-nodes-base.httpRequest')
    expect(node.parameters.url).not.toContain('3010/webhook')
  })

  it('maps transform intent to set node', () => {
    const node = mapIntentToN8nNode('transform', makeStep('Transform data'), baseCtx)
    expect(node.type).toBe('n8n-nodes-base.set')
  })

  it('generates correct node name and position', () => {
    const node = mapIntentToN8nNode('ai', makeStep('Analyze customer data'), { ...baseCtx, stepIndex: 2 })
    expect(node.name).toBe('Step 3: Analyze customer data')
    expect(node.position).toEqual([250 + (3 * 220), 300])
  })
})
