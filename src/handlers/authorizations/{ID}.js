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

 * Donovan Changfoot <don@coil.com>

 --------------
 ******/
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
