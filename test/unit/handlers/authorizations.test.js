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

const Mockgen = require('../../util/mockgen.js')
const Helper = require('../../util/helper')
const Handler = require('../../../src/domain/authorizations/authorizations')

const server = new Hapi.Server()

/**
 * Tests for /authorizations
 */
describe('/authorizations', () => {
  // URI
  const path = '/authorizations'

  beforeAll(async () => {
    await Helper.serverSetup(server)
  })

  afterAll(() => {
    server.stop()
  })

  beforeEach(() => {
    Handler.forwardAuthorizationMessage = jest.fn().mockResolvedValue()
  })

  const body = {
    authenticationType: 'OTP',
    retriesLeft: '1',
    amount: { currency: 'USD', amount: '100' },
    transactionId: 'e3a3d727-f5a7-41ec-981d-787ab05591cd',
    transactionRequestId: '15e26118-4bd7-51b2-9ce7-5b5d6733c90e',
    quote: {
      transferAmount: { currency: 'USD', amount: '100' },
      payeeReceiveAmount: { currency: 'USD', amount: '100' },
      expiration: '',
      geoCode: { latitude: '123', longitude: '123' },
      ilpPacket: 'mTdIgmCcEg',
      condition: 'hbLN'
    }
  }

  describe('POST', () => {
    // HTTP Method
    const method = 'post'

    it('returns a 200 response code', async () => {
      const request = await Mockgen.generateRequest(path, method)

      // Arrange
      const options = {
        method,
        url: path,
        headers: request.headers,
        payload: body
      }

      // Act
      const response = await server.inject(options)

      // Assert
      expect(response.statusCode).toBe(200)
      expect(Handler.forwardAuthorizationMessage).toHaveBeenCalledTimes(1)
      expect(Handler.forwardAuthorizationMessage.mock.calls[0][2]).toEqual(body)
      expect(Handler.forwardAuthorizationMessage.mock.calls[0][3]).toEqual('POST')
    })

    it('handles when an error is thrown', async () => {
      const request = await Mockgen.generateRequest(path, method)

      // Arrange
      const options = {
        method,
        url: path,
        headers: request.headers,
        payload: body
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
})
