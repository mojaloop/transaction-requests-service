'use strict'

jest.mock('@mojaloop/central-services-logger', () => {
  return {
    info: jest.fn(), // suppress info output
    debug: jest.fn(),
    error: jest.fn()
  }
})

const Sinon = require('sinon')
const Hapi = require('@hapi/hapi')
const ErrorHandler = require('@mojaloop/central-services-error-handling')
const Logger = require('@mojaloop/central-services-logger')

const Mockgen = require('../../../util/mockgen.js').mockRequest
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
    await Helper.serverSetup(server)
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

    it('handles when error is thrown', async () => {
      // Arrange
      const mock = await requests
      const options = {
        method: 'get',
        url: '' + mock.request.path,
        headers: Helper.defaultHeaders()
      }
      const err = new Error('Error occured')
      Handler.forwardTransactionRequest = sandbox.stub().throws(err)

      // Act
      const response = await server.inject(options)

      // Assert
      expect(response.statusCode).toBe(500)
      expect(Logger.error).toHaveBeenCalledWith(ErrorHandler.Factory.reformatFSPIOPError(err))
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

    it('handles when error is thrown', async () => {
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

      const err = new Error('Error occured')
      Handler.forwardTransactionRequest = sandbox.stub().throws(err)

      // Act
      const response = await server.inject(options)

      // Assert
      expect(response.statusCode).toBe(500)
      expect(Logger.error).toHaveBeenCalledWith(ErrorHandler.Factory.reformatFSPIOPError(err))
    })
  })
})
