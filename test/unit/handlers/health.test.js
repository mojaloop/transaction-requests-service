'use strict'

const Sinon = require('sinon')

const Mockgen = require('../../util/mockgen.js').mockRequest
const { initialize } = require('../../../src/server')
let sandbox

let server
jest.mock('@mojaloop/central-services-metrics', () => ({
  setup: jest.fn()
}))

/**
 * Tests for /health
 */
describe('/health', () => {
  beforeAll(async () => {
    server = await initialize(3001)
    sandbox = Sinon.createSandbox()
  })

  afterAll(() => {
    server.stop()
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('GET', () => {
    const requests = Mockgen().requestsAsync('/health', 'get')

    it('returns a 200 response code', async () => {
      // Arrange
      const mock = await requests
      const options = {
        method: 'get',
        url: '' + mock.request.path,
        headers: {
          ...mock.request.headers
        }
      }

      // Act
      const response = await server.inject(options)

      // Assert
      expect(response.statusCode).toBe(200)
    })
  })
})
