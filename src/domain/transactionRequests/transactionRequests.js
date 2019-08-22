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

 * Rajiv Mothilal <rajiv.mothilal@modusbox.com>

 --------------
 ******/
'use strict'

const Enum = require('@mojaloop/central-services-shared').Enum
const participantEndpointModel = require('../../models/participantEndpoint/participantEndpoint')
const Logger = require('@mojaloop/central-services-shared').Logger
const util = require('util')
const Mustache = require('mustache')
const Utils = require('../../lib/util')
const requests = require('@mojaloop/central-services-shared').Util.Request
const ErrorHandler = require('@mojaloop/central-services-error-handling')

/**
 * Forwards transactionRequests endpoint requests to destination FSP for processing
 *
 * @returns {undefined}
 */
const forwardTransactionRequest = async (request, path) => {
  let endpoint
  const payload = request.payload || { transactionRequestId: request.params.ID }
  try {
    endpoint = await participantEndpointModel.getEndpoint(Enum.Http.Headers.FSPIOP.DESTINATION, Enum.EndPoints.FspEndpointTypes.FSPIOP_CALLBACK_URL_TRANSACTION)
    Logger.info(`Resolved PAYER party ${Enum.EndPoints.FspEndpointTypes.FSPIOP_CALLBACK_URL_TRANSACTION} endpoint for transactionRequest ${payload.transactionRequestId || 'error.test.js'} to: ${util.inspect(endpoint)}`)
    if (!endpoint) {
      // we didnt get an endpoint for the payee dfsp!
      // make an error callback to the initiator
      throw ErrorHandler.Factory.createFSPIOPError(ErrorHandler.Enums.FSPIOPErrorCodes.DESTINATION_FSP_ERROR, `No ${Enum.EndPoints.FspEndpointTypes.FSPIOP_CALLBACK_URL_TRANSACTION} endpoint found for transactionRequest ${payload.transactionRequestId} for ${Enum.Http.Headers.FSPIOP.DESTINATION}`, request.method.toUpperCase() !== Enum.Http.RestMethods.GET ? payload : undefined, Enum.Http.Headers.FSPIOP.SOURCE)
    }
    const fullUrl = Mustache.render(endpoint + path, {
      ID: payload.transactionRequestId || request.params.ID
    })
    Logger.info(`Forwarding transaction request to endpoint: ${fullUrl}`)
    // Network errors lob an exception. Bare in mind 3xx 4xx and 5xx are not network errors
    // so we need to wrap the request below in a `try catch` to handle network errors
    let res
    try {
      res = await requests.sendRequest(fullUrl, request.headers, Enum.Http.Headers.FSPIOP.SOURCE, Enum.Http.Headers.FSPIOP.DESTINATION, request.method, request.method.toUpperCase() !== Enum.Http.RestMethods.GET ? payload : undefined, Enum.Http.ResponseTypes.JSON)
    } catch (e) {
      throw ErrorHandler.Factory.createFSPIOPError(ErrorHandler.Enums.FSPIOPErrorCodes.DESTINATION_COMMUNICATION_ERROR, `Network error forwarding quote request: ${e.stack || util.inspect(e)}`, 'Network error', Enum.Http.Headers.FSPIOP.SOURCE)
    }
    Logger.info(`Forwarding transaction request ${payload.transactionRequestId} from ${Enum.Http.Headers.FSPIOP.SOURCE} to ${Enum.Http.Headers.FSPIOP.DESTINATION} got response ${res.status} ${res.statusText}`)
    // handle non network related errors below
    if (!res.ok) {
      throw ErrorHandler.Factory.createFSPIOPError(ErrorHandler.Enums.FSPIOPErrorCodes.DESTINATION_COMMUNICATION_ERROR, 'Got non-success response forwarding transaction request', res.statusText, Enum.Http.Headers.FSPIOP.SOURCE)
    }
    return true
  } catch (err) {
    Logger.info(`Error forwarding transaction request to endpoint ${endpoint}: ${err.stack || util.inspect(err)}`)
    forwardTransactionRequestError(request.headers, Enum.Http.Headers.FSPIOP.SOURCE, Enum.EndPoints.FspEndpointTemplates.TRANSACTION_REQUEST_PUT_ERROR, Enum.Http.RestMethods.PUT, request.params.ID, err)
    throw ErrorHandler.Factory.reformatFSPIOPError(err)
  }
}

/**
 * Forwards transactionRequests errors to error endpoint
 *
 * @returns {undefined}
 */
const forwardTransactionRequestError = async (headers, to, path, method, transactionRequestId, payload) => {
  let endpoint
  try {
    endpoint = await participantEndpointModel.getEndpoint(to, Enum.EndPoints.FspEndpointTypes.FSPIOP_CALLBACK_URL_TRANSACTION)
    Logger.info(`Resolved PAYER party ${Enum.EndPoints.FspEndpointTypes.FSPIOP_CALLBACK_URL_TRANSACTION} endpoint for transactionRequest ${transactionRequestId || 'error.test.js'} to: ${util.inspect(endpoint)}`)

    if (!endpoint) {
      // we didnt get an endpoint for the payee dfsp!
      // make an error callback to the initiator
      throw ErrorHandler.Factory.createFSPIOPError(ErrorHandler.Enums.FSPIOPErrorCodes.DESTINATION_FSP_ERROR, `No ${Enum.EndPoints.FspEndpointTypes.FSPIOP_CALLBACK_URL_TRANSACTION} endpoint found for transactionRequest ${transactionRequestId} for ${to}`, payload, Enum.Http.Headers.FSPIOP.SOURCE)
    }
    const fullUrl = Mustache.render(endpoint + path, {
      ID: transactionRequestId
    })

    Logger.info(`Forwarding transaction request to endpoint: ${fullUrl}`)
    // Network errors lob an exception. Bare in mind 3xx 4xx and 5xx are not network errors
    // so we need to wrap the request below in a `try catch` to handle network errors
    let res
    try {
      res = await requests.sendRequest(fullUrl, headers, Enum.Http.Headers.FSPIOP.SOURCE, Enum.Http.Headers.FSPIOP.DESTINATION, method, payload || undefined, Enum.Http.ResponseTypes.JSON)
    } catch (e) {
      throw ErrorHandler.Factory.createFSPIOPError(ErrorHandler.Enums.FSPIOPErrorCodes.DESTINATION_FSP_ERROR, `Network error forwarding quote request: ${e.stack || util.inspect(e)}`, 'Network error', Enum.Http.Headers.FSPIOP.SOURCE)
    }
    Logger.info(`Forwarding transaction request ${transactionRequestId} from ${Enum.Http.Headers.FSPIOP.SOURCE} to ${to} got response ${res.status} ${res.statusText}`)

    // handle non network related errors below
    if (!res.ok) {
      throw ErrorHandler.Factory.createFSPIOPError(ErrorHandler.Enums.FSPIOPErrorCodes.DESTINATION_COMMUNICATION_ERROR, 'Got non-success response forwarding transaction request', res.statusText, Enum.Http.Headers.FSPIOP.SOURCE)
    }
    return true
  } catch (err) {
    Logger.info(`Error forwarding transaction request to endpoint ${endpoint}: ${err.stack || util.inspect(err)}`)
    throw ErrorHandler.Factory.reformatFSPIOPError(err)
  }
}

module.exports = {
  forwardTransactionRequest,
  forwardTransactionRequestError
}
