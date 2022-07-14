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

const Mockgen = require('../../../util/mockgen.js')
const Helper = require('../../../util/helper')
const Handler = require('../../../../src/domain/transactionRequests/transactionRequests')
const Config = require('../../../../src/lib/config')

let sandbox
const server = new Hapi.Server()

/**
 * Tests for /transactionRequests/{ID}
 */
describe('/transactionRequests/{ID}', () => {
  // URI
  const resource = 'transactionRequests'
  const path = `/${resource}/{ID}`

  beforeAll(async () => {
    sandbox = Sinon.createSandbox()
    await Helper.serverSetup(server)
  })

  afterAll(() => {
    server.stop()
  })

  beforeEach(() => {
    Handler.forwardTransactionRequest = jest.fn().mockResolvedValue()
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('GET', () => {
    // HTTP Method
    const method = 'get'

    it('returns a 202 response code', async () => {
      const headers = await Mockgen.generateRequestHeaders(path, method, resource, Config.PROTOCOL_VERSIONS)
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

    it('returns a 406 with invalid protocol version for content-type', async () => {
      const tempProtocolVersion = JSON.parse(JSON.stringify(Config.PROTOCOL_VERSIONS)) // We want to make a deep clone of the config
      tempProtocolVersion.CONTENT.DEFAULT = '0.1' // This is an invalid FSPIOP protocol version
      const headers = await Mockgen.generateRequestHeaders(path, method, resource, tempProtocolVersion)

      // Arrange
      const options = {
        method,
        url: path,
        headers
      }

      // Act
      const response = await server.inject(options)

      // Assert
      expect(response.statusCode).toBe(406)
      expect(response.result && response.result.errorInformation && response.result.errorInformation.errorCode).toBe('3001')
      expect(response.result && response.result.errorInformation && response.result.errorInformation.errorDescription).toBe('Unacceptable version requested - Client supplied a protocol version which is not supported by the server')
    })

    it('returns a 406 with invalid protocol version for accept-type', async () => {
      const tempProtocolVersion = JSON.parse(JSON.stringify(Config.PROTOCOL_VERSIONS)) // We want to make a deep clone of the config
      tempProtocolVersion.ACCEPT.DEFAULT = '0.1' // This is an invalid FSPIOP protocol version
      const headers = await Mockgen.generateRequestHeaders(path, method, resource, tempProtocolVersion)

      // Arrange
      const options = {
        method,
        url: path,
        headers
      }

      // Act
      const response = await server.inject(options)

      // Assert
      expect(response.statusCode).toBe(406)
      expect(response.result && response.result.errorInformation && response.result.errorInformation.errorCode).toBe('3001')
      expect(response.result && response.result.errorInformation && response.result.errorInformation.errorDescription).toBe('Unacceptable version requested - The Client requested an unsupported version, see extension list for supported version(s).')
    })

    it('handles when error is thrown', async () => {
      const headers = await Mockgen.generateRequestHeaders(path, method, resource, Config.PROTOCOL_VERSIONS)
      // Arrange
      const options = {
        method,
        url: path,
        headers
      }
      const err = new Error('Error occurred')
      Handler.forwardTransactionRequest.mockImplementation(async () => { throw err })

      // Act
      const response = await server.inject(options)

      // Assert
      expect(Handler.forwardTransactionRequest).toHaveBeenCalledTimes(1)
      expect(Handler.forwardTransactionRequest.mock.results[0].value).rejects.toThrow(err)
      expect(response.statusCode).toBe(202)
    })
  })

  describe('PUT', () => {
    // HTTP Method
    const method = 'put'

    it('returns a 200 response code', async () => {
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
      Handler.forwardTransactionRequest.mockImplementation(async () => { throw err })

      // Act
      const response = await server.inject(options)

      // Assert
      expect(response.statusCode).toBe(200)
      expect(Handler.forwardTransactionRequest).toHaveBeenCalledTimes(1)
      expect(Handler.forwardTransactionRequest.mock.results[0].value).rejects.toThrow(err)
    })
  })
})
