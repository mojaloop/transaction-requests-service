'use strict'

const Enum = require('../../lib/enum')
const transactionRequest = require('../../domain/transactionRequests/transactionRequests')

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
  get: function (request, h) {
    transactionRequest.forwardTransactionRequest(request, Enum.endpoints.TRANSACTION_REQUEST_GET)
    return h.response().code(202)
  },
  /**
   * summary: TransactionRequestsByID
   * description: The callback PUT /transactionRequests/&lt;ID&gt; is used to inform the client of a requested or created transaction request. The &lt;ID&gt; in the URI should contain the transactionRequestId that was used for the creation of the transaction request, or the &lt;ID&gt; that was used in the GET /transactionRequests/&lt;ID&gt;.
   * parameters: body, content-length
   * produces: application/json
   * responses: 200, 400, 401, 403, 404, 405, 406, 501, 503
   */
  put: function (request, h) {
    transactionRequest.forwardTransactionRequest(request, Enum.endpoints.TRANSACTION_REQUEST_PUT)
    return h.response().code(200)
  }
}
