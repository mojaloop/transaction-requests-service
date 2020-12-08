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

const ErrorHandler = require('@mojaloop/central-services-error-handling')
const Logger = require('@mojaloop/central-services-logger')

// const Mockgen = require('../../util/mockgen.js').mockRequest
const Mockgen = require('../../util/mockgen.js')
const Helper = require('../../util/helper')
const Handler = require('../../../src/domain/transactionRequests/transactionRequests')
// const OpenApiRequestGenerator = require('../../util/openApiRequestGenerator')

let sandbox
const server = new Hapi.Server()

/**
 * Tests for /transactionRequests
 */
describe('/transactionRequests', () => {
  // URI
  const path = '/transactionRequests'

  beforeAll(async () => {
    sandbox = Sinon.createSandbox()
    await Helper.serverSetup(server)
  })

  beforeEach(() => {
    sandbox.stub(Handler, 'forwardTransactionRequest').returns(Promise.resolve())
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
      const request = await Mockgen.generateRequest(path, method, overrideReq)

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
      const request = await Mockgen.generateRequest(path, method, overrideReq)

      // Setup request opts
      const options = {
        method,
        url: path,
        headers: request.headers,
        payload: request.body
      }

      const err = new Error('Error occured')
      Handler.forwardTransactionRequest = sandbox.stub().throws(err)

      // Act
      const response = await server.inject(options)

      // Assert
      expect(response.statusCode).toBe(500)
      expect(Logger.error).toHaveBeenCalledWith(ErrorHandler.Factory.reformatFSPIOPError(err))
    })
  })
})
