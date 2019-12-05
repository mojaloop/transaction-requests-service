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
      Request.sendRequest = jest.fn().mockImplementationOnce(() => { throw new Error('Error with request.') }).mockResolvedValue({
        ok: true,
        status: 202,
        statusText: 'Accepted'
      })

      // Act
      await expect(Authorizations.forwardAuthorizationMessage(headers, transactionRequestId, queryParams, Enum.Http.RestMethods.GET)).rejects.toThrowError(new RegExp('Network error forwarding authorization request: Error: Error with request'))

      // Assert
      const expectedErrorHeaders = Object.assign(headers, { 'fspiop-source': Enum.Http.Headers.FSPIOP.SWITCH.value, 'fspiop-destination': headers['fspiop-source'] })
      expect(Request.sendRequest).toHaveBeenCalledTimes(2)
      expect(Request.sendRequest.mock.calls[1][0]).toEqual('http://dfsp1/authorizations/aef-123/error')
      expect(Request.sendRequest.mock.calls[1][1]).toEqual(expectedErrorHeaders)
      expect(Request.sendRequest.mock.calls[1][2]).toEqual(Enum.Http.Headers.FSPIOP.SWITCH.value)
      expect(Request.sendRequest.mock.calls[1][3]).toEqual(headers[Enum.Http.Headers.FSPIOP.DESTINATION])
    })

    it('sends authorization error response to the source if forwarding request was successful, but response was not', async () => {
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
      Request.sendRequest = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      }).mockResolvedValue({
        ok: true,
        status: 202,
        statusText: 'Accepted'
      })

      // Act
      await expect(Authorizations.forwardAuthorizationMessage(headers, transactionRequestId, queryParams, Enum.Http.RestMethods.GET)).rejects.toThrowError(new RegExp('Got non-success response forwarding authorization request'))

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
      Request.sendRequest = jest.fn().mockImplementationOnce(() => { throw new Error('Error with request.') })

      // Act, Assert
      await expect(Authorizations.forwardAuthorizationError(TestHelper.defaultHeaders(), 'aef-123', new Error('Error'))).rejects.toThrowError(new RegExp('Network error forwarding authorization error'))
    })

    it('throws error if forwarding request was successful, but response was not', async () => {
      // Arrange
      Endpoint.getEndpoint = jest.fn().mockResolvedValue('http://dfsp2')
      Request.sendRequest = jest.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      })

      // Act, Assert
      await expect(Authorizations.forwardAuthorizationError(TestHelper.defaultHeaders(), 'aef-123', new Error('Error'))).rejects.toThrowError(new RegExp('Got non-success response forwarding authorization error response'))
    })
  })
})
