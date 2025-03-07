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

 * ModusBox
 - Rajiv Mothilal <rajiv.mothilal@modusbox.com>
 - Steven Oderayi <steven.oderayi@modusbox.com>

 --------------
 ******/
'use strict'

const Logger = require('@mojaloop/central-services-logger')
const ErrorHandler = require('@mojaloop/central-services-error-handling')
const Enum = require('@mojaloop/central-services-shared').Enum
const { Endpoints, Request, HeaderValidation } = require('@mojaloop/central-services-shared').Util
const EventSdk = require('@mojaloop/event-sdk')
const Mustache = require('mustache')
const util = require('util')

const Config = require('../../lib/config.js')
const { getStackOrInspect } = require('../../lib/util')

const hubNameRegex = HeaderValidation.getHubNameRegex(Config.HUB_NAME)
const responseType = Enum.Http.ResponseTypes.JSON

/**
 * Forwards transactionRequests endpoint requests to destination FSP for processing
 *
 * @returns {boolean}
 */
const forwardTransactionRequest = async (path, headers, method, params, payload, span = null) => {
  const childSpan = span ? span.getChild('forwardTransactionRequest') : undefined
  let endpoint
  const source = headers[Enum.Http.Headers.FSPIOP.SOURCE]
  const destination = headers[Enum.Http.Headers.FSPIOP.DESTINATION]
  const payloadLocal = payload || { transactionRequestId: params.ID }
  const transactionRequestId = (payload && payload.transactionRequestId) || params.ID
  let fspiopError

  try {
    endpoint = await Endpoints.getEndpoint(Config.SWITCH_ENDPOINT, destination, Enum.EndPoints.FspEndpointTypes.FSPIOP_CALLBACK_URL_TRX_REQ_SERVICE)
    Logger.info(`Resolved PAYER party ${Enum.EndPoints.FspEndpointTypes.FSPIOP_CALLBACK_URL_TRX_REQ_SERVICE} endpoint for transactionRequest ${transactionRequestId || 'error.test.js'} to: ${util.inspect(endpoint)}`)
    if (!endpoint) {
      // we didnt get an endpoint for the payee dfsp!
      // make an error callback to the initiator
      throw ErrorHandler.Factory.createFSPIOPError(ErrorHandler.Enums.FSPIOPErrorCodes.DESTINATION_FSP_ERROR, `No ${Enum.EndPoints.FspEndpointTypes.FSPIOP_CALLBACK_URL_TRX_REQ_SERVICE} endpoint found for transactionRequest ${transactionRequestId} for ${Enum.Http.Headers.FSPIOP.DESTINATION}`, method.toUpperCase() !== Enum.Http.RestMethods.GET ? payload : undefined, source)
    }
    const url = Mustache.render(endpoint + path, {
      ID: transactionRequestId
    })
    Logger.info(`Forwarding transaction request to endpoint: ${url}`)

    const response = await Request.sendRequest({ url, headers, source, destination, method, payload: method.toUpperCase() !== Enum.Http.RestMethods.GET ? payloadLocal : undefined, responseType, span: childSpan, hubNameRegex })

    Logger.info(`Forwarded transaction request ${transactionRequestId} from ${source} to ${destination} got response ${response.status} ${response.statusText}`)

    if (childSpan && !childSpan.isFinished) {
      childSpan.finish()
    }

    return true
  } catch (err) {
    Logger.info(`Error forwarding transaction request to endpoint ${endpoint}: ${getStackOrInspect(err)}`)
    fspiopError = ErrorHandler.Factory.reformatFSPIOPError(err)
    await forwardTransactionRequestError(headers, source, Enum.EndPoints.FspEndpointTemplates.TRANSACTION_REQUEST_PUT_ERROR, Enum.Http.RestMethods.PUT, transactionRequestId, fspiopError.toApiErrorObject(Config.ERROR_HANDLING), childSpan)
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
 * Forwards transactionRequests errors to error endpoint
 *
 * @returns {undefined}
 */
const forwardTransactionRequestError = async (headers, to, path, method, transactionRequestId, payload, span = null) => {
  const childSpan = span ? span.getChild('forwardTransactionRequestError') : undefined
  let endpoint
  const source = headers[Enum.Http.Headers.FSPIOP.SOURCE]
  const destination = headers[Enum.Http.Headers.FSPIOP.DESTINATION]
  try {
    endpoint = await Endpoints.getEndpoint(Config.SWITCH_ENDPOINT, to, Enum.EndPoints.FspEndpointTypes.FSPIOP_CALLBACK_URL_TRX_REQ_SERVICE)
    Logger.info(`Resolved PAYER party ${Enum.EndPoints.FspEndpointTypes.FSPIOP_CALLBACK_URL_TRX_REQ_SERVICE} endpoint for transactionRequest ${transactionRequestId || 'error.test.js'} to: ${util.inspect(endpoint)}`)

    if (!endpoint) {
      // we didnt get an endpoint for the payee dfsp!
      // make an error callback to the initiator
      throw ErrorHandler.Factory.createFSPIOPError(ErrorHandler.Enums.FSPIOPErrorCodes.DESTINATION_FSP_ERROR, `No ${Enum.EndPoints.FspEndpointTypes.FSPIOP_CALLBACK_URL_TRX_REQ_SERVICE} endpoint found for transactionRequest ${transactionRequestId} for ${to}`, payload, source)
    }
    const url = Mustache.render(endpoint + path, {
      ID: transactionRequestId
    })

    Logger.info(`Forwarding transaction request error to endpoint: ${url}`)

    const response = await Request.sendRequest({ url, headers, source, destination, method, payload, responseType, childSpan, hubNameRegex })

    Logger.info(`Forwarding transaction request error for ${transactionRequestId} from ${source} to ${to} got response ${response.status} ${response.statusText}`)

    if (childSpan && !childSpan.isFinished) {
      childSpan.finish()
    }

    return true
  } catch (err) {
    Logger.info(`Error forwarding transaction request error to endpoint ${endpoint}: ${getStackOrInspect(err)}`)
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
  forwardTransactionRequest,
  forwardTransactionRequestError
}
