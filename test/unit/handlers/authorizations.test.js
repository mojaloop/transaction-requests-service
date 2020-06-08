'use strict'

jest.mock('@mojaloop/central-services-logger', () => {
  return {
    info: jest.fn(), // suppress info output
    debug: jest.fn(),
    error: jest.fn()
  }
})

jest.mock('../../../src/domain/authorizations/authorizations', () => {
  return {
    forwardAuthorizationMessage: jest.fn()
  }
})

const Hapi = require('@hapi/hapi')
const ErrorHandler = require('@mojaloop/central-services-error-handling')
const Logger = require('@mojaloop/central-services-logger')

const Mockgen = require('../../util/mockgen').mockRequest
const Helper = require('../../util/helper')
const Handler = require('../../../src/domain/authorizations/authorizations')
const Plugins = require('../../../src/plugins')

const server = new Hapi.Server()

/**
 * Tests for /authorizations
 */
describe('/authorizations', () => {
  beforeAll(async () => {
    await Plugins.registerPlugins(server)
    await server.register(Helper.defaultServerOptions)
  })

  afterAll(() => {
    server.stop()
  })

  beforeEach(() => {
    Handler.forwardAuthorizationMessage = jest.fn().mockResolvedValue()
  })

  describe('POST', () => {
    const requests = Mockgen().requestsAsync('/authorizations', 'post')

    it('returns a 200 response code', async () => {
      // Arrange
      const mock = await requests
      const options = {
        method: 'post',
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
      expect(Handler.forwardAuthorizationMessage.mock.calls[0][3]).toEqual('POST')
    })

    it('handles when an error is thrown', async () => {
      // Arrange
      const mock = await requests
      const headers = Helper.defaultHeaders()
      const options = {
        method: 'post',
        url: '' + mock.request.path,
        headers,
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
