/*****
 License
 --------------
 Copyright © 2017 Bill & Melinda Gates Foundation
 The Mojaloop files are made available by the Bill & Melinda Gates Foundation under the Apache License, Version 2.0 (the "License") and you may not use these files except in compliance with the License. You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing, the Mojaloop files are distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 Contributors
 --------------
 This is the official list of the Mojaloop project contributors for this file.
 Names of the original copyright holders (individuals or organizations)
 should be listed with a '*' in the first column. People who have
 contributed from an organization can be listed under the organization
 that actually holds the copyright for their contributions (see the
 Gates Foundation organization for an example). Those individuals should have
 their names indented and be marked with a '-'. Email address can be added
 optionally within square brackets <email>.
 * Gates Foundation

 * Crosslake
 - Lewis Daly <lewisd@crosslaketech.com>

 --------------
 ******/

'use strict'

jest.mock('@mojaloop/central-services-logger', () => {
  return {
    info: jest.fn() // suppress info output
  }
})

const Sinon = require('sinon')
const Enum = require('@mojaloop/central-services-shared').Enum
const Endpoint = require('@mojaloop/central-services-shared').Util.Endpoints
const Request = require('@mojaloop/central-services-shared').Util.Request

const TransactionRequests = require('../../../../src/domain/transactionRequests/transactionRequests')
const TestHelper = require('../../../util/helper')

let sandbox
describe('transactionRequests', () => {
  beforeAll(() => {
    sandbox = Sinon.createSandbox()
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('forwardTransactionRequest', () => {
    it('forwards a POST request when the payload is undefined', async () => {
      // Arrange
      sandbox.stub(Endpoint, 'getEndpoint').resolves('http://localhost:3000')
      sandbox.stub(Request, 'sendRequest').resolves({
        ok: true,
        status: 202,
        statusText: 'Accepted'
      })
      const options = [
        Enum.EndPoints.FspEndpointTemplates.TRANSACTION_REQUEST_POST,
        TestHelper.defaultHeaders(),
        'post',
        { ID: '12345' },
        null
      ]

      // Act
      const result = await TransactionRequests.forwardTransactionRequest(...options)

      // Assert
      expect(result).toBe(true)
    })

    it('handles when the endpoint could not be found', async () => {
      // Arrange
      sandbox.stub(Endpoint, 'getEndpoint').resolves(undefined)
      sandbox.stub(Request, 'sendRequest').resolves({
        ok: true,
        status: 202,
        statusText: 'Accepted'
      })
      const options = [
        Enum.EndPoints.FspEndpointTemplates.TRANSACTION_REQUEST_POST,
        TestHelper.defaultHeaders(),
        'post',
        { ID: '12345' },
        { transactionRequestId: '12345' }
      ]

      // Act
      const action = async () => TransactionRequests.forwardTransactionRequest(...options)

      // Assert
      await expect(action()).rejects.toThrowError(new RegExp('No FSPIOP_CALLBACK_URL_TRANSACTION endpoint found for transactionRequest'))
    })

    it('handles when the the request fails', async () => {
      // Arrange
      sandbox.stub(Endpoint, 'getEndpoint').resolves('http://localhost:3000')
      sandbox.stub(Request, 'sendRequest').throws(new Error('Error with request.'))
      const options = [
        Enum.EndPoints.FspEndpointTemplates.TRANSACTION_REQUEST_POST,
        TestHelper.defaultHeaders(),
        'post',
        { ID: '12345' },
        { transactionRequestId: '12345' }
      ]

      // Act
      const action = async () => TransactionRequests.forwardTransactionRequest(...options)

      // Assert
      await expect(action()).rejects.toThrowError(new RegExp('Network error forwarding quote request:'))
    })

    it('handles when forwarding request was successful, but response was not', async () => {
      // Arrange
      sandbox.stub(Endpoint, 'getEndpoint').resolves('http://localhost:3000')
      sandbox.stub(Request, 'sendRequest').resolves({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      })
      const options = [
        Enum.EndPoints.FspEndpointTemplates.TRANSACTION_REQUEST_POST,
        TestHelper.defaultHeaders(),
        'post',
        { ID: '12345' },
        null
      ]

      // Act
      const action = async () => TransactionRequests.forwardTransactionRequest(...options)

      // Assert
      await expect(action()).rejects.toThrowError(new RegExp('Got non-success response forwarding transaction request'))
    })

    it('handles missing payload and params.ID', async () => {
      // Arrange
      sandbox.stub(Endpoint, 'getEndpoint').resolves('http://localhost:3000')
      sandbox.stub(Request, 'sendRequest').resolves({
        ok: true,
        status: 202,
        statusText: 'Accepted'
      })
      const options = [
        Enum.EndPoints.FspEndpointTemplates.TRANSACTION_REQUEST_GET,
        TestHelper.defaultHeaders(),
        'get',
        { },
        null
      ]

      // Act
      const result = await TransactionRequests.forwardTransactionRequest(...options)

      // Assert
      expect(result).toBe(true)
    })
  })

  describe('forwardTransactionRequestError', () => {
    it('sends the error request ', async () => {
      // Arrange
      sandbox.stub(Endpoint, 'getEndpoint').resolves('http://localhost:3000')
      sandbox.stub(Request, 'sendRequest').resolves({
        ok: true,
        status: 202,
        statusText: 'Accepted'
      })
      const options = [
        TestHelper.defaultHeaders(),
        Enum.Http.Headers.FSPIOP.SOURCE,
        Enum.EndPoints.FspEndpointTemplates.TRANSACTION_REQUEST_PUT_ERROR,
        Enum.Http.RestMethods.PUT,
        '12345',
        new Error('Could not find endpoints')
      ]

      // Act
      // const action = async () => await TransactionRequests.forwardTransactionRequestError(...options)
      const result = await TransactionRequests.forwardTransactionRequestError(...options)

      // Assert
      expect(result).toBe(true)
    })

    it('handles an undefined payload', async () => {
      // Arrange
      sandbox.stub(Endpoint, 'getEndpoint').resolves('http://localhost:3000')
      sandbox.stub(Request, 'sendRequest').resolves({
        ok: true,
        status: 202,
        statusText: 'Accepted'
      })
      const options = [
        TestHelper.defaultHeaders(),
        Enum.Http.Headers.FSPIOP.SOURCE,
        Enum.EndPoints.FspEndpointTemplates.TRANSACTION_REQUEST_PUT_ERROR,
        Enum.Http.RestMethods.PUT,
        '12345'
      ]

      // Act
      // const action = async () => await TransactionRequests.forwardTransactionRequestError(...options)
      const result = await TransactionRequests.forwardTransactionRequestError(...options)

      // Assert
      expect(result).toBe(true)
    })

    it('handles a missing transactionRequestId', async () => {
      // Arrange
      sandbox.stub(Endpoint, 'getEndpoint').resolves('http://localhost:3000')
      sandbox.stub(Request, 'sendRequest').resolves({
        ok: true,
        status: 202,
        statusText: 'Accepted'
      })
      const options = [
        TestHelper.defaultHeaders(),
        Enum.Http.Headers.FSPIOP.SOURCE,
        Enum.EndPoints.FspEndpointTemplates.TRANSACTION_REQUEST_PUT_ERROR,
        Enum.Http.RestMethods.PUT
      ]

      // Act
      // const action = async () => await TransactionRequests.forwardTransactionRequestError(...options)
      const result = await TransactionRequests.forwardTransactionRequestError(...options)

      // Assert
      expect(result).toBe(true)
    })
  })
})
