'use strict'

const EventSdk = require('@mojaloop/event-sdk')
const Enum = require('@mojaloop/central-services-shared').Enum
const transactionRequest = require('../../../domain/transactionRequests/transactionRequests')
const LibUtil = require('../../../lib/util')
const ErrorHandler = require('@mojaloop/central-services-error-handling')
const Logger = require('@mojaloop/central-services-logger')
const Metrics = require('@mojaloop/central-services-metrics')

/**
 * Operations on /transactionRequests/{ID}/error
 */
module.exports = {
  /**
     * summary: TransactionRequestsErrorByID
     * description: If the server is unable to find or create a transaction request, or another processing error occurs, the error callback PUT /transactionRequests/&lt;ID&gt;/error is used. The &lt;ID&gt; in the URI should contain the transactionRequestId that was used for the creation of the transaction request, or the &lt;ID&gt; that was used in the GET /transactionRequests/&lt;ID&gt;.
     * parameters: ID, body, content-length, content-type, date, x-forwarded-for, fspiop-source, fspiop-destination, fspiop-encryption, fspiop-signature, fspiop-uri, fspiop-http-method
     * produces: application/json
     * responses: 200, 400, 401, 403, 404, 405, 406, 501, 503
     */
  put: async (context, request, h) => {
    const histTimerEnd = Metrics.getHistogram(
      'transaction_requests_error_put',
      'Put Transaction Request error by Id',
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
      transactionRequest.forwardTransactionRequestError(request.headers, request.headers['fspiop-destination'], Enum.EndPoints.FspEndpointTemplates.TRANSACTION_REQUEST_PUT_ERROR, Enum.Http.RestMethods.PUT, request.params.ID, request.payload, span).catch(err => {
        // Do nothing with the error - forwardTransactionRequestError takes care of async errors
        request.server.log(['error'], `ERROR - forwardTransactionRequestError: ${LibUtil.getStackOrInspect(err)}`)
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
