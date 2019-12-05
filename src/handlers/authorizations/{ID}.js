'use strict'

const Enum = require('@mojaloop/central-services-shared').Enum
const authorizations = require('../../domain/authorizations/authorizations')

/**
 * Operations on /authorizations/{ID}
 */
module.exports = {
  /**
   * summary: AuthorizationsByID
   * description: The HTTP request GET /authorizations/&lt;ID&gt; is used to get authorization for an earlier created or requested transaction request. The &lt;ID&gt; in the URI should contain the transactionRequestId that was used for the creation of the transaction request.
   * parameters: accept
   * produces: application/json
   * responses: 202, 400, 401, 403, 404, 405, 406, 501, 503
   */
  get: function (request, h) {
    authorizations.forwardAuthorizationMessage(request.headers, request.params.ID, request.query, Enum.Http.RestMethods.GET)
    return h.response().code(Enum.Http.ReturnCodes.ACCEPTED.CODE)
  },
  /**
   * summary: AuthorizationsByID
   * description: The callback PUT /authorizations/&lt;ID&gt; is used to return authorization information for a requested or created transaction request. The &lt;ID&gt; in the URI should contain the transactionRequestId that was used for the creation of the transaction request.
   * parameters: body, content-length
   * produces: application/json
   * responses: 200, 400, 401, 403, 404, 405, 406, 501, 503
   */
  put: function (request, h) {
    authorizations.forwardAuthorizationMessage(request.headers, request.params.ID, request.payload, Enum.Http.RestMethods.PUT)
    return h.response().code(Enum.Http.ReturnCodes.OK.CODE)
  }
}
