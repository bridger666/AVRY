import { describe, it, expect } from 'vitest'
import { parseLLMResponse, formatLLMResponse, ParsedLLMResponse } from '@/lib/parseLLMResponse'

describe('parseLLMResponse', () => {
  it('parses valid JSON with reply and suggestions', () => {
    const input = JSON.stringify({
      reply: 'Hello, how can I help?',
      suggestions: ['Run Diagnostic', 'Generate Blueprint', 'Design Workflow'],
    })

    const result = parseLLMResponse(input)

    expect(result.reply).toBe('Hello, how can I help?')
    expect(result.suggestions).toEqual(['Run Diagnostic', 'Generate Blueprint', 'Design Workflow'])
    expect(result.isClarification).toBe(false)
  })

  it('parses valid JSON with clarification flag', () => {
    const input = JSON.stringify({
      reply: 'Which workflow do you mean?',
      suggestions: ['Workflow A', 'Workflow B'],
      clarification: true,
    })

    const result = parseLLMResponse(input)

    expect(result.reply).toBe('Which workflow do you mean?')
    expect(result.suggestions).toEqual(['Workflow A', 'Workflow B'])
    expect(result.isClarification).toBe(true)
  })

  it('returns raw text for invalid JSON', () => {
    const input = 'This is just plain text, not JSON'

    const result = parseLLMResponse(input)

    expect(result.reply).toBe(input)
    expect(result.suggestions).toEqual([])
    expect(result.isClarification).toBe(false)
  })

  it('returns raw text when JSON is missing reply key', () => {
    const input = JSON.stringify({ message: 'Hello', suggestions: ['a', 'b'] })

    const result = parseLLMResponse(input)

    expect(result.reply).toBe(input)
    expect(result.suggestions).toEqual([])
    expect(result.isClarification).toBe(false)
  })

  it('filters non-string values from suggestions', () => {
    const input = JSON.stringify({
      reply: 'Hello',
      suggestions: ['valid', 42, null, true, 'also valid', { obj: true }],
    })

    const result = parseLLMResponse(input)

    expect(result.suggestions).toEqual(['valid', 'also valid'])
  })

  it('caps suggestions at 5 items', () => {
    const input = JSON.stringify({
      reply: 'Hello',
      suggestions: ['one', 'two', 'three', 'four', 'five', 'six', 'seven'],
    })

    const result = parseLLMResponse(input)

    expect(result.suggestions).toHaveLength(5)
    expect(result.suggestions).toEqual(['one', 'two', 'three', 'four', 'five'])
  })

  it('handles empty suggestions array', () => {
    const input = JSON.stringify({ reply: 'Hello', suggestions: [] })

    const result = parseLLMResponse(input)

    expect(result.reply).toBe('Hello')
    expect(result.suggestions).toEqual([])
  })

  it('handles missing suggestions key', () => {
    const input = JSON.stringify({ reply: 'Hello' })

    const result = parseLLMResponse(input)

    expect(result.reply).toBe('Hello')
    expect(result.suggestions).toEqual([])
  })

  it('returns raw text for JSON arrays', () => {
    const input = JSON.stringify(['not', 'an', 'object'])

    const result = parseLLMResponse(input)

    expect(result.reply).toBe(input)
    expect(result.suggestions).toEqual([])
  })

  it('returns raw text for JSON primitives', () => {
    const input = JSON.stringify(42)

    const result = parseLLMResponse(input)

    expect(result.reply).toBe(input)
    expect(result.suggestions).toEqual([])
  })
})

describe('formatLLMResponse', () => {
  it('serializes a ParsedLLMResponse to JSON', () => {
    const parsed: ParsedLLMResponse = {
      reply: 'Hello',
      suggestions: ['a', 'b'],
      isClarification: false,
    }

    const result = formatLLMResponse(parsed)
    const reparsed = JSON.parse(result)

    expect(reparsed.reply).toBe('Hello')
    expect(reparsed.suggestions).toEqual(['a', 'b'])
    expect(reparsed.clarification).toBeUndefined()
  })

  it('includes clarification flag when true', () => {
    const parsed: ParsedLLMResponse = {
      reply: 'Which one?',
      suggestions: ['Option A', 'Option B'],
      isClarification: true,
    }

    const result = formatLLMResponse(parsed)
    const reparsed = JSON.parse(result)

    expect(reparsed.clarification).toBe(true)
  })

  it('round-trips correctly', () => {
    const original: ParsedLLMResponse = {
      reply: 'Test reply',
      suggestions: ['s1', 's2', 's3'],
      isClarification: true,
    }

    const serialized = formatLLMResponse(original)
    const reparsed = parseLLMResponse(serialized)

    expect(reparsed.reply).toBe(original.reply)
    expect(reparsed.suggestions).toEqual(original.suggestions)
    expect(reparsed.isClarification).toBe(original.isClarification)
  })
})
