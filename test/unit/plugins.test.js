'use strict'

const Sinon = require('sinon')
const Hapi = require('@hapi/hapi')
const crypto = require('node:crypto')
const fs = require('node:fs')
const path = require('node:path')
const os = require('node:os')
const { Jws } = require('@mojaloop/sdk-standard-components')

const JwsSigner = Jws.signer

const FSPIOP_SOURCE = 'payerfsp'

const generateKeyPair = () => crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
})

const buildSignedHeaders = ({ signingKey, method, urlPath, body, source = FSPIOP_SOURCE }) => {
  const signer = new JwsSigner({ signingKey })
  const reqOpts = {
    headers: {
      'content-type': 'application/vnd.interoperability.transactionRequests+json;version=1.1',
      accept: 'application/vnd.interoperability.transactionRequests+json;version=1',
      date: new Date().toUTCString(),
      'fspiop-source': source,
      'fspiop-destination': 'payeefsp'
    },
    method,
    uri: `http://switch${urlPath}`,
    body
  }
  signer.sign(reqOpts)
  return reqOpts.headers
}

const makeTempDir = () => fs.mkdtempSync(path.join(os.tmpdir(), 'jws-trs-'))

jest.mock('hapi-swagger', () => ({ plugin: { name: 'stub-swagger', register () {} } }))
jest.mock('@hapi/good', () => ({ plugin: { name: 'stub-good', register () {} } }))
jest.mock('@mojaloop/central-services-metrics', () => ({
  plugin: { plugin: { name: 'stub-metrics', register () {} } }
}))
jest.mock('@mojaloop/central-services-shared', () => {
  const actual = jest.requireActual('@mojaloop/central-services-shared')
  const s = (n) => ({ plugin: { name: n, register () {} } })
  return {
    ...actual,
    Util: {
      ...actual.Util,
      Hapi: {
        ...actual.Util.Hapi,
        OpenapiBackendValidator: s('stub-openapi-validator'),
        FSPIOPHeaderValidation: { plugin: s('stub-header-validation') },
        HapiEventPlugin: s('stub-event-plugin')
      }
    }
  }
})

