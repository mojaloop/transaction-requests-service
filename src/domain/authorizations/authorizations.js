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

 * Coil
 - Donovan Changfoot <don@coil.com>

 * ModusBox
 - Steven Oderayi <steven.oderayi@modusbox.com>

 --------------
 ******/
'use strict'

const Logger = require('@mojaloop/central-services-logger')
const ErrorHandler = require('@mojaloop/central-services-error-handling')
const Enum = require('@mojaloop/central-services-shared').Enum
const Endpoint = require('@mojaloop/central-services-shared').Util.Endpoints
const EventSdk = require('@mojaloop/event-sdk')
const requests = require('@mojaloop/central-services-shared').Util.Request
const util = require('util')

const Config = require('../../lib/config.js')
const { getStackOrInspect } = require('../../lib/util')

/**
 * Forwards GET authorizations endpoint requests to destination FSP for processing
 * @param {object} headers Headers object of the request
 * @param {string} transactionRequestId Transaction request id that the authorization is for
 * @param {object} payload Body of the PUT request or the query parameters in an object for a GET request
 * @param {string} method The http method (GET or PUT)
 * @throws {FSPIOPError} Will throw an error if no endpoint to forward the authorization message to is found, if there are network errors or if there is a bad response
 * @returns {Promise<true>}
 */
const forwardAuthorizationMessage = async (headers, transactionRequestId, payload, method, span = null) => {
  const childSpan = span ? span.getChild('forwardAuthorizationMessage') : undefined
  let endpoint
  const fspiopSource = headers[Enum.Http.Headers.FSPIOP.SOURCE]
  const fspiopDest = headers[Enum.Http.Headers.FSPIOP.DESTINATION]
  const messageType = method === Enum.Http.RestMethods.GET ? 'request' : 'response'
  const payloadLocal = method === Enum.Http.RestMethods.GET ? undefined : payload
  let fspiopError

  try {
    endpoint = await Endpoint.getEndpoint(Config.SWITCH_ENDPOINT, fspiopDest, Enum.EndPoints.FspEndpointTypes.FSPIOP_CALLBACK_URL_AUTHORIZATIONS)

    Logger.info(`Resolved party ${Enum.EndPoints.FspEndpointTypes.FSPIOP_CALLBACK_URL_AUTHORIZATIONS} endpoint for authorizations ${messageType} ${transactionRequestId || 'error.test.js'} to: ${util.inspect(endpoint)}`)

    if (!endpoint) {
      throw ErrorHandler.Factory.createFSPIOPError(ErrorHandler.Enums.FSPIOPErrorCodes.DESTINATION_FSP_ERROR, `No ${Enum.EndPoints.FspEndpointTypes.FSPIOP_CALLBACK_URL_AUTHORIZATIONS} endpoint found for transactionRequest ${transactionRequestId} for ${Enum.Http.Headers.FSPIOP.DESTINATION}`, undefined, fspiopSource)
    }

    const query = method === Enum.Http.RestMethods.GET ? '?' + (new URLSearchParams(payload).toString()) : ''
    const fullUrl = `${endpoint}/authorizations/${transactionRequestId}${query}`

    Logger.info(`Forwarding authorization request to endpoint: ${fullUrl}`)

    const response = await requests.sendRequest(fullUrl, headers, fspiopSource, fspiopDest, method, payloadLocal, Enum.Http.ResponseTypes.JSON, childSpan)

    Logger.info(`Forwarding authorization ${messageType} for transactionRequestId ${transactionRequestId} from ${fspiopSource} to ${fspiopDest} got response ${response.status} ${response.statusText}`)

    if (childSpan && !childSpan.isFinished) {
      childSpan.finish()
    }

    return true
  } catch (err) {
    Logger.info(`Error forwarding authorization ${messageType} to endpoint ${endpoint}: ${getStackOrInspect(err)}`)

    const errorHeaders = {
      ...headers,
      'fspiop-source': Enum.Http.Headers.FSPIOP.SWITCH.value,
      'fspiop-destination': fspiopSource
    }
    fspiopError = ErrorHandler.Factory.reformatFSPIOPError(err)
    await forwardAuthorizationError(errorHeaders, transactionRequestId, fspiopError.toApiErrorObject(Config.ERROR_HANDLING), childSpan)
    throw fspiopError
  } finally {
    if (childSpan && !childSpan.isFinished && fspiopError) {
      const state = new EventSdk.EventStateMetadata(EventSdk.EventStatusType.failed, fspiopError.apiErrorCode.code, fspiopError.apiErrorCode.message)
      await childSpan.error(fspiopError, state)
      await childSpan.finish(fspiopError.message, state)
    }
  }
}

/**
 * Forwards PUT authorization errors to destination FSP
 * @param {object} headers Headers object of the request
 * @param {string} transactionRequestId Transaction request id that the authorization is for
 * @param {object} payload Body of the request
 * @throws {FSPIOPError} Will throw an error if no endpoint to forward the authorization error to is found, if there are network errors or if there is a bad response.
 * @returns {Promise<true>}
 */
const forwardAuthorizationError = async (headers, transactionRequestId, payload, span = null) => {
  const childSpan = span ? span.getChild('forwardAuthorizationError') : undefined
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

    const response = await requests.sendRequest(fullUrl, headers, fspiopSource, fspiopDestination, Enum.Http.RestMethods.PUT, payload || undefined, Enum.Http.ResponseTypes.JSON, childSpan)

    Logger.info(`Forwarding authorization error response for transactionRequest ${transactionRequestId} from ${fspiopSource} to ${fspiopDestination} got response ${response.status} ${response.statusText}`)

    if (childSpan && !childSpan.isFinished) {
      childSpan.finish()
    }

    return true
  } catch (err) {
    Logger.info(`Error forwarding authorization error response to endpoint ${endpoint}: ${getStackOrInspect(err)}`)
    const fspiopError = ErrorHandler.Factory.reformatFSPIOPError(err)
    if (childSpan && !childSpan.isFinished) {
      const state = new EventSdk.EventStateMetadata(EventSdk.EventStatusType.failed, fspiopError.apiErrorCode.code, fspiopError.apiErrorCode.message)
      await childSpan.error(fspiopError, state)
      await childSpan.finish(fspiopError.message, state)
    }
    throw fspiopError
  }
}

module.exports = {
  forwardAuthorizationMessage,
  forwardAuthorizationError
}
