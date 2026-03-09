/**
 * Console-related TypeScript interfaces for VPS Bridge integration
 * 
 * These types define the structure for console streaming requests,
 * responses, and session management.
 */

/**
 * Represents a single message in the console conversation
 */
export interface ConsoleMessage {
  role: 'user' | 'assistant'
  content: string
}

/**
 * Request payload for console streaming endpoint
 */
export interface ConsoleStreamRequest {
  session_id: string
  organization_id: string
  messages: ConsoleMessage[]
}

/**
 * Represents a chunk of data in the streaming response
 */
export interface StreamChunk {
  type: 'chunk' | 'done' | 'error'
  content?: string
  error?: string
  /** Set on synthetic 'done' events — true if at least one content chunk was received */
  receivedContent?: boolean
}

/**
 * Represents a complete console session with metadata
 */
export interface ConsoleSession {
  session_id: string
  organization_id: string
  messages: ConsoleMessage[]
  created_at: string
  last_activity: string
}
