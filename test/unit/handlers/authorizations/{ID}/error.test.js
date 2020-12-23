'use strict'

jest.mock('@mojaloop/central-services-logger', () => {
  return {
    info: jest.fn(), // suppress info output
    debug: jest.fn(),
    error: jest.fn()
  }
})

jest.mock('../../../../../src/domain/authorizations/authorizations', () => {
  return {
    forwardAuthorizationError: jest.fn()
  }
})

const Hapi = require('@hapi/hapi')
const ErrorHandler = require('@mojaloop/central-services-error-handling')
const Logger = require('@mojaloop/central-services-logger')

const Mockgen = require('../../../../util/mockgen')
const Helper = require('../../../../util/helper')
const Handler = require('../../../../../src/domain/authorizations/authorizations')
const server = new Hapi.Server()

/**
 * Tests for /authorizations/{ID}/error
 */
describe('/authorizations/{ID}/error', () => {
  // URI
  const path = '/authorizations/{ID}/error'
  beforeAll(async () => {
    await Helper.serverSetup(server)
  })

  afterAll(() => {
    server.stop()
  })

  beforeEach(() => {
    Handler.forwardAuthorizationError = jest.fn().mockResolvedValue()
  })

  describe('PUT', () => {
    // HTTP Method
    const method = 'put'

    it('returns a 200 response code', async () => {
      const request = await Mockgen.generateRequest(path, method)

      // Arrange
      const options = {
        method,
        url: path + request.query.toURLEncodedString(),
        headers: request.headers,
        payload: request.body
      }

      // Act
      const response = await server.inject(options)

      // Assert
      expect(response.statusCode).toBe(200)
      expect(Handler.forwardAuthorizationError).toHaveBeenCalledTimes(1)
    })

    it('handles when error is thrown', async () => {
      const request = await Mockgen.generateRequest(path, method)

      // Arrange
      const options = {
        method,
        url: path + request.query.toURLEncodedString(),
        headers: request.headers,
        payload: request.body
      }

      const err = new Error('Error occurred')
      Handler.forwardAuthorizationError.mockImplementation(() => { throw err })

      // Act
      const response = await server.inject(options)

      // Assert
      expect(response.statusCode).toBe(500)
      expect(Logger.error).toHaveBeenCalledWith(ErrorHandler.Factory.reformatFSPIOPError(err))
    })
  })
})
