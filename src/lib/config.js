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
 - Name Surname <name.surname@gatesfoundation.com>

 * Rajiv Mothilal <rajiv.mothilal@modusbox.com>

 --------------
 ******/

'use strict'

const RC = require('parse-strings-in-object')(require('rc')('ES', require('../../config/default.json')))

const DEFAULT_PROTOCOL_VERSION = {
  CONTENT: '1.1',
  ACCEPT: {
    DEFAULT: '1', // This is not currently used for unit test purposes, and it is here for consistency between services.
    VALIDATELIST: [
      '1',
      '1.1'
    ]
  }
}

const T_PROTOCOL_VERSION = { ...DEFAULT_PROTOCOL_VERSION, ...RC.PROTOCOL_VERSIONS }
if (RC.PROTOCOL_VERSIONS) T_PROTOCOL_VERSION.ACCEPT = { ...DEFAULT_PROTOCOL_VERSION.ACCEPT, ...RC.PROTOCOL_VERSIONS.ACCEPT }
if (T_PROTOCOL_VERSION.ACCEPT && T_PROTOCOL_VERSION.ACCEPT.VALIDATELIST && (typeof T_PROTOCOL_VERSION.ACCEPT.VALIDATELIST === 'string' || T_PROTOCOL_VERSION.ACCEPT.VALIDATELIST instanceof String)) {
  T_PROTOCOL_VERSION.ACCEPT.VALIDATELIST = JSON.parse(T_PROTOCOL_VERSION.ACCEPT.VALIDATELIST)
}

module.exports = {
  PORT: RC.PORT,
  ERROR_HANDLING: RC.ERROR_HANDLING,
  SWITCH_ENDPOINT: RC.SWITCH_ENDPOINT,
  ENDPOINT_CACHE_CONFIG: RC.ENDPOINT_CACHE_CONFIG,
  INSTRUMENTATION_METRICS_DISABLED: RC.INSTRUMENTATION.METRICS.DISABLED,
  INSTRUMENTATION_METRICS_LABELS: RC.INSTRUMENTATION.METRICS.labels,
  INSTRUMENTATION_METRICS_CONFIG: RC.INSTRUMENTATION.METRICS.config,
  PROTOCOL_VERSIONS: T_PROTOCOL_VERSION
}
