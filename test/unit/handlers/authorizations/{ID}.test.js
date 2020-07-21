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

const Mockgen = require('../../../util/mockgen').mockRequest
const Helper = require('../../../util/helper')
const Handler = require('../../../../src/domain/authorizations/authorizations')

const server = new Hapi.Server()

/**
 * Tests for /authorizations/{ID}
 */
describe('/authorizations/{ID}', () => {
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
    const requests = Mockgen().requestsAsync('/authorizations/{ID}', 'get')

    it('returns a 202 response code', async () => {
      // Arrange
      const mock = await requests
      const headers = Helper.defaultHeaders()
      const options = {
        method: 'get',
        url: '' + mock.request.path,
        headers
      }

      // Act
      const response = await server.inject(options)

      // Assert
      const query = queryString.parse(mock.request.query)
      query.retriesLeft = Number(query.retriesLeft)
      expect(response.statusCode).toBe(202)
      expect(Handler.forwardAuthorizationMessage).toHaveBeenCalledTimes(1)
      expect(Handler.forwardAuthorizationMessage.mock.calls[0][2]).toEqual(query)
      expect(Handler.forwardAuthorizationMessage.mock.calls[0][3]).toEqual('GET')
    })

    it('GET handles when an error is thrown', async () => {
      // Arrange
      const mock = await requests
      const headers = Helper.defaultHeaders()
      const options = {
        method: 'get',
        url: '' + mock.request.path,
        headers
      }
      const err = new Error('Error occurred')
      Handler.forwardAuthorizationMessage.mockImplementation(() => { throw err })

      // Act
      const response = await server.inject(options)

      // Assert
      expect(response.statusCode).toBe(500)
      expect(Logger.error).toHaveBeenCalledWith(ErrorHandler.Factory.reformatFSPIOPError(err))
    })
  })

  describe('PUT', () => {
    const requests = Mockgen().requestsAsync('/authorizations/{ID}', 'put')

    it('properly handles OTP payload', async () => {
      // Arrange
      const mock = await requests
      const options = {
        method: 'put',
        url: '' + mock.request.path,
        headers: Helper.defaultHeaders(),
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
      const mock = await requests
      const options = {
        method: 'put',
        url: '' + mock.request.path,
        headers: Helper.defaultHeaders(),
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

    it('properly handles U2F payload', async () => {
      // Arrange
      const mock = await requests
      const options = {
        method: 'put',
        url: '' + mock.request.path,
        headers: Helper.defaultHeaders(),
        payload: {
          responseType: 'ENTERED',
          authenticationInfo: {
            authentication: 'U2F',
            authenticationValue: {
              pinValue: 'abcd',
              counter: '1'
            }
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

    it('PUT handles when an error is thrown', async () => {
      // Arrange
      const mock = await requests
      const options = {
        method: 'put',
        url: '' + mock.request.path,
        headers: Helper.defaultHeaders(),
        payload: {
          responseType: 'ENTERED',
          authenticationInfo: {
            authentication: 'OTP',
            authenticationValue: '123456'
          }
        }
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
      const mock = await requests
      const options = {
        method: 'put',
        url: '' + mock.request.path,
        headers: Helper.defaultHeaders(),
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
  })
})
