/**
 * Session Management Utilities
 * 
 * Provides functions for managing console session IDs in localStorage.
 * Sessions persist across page refreshes and are only cleared on explicit "New chat" action.
 * 
 * Requirements: 8.1, 8.4
 */

const SESSION_STORAGE_KEY = 'console_session_id';

/**
 * Generates a unique session ID using crypto.randomUUID()
 * 
 * @returns A unique session identifier
 */
export function generateSessionId(): string {
  return crypto.randomUUID();
}

/**
 * Retrieves the current session ID from localStorage, or generates a new one if none exists
 * 
 * @returns The current or newly generated session ID
 */
export function getSessionId(): string {
  if (typeof window === 'undefined') {
    // Server-side rendering: generate temporary ID
    return generateSessionId();
  }

  try {
    const existingSessionId = localStorage.getItem(SESSION_STORAGE_KEY);
    
    if (existingSessionId) {
      return existingSessionId;
    }
    
    // No existing session, generate new one
    const newSessionId = generateSessionId();
    saveSession(newSessionId);
    return newSessionId;
  } catch (error) {
    // localStorage might be unavailable (private browsing, etc.)
    console.warn('Failed to access localStorage for session management:', error);
    return generateSessionId();
  }
}

/**
 * Saves a session ID to localStorage
 * 
 * @param sessionId - The session ID to persist
 */
export function saveSession(sessionId: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
  } catch (error) {
    console.warn('Failed to save session to localStorage:', error);
  }
}

/**
 * Clears the current session from localStorage
 * This should be called when the user clicks "New chat"
 */
export function clearSession(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear session from localStorage:', error);
  }
}
