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

const Enum = require('../../lib/enum')
const participantEndpointModel = require('../../models/participantEndpoint/participantEndpoint')
const Errors = require('../../lib/errors')
const Logger = require('@mojaloop/central-services-shared').Logger
const util = require('util')
const Mustache = require('mustache')
const Utils = require('../../lib/util')
const requests = require('../../lib/request')

/**
 * Forwards transactionRequests endpoint requests to destination FSP for processing
 *
 * @returns {undefined}
 */
const forwardTransactionRequest = async (request, path) => {
  let endpoint
  const fspiopSource = request.headers['fspiop-source']
  const fspiopDest = request.headers['fspiop-destination']
  const payload = request.payload || { transactionRequestId: request.params.ID }
  try {
    endpoint = await participantEndpointModel.getEndpoint(fspiopDest, Enum.endpointTypes.FSPIOP_CALLBACK_URL_TRANSACTION)
    Logger.info(`Resolved PAYER party ${Enum.endpointTypes.FSPIOP_CALLBACK_URL_TRANSACTION} endpoint for transactionRequest ${payload.transactionRequestId || 'error.test.js'} to: ${util.inspect(endpoint)}`)
    if (!endpoint) {
      // we didnt get an endpoint for the payee dfsp!
      // make an error callback to the initiator
      throw new Errors.FSPIOPError(request.method.toUpperCase() !== Enum.restMethods.GET ? payload : undefined,
        `No ${Enum.endpointTypes.FSPIOP_CALLBACK_URL_TRANSACTION} endpoint found for transactionRequest ${payload.transactionRequestId} for ${fspiopDest}`, fspiopSource,
        Errors.ApiErrorCodes.DESTINATION_FSP_ERROR)
    }
    const fullUrl = Mustache.render(endpoint + path, {
      ID: payload.transactionRequestId || request.params.ID
    })
    Logger.info(`Forwarding transaction request to endpoint: ${fullUrl}`)
    // Network errors lob an exception. Bare in mind 3xx 4xx and 5xx are not network errors
    // so we need to wrap the request below in a `try catch` to handle network errors
    let res
    try {
      res = await requests.sendRequest(fullUrl, Utils.generateRequestHeaders(request.headers), request.method, request.method.toUpperCase() !== Enum.restMethods.GET ? payload : undefined)
    } catch (e) {
      throw new Errors.FSPIOPError('Network error', `Network error forwarding quote request: ${e.stack || util.inspect(e)}`,
        fspiopSource, Errors.ApiErrorCodes.DESTINATION_COMMUNICATION_ERROR)
    }
    Logger.info(`Forwarding transaction request ${payload.transactionRequestId} from ${fspiopSource} to ${fspiopDest} got response ${res.status} ${res.statusText}`)
    // handle non network related errors below
    if (!res.ok) {
      throw new Errors.FSPIOPError(res.statusText, 'Got non-success response forwarding transaction request',
        fspiopSource, Errors.ApiErrorCodes.DESTINATION_COMMUNICATION_ERROR)
    }
    return true
  } catch (err) {
    Logger.info(`Error forwarding transaction request to endpoint ${endpoint}: ${err.stack || util.inspect(err)}`)
    forwardTransactionRequestError(request.headers, fspiopSource, Enum.endpoints.TRANSACTION_REQUEST_PUT_ERROR, Enum.restMethods.PUT, request.params.ID, err)
    throw err
  }
}

/**
 * Forwards transactionRequests errors to error endpoint
 *
 * @returns {undefined}
 */
const forwardTransactionRequestError = async (headers, to, path, method, transactionRequestId, payload) => {
  let endpoint
  const fspiopSource = headers['fspiop-source']
  try {
    endpoint = await participantEndpointModel.getEndpoint(to, Enum.endpointTypes.FSPIOP_CALLBACK_URL_TRANSACTION)
    Logger.info(`Resolved PAYER party ${Enum.endpointTypes.FSPIOP_CALLBACK_URL_TRANSACTION} endpoint for transactionRequest ${transactionRequestId || 'error.test.js'} to: ${util.inspect(endpoint)}`)

    if (!endpoint) {
      // we didnt get an endpoint for the payee dfsp!
      // make an error callback to the initiator
      throw new Errors.FSPIOPError(payload,
        `No ${Enum.endpointTypes.FSPIOP_CALLBACK_URL_TRANSACTION} endpoint found for transactionRequest ${transactionRequestId} for ${to}`, fspiopSource,
        Errors.ApiErrorCodes.DESTINATION_FSP_ERROR)
    }
    const fullUrl = Mustache.render(endpoint + path, {
      ID: transactionRequestId
    })

    Logger.info(`Forwarding transaction request to endpoint: ${fullUrl}`)
    // Network errors lob an exception. Bare in mind 3xx 4xx and 5xx are not network errors
    // so we need to wrap the request below in a `try catch` to handle network errors
    let res
    try {
      res = await requests.sendRequest(fullUrl, Utils.generateRequestHeaders(headers), method, payload || undefined)
    } catch (e) {
      throw new Errors.FSPIOPError('Network error', `Network error forwarding quote request: ${e.stack || util.inspect(e)}`,
        fspiopSource, Errors.ApiErrorCodes.DESTINATION_COMMUNICATION_ERROR)
    }
    Logger.info(`Forwarding transaction request ${transactionRequestId} from ${fspiopSource} to ${to} got response ${res.status} ${res.statusText}`)

    // handle non network related errors below
    if (!res.ok) {
      throw new Errors.FSPIOPError(res.statusText, 'Got non-success response forwarding transaction request',
        fspiopSource, Errors.ApiErrorCodes.DESTINATION_COMMUNICATION_ERROR)
    }
    return true
  } catch (err) {
    Logger.info(`Error forwarding transaction request to endpoint ${endpoint}: ${err.stack || util.inspect(err)}`)
    throw err
  }
}

module.exports = {
  forwardTransactionRequest,
  forwardTransactionRequestError
}
