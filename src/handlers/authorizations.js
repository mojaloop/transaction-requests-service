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

 * ModusBox
 - Paweł Marzec <pawel.marzec@modusbox.com>

 --------------
 ******/
'use strict'

const EventSdk = require('@mojaloop/event-sdk')
const Enum = require('@mojaloop/central-services-shared').Enum
const authorizations = require('../domain/authorizations/authorizations')
const ErrorHandler = require('@mojaloop/central-services-error-handling')
const Logger = require('@mojaloop/central-services-logger')
const Metrics = require('@mojaloop/central-services-metrics')
const LibUtil = require('../lib/util')

/**
 * Operations on /authorizations
 */
module.exports = {
  /**
   * summary: AuthorizationsByID
   * description: The POST /authorizations is used to request the PISP to start with the User the authorization process
   * parameters: body, content-length
   * produces: application/json
   * responses: 200, 400, 401, 403, 404, 405, 406, 501, 503
   */
  post: async (request, h) => {
    const histTimerEnd = Metrics.getHistogram(
      'authorizations_post',
      'Post authorizations',
      ['success']
    ).startTimer()
    const span = request.span
    try {
      const tags = LibUtil.getSpanTags(
        request,
        Enum.Events.Event.Type.AUTHORIZATION,
        Enum.Events.Event.Action.POST
      )
      span.setTags(tags)
      await span.audit(
        {
          headers: request.headers,
          payload: request.payload
        },
        EventSdk.AuditEventAction.start
      )
      authorizations.forwardAuthorizationMessage(
        request.headers,
        request.payload.transactionRequestId,
        request.payload,
        Enum.Http.RestMethods.POST,
        span
      )
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
