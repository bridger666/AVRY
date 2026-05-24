/**
 * Vitest Setup File
 * 
 * Initializes test environment with necessary polyfills and mocks
 */

import { beforeEach, afterEach } from 'vitest'
import '@testing-library/jest-dom'

// Create a mock localStorage implementation
const createLocalStorageMock = () => {
  const store: Record<string, string> = {}

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString()
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      Object.keys(store).forEach((key) => {
        delete store[key]
      })
    },
    key: (index: number) => {
      const keys = Object.keys(store)
      return keys[index] || null
    },
    get length() {
      return Object.keys(store).length
    },
  } as Storage
}

// Replace global localStorage with our mock
Object.defineProperty(global, 'localStorage', {
  value: createLocalStorageMock(),
  writable: true,
})

// Clear localStorage before each test
beforeEach(() => {
  localStorage.clear()
})

// Clean up after each test
afterEach(() => {
  localStorage.clear()
})
