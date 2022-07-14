'use strict'

const EventSdk = require('@mojaloop/event-sdk')
const Enum = require('@mojaloop/central-services-shared').Enum
const ErrorHandler = require('@mojaloop/central-services-error-handling')
const Logger = require('@mojaloop/central-services-logger')
const Metrics = require('@mojaloop/central-services-metrics')
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
  post: async (context, request, h) => {
    const histTimerEnd = Metrics.getHistogram(
      'transaction_requests_get',
      'Post transaction request',
      ['success']
    ).startTimer()
    const span = request.span
    try {
      const tags = LibUtil.getSpanTags(request, Enum.Events.Event.Type.TRANSACTION_REQUEST, Enum.Events.Event.Action.POST)
      span.setTags(tags)
      await span.audit({
        headers: request.headers,
        payload: request.payload
      }, EventSdk.AuditEventAction.start)
      transactionRequest.forwardTransactionRequest(Enum.EndPoints.FspEndpointTemplates.TRANSACTION_REQUEST_POST, request.headers, Enum.Http.RestMethods.POST, request.params, request.payload, span).catch(err => {
        // Do nothing with the error - forwardTransactionRequest takes care of async errors
        request.server.log(['error'], `ERROR - forwardTransactionRequest: ${LibUtil.getStackOrInspect(err)}`)
      })
      histTimerEnd({ success: true })
      return h.response().code(Enum.Http.ReturnCodes.ACCEPTED.CODE)
    } catch (err) {
      const fspiopError = ErrorHandler.Factory.reformatFSPIOPError(err)
      Logger.error(fspiopError)
      histTimerEnd({ success: false })
      throw fspiopError
    }
  }
}
