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

const Mockgen = require('../../../../util/mockgen.js')
const Helper = require('../../../../util/helper')
const Handler = require('../../../../../src/domain/transactionRequests/transactionRequests')
const Config = require('../../../../../src/lib/config')

let sandbox
const server = new Hapi.Server()

describe('/transactionRequests/{ID}/error', () => {
  // URI
  const resource = 'transactionRequests'
  const path = `/${resource}/{ID}/error`

  beforeAll(async () => {
    sandbox = Sinon.createSandbox()
    // sandbox.stub(Handler, 'forwardTransactionRequestError').returns(Promise.resolve())
    await Helper.serverSetup(server)
  })

  beforeEach(() => {
    Handler.forwardTransactionRequestError = jest.fn().mockResolvedValue()
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
      const request = await Mockgen.generateRequest(path, method, resource, Config.PROTOCOL_VERSIONS)

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
      const request = await Mockgen.generateRequest(path, method, resource, Config.PROTOCOL_VERSIONS)

      // Arrange
      const options = {
        method,
        url: path,
        headers: request.headers,
        payload: request.body
      }

      const err = new Error('Error occurred')
      Handler.forwardTransactionRequestError.mockImplementation(async () => { throw err })

      // Act
      const response = await server.inject(options)

      // Assert
      expect(response.statusCode).toBe(200)
      expect(Handler.forwardTransactionRequestError).toHaveBeenCalledTimes(1)
      expect(Handler.forwardTransactionRequestError.mock.results[0].value).rejects.toThrow(err)
    })
  })
})
