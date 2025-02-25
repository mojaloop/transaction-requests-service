/*****
 License
 --------------
 Copyright © 2020-2025 Mojaloop Foundation
 The Mojaloop files are made available by the Mojaloop Foundation under the Apache License, Version 2.0 (the "License") and you may not use these files except in compliance with the License. You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, the Mojaloop files are distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

 Contributors
 --------------
 This is the official list of the Mojaloop project contributors for this file.
 Names of the original copyright holders (individuals or organizations)
 should be listed with a '*' in the first column. People who have
 contributed from an organization can be listed under the organization
 that actually holds the copyright for their contributions (see the
 Mojaloop Foundation for an example). Those individuals should have
 their names indented and be marked with a '-'. Email address can be added
 optionally within square brackets <email>.

 * Mojaloop Foundation
 - Name Surname <name.surname@mojaloop.io>

 * Coil
 - Donovan Changfoot <don@coil.com>

 * ModusBox
 - Steven Oderayi <steven.oderayi@modusbox.com>

 --------------
 ******/
'use strict'

jest.mock('@mojaloop/central-services-logger', () => {
  return {
    info: jest.fn() // suppress info output
  }
})

jest.mock('@mojaloop/central-services-shared', () => {
  const temp = jest.requireActual('@mojaloop/central-services-shared')
  temp.Enum.EndPoints.FspEndpointTypes.FSPIOP_CALLBACK_URL_AUTHORIZATIONS = 'FSPIOP_CALLBACK_URL_AUTHORIZATIONS'
  return temp
})

const Enum = require('@mojaloop/central-services-shared').Enum
const { Endpoints, Request, HeaderValidation } = require('@mojaloop/central-services-shared').Util
const ErrorHandler = require('@mojaloop/central-services-error-handling')

const Authorizations = require('../../../../src/domain/authorizations/authorizations')
const TestHelper = require('../../../util/helper')
const MockSpan = require('../../../util/mockgen').mockSpan
const Config = require('../../../../src/lib/config')

let SpanMock = MockSpan()
const hubNameRegex = HeaderValidation.getHubNameRegex(Config.HUB_NAME)

