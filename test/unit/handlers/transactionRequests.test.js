'use strict'

jest.mock('@mojaloop/central-services-logger', () => {
  return {
    info: jest.fn(),
    debug: jest.fn(),
    error: jest.fn()
  }
})

const Sinon = require('sinon')
const Hapi = require('@hapi/hapi')

const ErrorHandler = require('@mojaloop/central-services-error-handling')
const Logger = require('@mojaloop/central-services-logger')

const Mockgen = require('../../util/mockgen.js').mockRequest
const Helper = require('../../util/helper')
const Handler = require('../../../src/domain/transactionRequests/transactionRequests')

let sandbox
const server = new Hapi.Server()

/**
 * Tests for /transactionRequests
 */
describe('/transactionRequests', () => {
  beforeAll(async () => {
    sandbox = Sinon.createSandbox()
    await Helper.serverSetup(server)
  })

  beforeEach(() => {
    sandbox.stub(Handler, 'forwardTransactionRequest').returns(Promise.resolve())
  })

  afterAll(() => {
    server.stop()
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('POST', () => {
    const requests = Mockgen().requestsAsync('/transactionRequests', 'post')

    it('returns a 202 response code', async () => {
      // Arrange
      const mock = await requests

      // fix mocked amount
      mock.request.body.amount = {
        currency: 'USD', amount: '100'
      }
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

    it('handles when forwardTransactionRequest throws error', async () => {
      // Arrange
      const mock = await requests
      const options = {
        method: 'post',
        url: '' + mock.request.path,
        headers: Helper.defaultHeaders(),
        payload: mock.request.body || mock.request.formData
      }
      const err = new Error('Error occurred')
      Handler.forwardTransactionRequest = sandbox.stub().throws(err)

      // Act
      const response = await server.inject(options)

      // Assert
      expect(response.statusCode).toBe(500)
      expect(Logger.error).toHaveBeenCalledWith(ErrorHandler.Factory.reformatFSPIOPError(err))
    })
  })
})
