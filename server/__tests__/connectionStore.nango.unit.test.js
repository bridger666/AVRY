const {
  createConnection,
  listConnections,
  upsertFromNango,
  findConnectionByNangoId,
  revokeConnection,
  getConnection,
  _clearAllConnections,
} = require('../lib/connectionStore')
const { _clearVault, _getVaultSize } = require('../lib/tokenVault')

beforeEach(() => {
  _clearAllConnections()
  _clearVault()
})

describe('upsertFromNango', () => {
  it('creates a new connection when none exists', () => {
    const conn = upsertFromNango('t1', {
      appId: 'slack',
      nangoConnectionId: 't1:slack',
      nangoProviderConfigKey: 'slack',
      accountIdentifier: 'user@example.com',
    })

    expect(conn.appId).toBe('slack')
    expect(conn.status).toBe('connected')
    expect(conn.authType).toBe('oauth')
    expect(conn.storageRef).toBeNull()
    expect(conn.nangoConnectionId).toBe('t1:slack')
    expect(conn.nangoProviderConfigKey).toBe('slack')
    expect(conn.accountIdentifier).toBe('user@example.com')
  })

  it('updates existing connection when one exists for same appId', () => {
    const first = upsertFromNango('t1', {
      appId: 'slack',
      nangoConnectionId: 't1:slack',
      nangoProviderConfigKey: 'slack',
      accountIdentifier: 'old@example.com',
    })

    const second = upsertFromNango('t1', {
      appId: 'slack',
      nangoConnectionId: 't1:slack',
      nangoProviderConfigKey: 'slack',
      accountIdentifier: 'new@example.com',
    })

    expect(second.id).toBe(first.id) // same record updated
    expect(second.accountIdentifier).toBe('new@example.com')
    expect(second.status).toBe('connected')
    expect(listConnections('t1')).toHaveLength(1)
  })

  it('throws for unknown appId', () => {
    expect(() => upsertFromNango('t1', {
      appId: 'nonexistent',
      nangoConnectionId: 't1:nonexistent',
    })).toThrow('Unknown app')
  })

  it('OAuth connections have null storageRef — never stores tokens locally', () => {
    const conn = upsertFromNango('t1', {
      appId: 'gmail',
      nangoConnectionId: 't1:gmail',
      nangoProviderConfigKey: 'google-mail',
    })

    expect(conn.storageRef).toBeNull()
    expect(_getVaultSize()).toBe(0) // no credentials stored
  })
})

describe('findConnectionByNangoId', () => {
  it('finds connection by nangoConnectionId', () => {
    upsertFromNango('t1', {
      appId: 'github',
      nangoConnectionId: 't1:github',
      nangoProviderConfigKey: 'github',
    })

    const found = findConnectionByNangoId('t1', 't1:github')
    expect(found).not.toBeNull()
    expect(found.appId).toBe('github')
  })

  it('returns null when not found', () => {
    expect(findConnectionByNangoId('t1', 'nonexistent')).toBeNull()
  })
})

describe('revokeConnection – OAuth vs non-OAuth', () => {
  it('revokes OAuth connection without purging from vault', () => {
    const conn = upsertFromNango('t1', {
      appId: 'slack',
      nangoConnectionId: 't1:slack',
      nangoProviderConfigKey: 'slack',
    })

    const vaultBefore = _getVaultSize()
    revokeConnection('t1', conn.id)
    const vaultAfter = _getVaultSize()

    expect(vaultAfter).toBe(vaultBefore) // nothing purged from vault
    expect(getConnection('t1', conn.id).status).toBe('revoked')
  })

  it('revokes apiKey connection and purges from vault', () => {
    const conn = createConnection('t1', {
      appId: 'openai',
      displayName: 'OpenAI Prod',
      credentials: { apiKey: 'sk-test' },
    })

    expect(_getVaultSize()).toBe(1)
    revokeConnection('t1', conn.id)
    expect(_getVaultSize()).toBe(0) // vault purged
    expect(getConnection('t1', conn.id).status).toBe('revoked')
  })
})
