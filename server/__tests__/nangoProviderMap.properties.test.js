const fc = require('fast-check')
const {
  PROVIDER_MAP,
  getProviderConfigKey,
  getAppIdFromConfigKey,
  buildConnectionId,
  parseConnectionId,
} = require('../lib/nangoProviderMap')

describe('nangoProviderMap – property-based tests', () => {
  // P1: Mapping bijectivity — for every appId in PROVIDER_MAP,
  // getAppIdFromConfigKey(getProviderConfigKey(appId)) === appId
  describe('P1: Mapping bijectivity', () => {
    const appIds = Object.keys(PROVIDER_MAP)

    it('forward→reverse roundtrip holds for all entries', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...appIds),
          (appId) => {
            const configKey = getProviderConfigKey(appId)
            expect(configKey).not.toBeNull()
            expect(getAppIdFromConfigKey(configKey)).toBe(appId)
          }
        ),
        { numRuns: 200 }
      )
    })

    it('reverse→forward roundtrip holds for all entries', () => {
      const configKeys = Object.values(PROVIDER_MAP)
      fc.assert(
        fc.property(
          fc.constantFrom(...configKeys),
          (configKey) => {
            const appId = getAppIdFromConfigKey(configKey)
            expect(appId).not.toBeNull()
            expect(getProviderConfigKey(appId)).toBe(configKey)
          }
        ),
        { numRuns: 200 }
      )
    })

    it('unknown keys return null', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }).filter(s => !(s in PROVIDER_MAP)),
          (randomKey) => {
            // If randomKey is not in PROVIDER_MAP, getProviderConfigKey should return null
            // (unless it accidentally matches, which the filter prevents)
            expect(getProviderConfigKey(randomKey)).toBeNull()
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  // P2: ConnectionId roundtrip — for any non-empty strings without ':',
  // parseConnectionId(buildConnectionId(tenantId, appId)) === { tenantId, appId }
  describe('P2: ConnectionId roundtrip', () => {
    const nonColonString = fc.string({ minLength: 1 }).filter(s => !s.includes(':'))

    it('buildConnectionId → parseConnectionId roundtrips losslessly', () => {
      fc.assert(
        fc.property(
          nonColonString,
          nonColonString,
          (tenantId, appId) => {
            const connectionId = buildConnectionId(tenantId, appId)
            const parsed = parseConnectionId(connectionId)
            expect(parsed).not.toBeNull()
            expect(parsed.tenantId).toBe(tenantId)
            expect(parsed.appId).toBe(appId)
          }
        ),
        { numRuns: 500 }
      )
    })

    it('connectionId format is always tenantId:appId', () => {
      fc.assert(
        fc.property(
          nonColonString,
          nonColonString,
          (tenantId, appId) => {
            const connectionId = buildConnectionId(tenantId, appId)
            expect(connectionId).toBe(`${tenantId}:${appId}`)
            expect(connectionId).toContain(':')
          }
        ),
        { numRuns: 200 }
      )
    })
  })
})
