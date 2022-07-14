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

const Mockgen = require('../../../util/mockgen.js')
const Helper = require('../../../util/helper')
const Handler = require('../../../../src/domain/authorizations/authorizations')
const Config = require('../../../../src/lib/config')

const server = new Hapi.Server()

/**
 * Tests for /authorizations/{ID}
 */
describe('/authorizations/{ID}', () => {
  // URI
  // URI
  const resource = 'authorizations'
  const path = `/${resource}/{ID}`

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
      const request = await Mockgen.generateRequest(path, method, resource, Config.PROTOCOL_VERSIONS)

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

      /// / This is due to a known issue in openapi-backend (which may be intended) -> https://github.com/anttiviljami/openapi-backend/issues/144. Parsed values are no longer coerced with the current version.
      // convert each query Param into strings
      const queryMap = Object.fromEntries(Object.entries(request.query.params).map(([key, value], i) => {
        return [key, value.toString()]
      }))
      expect(Handler.forwardAuthorizationMessage.mock.calls[0][2]).toEqual(queryMap)
      // expect(Handler.forwardAuthorizationMessage.mock.calls[0][2]).toEqual(request.query.params) // This is the original assertion

      expect(Handler.forwardAuthorizationMessage.mock.calls[0][3]).toEqual('GET')
    })

    it('handles when an error is thrown', async () => {
      const request = await Mockgen.generateRequest(path, method, resource, Config.PROTOCOL_VERSIONS)

      // Arrange
      const options = {
        method,
        url: path + request.query.toURLEncodedString(),
        headers: request.headers
      }

      const err = new Error('Error occurred')
      Handler.forwardAuthorizationMessage.mockImplementation(async () => { throw err })

      // Act
      const response = await server.inject(options)

      // Assert
      expect(response.statusCode).toBe(202)
      expect(Handler.forwardAuthorizationMessage).toHaveBeenCalledTimes(1)
      expect(Handler.forwardAuthorizationMessage.mock.results[0].value).rejects.toThrow(err)
    })
  })

  describe('PUT', () => {
    // HTTP Method
    const method = 'put'

    it('returns a 202 response code', async () => {
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
      expect(Handler.forwardAuthorizationMessage).toHaveBeenCalledTimes(1)
      expect(Handler.forwardAuthorizationMessage.mock.calls[0][2]).toEqual(request.body)
      expect(Handler.forwardAuthorizationMessage.mock.calls[0][3]).toEqual(method.toUpperCase())
    })

    it('handles when an error is thrown', async () => {
      const request = await Mockgen.generateRequest(path, method, resource, Config.PROTOCOL_VERSIONS)

      // Arrange
      const options = {
        method,
        url: path,
        headers: request.headers,
        payload: request.body
      }

      const err = new Error('Error occurred')
      Handler.forwardAuthorizationMessage.mockImplementation(async () => { throw err })

      // Act
      const response = await server.inject(options)

      // Assert
      expect(response.statusCode).toBe(200)
      expect(Handler.forwardAuthorizationMessage).toHaveBeenCalledTimes(1)
      expect(Handler.forwardAuthorizationMessage.mock.results[0].value).rejects.toThrow(err)
    })
  })
})
