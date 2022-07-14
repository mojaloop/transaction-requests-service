'use strict'

const EventSdk = require('@mojaloop/event-sdk')
const Enum = require('@mojaloop/central-services-shared').Enum
const ErrorHandler = require('@mojaloop/central-services-error-handling')
const Logger = require('@mojaloop/central-services-logger')
const Metrics = require('@mojaloop/central-services-metrics')
const transactionRequest = require('../../domain/transactionRequests/transactionRequests')
const LibUtil = require('../../lib/util')

/**
 * Operations on /transactionRequests/{ID}
 */
module.exports = {
  /**
   * summary: TransactionRequestsByID
   * description: The HTTP request GET /transactionRequests/&lt;ID&gt; is used to get information regarding an earlier created or requested transaction request. The &lt;ID&gt; in the URI should contain the transactionRequestId that was used for the creation of the transaction request.
   * parameters: accept
   * produces: application/json
   * responses: 202, 400, 401, 403, 404, 405, 406, 501, 503
   */
  get: async (context, request, h) => {
    const histTimerEnd = Metrics.getHistogram(
      'transaction_requests_get',
      'Get transaction request by Id',
      ['success']
    ).startTimer()
    const span = request.span
    try {
      const tags = LibUtil.getSpanTags(request, Enum.Events.Event.Type.TRANSACTION_REQUEST, Enum.Events.Event.Action.LOOKUP)
      span.setTags(tags)
      await span.audit({
        headers: request.headers,
        payload: request.payload
      }, EventSdk.AuditEventAction.start)
      transactionRequest.forwardTransactionRequest(Enum.EndPoints.FspEndpointTemplates.TRANSACTION_REQUEST_GET, request.headers, Enum.Http.RestMethods.GET, request.params, request.payload, span).catch(err => {
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
  },
  /**
   * summary: TransactionRequestsByID
   * description: The callback PUT /transactionRequests/&lt;ID&gt; is used to inform the client of a requested or created transaction request. The &lt;ID&gt; in the URI should contain the transactionRequestId that was used for the creation of the transaction request, or the &lt;ID&gt; that was used in the GET /transactionRequests/&lt;ID&gt;.
   * parameters: body, content-length
   * produces: application/json
   * responses: 200, 400, 401, 403, 404, 405, 406, 501, 503
   */
  put: async (context, request, h) => {
    const histTimerEnd = Metrics.getHistogram(
      'transaction_requests_put',
      'Put transaction request by Id',
      ['success']
    ).startTimer()
    const span = request.span
    try {
      const tags = LibUtil.getSpanTags(request, Enum.Events.Event.Type.TRANSACTION_REQUEST, Enum.Events.Event.Action.PUT)
      span.setTags(tags)
      await span.audit({
        headers: request.headers,
        payload: request.payload
      }, EventSdk.AuditEventAction.start)
      transactionRequest.forwardTransactionRequest(Enum.EndPoints.FspEndpointTemplates.TRANSACTION_REQUEST_PUT, request.headers, Enum.Http.RestMethods.PUT, request.params, request.payload, span).catch(err => {
        // Do nothing with the error - forwardTransactionRequest takes care of async errors
        request.server.log(['error'], `ERROR - forwardTransactionRequest: ${LibUtil.getStackOrInspect(err)}`)
      })
      histTimerEnd({ success: true })
      return h.response().code(Enum.Http.ReturnCodes.OK.CODE)
    } catch (err) {
      const fspiopError = ErrorHandler.Factory.reformatFSPIOPError(err)
      Logger.error(fspiopError)
      histTimerEnd({ success: false })
      throw fspiopError
    }
  }
}
