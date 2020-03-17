'use strict'

const EventSdk = require('@mojaloop/event-sdk')
const Enum = require('@mojaloop/central-services-shared').Enum
const transactionRequest = require('../domain/transactionRequests/transactionRequests')
const LibUtil = require('../lib/util')

/**
 * Operations on /transactionRequests
 */
module.exports = {
  /**
   * summary: TransactionRequests
   * description: The HTTP request POST /transactionRequests is used to request the creation of a transaction request for the provided financial transaction in the server.
   * parameters: body, accept, content-length, content-type, date, x-forwarded-for, fspiop-source, fspiop-destination, fspiop-encryption, fspiop-signature, fspiop-uri, fspiop-http-method
   * produces: application/json
   * responses: 202, 400, 401, 403, 404, 405, 406, 501, 503
   */
  post: async (request, h) => {
    const span = request.span
    const tags = LibUtil.getSpanTags(request, Enum.Events.Event.Type.TRANSACTION_REQUEST, Enum.Events.Event.Action.POST)
    span.setTags(tags)
    await span.audit({
      headers: request.headers,
      payload: request.payload
    }, EventSdk.AuditEventAction.start)
    transactionRequest.forwardTransactionRequest(Enum.EndPoints.FspEndpointTemplates.TRANSACTION_REQUEST_POST, request.headers, Enum.Http.RestMethods.POST, request.params, request.payload, span)
    return h.response().code(Enum.Http.ReturnCodes.ACCEPTED.CODE)
  }
}
