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

 * Donovan Changfoot <don@coil.com>

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
const Endpoint = require('@mojaloop/central-services-shared').Util.Endpoints
const Request = require('@mojaloop/central-services-shared').Util.Request
const ErrorHandler = require('@mojaloop/central-services-error-handling')

const Authorizations = require('../../../../src/domain/authorizations/authorizations')
const TestHelper = require('../../../util/helper')

describe('Authorizations', () => {
  describe('forwardAuthorization', () => {
    it('forwards a GET request', async () => {
      Endpoint.getEndpoint = jest.fn().mockResolvedValue('http://dfsp2')
      Request.sendRequest = jest.fn().mockResolvedValue({
        ok: true,
        status: 202,
        statusText: 'Accepted'
      })
      const headers = TestHelper.defaultHeaders()
      const transactionRequestId = 'aef-123'
      const queryParams = {
        amount: '101.00',
        currency: 'USD',
        retriesLeft: '3',
        authenticationType: '0'
      }

      // Act
      const response = await Authorizations.forwardAuthorizationMessage(headers, transactionRequestId, queryParams, Enum.Http.RestMethods.GET)

      // Assert
      expect(response).toBe(true)
      expect(Request.sendRequest).toHaveBeenCalledWith(
        'http://dfsp2/authorizations/aef-123?amount=101.00&currency=USD&retriesLeft=3&authenticationType=0',
        headers,
        headers[Enum.Http.Headers.FSPIOP.SOURCE],
        headers[Enum.Http.Headers.FSPIOP.DESTINATION],
        Enum.Http.RestMethods.GET,
        undefined
      )
    })

    it('forwards a PUT request', async () => {
      // Arrange
      Endpoint.getEndpoint = jest.fn().mockResolvedValue('http://dfsp2')
      Request.sendRequest = jest.fn().mockResolvedValue({
        ok: true,
        status: 202,
        statusText: 'Accepted'
      })
      const headers = TestHelper.defaultHeaders()
      const transactionRequestId = 'aef-123'
      const payload = {
        authenticationInfo: {
          authenticationType: 'OTP',
          authenticationValue: '1234'
        },
        responseType: 'ENTERED'
      }

      // Act
      const response = await Authorizations.forwardAuthorizationMessage(headers, transactionRequestId, payload, Enum.Http.RestMethods.PUT)

      // Assert
      expect(response).toBe(true)
      expect(Request.sendRequest).toHaveBeenCalledWith(
        'http://dfsp2/authorizations/aef-123',
        headers,
        headers[Enum.Http.Headers.FSPIOP.SOURCE],
        headers[Enum.Http.Headers.FSPIOP.DESTINATION],
        Enum.Http.RestMethods.PUT,
        payload
      )
    })

    it('sends authorization error response to the source if no destination endpoint is found', async () => {
      // Arrange
      const headers = TestHelper.defaultHeaders()
      const transactionRequestId = 'aef-123'
      const queryParams = {
        amount: '101.00',
        currency: 'USD',
        retriesLeft: '3',
        authenticationType: '0'
      }
      Endpoint.getEndpoint = jest.fn().mockResolvedValueOnce(undefined).mockResolvedValue('http://dfsp1')
      Request.sendRequest = jest.fn().mockResolvedValue({
        ok: true,
        status: 202,
        statusText: 'Accepted'
      })

      // Act
      await expect(Authorizations.forwardAuthorizationMessage(headers, transactionRequestId, queryParams)).rejects.toThrowError(new RegExp('No FSPIOP_CALLBACK_URL_AUTHORIZATIONS endpoint found for transactionRequest aef-123 for fspiop-destination'))

      // Assert
      const expectedErrorHeaders = Object.assign(headers, { 'fspiop-source': Enum.Http.Headers.FSPIOP.SWITCH.value, 'fspiop-destination': headers['fspiop-source'] })
      expect(Request.sendRequest).toHaveBeenCalledTimes(1)
      expect(Request.sendRequest.mock.calls[0][0]).toEqual('http://dfsp1/authorizations/aef-123/error')
      expect(Request.sendRequest.mock.calls[0][1]).toEqual(expectedErrorHeaders)
      expect(Request.sendRequest.mock.calls[0][2]).toEqual(Enum.Http.Headers.FSPIOP.SWITCH.value)
      expect(Request.sendRequest.mock.calls[0][3]).toEqual(headers[Enum.Http.Headers.FSPIOP.DESTINATION])
    })

    it('sends authorization error response to the source if the request fails', async () => {
      // Arrange
      const headers = TestHelper.defaultHeaders()
      const transactionRequestId = 'aef-123'
      const queryParams = {
        amount: '101.00',
        currency: 'USD',
        retriesLeft: '3',
        authenticationType: '0'
      }
      Endpoint.getEndpoint = jest.fn().mockResolvedValueOnce('http://dfsp2').mockResolvedValue('http://dfsp1')
      Request.sendRequest = jest.fn().mockImplementationOnce(() => {
        throw ErrorHandler.Factory.createFSPIOPError(ErrorHandler.Enums.FSPIOPErrorCodes.DESTINATION_COMMUNICATION_ERROR, 'Failed to send HTTP request to host', new Error(), headers['fspiop-source'], [{ key: 'cause', value: {} }])
      }).mockResolvedValue({
        ok: true,
        status: 202,
        statusText: 'Accepted'
      })

      // Act
      await expect(Authorizations.forwardAuthorizationMessage(headers, transactionRequestId, queryParams, Enum.Http.RestMethods.GET)).rejects.toThrowError(new RegExp('Failed to send HTTP request to host'))

      // Assert
      const expectedErrorHeaders = Object.assign(headers, { 'fspiop-source': Enum.Http.Headers.FSPIOP.SWITCH.value, 'fspiop-destination': headers['fspiop-source'] })
      expect(Request.sendRequest).toHaveBeenCalledTimes(2)
      expect(Request.sendRequest.mock.calls[1][0]).toEqual('http://dfsp1/authorizations/aef-123/error')
      expect(Request.sendRequest.mock.calls[1][1]).toEqual(expectedErrorHeaders)
      expect(Request.sendRequest.mock.calls[1][2]).toEqual(Enum.Http.Headers.FSPIOP.SWITCH.value)
      expect(Request.sendRequest.mock.calls[1][3]).toEqual(headers[Enum.Http.Headers.FSPIOP.DESTINATION])
    })
  })

  describe('forwardAuthorizationError', () => {
    it('sends the error request ', async () => {
      // Arrange
      Endpoint.getEndpoint = jest.fn().mockResolvedValue('http://dfsp2')
      Request.sendRequest = jest.fn().mockResolvedValue({
        ok: true,
        status: 202,
        statusText: 'Accepted'
      })
      const headers = TestHelper.defaultHeaders()

      // Act
      const result = await Authorizations.forwardAuthorizationError(headers, 'aef-123', new Error('Error'))

      // Assert
      expect(result).toBe(true)
      expect(Request.sendRequest).toHaveBeenCalledWith('http://dfsp2/authorizations/aef-123/error', headers, headers['fspiop-source'], headers['fspiop-destination'], Enum.Http.RestMethods.PUT, new Error('Error'))
    })

    it('throws error if no destination endpoint is found', async () => {
      // Arrange
      Endpoint.getEndpoint = jest.fn().mockResolvedValue(undefined)
      Request.sendRequest = jest.fn()

      // Act
      await expect(Authorizations.forwardAuthorizationError(TestHelper.defaultHeaders(), 'aef-123', new Error('Error'))).rejects.toThrowError(new RegExp('No FSPIOP_CALLBACK_URL_AUTHORIZATIONS endpoint found to send authorization error for transaction request aef-123 for FSP dfsp2'))

      // Assert
      expect(Request.sendRequest).not.toHaveBeenCalled()
    })

    it('throws error if if the request fails', async () => {
      // Arrange
      Endpoint.getEndpoint = jest.fn().mockResolvedValue('http://dfsp2')
      Request.sendRequest = jest.fn().mockImplementationOnce(() => {
        throw ErrorHandler.Factory.createFSPIOPError(ErrorHandler.Enums.FSPIOPErrorCodes.DESTINATION_COMMUNICATION_ERROR, 'Failed to send HTTP request to host', new Error('Error'), '', [{ key: 'cause', value: {} }])
      })

      // Act, Assert
      await expect(Authorizations.forwardAuthorizationError(TestHelper.defaultHeaders(), 'aef-123', new Error('Error'))).rejects.toThrowError(new RegExp('Failed to send HTTP request to host'))
    })
  })
})
