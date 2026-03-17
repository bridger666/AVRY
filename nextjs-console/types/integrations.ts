export type AuthType = 'apiKey' | 'basic'
export type ConnectionStatus = 'connected' | 'revoked' | 'needs_reauth'

export interface AivoryApp {
  id: string
  name: string
  description: string
  icon: string          // emoji fallback
  iconPath?: string     // path to SVG in /public/integrations/icons/
  authType: AuthType
  categories: string[]
  defaultAction?: string  // default action name for canvas nodes
  fields: AppField[]
}

export interface AppField {
  key: string
  label: string
  type: 'text' | 'password' | 'url'
  placeholder?: string
  required: boolean
}

/** Safe metadata returned to clients — NO credentials */
export interface AivoryConnection {
  id: string
  tenantId: string
  appId: string
  appName: string
  appIcon: string
  displayName: string
  status: ConnectionStatus
  authType: AuthType
  storageRef: string    // opaque reference to where credentials live in the vault
  createdAt: string
  updatedAt: string
  lastUsedAt: string | null
}

/** What the client sends to create/update a connection */
export interface CreateConnectionPayload {
  appId: string
  displayName: string
  credentials: Record<string, string>
}