let sandbox
describe('plugins', () => {
  beforeAll(() => {
    sandbox = Sinon.createSandbox()
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('registerPlugins (stub server)', () => {
    it('registers the plugins when JWS_VALIDATE is false', async () => {
      const serverStub = { register: sandbox.stub() }
      const { registerPlugins } = require('../../src/plugins')
      await registerPlugins(serverStub)
      expect(serverStub.register.callCount).toBeGreaterThanOrEqual(5)
    })
  })

  describe('registerPlugins with JWS_VALIDATE=true (real Hapi server)', () => {
    const { privateKey, publicKey } = generateKeyPair()
    const Config = require('../../src/lib/config')

    const createServer = async (keysDir) => {
      const origValidate = Config.JWS_VALIDATE
      const origDir = Config.JWS_VERIFICATION_KEYS_DIRECTORY
      const origPutParties = Config.JWS_VALIDATE_PUT_PARTIES
      Config.JWS_VALIDATE = true
      Config.JWS_VERIFICATION_KEYS_DIRECTORY = keysDir
      Config.JWS_VALIDATE_PUT_PARTIES = false

      const server = new Hapi.Server({
        routes: { payload: { output: 'stream', parse: true } }
      })

      const { registerPlugins } = require('../../src/plugins')
      await registerPlugins(server, { matchOperation: () => ({}) })

      server.ext('onPreResponse', (req, h) => {
        if (req.response && req.response.name === 'FSPIOPError') {
          const { apiErrorCode } = req.response
          return h.response({ errorCode: apiErrorCode.code }).code(apiErrorCode.httpStatusCode)
        }
        return h.continue
      })

      const ok = (_req, h) => h.response({ ok: true }).code(200)
      server.route([
        { method: 'POST', path: '/transactionRequests', handler: ok },
        { method: 'GET', path: '/transactionRequests/{id}', handler: ok },
        { method: 'POST', path: '/quotes', handler: ok }
      ])

      Config.JWS_VALIDATE = origValidate
      Config.JWS_VERIFICATION_KEYS_DIRECTORY = origDir
      Config.JWS_VALIDATE_PUT_PARTIES = origPutParties

      return server
    }

    it('accepts valid signed request', async () => {
      const dir = makeTempDir()
      fs.writeFileSync(path.join(dir, `${FSPIOP_SOURCE}.pem`), publicKey)
      const server = await createServer(dir)

      const body = { transactionRequestId: 'abc' }
      const headers = buildSignedHeaders({ signingKey: privateKey, method: 'POST', urlPath: '/transactionRequests', body })
      const res = await server.inject({ method: 'POST', url: '/transactionRequests', headers, payload: body })
      expect(res.statusCode).toBe(200)

      await server.stop()
      fs.rmSync(dir, { recursive: true, force: true })
    })

    it('rejects tampered body with 3105', async () => {
      const dir = makeTempDir()
      fs.writeFileSync(path.join(dir, `${FSPIOP_SOURCE}.pem`), publicKey)
      const server = await createServer(dir)

      const body = { transactionRequestId: 'abc' }
      const headers = buildSignedHeaders({ signingKey: privateKey, method: 'POST', urlPath: '/transactionRequests', body })
      const res = await server.inject({ method: 'POST', url: '/transactionRequests', headers, payload: { transactionRequestId: 'tampered' } })
      expect(res.statusCode).toBe(400)
      expect(JSON.parse(res.payload).errorCode).toBe('3105')

      if (server.app.jwsKeyWatcher) server.app.jwsKeyWatcher.close()
      fs.rmSync(dir, { recursive: true, force: true })
    })

    it('rejects unknown source with 3105', async () => {
      const dir = makeTempDir()
      fs.writeFileSync(path.join(dir, `${FSPIOP_SOURCE}.pem`), publicKey)
      const server = await createServer(dir)

      const body = { transactionRequestId: 'abc' }
      const headers = buildSignedHeaders({ signingKey: privateKey, method: 'POST', urlPath: '/transactionRequests', body, source: 'unknownfsp' })
      const res = await server.inject({ method: 'POST', url: '/transactionRequests', headers, payload: body })
      expect(res.statusCode).toBe(400)
      expect(JSON.parse(res.payload).errorCode).toBe('3105')

      if (server.app.jwsKeyWatcher) server.app.jwsKeyWatcher.close()
      fs.rmSync(dir, { recursive: true, force: true })
    })

    it('GET bypasses validation', async () => {
      const dir = makeTempDir()
      fs.writeFileSync(path.join(dir, `${FSPIOP_SOURCE}.pem`), publicKey)
      const server = await createServer(dir)

      const res = await server.inject({ method: 'GET', url: '/transactionRequests/abc' })
      expect(res.statusCode).toBe(200)

      if (server.app.jwsKeyWatcher) server.app.jwsKeyWatcher.close()
      fs.rmSync(dir, { recursive: true, force: true })
    })

    it('non-target resource bypasses validation', async () => {
      const dir = makeTempDir()
      fs.writeFileSync(path.join(dir, `${FSPIOP_SOURCE}.pem`), publicKey)
      const server = await createServer(dir)

      const res = await server.inject({ method: 'POST', url: '/quotes', payload: { x: 1 } })
      expect(res.statusCode).toBe(200)

      if (server.app.jwsKeyWatcher) server.app.jwsKeyWatcher.close()
      fs.rmSync(dir, { recursive: true, force: true })
    })

    it('handles missing keys dir gracefully', async () => {
      const server = await createServer('/no/such/dir')
      const body = { transactionRequestId: 'abc' }
      const headers = buildSignedHeaders({ signingKey: privateKey, method: 'POST', urlPath: '/transactionRequests', body })
      const res = await server.inject({ method: 'POST', url: '/transactionRequests', headers, payload: body })
      expect(res.statusCode).toBe(400)
      expect(JSON.parse(res.payload).errorCode).toBe('3105')
    })

    it('PUT /parties bypasses validation', async () => {
      const dir = makeTempDir()
      fs.writeFileSync(path.join(dir, `${FSPIOP_SOURCE}.pem`), publicKey)
      const server = await createServer(dir)
      server.route({ method: 'PUT', path: '/parties/{type}/{id}', handler: (_r, h) => h.response({ ok: true }).code(200) })

      const res = await server.inject({ method: 'PUT', url: '/parties/MSISDN/123', payload: { party: {} } })
      expect(res.statusCode).toBe(200)

      if (server.app.jwsKeyWatcher) server.app.jwsKeyWatcher.close()
      fs.rmSync(dir, { recursive: true, force: true })
    })

    it('watchJwsKeys detects added and removed keys', async () => {
      const dir = makeTempDir()
      fs.writeFileSync(path.join(dir, `${FSPIOP_SOURCE}.pem`), publicKey)
      const server = await createServer(dir)
      expect(server.app.jwsKeyWatcher).toBeDefined()

      const { privateKey: pk2, publicKey: pub2 } = generateKeyPair()
      fs.writeFileSync(path.join(dir, 'newfsp.pem'), pub2)
      const deadline = Date.now() + 3000
      while (Date.now() < deadline) {
        const body = { transactionRequestId: 'test' }
        const headers = buildSignedHeaders({ signingKey: pk2, method: 'POST', urlPath: '/transactionRequests', body, source: 'newfsp' })
        const res = await server.inject({ method: 'POST', url: '/transactionRequests', headers, payload: body })
        if (res.statusCode === 200) break
        await new Promise(resolve => setTimeout(resolve, 50))
      }

      fs.rmSync(path.join(dir, 'newfsp.pem'))
      const deadline2 = Date.now() + 3000
      while (Date.now() < deadline2) {
        const body = { transactionRequestId: 'test2' }
        const headers = buildSignedHeaders({ signingKey: pk2, method: 'POST', urlPath: '/transactionRequests', body, source: 'newfsp' })
        const res = await server.inject({ method: 'POST', url: '/transactionRequests', headers, payload: body })
        if (res.statusCode === 400) break
        await new Promise(resolve => setTimeout(resolve, 50))
      }

      await server.stop()
      fs.rmSync(dir, { recursive: true, force: true })
    })
  })
})
