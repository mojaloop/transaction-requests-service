'use strict'

const Sinon = require('sinon')
const Hapi = require('@hapi/hapi')
const Metrics = require('@mojaloop/central-services-metrics')
const Helper = require('../../util/helper')

let sandbox
const server = new Hapi.Server()

/**
 * Tests for /metrics
 */
describe('/metrics', () => {
  // URI
  const path = '/metrics'

  beforeAll(async () => {
    sandbox = Sinon.createSandbox()
    await Helper.serverSetup(server)
    sandbox.stub(Metrics, 'getMetricsForPrometheus').returns({})
  })

  afterAll(() => {
    server.stop()
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('GET', () => {
    // HTTP Method
    const method = 'get'

    it('returns a 200 response code', async () => {
      // Arrange
      const options = {
        method,
        url: path
      }

      // Act
      const response = await server.inject(options)

      // Assert
      expect(response.statusCode).toBe(200)
    })
  })
})
