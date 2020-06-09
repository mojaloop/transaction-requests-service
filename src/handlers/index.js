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
 - Rajiv Mothilal <rajiv.mothilal@modusbox.com>

 --------------
 ******/

'use strict'

const OpenapiBackend = require('@mojaloop/central-services-shared').Util.OpenapiBackend
const transactionRequests = require('./transactionRequests')
const transactionRequestsId = require('./transactionRequests/{ID}')
const transactionRequestsErrorByID = require('./transactionRequests/{ID}/error')
const health = require('./health')
const metrics = require('./metrics')
const authorizationsId = require('./authorizations/{ID}')
const authorizationsIdError = require('./authorizations/{ID}/error')

module.exports = {
  HealthGet: health.get,
  MetricsGet: metrics.get,
  TransactionRequestsErrorByID: transactionRequestsErrorByID.put,
  TransactionRequestsByID: transactionRequestsId.get,
  TransactionRequestsByIDPut: transactionRequestsId.put,
  TransactionRequests: transactionRequests.post,
  AuthorizationsIDResponse: authorizationsId.get,
  AuthorizationsIDPutResponse: authorizationsId.put,
  AuthorizationsErrorByID: authorizationsIdError.put,
  validationFail: OpenapiBackend.validationFail,
  notFound: OpenapiBackend.notFound,
  methodNotAllowed: OpenapiBackend.methodNotAllowed
}
