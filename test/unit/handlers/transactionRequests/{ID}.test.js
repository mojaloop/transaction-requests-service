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

const Mockgen = require('../../../util/mockgen.js')
const Helper = require('../../../util/helper')
const Handler = require('../../../../src/domain/transactionRequests/transactionRequests')

let sandbox
const server = new Hapi.Server()

/**
 * Tests for /transactionRequests/{ID}
 */
describe('/transactionRequests/{ID}', () => {
  // URI
  const path = '/transactionRequests/{ID}'

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
    // HTTP Method
    const method = 'get'

    it('returns a 202 response code', async () => {
      const headers = await Mockgen.generateRequestHeaders(path, method)
      // Arrange
      const options = {
        method,
        url: path,
        headers
      }

      // Act
      const response = await server.inject(options)

      // Assert
      expect(response.statusCode).toBe(202)
    })

    it('handles when error is thrown', async () => {
      const headers = await Mockgen.generateRequestHeaders(path, method)
      // Arrange
      const options = {
        method,
        url: path,
        // headers: Helper.defaultHeaders()
        headers
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

  describe('PUT', () => {
    // HTTP Method
    const method = 'put'

    it('returns a 200 response code', async () => {
      const request = await Mockgen.generateRequest(path, method)

      // Arrange
      const options = {
        method,
        url: path,
        headers: request.headers,
        payload: request.body
      }

      // Act
      const response = await server.inject(options)

      // Assert
      expect(response.statusCode).toBe(200)
    })

    it('handles when error is thrown', async () => {
      const request = await Mockgen.generateRequest(path, method)

      // Arrange
      const options = {
        method,
        url: path,
        headers: request.headers,
        payload: request.body
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
