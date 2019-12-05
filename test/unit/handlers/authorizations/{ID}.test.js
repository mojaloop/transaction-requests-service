'use strict'

jest.mock('@mojaloop/central-services-logger', () => {
  return {
    info: jest.fn() // suppress info output
  }
})
const Hapi = require('@hapi/hapi')
const queryString = require('querystring')

const Mockgen = require('../../../util/mockgen.js')
const Helper = require('../../../util/helper')
const Handler = require('../../../../src/domain/authorizations/authorizations')

const server = new Hapi.Server()

/**
 * Tests for /authorizations/{ID}
 */
describe('/authorizations/{ID}', () => {
  beforeAll(async () => {
    await server.register(Helper.defaultServerOptions)
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
  })
})
