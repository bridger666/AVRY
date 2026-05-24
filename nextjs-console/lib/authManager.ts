/**
 * AuthManager for Next.js Console
 * Wrapper around the global AuthManager from frontend/auth-manager.js
 */

export interface User {
  user_id: string
  email: string
  account_type: string
  company_name?: string
  tier: string
  is_subscribed: boolean
  has_diagnostic: boolean
  has_snapshot: boolean
  has_blueprint: boolean
  credits: number
  credits_max: number
}

export const AuthManager = {
  // Check if AuthManager is available
  isAvailable: () => {
    if (typeof window === 'undefined') return false
    return typeof (window as any).AuthManager !== 'undefined'
  },

  // Get AuthManager instance
  getInstance: () => {
    if (typeof window === 'undefined') return null
    return (window as any).AuthManager
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    if (!AuthManager.isAvailable()) return false
    return AuthManager.getInstance().isAuthenticated()
  },

  // Get current user
  getUser: (): User | null => {
    if (!AuthManager.isAvailable()) return null
    const user = AuthManager.getInstance().getUser()
    return user || null
  },

  // Get user ID
  getUserId: (): string | null => {
    if (!AuthManager.isAvailable()) return null
    return AuthManager.getInstance().getUserId()
  },

  // Check if user is super admin
  isSuperAdmin: (): boolean => {
    if (!AuthManager.isAvailable()) return false
    return AuthManager.getInstance().isSuperAdmin()
  },

  // Check if user is admin
  isAdmin: (): boolean => {
    if (!AuthManager.isAvailable()) return false
    return AuthManager.getInstance().isAdmin()
  },

  // Get redirect URL
  getRedirectUrl: (): string => {
    if (!AuthManager.isAvailable()) return '/dashboard'
    return AuthManager.getInstance().getRedirectUrl()
  },

  // Register new user
  register: async (email: string, password: string, companyName?: string) => {
    if (!AuthManager.isAvailable()) throw new Error('AuthManager not available')
    return AuthManager.getInstance().register(email, password, companyName)
  },

  // Login user
  login: async (email: string, password: string) => {
    if (!AuthManager.isAvailable()) throw new Error('AuthManager not available')
    return AuthManager.getInstance().login(email, password)
  },

  // Logout user
  logout: async () => {
    if (!AuthManager.isAvailable()) return
    await AuthManager.getInstance().logout()
  },

  // Get current user from server
  getCurrentUser: async (): Promise<User | null> => {
    if (!AuthManager.isAvailable()) return null
    return AuthManager.getInstance().getCurrentUser()
  },

  // Subscribe to auth state changes
  onAuthStateChange: (callback: (user: User | null) => void) => {
    if (!AuthManager.isAvailable()) return
    AuthManager.getInstance().onAuthStateChange(callback)
  },

  // Refresh access token
  refreshAccessToken: async (): Promise<string | null> => {
    if (!AuthManager.isAvailable()) return null
    try {
      return await AuthManager.getInstance().refreshAccessToken()
    } catch {
      return null
    }
  },

  // Make authenticated fetch
  authenticatedFetch: async (url: string, options?: RequestInit) => {
    if (!AuthManager.isAvailable()) throw new Error('AuthManager not available')
    return AuthManager.getInstance().authenticatedFetch(url, options)
  },
}
