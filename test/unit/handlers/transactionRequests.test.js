'use strict'

const Sinon = require('sinon')
const Hapi = require('@hapi/hapi')

const Mockgen = require('../../util/mockgen.js').mockRequest
const Helper = require('../../util/helper')
const Handler = require('../../../src/domain/transactionRequests/transactionRequests')
const Plugins = require('../../../src/plugins')

let sandbox
const server = new Hapi.Server()

/**
 * Tests for /transactionRequests
 */
describe('/transactionRequests', () => {
  beforeAll(async () => {
    sandbox = Sinon.createSandbox()
    await Plugins.registerPlugins(server)
    await server.register(Helper.defaultServerOptions)
  })

  afterAll(() => {
    server.stop()
  })

  beforeEach(() => {
    sandbox.stub(Handler, 'forwardTransactionRequest').returns(Promise.resolve())
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('POST', () => {
    const requests = Mockgen().requestsAsync('/transactionRequests', 'post')

    it('returns a 202 response code', async () => {
      // Arrange
      const mock = await requests
      const options = {
        method: 'post',
        url: '' + mock.request.path,
        headers: Helper.defaultHeaders(),
        payload: mock.request.body || mock.request.formData
      }

      // Act
      const response = await server.inject(options)

      // Assert
      expect(response.statusCode).toBe(202)
    })
  })
})
