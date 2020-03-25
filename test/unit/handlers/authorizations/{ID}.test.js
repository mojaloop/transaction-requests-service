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

const Mockgen = require('../../../util/mockgen.js').mockRequest
const Helper = require('../../../util/helper')
const Handler = require('../../../../src/domain/authorizations/authorizations')
const Plugins = require('../../../../src/plugins')

const server = new Hapi.Server()

/**
 * Tests for /authorizations/{ID}
 */
describe('/authorizations/{ID}', () => {
  beforeAll(async () => {
    await Plugins.registerPlugins(server)
    await server.register(Helper.defaultServerOptions)
  })
  Logger.error = jest.fn()

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

    it('handles when an error is thrown', async () => {
      // Arrange
      const mock = await requests
      const headers = Helper.defaultHeaders()
      const options = {
        method: 'get',
        url: '' + mock.request.path,
        headers
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
    const requests = Mockgen().requestsAsync('/authorizations/{ID}', 'put')

    it('returns a 202 response code', async () => {
      // Arrange
      const mock = await requests
      const options = {
        method: 'put',
        url: '' + mock.request.path,
        headers: Helper.defaultHeaders(),
        payload: mock.request.body
      }

      // Act
      const response = await server.inject(options)

      // Assert
      expect(response.statusCode).toBe(200)
      expect(Handler.forwardAuthorizationMessage).toHaveBeenCalledTimes(1)
      expect(Handler.forwardAuthorizationMessage.mock.calls[0][2]).toEqual(mock.request.body)
      expect(Handler.forwardAuthorizationMessage.mock.calls[0][3]).toEqual('PUT')
    })

    it('handles when an error is thrown', async () => {
      // Arrange
      const mock = await requests
      const options = {
        method: 'put',
        url: '' + mock.request.path,
        headers: Helper.defaultHeaders(),
        payload: mock.request.body
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
})
