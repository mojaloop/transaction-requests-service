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
 * - Name Surname <name.surname@gatesfoundation.com>

 * ModusBox
 - Rajiv Mothilal <rajiv.mothilal@modusbox.com>

 * Crosslake
 - Lewis Daly <lewisd@crosslaketech.com>

 --------------
 ******/
'use strict'

const Path = require('path')
const OpenapiBackend = require('@mojaloop/central-services-shared').Util.OpenapiBackend

const Plugins = require('../../src/plugins')
const Handlers = require('../../src/handlers')

const destinationFsp = 'dfsp2'
const sourceFsp = 'dfsp1'

/**
 * @function defaultHeaders
 * @description This returns a set of default headers used for requests
 *   see https://nodejs.org/dist/latest-v10.x/docs/api/http.html#http_message_headers
 * @param {string} resource - the version for the accept and content-type headers
 * @param {object} protocolVersions - object containing the protocol versions config (see default.json)
 * @returns {object} Returns the default headers
 */

function defaultHeaders (resource, protocolVersions) {
  // TODO: See API section 3.2.1; what should we do about X-Forwarded-For? Also, should we
  // add/append to this field in all 'queueResponse' calls?
  return {
    accept: `application/vnd.interoperability.${resource}+json;version=${protocolVersions.ACCEPT.DEFAULT}`,
    'fspiop-destination': destinationFsp,
    'content-type': `application/vnd.interoperability.${resource}+json;version=${protocolVersions.CONTENT.DEFAULT}`,
    date: '2019-05-24 08:52:19',
    'fspiop-source': sourceFsp
  }
}

const serverSetup = async (server) => {
  const api = await OpenapiBackend.initialise(Path.resolve(__dirname, '../../src/interface/openapi.yaml'), Handlers)
  await Plugins.registerPlugins(server, api)
  // use as a catch-all handler
  server.route({
    method: ['GET', 'POST', 'PUT', 'DELETE'],
    path: '/{path*}',
    handler: (req, h) => {
      return api.handleRequest(
        {
          method: req.method,
          path: req.path,
          body: req.payload,
          query: req.query,
          headers: req.headers
        },
        req,
        h
      )
      // TODO: follow instructions https://github.com/anttiviljami/openapi-backend/blob/master/DOCS.md#postresponsehandler-handler
    }
  })
}

module.exports = {
  defaultHeaders,
  serverSetup
}
