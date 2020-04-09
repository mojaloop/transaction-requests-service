'use strict'

const Sinon = require('sinon')
const Hapi = require('@hapi/hapi')
const Metrics = require('@mojaloop/central-services-metrics')

const Mockgen = require('../../util/mockgen.js').mockRequest
const Helper = require('../../util/helper')

let sandbox
const server = new Hapi.Server()

/**
 * Tests for /metrics
 */
describe('/metrics', () => {
  beforeAll(async () => {
    sandbox = Sinon.createSandbox()
    await server.register(Helper.defaultServerOptions)
    sandbox.stub(Metrics, 'getMetricsForPrometheus').returns({})
  })

  afterAll(() => {
    server.stop()
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('GET', () => {
    const requests = Mockgen().requestsAsync('/metrics', 'get')

    it('returns a 200 response code', async () => {
      // Arrange
      const mock = await requests
      const options = {
        method: 'get',
        url: '' + mock.request.path
      }

      // Act
      const response = await server.inject(options)

      // Assert
      expect(response.statusCode).toBe(200)
    })
  })
})
