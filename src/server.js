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

 * Rajiv Mothilal <rajiv.mothilal@modusbox.com>

 --------------
 ******/

'use strict'

const { Server } = require('@hapi/hapi')
const Logger = require('@mojaloop/central-services-logger')
const Metrics = require('@mojaloop/central-services-metrics')
const Endpoints = require('@mojaloop/central-services-shared').Util.Endpoints
const OpenapiBackend = require('@mojaloop/central-services-shared').Util.OpenapiBackend
const ErrorHandler = require('@mojaloop/central-services-error-handling')
const Path = require('path')

const Handlers = require('./handlers')
const Plugins = require('./plugins')
const ServerHandler = require('./handlers/server')
const Routes = require('./handlers/routes')
const Config = require('./lib/config.js')
/**
 * @function createServer
 *
 * @description Create HTTP Server
 *
 * @param {number} port Port to register the Server against
 * @returns {Promise<Server>} Returns the Server object
 */
const createServer = async (port) => {
  const server = await new Server({
    port,
    routes: {
      validate: {
        options: ErrorHandler.validateRoutes(),
        failAction: ServerHandler.failActionHandler
      }
    }
  })
  const api = await OpenapiBackend.initialise(Path.resolve(__dirname, './interface/openapi.yaml'), Handlers)
  await Plugins.registerPlugins(server, api)
  await server.ext([
    {
      type: 'onPreHandler',
      method: ServerHandler.onPreHandler
    }
  ])

  server.route(Routes.APIRoutes(api))
  // TODO: follow instructions https://github.com/anttiviljami/openapi-backend/blob/master/DOCS.md#postresponsehandler-handler

  await server.start()
  return server
}

const initializeInstrumentation = () => {
  if (!Config.INSTRUMENTATION_METRICS_DISABLED) {
    Metrics.setup(Config.INSTRUMENTATION_METRICS_CONFIG)
  }
}

const initialize = async (port = Config.PORT) => {
  const server = await createServer(port)
  Logger.info(`Server running on ${server.info.host}:${server.info.port}`)
  await Endpoints.initializeCache(Config.ENDPOINT_CACHE_CONFIG)
  initializeInstrumentation()
  return server
}

module.exports = {
  createServer, // exported for testing only
  initialize
}
