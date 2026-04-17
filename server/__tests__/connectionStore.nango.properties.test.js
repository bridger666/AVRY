const fc = require('fast-check')
const {
  upsertFromNango,
  listConnections,
  findConnectionByNangoId,
  _clearAllConnections,
} = require('../lib/connectionStore')
const { _clearVault, _getVaultSize } = require('../lib/tokenVault')
const { APP_CATALOG } = require('../lib/appCatalog')

// Get all OAuth appIds from the catalog
const oauthAppIds = APP_CATALOG
  .filter(a => a.authType === 'oauth')
  .map(a => a.id)

beforeEach(() => {
  _clearAllConnections()
  _clearVault()
})

describe('Connection Store – property-based tests', () => {
  // P3: Webhook idempotency — processing same upsert twice yields same state
  describe('P3: Webhook idempotency', () => {
    it('upsertFromNango is idempotent — double upsert yields single connection with same state', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...oauthAppIds),
          fc.string({ minLength: 1, maxLength: 20 }).filter(s => !s.includes(':')),
          fc.option(fc.emailAddress(), { nil: null }),
          (appId, tenantId, email) => {
            _clearAllConnections()
            const nangoConnId = `${tenantId}:${appId}`

            const first = upsertFromNango(tenantId, {
              appId,
              nangoConnectionId: nangoConnId,
              nangoProviderConfigKey: `config-${appId}`,
              accountIdentifier: email,
            })

            const second = upsertFromNango(tenantId, {
              appId,
              nangoConnectionId: nangoConnId,
              nangoProviderConfigKey: `config-${appId}`,
              accountIdentifier: email,
            })

            // Same connection ID — updated, not duplicated
            expect(second.id).toBe(first.id)
            expect(listConnections(tenantId)).toHaveLength(1)
            expect(second.status).toBe('connected')
            expect(second.nangoConnectionId).toBe(nangoConnId)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  // P4: No local token storage for OAuth — storageRef is always null after upsertFromNango
  describe('P4: No local token storage for OAuth', () => {
    it('OAuth connections created via upsertFromNango always have null storageRef', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...oauthAppIds),
          fc.string({ minLength: 1, maxLength: 20 }).filter(s => !s.includes(':')),
          (appId, tenantId) => {
            _clearAllConnections()
            _clearVault()

            const conn = upsertFromNango(tenantId, {
              appId,
              nangoConnectionId: `${tenantId}:${appId}`,
              nangoProviderConfigKey: `config-${appId}`,
            })

            expect(conn.storageRef).toBeNull()
            expect(conn.authType).toBe('oauth')
            // Vault should remain empty — no tokens stored locally
            expect(_getVaultSize()).toBe(0)
          }
        ),
        { numRuns: 200 }
      )
    })
  })
})