describe('Authorizations', () => {
  // URI
  const resource = 'authorizations'

  beforeEach(() => {
    SpanMock = MockSpan()
  })

  describe('forwardAuthorizationMessage', () => {
    it('forwards a GET request', async () => {
      Endpoints.getEndpoint = jest.fn().mockResolvedValue('http://dfsp2')
      Request.sendRequest = jest.fn().mockResolvedValue({
        ok: true,
        status: 202,
        statusText: 'Accepted'
      })
      const headers = TestHelper.defaultHeaders(resource, Config.PROTOCOL_VERSIONS)
      const transactionRequestId = 'aef-123'
      const queryParams = {
        amount: '101.00',
        currency: 'USD',
        retriesLeft: '3',
        authenticationType: '0'
      }

      // Act
      const response = await Authorizations.forwardAuthorizationMessage(headers, transactionRequestId, queryParams, Enum.Http.RestMethods.GET, SpanMock)

      // Assert
      expect(response).toBe(true)
      expect(Request.sendRequest).toHaveBeenCalledWith({
        url: 'http://dfsp2/authorizations/aef-123?amount=101.00&currency=USD&retriesLeft=3&authenticationType=0',
        headers,
        source: headers[Enum.Http.Headers.FSPIOP.SOURCE],
        destination: headers[Enum.Http.Headers.FSPIOP.DESTINATION],
        method: Enum.Http.RestMethods.GET,
        payload: undefined,
        responseType: 'json',
        span: SpanMock,
        hubNameRegex
      })
    })

    it('forwards a PUT request', async () => {
      // Arrange
      Endpoints.getEndpoint = jest.fn().mockResolvedValue('http://dfsp2')
      Request.sendRequest = jest.fn().mockResolvedValue({
        ok: true,
        status: 202,
        statusText: 'Accepted'
      })
      const headers = TestHelper.defaultHeaders(resource, Config.PROTOCOL_VERSIONS)
      const transactionRequestId = 'aef-123'
      const payload = {
        authenticationInfo: {
          authenticationType: 'OTP',
          authenticationValue: '1234'
        },
        responseType: 'ENTERED'
      }

      // Act
      const response = await Authorizations.forwardAuthorizationMessage(headers, transactionRequestId, payload, Enum.Http.RestMethods.PUT, SpanMock)

      // Assert
      expect(response).toBe(true)
      expect(Request.sendRequest).toHaveBeenCalledWith({
        url: 'http://dfsp2/authorizations/aef-123',
        headers,
        source: headers[Enum.Http.Headers.FSPIOP.SOURCE],
        destination: headers[Enum.Http.Headers.FSPIOP.DESTINATION],
        method: Enum.Http.RestMethods.PUT,
        payload,
        responseType: 'json',
        span: SpanMock,
        hubNameRegex
      })
    })

    it('sends authorization error response to the source if no destination endpoint is found', async () => {
      // Arrange
      const headers = TestHelper.defaultHeaders(resource, Config.PROTOCOL_VERSIONS)
      const transactionRequestId = 'aef-123'
      const queryParams = {
        amount: '101.00',
        currency: 'USD',
        retriesLeft: '3',
        authenticationType: '0'
      }
      Endpoints.getEndpoint = jest.fn().mockResolvedValueOnce(undefined).mockResolvedValue('http://dfsp1')
      Request.sendRequest = jest.fn().mockResolvedValue({
        ok: true,
        status: 202,
        statusText: 'Accepted'
      })

      // Act
      await expect(Authorizations.forwardAuthorizationMessage(headers, transactionRequestId, queryParams)).rejects.toThrowError(/No FSPIOP_CALLBACK_URL_AUTHORIZATIONS endpoint found for transactionRequest aef-123 for fspiop-destination/)

      // Assert
      const expectedErrorHeaders = Object.assign(headers, { 'fspiop-source': Config.HUB_NAME, 'fspiop-destination': headers['fspiop-source'] })
      expect(Request.sendRequest).toHaveBeenCalledTimes(1)
      const args = Request.sendRequest.mock.calls[0][0]
      expect(args.url).toEqual('http://dfsp1/authorizations/aef-123/error')
      expect(args.headers).toEqual(expectedErrorHeaders)
      expect(args.source).toEqual(Config.HUB_NAME)
      expect(args.destination).toEqual(headers[Enum.Http.Headers.FSPIOP.DESTINATION])
    })

    it('sends authorization error response to the source if the request fails', async () => {
      // Arrange
      const headers = TestHelper.defaultHeaders(resource, Config.PROTOCOL_VERSIONS)
      const transactionRequestId = 'aef-123'
      const queryParams = {
        amount: '101.00',
        currency: 'USD',
        retriesLeft: '3',
        authenticationType: '0'
      }
      Endpoints.getEndpoint = jest.fn().mockResolvedValueOnce('http://dfsp2').mockResolvedValue('http://dfsp1')
      Request.sendRequest = jest.fn().mockImplementationOnce(() => {
        throw ErrorHandler.Factory.createFSPIOPError(ErrorHandler.Enums.FSPIOPErrorCodes.DESTINATION_COMMUNICATION_ERROR, 'Failed to send HTTP request to host', new Error(), headers['fspiop-source'], [{ key: 'cause', value: {} }])
      }).mockResolvedValue({
        ok: true,
        status: 202,
        statusText: 'Accepted'
      })

      // Act
      await expect(Authorizations.forwardAuthorizationMessage(headers, transactionRequestId, queryParams, Enum.Http.RestMethods.GET, SpanMock)).rejects.toThrowError(/Failed to send HTTP request to host/)

      // Assert
      const expectedErrorHeaders = Object.assign(headers, { 'fspiop-source': Config.HUB_NAME, 'fspiop-destination': headers['fspiop-source'] })
      expect(Request.sendRequest).toHaveBeenCalledTimes(2)
      const args = Request.sendRequest.mock.calls[1][0]
      expect(args.url).toEqual('http://dfsp1/authorizations/aef-123/error')
      expect(args.headers).toEqual(expectedErrorHeaders)
      expect(args.source).toEqual(Config.HUB_NAME)
      expect(args.destination).toEqual(headers[Enum.Http.Headers.FSPIOP.DESTINATION])
    })
  })

  describe('forwardAuthorizationError', () => {
    it('sends the error request ', async () => {
      // Arrange
      Endpoints.getEndpoint = jest.fn().mockResolvedValue('http://dfsp2')
      Request.sendRequest = jest.fn().mockResolvedValue({
        ok: true,
        status: 202,
        statusText: 'Accepted'
      })
      const headers = TestHelper.defaultHeaders(resource, Config.PROTOCOL_VERSIONS)

      // Act
      const result = await Authorizations.forwardAuthorizationError(headers, 'aef-123', ErrorHandler.Factory.createFSPIOPError(ErrorHandler.Enums.FSPIOPErrorCodes.DESTINATION_COMMUNICATION_ERROR, 'Error'), SpanMock)

      // Assert
      expect(result).toBe(true)
      expect(Request.sendRequest).toHaveBeenCalledWith({
        url: 'http://dfsp2/authorizations/aef-123/error',
        headers,
        source: headers['fspiop-source'],
        destination: headers['fspiop-destination'],
        method: Enum.Http.RestMethods.PUT,
        payload: new Error('Error'),
        responseType: 'json',
        span: SpanMock,
        hubNameRegex
      })
    })

    it('throws error if no destination endpoint is found', async () => {
      // Arrange
      Endpoints.getEndpoint = jest.fn().mockResolvedValue(undefined)
      Request.sendRequest = jest.fn()

      // Act
      await expect(Authorizations.forwardAuthorizationError(TestHelper.defaultHeaders(resource, Config.PROTOCOL_VERSIONS), 'aef-123', ErrorHandler.Factory.createFSPIOPError(ErrorHandler.Enums.FSPIOPErrorCodes.DESTINATION_COMMUNICATION_ERROR, 'Error'), SpanMock)).rejects.toThrowError(/No FSPIOP_CALLBACK_URL_AUTHORIZATIONS endpoint found to send authorization error for transaction request aef-123 for FSP dfsp2/)

      // Assert
      expect(Request.sendRequest).not.toHaveBeenCalled()
    })

    it('throws error if if the request fails', async () => {
      // Arrange
      Endpoints.getEndpoint = jest.fn().mockResolvedValue('http://dfsp2')
      Request.sendRequest = jest.fn().mockImplementationOnce(() => {
        throw ErrorHandler.Factory.createFSPIOPError(ErrorHandler.Enums.FSPIOPErrorCodes.DESTINATION_COMMUNICATION_ERROR, 'Failed to send HTTP request to host', new Error('Error'), '', [{ key: 'cause', value: {} }])
      })

      // Act, Assert
      await expect(Authorizations.forwardAuthorizationError(TestHelper.defaultHeaders(resource, Config.PROTOCOL_VERSIONS), 'aef-123', ErrorHandler.Factory.createFSPIOPError(ErrorHandler.Enums.FSPIOPErrorCodes.DESTINATION_COMMUNICATION_ERROR, 'Error'), SpanMock)).rejects.toThrowError(/Failed to send HTTP request to host/)
    })
  })
})
