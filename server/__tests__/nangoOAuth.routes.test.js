const request = require('supertest')
const express = require('express')

// Mock nangoClient before requiring routes
jest.mock('../lib/nangoClient', () => ({
  initiateAuth: jest.fn(),
  getToken: jest.fn(),
  getConnection: jest.fn(),
  deleteConnection: jest.fn(),
}))

const nangoClient = require('../lib/nangoClient')
const nangoOAuthRoutes = require('../routes/nangoOAuth')
const { _clearAllConnections, upsertFromNango, listConnections } = require('../lib/connectionStore')

function createApp() {
  const app = express()
  app.use(express.json())
  // Inject tenantId middleware
  app.use((req, res, next) => {
    req.tenantId = req.headers['x-tenant-id'] || 'default'
    next()
  })
  app.use('/auth', nangoOAuthRoutes)
  return app
}

beforeEach(() => {
  _clearAllConnections()
  jest.clearAllMocks()
})

describe('GET /auth/status', () => {
  it('returns empty array when no connections', async () => {
    const app = createApp()
    const res = await request(app).get('/auth/status')
    expect(res.status).toBe(200)
    expect(res.body).toEqual([])
  })

  it('returns connections with correct shape', async () => {
    upsertFromNango('default', {
      appId: 'slack',
      nangoConnectionId: 'default:slack',
      nangoProviderConfigKey: 'slack',
      accountIdentifier: 'user@slack.com',
    })

    const app = createApp()
    const res = await request(app).get('/auth/status')

    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
    const conn = res.body[0]
    expect(conn).toHaveProperty('id')
    expect(conn).toHaveProperty('appId', 'slack')
    expect(conn).toHaveProperty('appName', 'Slack')
    expect(conn).toHaveProperty('status', 'connected')
    expect(conn).toHaveProperty('displayName')
    expect(conn).toHaveProperty('authType', 'oauth')
    expect(conn).toHaveProperty('accountIdentifier', 'user@slack.com')
    expect(conn).toHaveProperty('createdAt')
    expect(conn).toHaveProperty('updatedAt')
    expect(conn).toHaveProperty('lastUsedAt')
    // Should NOT expose internal fields
    expect(conn).not.toHaveProperty('storageRef')
    expect(conn).not.toHaveProperty('nangoConnectionId')
  })
})

describe('GET /auth/:provider', () => {
  it('returns authUrl from Nango', async () => {
    nangoClient.initiateAuth.mockResolvedValue({ url: 'https://accounts.google.com/oauth?...' })

    const app = createApp()
    const res = await request(app).get('/auth/google?appId=gmail')

    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('authUrl', 'https://accounts.google.com/oauth?...')
    expect(nangoClient.initiateAuth).toHaveBeenCalledWith('google-mail', 'default:gmail')
  })

  it('returns 400 for unknown provider', async () => {
    const app = createApp()
    const res = await request(app).get('/auth/unknown-provider')

    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('returns 503 when Nango is unreachable', async () => {
    const err = new Error('Connection refused')
    err.statusCode = 503
    nangoClient.initiateAuth.mockRejectedValue(err)

    const app = createApp()
    const res = await request(app).get('/auth/google?appId=gmail')

    expect(res.status).toBe(503)
    expect(res.body.error).toBe('OAuth service temporarily unavailable')
  })
})

describe('GET /auth/token/:provider/:connectionId', () => {
  it('returns fresh token from Nango', async () => {
    nangoClient.getToken.mockResolvedValue({
      accessToken: 'ya29.fresh-token',
      tokenType: 'Bearer',
      expiresAt: '2025-01-01T00:00:00Z',
    })

    const app = createApp()
    const res = await request(app).get('/auth/token/gmail/default:gmail')

    expect(res.status).toBe(200)
    expect(res.body.accessToken).toBe('ya29.fresh-token')
    expect(res.body.tokenType).toBe('Bearer')
  })

  it('returns 400 for unknown provider', async () => {
    const app = createApp()
    const res = await request(app).get('/auth/token/unknown/id')

    expect(res.status).toBe(400)
    expect(res.body.error).toContain('Unknown provider')
  })
})

describe('POST /auth/:provider/revoke/:connectionId', () => {
  it('revokes an OAuth connection', async () => {
    const conn = upsertFromNango('default', {
      appId: 'slack',
      nangoConnectionId: 'default:slack',
      nangoProviderConfigKey: 'slack',
    })

    nangoClient.deleteConnection.mockResolvedValue()

    const app = createApp()
    const res = await request(app).post(`/auth/slack/revoke/${conn.id}`)

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(nangoClient.deleteConnection).toHaveBeenCalledWith('slack', 'default:slack')
  })

  it('returns 404 for non-existent connection', async () => {
    const app = createApp()
    const res = await request(app).post('/auth/slack/revoke/nonexistent-id')

    expect(res.status).toBe(404)
  })
})
