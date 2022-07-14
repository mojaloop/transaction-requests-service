'use strict'

jest.mock('@mojaloop/central-services-logger', () => {
  return {
    info: jest.fn(),
    debug: jest.fn(),
    error: jest.fn()
  }
})

const Sinon = require('sinon')
const Hapi = require('@hapi/hapi')

// const Mockgen = require('../../util/mockgen.js').mockRequest
const Mockgen = require('../../util/mockgen.js')
const Helper = require('../../util/helper')
const Handler = require('../../../src/domain/transactionRequests/transactionRequests')
// const OpenApiRequestGenerator = require('../../util/openApiRequestGenerator')
const Config = require('../../../src/lib/config')

let sandbox
const server = new Hapi.Server()

/**
 * Tests for /transactionRequests
 */
describe('/transactionRequests', () => {
  // URI
  const resource = 'transactionRequests'
  const path = `/${resource}`

  beforeAll(async () => {
    sandbox = Sinon.createSandbox()
    await Helper.serverSetup(server)
  })

  beforeEach(() => {
    Handler.forwardTransactionRequest = jest.fn().mockResolvedValue()
  })

  afterAll(() => {
    server.stop()
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('POST', () => {
    // HTTP Method
    const method = 'post'
    // Override request refs because OpenApiRequestGenerator is unable to generate unicode test data
    const overrideReq = {
      request: [
        {
          id: 'payee.personalInfo.complexName.firstName',
          pattern: 'Česko| Dvořák'
        },
        {
          id: 'payee.personalInfo.complexName.middleName',
          pattern: 'John|David|Michael|Chris|Mike|Mark|Paul|Daniel|James|Maria'
        },
        {
          id: 'payee.personalInfo.complexName.lastName',
          pattern: 'John|David|Michael|Chris|Mike|Mark|Paul|Daniel|James|Maria'
        }
      ]
    }
    // const requests = Mockgen().requestsAsync('/transactionRequests', 'post')

    it('returns a 202 response code', async () => {
      // Generate request
      const request = await Mockgen.generateRequest(path, method, resource, Config.PROTOCOL_VERSIONS, overrideReq)

      // Setup request opts
      const options = {
        method,
        url: path,
        headers: request.headers,
        payload: request.body
      }

      // Act
      const response = await server.inject(options)

      // Assert
      expect(response.statusCode).toBe(202)
    })

    it('handles when forwardTransactionRequest throws error', async () => {
      // Generate request
      const request = await Mockgen.generateRequest(path, method, resource, Config.PROTOCOL_VERSIONS, overrideReq)

      // Setup request opts
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
      expect(response.statusCode).toBe(202)
      expect(Handler.forwardTransactionRequest).toHaveBeenCalledTimes(1)
      expect(Handler.forwardTransactionRequest.mock.results[0].value).rejects.toThrow(err)
    })
  })
})
