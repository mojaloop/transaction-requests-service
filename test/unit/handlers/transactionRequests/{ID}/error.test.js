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

const Mockgen = require('../../../../util/mockgen.js')
const Helper = require('../../../../util/helper')
const Handler = require('../../../../../src/domain/transactionRequests/transactionRequests')

let sandbox
const server = new Hapi.Server()

describe('/transactionRequests/{ID}/error', () => {
  // URI
  const path = '/transactionRequests/{ID}/error'

  beforeAll(async () => {
    sandbox = Sinon.createSandbox()
    sandbox.stub(Handler, 'forwardTransactionRequestError').returns(Promise.resolve())
    await Helper.serverSetup(server)
  })

  afterAll(() => {
    server.stop()
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('PUT', () => {
    // HTTP Method
    const method = 'put'

    it('handles a PUT', async () => {
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

      const err = new Error('Error occured')
      Handler.forwardTransactionRequestError = sandbox.stub().throws(err)

      // Act
      const response = await server.inject(options)

      // Assert
      expect(response.statusCode).toBe(500)
      expect(Logger.error).toHaveBeenCalledWith(ErrorHandler.Factory.reformatFSPIOPError(err))
    })
  })
})
