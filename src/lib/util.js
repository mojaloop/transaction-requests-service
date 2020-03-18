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

 * Crosslake
 - Lewis Daly <lewisd@crosslaketech.com>

 * ModusBox
 - Steven Oderayi <steven.oderayi@modusbox.com>

 --------------
 ******/
'use strict'

const util = require('util')
const Enum = require('@mojaloop/central-services-shared').Enum

/**
 * @function getStackOrInspect
 * @description Gets the error stack, or uses util.inspect to inspect the error
 * @param {*} err - An error object
 */
function getStackOrInspect (err) {
  return err.stack || util.inspect(err)
}

/**
 * @function getSpanTags
 * @description Returns span tags based on headers, transactionType and action.
 * @param {Object} param
 * @param {string} transactionType
 * @param {string} transactionAction
 * @returns {Object}
 */
const getSpanTags = ({ headers, payload, params }, transactionType, transactionAction) => {
  const tags = {
    transactionType,
    transactionAction,
    transactionId: (payload && payload.transactionRequestId) || (params && params.ID) || (headers && headers.ID) || undefined
  }
  if (headers && headers[Enum.Http.Headers.FSPIOP.SOURCE]) {
    tags.source = headers[Enum.Http.Headers.FSPIOP.SOURCE]
  }
  if (headers && headers[Enum.Http.Headers.FSPIOP.DESTINATION]) {
    tags.destination = headers[Enum.Http.Headers.FSPIOP.DESTINATION]
  }
  return tags
}

module.exports = {
  getStackOrInspect,
  getSpanTags
}
