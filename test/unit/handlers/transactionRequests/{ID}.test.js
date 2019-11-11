'use strict'

jest.mock('@mojaloop/central-services-logger', () => {
  return {
    info: jest.fn() // suppress info output
  }
})

const Sinon = require('sinon')
const Hapi = require('@hapi/hapi')

const Mockgen = require('../../../util/mockgen.js')
const Helper = require('../../../util/helper')
const Handler = require('../../../../src/domain/transactionRequests/transactionRequests')

let sandbox
const server = new Hapi.Server()

/**
 * Tests for /transactionRequests/{ID}
 */
describe('/transactionRequests/{ID}', () => {
  beforeAll(async () => {
    sandbox = Sinon.createSandbox()
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

  describe('GET', () => {
    const requests = Mockgen().requestsAsync('/transactionRequests/{ID}', 'get')

    it('returns a 202 response code', async () => {
      // Arrange
      const mock = await requests
      const options = {
        method: 'get',
        url: '' + mock.request.path,
        headers: Helper.defaultHeaders()
      }

      // Act
      const response = await server.inject(options)

      // Assert
      expect(response.statusCode).toBe(202)
    })
  })

  describe('PUT', () => {
    const requests = Mockgen().requestsAsync('/transactionRequests/{ID}', 'put')

    it('returns a 200 response code', async () => {
      // Arrange
      const mock = await requests
      const options = {
        method: 'put',
        url: '' + mock.request.path,
        headers: Helper.defaultHeaders(),
        payload: {
          ...mock.request.body,
          ...mock.request.formData
        }
      }

      // Act
      const response = await server.inject(options)

      // Assert
      expect(response.statusCode).toBe(200)
    })
  })
})
