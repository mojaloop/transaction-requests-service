'use strict'

jest.mock('@mojaloop/central-services-logger', () => {
  return {
    info: jest.fn(), // suppress info output
    debug: jest.fn(),
    error: jest.fn()
  }
})

jest.mock('../../../../src/domain/authorizations/authorizations', () => {
  return {
    forwardAuthorizationMessage: jest.fn()
  }
})

const Hapi = require('@hapi/hapi')
const queryString = require('querystring')
const ErrorHandler = require('@mojaloop/central-services-error-handling')
const Logger = require('@mojaloop/central-services-logger')

const Mockgen = require('../../../util/mockgen.js')
const MockgenRequest = require('../../../util/mockgen.js').mockRequest
const Helper = require('../../../util/helper')
const Handler = require('../../../../src/domain/authorizations/authorizations')

const server = new Hapi.Server()

/**
 * Tests for /authorizations/{ID}
 */
describe('/authorizations/{ID}', () => {
  // URI
  const path = '/authorizations/{ID}'

  beforeAll(async () => {
    await Helper.serverSetup(server)
  })

  afterAll(() => {
    server.stop()
  })

  beforeEach(() => {
    Handler.forwardAuthorizationMessage = jest.fn().mockResolvedValue()
  })

  describe('GET', () => {
    // HTTP Method
    const method = 'get'

    it('returns a 202 response code', async () => {
      const request = await Mockgen.generateRequest(path, method)

      // Arrange
      const options = {
        method,
        url: path + request.query.toURLEncodedString(),
        headers: request.headers
      }

      // Act
      const response = await server.inject(options)

      // Assert
      expect(response.statusCode).toBe(202)
      expect(Handler.forwardAuthorizationMessage).toHaveBeenCalledTimes(1)
      expect(Handler.forwardAuthorizationMessage.mock.calls[0][2]).toEqual(request.query.params)
      expect(Handler.forwardAuthorizationMessage.mock.calls[0][3]).toEqual('GET')
    })

    it('handles when an error is thrown', async () => {
      const request = await Mockgen.generateRequest(path, method)

      // Arrange
      const options = {
        method,
        url: path + request.query.toURLEncodedString(),
        headers: request.headers
      }

      const err = new Error('Error occured')
      Handler.forwardAuthorizationMessage.mockImplementation(() => { throw err })

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

    it('returns a 202 response code', async () => {
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
      console.log(response)
      // Assert
      expect(response.statusCode).toBe(200)
      expect(Handler.forwardAuthorizationMessage).toHaveBeenCalledTimes(1)
      expect(Handler.forwardAuthorizationMessage.mock.calls[0][2]).toEqual(request.body)
      expect(Handler.forwardAuthorizationMessage.mock.calls[0][3]).toEqual(method.toUpperCase())
    })

    it('handles when an error is thrown', async () => {
      const request = await Mockgen.generateRequest(path, method)

      // Arrange
      const options = {
        method,
        url: path,
        headers: request.headers,
        payload: request.body
      }

      const err = new Error('Error occurred')
      Handler.forwardAuthorizationMessage.mockImplementation(() => { throw err })

      // Act
      const response = await server.inject(options)

      // Assert
      expect(response.statusCode).toBe(500)
      expect(Logger.error).toHaveBeenCalledWith(ErrorHandler.Factory.reformatFSPIOPError(err))
    })

    it('should validate properly authenticationValue depending on authentication field', async () => {
      // Arrange
      const request = await Mockgen.generateRequest(path, method)
      const options = {
        method,
        url: path,
        headers: request.headers,
        payload: {
          responseType: 'ENTERED',
          authenticationInfo: {
            authentication: 'U2F',
            authenticationValue: '123456' // for U2F an object should be used here, not a string
          }
        }
      }

      expect(typeof options.payload.authenticationInfo.authenticationValue).toEqual('string')
      // Act
      const response = await server.inject(options)

      // Assert
      expect(response.statusCode).toBe(400)
    })

    it('properly handles OTP payload', async () => {
      // Arrange
      const request = await Mockgen.generateRequest(path, method)
      const options = {
        method,
        url: path,
        headers: request.headers,
        payload: {
          responseType: 'ENTERED',
          authenticationInfo: {
            authentication: 'OTP',
            authenticationValue: '123456'
          }
        }
      }

      // Act
      const response = await server.inject(options)

      // Assert
      expect(response.statusCode).toBe(200)
      expect(Handler.forwardAuthorizationMessage).toHaveBeenCalledTimes(1)
      expect(Handler.forwardAuthorizationMessage.mock.calls[0][2]).toEqual(options.payload)
      expect(Handler.forwardAuthorizationMessage.mock.calls[0][3]).toEqual('PUT')
    })

    it('properly handles QRCODE payload', async () => {
      // Arrange
      const request = await Mockgen.generateRequest(path, method)
      const options = {
        method,
        url: path,
        headers: request.headers,
        payload: {
          responseType: 'ENTERED',
          authenticationInfo: {
            authentication: 'QRCODE',
            authenticationValue: 'abcdefghijklmnopqrstuvwxyz0987654321'
          }
        }
      }

      // Act
      const response = await server.inject(options)

      // Assert
      expect(response.statusCode).toBe(200)
      expect(Handler.forwardAuthorizationMessage).toHaveBeenCalledTimes(1)
      expect(Handler.forwardAuthorizationMessage.mock.calls[0][2]).toEqual(options.payload)
      expect(Handler.forwardAuthorizationMessage.mock.calls[0][3]).toEqual('PUT')
    })
  })
})
