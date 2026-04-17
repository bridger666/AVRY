const {
  PROVIDER_MAP,
  getProviderConfigKey,
  getAppIdFromConfigKey,
  buildConnectionId,
  parseConnectionId,
} = require('../lib/nangoProviderMap')

describe('nangoProviderMap', () => {
  describe('PROVIDER_MAP', () => {
    it('contains exactly 21 OAuth providers', () => {
      expect(Object.keys(PROVIDER_MAP)).toHaveLength(21)
    })

    it.each(Object.entries(PROVIDER_MAP))('maps %s → %s', (appId, configKey) => {
      expect(typeof appId).toBe('string')
      expect(typeof configKey).toBe('string')
      expect(appId.length).toBeGreaterThan(0)
      expect(configKey.length).toBeGreaterThan(0)
    })
  })

  describe('getProviderConfigKey', () => {
    it('returns configKey for known appId', () => {
      expect(getProviderConfigKey('gmail')).toBe('google-mail')
      expect(getProviderConfigKey('slack')).toBe('slack')
      expect(getProviderConfigKey('github')).toBe('github')
    })

    it('returns null for unknown appId', () => {
      expect(getProviderConfigKey('unknown')).toBeNull()
      expect(getProviderConfigKey('')).toBeNull()
    })
  })

  describe('getAppIdFromConfigKey', () => {
    it('returns appId for known configKey', () => {
      expect(getAppIdFromConfigKey('google-mail')).toBe('gmail')
      expect(getAppIdFromConfigKey('slack')).toBe('slack')
    })

    it('returns null for unknown configKey', () => {
      expect(getAppIdFromConfigKey('unknown')).toBeNull()
    })
  })

  describe('bijectivity', () => {
    it.each(Object.keys(PROVIDER_MAP))('roundtrip holds for %s', (appId) => {
      const configKey = getProviderConfigKey(appId)
      expect(getAppIdFromConfigKey(configKey)).toBe(appId)
    })
  })

  describe('buildConnectionId', () => {
    it('builds tenantId:appId format', () => {
      expect(buildConnectionId('tenant1', 'gmail')).toBe('tenant1:gmail')
      expect(buildConnectionId('default', 'slack')).toBe('default:slack')
    })
  })

  describe('parseConnectionId', () => {
    it('parses valid connectionId', () => {
      expect(parseConnectionId('tenant1:gmail')).toEqual({ tenantId: 'tenant1', appId: 'gmail' })
    })

    it('returns null for invalid format', () => {
      expect(parseConnectionId('nocolon')).toBeNull()
      expect(parseConnectionId('')).toBeNull()
      expect(parseConnectionId(null)).toBeNull()
      expect(parseConnectionId(undefined)).toBeNull()
    })

    it('returns null when tenantId or appId is empty', () => {
      expect(parseConnectionId(':appId')).toBeNull()
      expect(parseConnectionId('tenantId:')).toBeNull()
    })

    it('roundtrips with buildConnectionId', () => {
      const result = parseConnectionId(buildConnectionId('t1', 'gmail'))
      expect(result).toEqual({ tenantId: 't1', appId: 'gmail' })
    })
  })
})
