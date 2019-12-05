'use strict'

const Enum = require('@mojaloop/central-services-shared').Enum
const authorizations = require('../../../domain/authorizations/authorizations')

/**
 * Operations on /authorizations/{ID}/error
 */
module.exports = {
  /**
     * summary: AuthorizationsErrorByID
     * description: If the server is unable to process the authorization, or another processing error occurs, the error callback PUT /authorizations/&lt;ID&gt;/error is used. The &lt;ID&gt; in the URI should contain the transactionRequestId that was used for the creation of the transaction request.
     * parameters: ID, body, content-length, content-type, date, x-forwarded-for, fspiop-source, fspiop-destination, fspiop-encryption, fspiop-signature, fspiop-uri, fspiop-http-method
     * produces: application/json
     * responses: 200, 400, 401, 403, 404, 405, 406, 501, 503
     */
  put: function (request, h) {
    authorizations.forwardAuthorizationError(request.headers, request.params.ID, request.payload)
    return h.response().code(Enum.Http.ReturnCodes.OK.CODE)
  }
}
