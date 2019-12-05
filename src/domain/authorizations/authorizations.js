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

const Logger = require('@mojaloop/central-services-logger')
const ErrorHandler = require('@mojaloop/central-services-error-handling')
const Enum = require('@mojaloop/central-services-shared').Enum
const Endpoint = require('@mojaloop/central-services-shared').Util.Endpoints
const requests = require('@mojaloop/central-services-shared').Util.Request
const util = require('util')

const Config = require('../../lib/config.js')
const { getStackOrInspect } = require('../../lib/util')

/**
 * Forwards GET authorizations endpoint requests to destination FSP for processing
 *
 * @returns {undefined}
 */
const forwardAuthorizationMessage = async (headers, transactionRequestId, payload, method) => {
  let endpoint
  const fspiopSource = headers[Enum.Http.Headers.FSPIOP.SOURCE]
  const fspiopDest = headers[Enum.Http.Headers.FSPIOP.DESTINATION]
  const messageType = method === Enum.Http.RestMethods.GET ? 'request' : 'response'
  const payloadLocal = method === Enum.Http.RestMethods.GET ? undefined : payload

  try {
    endpoint = await Endpoint.getEndpoint(Config.SWITCH_ENDPOINT, fspiopDest, Enum.EndPoints.FspEndpointTypes.FSPIOP_CALLBACK_URL_AUTHORIZATIONS)
    Logger.info(`Resolved party ${Enum.EndPoints.FspEndpointTypes.FSPIOP_CALLBACK_URL_AUTHORIZATIONS} endpoint for authorizations ${messageType} ${transactionRequestId || 'error.test.js'} to: ${util.inspect(endpoint)}`)
    if (!endpoint) {
      throw ErrorHandler.Factory.createFSPIOPError(ErrorHandler.Enums.FSPIOPErrorCodes.DESTINATION_FSP_ERROR, `No ${Enum.EndPoints.FspEndpointTypes.FSPIOP_CALLBACK_URL_AUTHORIZATIONS} endpoint found for transactionRequest ${transactionRequestId} for ${Enum.Http.Headers.FSPIOP.DESTINATION}`, undefined, fspiopSource)
    }
    const query = method === Enum.Http.RestMethods.GET ? '?' + (new URLSearchParams(payload).toString()) : ''
    const fullUrl = `${endpoint}/authorizations/${transactionRequestId}${query}`
    Logger.info(`Forwarding authorization request to endpoint: ${fullUrl}`)
    // Network errors lob an exception. Bare in mind 3xx 4xx and 5xx are not network errors
    // so we need to wrap the request below in a `try catch` to handle network errors
    let res
    try {
      res = await requests.sendRequest(fullUrl, headers, fspiopSource, fspiopDest, method, payloadLocal)
    } catch (e) {
      throw ErrorHandler.Factory.createFSPIOPError(ErrorHandler.Enums.FSPIOPErrorCodes.DESTINATION_COMMUNICATION_ERROR, `Network error forwarding authorization ${messageType}: ${getStackOrInspect(e)}`, 'Network error', fspiopSource)
    }
    Logger.info(`Forwarding authorization ${messageType} for transactionRequestId ${transactionRequestId} from ${fspiopSource} to ${fspiopDest} got response ${res.status} ${res.statusText}`)
    // handle non network related errors below
    if (!res.ok) {
      throw ErrorHandler.Factory.createFSPIOPError(ErrorHandler.Enums.FSPIOPErrorCodes.DESTINATION_COMMUNICATION_ERROR, 'Got non-success response forwarding authorization ' + messageType, res.statusText, fspiopSource)
    }
    return true
  } catch (err) {
    Logger.info(`Error forwarding authorization ${messageType} to endpoint ${endpoint}: ${getStackOrInspect(err)}`)
    const errorHeaders = Object.assign({}, headers, {
      'fspiop-source': Enum.Http.Headers.FSPIOP.SWITCH.value,
      'fspiop-destination': fspiopSource
    })
    forwardAuthorizationError(errorHeaders, transactionRequestId, err)
    throw ErrorHandler.Factory.reformatFSPIOPError(err)
  }
}

/**
 * Forwards PUT authorization errors to destination FSP
 *
 * @returns {undefined}
 */
const forwardAuthorizationError = async (headers, transactionRequestId, payload) => {
  let endpoint
  const fspiopSource = headers[Enum.Http.Headers.FSPIOP.SOURCE]
  const fspiopDestination = headers[Enum.Http.Headers.FSPIOP.DESTINATION]
  try {
    endpoint = await Endpoint.getEndpoint(Config.SWITCH_ENDPOINT, fspiopDestination, Enum.EndPoints.FspEndpointTypes.FSPIOP_CALLBACK_URL_AUTHORIZATIONS)
    Logger.info(`Resolved party ${Enum.EndPoints.FspEndpointTypes.FSPIOP_CALLBACK_URL_AUTHORIZATIONS} endpoint for authorization error for transactionRequest ${transactionRequestId || 'error.test.js'} to: ${util.inspect(endpoint)}`)

    if (!endpoint) {
      throw ErrorHandler.Factory.createFSPIOPError(ErrorHandler.Enums.FSPIOPErrorCodes.DESTINATION_FSP_ERROR, `No ${Enum.EndPoints.FspEndpointTypes.FSPIOP_CALLBACK_URL_AUTHORIZATIONS} endpoint found to send authorization error for transaction request ${transactionRequestId} for FSP ${fspiopDestination}`, payload, fspiopSource)
    }
    const fullUrl = `${endpoint}/authorizations/${transactionRequestId}/error`

    Logger.info(`Forwarding authorization error to endpoint: ${fullUrl}`)
    // Network errors lob an exception. Bare in mind 3xx 4xx and 5xx are not network errors
    // so we need to wrap the request below in a `try catch` to handle network errors
    let res
    try {
      res = await requests.sendRequest(fullUrl, headers, fspiopSource, fspiopDestination, Enum.Http.RestMethods.PUT, payload || undefined)
    } catch (e) {
      throw ErrorHandler.Factory.createFSPIOPError(ErrorHandler.Enums.FSPIOPErrorCodes.DESTINATION_FSP_ERROR, `Network error forwarding authorization error: ${getStackOrInspect(e)}`, 'Network error', fspiopSource)
    }
    Logger.info(`Forwarding authorization error response for transactionRequest ${transactionRequestId} from ${fspiopSource} to ${fspiopDestination} got response ${res.status} ${res.statusText}`)

    // handle non network related errors below
    if (!res.ok) {
      throw ErrorHandler.Factory.createFSPIOPError(ErrorHandler.Enums.FSPIOPErrorCodes.DESTINATION_COMMUNICATION_ERROR, 'Got non-success response forwarding authorization error response', res.statusText, fspiopSource)
    }
    return true
  } catch (err) {
    Logger.info(`Error forwarding authorization error response to endpoint ${endpoint}: ${getStackOrInspect(err)}`)
    throw ErrorHandler.Factory.reformatFSPIOPError(err)
  }
}

module.exports = {
  forwardAuthorizationMessage,
  forwardAuthorizationError
}
