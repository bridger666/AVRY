const crypto = require('crypto')
const verifyNangoWebhook = require('../middleware/nangoWebhook')

function makeMockReqRes(body, signature) {
  const req = {
    body,
    headers: signature !== undefined ? { 'x-nango-signature': signature } : {},
  }
  const res = {
    statusCode: null,
    body: null,
    status(code) { this.statusCode = code; return this },
    json(data) { this.body = data; return this },
  }
  return { req, res }
}

function computeSignature(body, secret) {
  const str = typeof body === 'string' ? body : JSON.stringify(body)
  return crypto.createHmac('sha256', secret).update(str).digest('hex')
}

describe('verifyNangoWebhook', () => {
  const ORIGINAL_ENV = process.env

  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV, NANGO_WEBHOOK_SECRET: 'test-secret-123' }
  })

  afterAll(() => {
    process.env = ORIGINAL_ENV
  })

  it('calls next() for valid signature', () => {
    const body = { type: 'auth', connectionId: 'tenant:gmail', success: true }
    const sig = computeSignature(body, 'test-secret-123')
    const { req, res } = makeMockReqRes(body, sig)
    const next = jest.fn()

    verifyNangoWebhook(req, res, next)

    expect(next).toHaveBeenCalledTimes(1)
    expect(res.statusCode).toBeNull()
  })

  it('returns 401 for missing signature', () => {
    const body = { type: 'auth' }
    const { req, res } = makeMockReqRes(body, undefined)
    const next = jest.fn()

    verifyNangoWebhook(req, res, next)

    expect(next).not.toHaveBeenCalled()
    expect(res.statusCode).toBe(401)
    expect(res.body.error).toBe('Missing webhook signature')
  })

  it('returns 401 for invalid signature', () => {
    const body = { type: 'auth' }
    const { req, res } = makeMockReqRes(body, 'bad-signature')
    const next = jest.fn()

    verifyNangoWebhook(req, res, next)

    expect(next).not.toHaveBeenCalled()
    expect(res.statusCode).toBe(401)
    expect(res.body.error).toBe('Invalid webhook signature')
  })

  it('returns 500 when NANGO_WEBHOOK_SECRET is not set', () => {
    delete process.env.NANGO_WEBHOOK_SECRET
    const body = { type: 'auth' }
    const sig = 'any'
    const { req, res } = makeMockReqRes(body, sig)
    const next = jest.fn()

    verifyNangoWebhook(req, res, next)

    expect(next).not.toHaveBeenCalled()
    expect(res.statusCode).toBe(500)
  })
})
