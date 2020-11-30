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

 * ModusBox
 - Steven Oderayi <steven.oderayi@modusbox.com>
 --------------
 ******/

'use strict'

/**
 * Request handler
 *
 * @param {object} api OpenAPIBackend instance
 * @param {object} req Request
 * @param {object} h   Response handle
 */
const handleRequest = (api, req, h) => api.handleRequest(
  {
    method: req.method,
    path: req.path,
    body: req.payload,
    query: req.query,
    headers: req.headers
  }, req, h)

/**
 * Core API Routes
 *
 * @param {object} api OpenAPIBackend instance
 */
const APIRoutes = (api) => [
  {
    method: 'GET',
    path: '/health',
    handler: (req, h) => handleRequest(api, req, h),
    config: {
      tags: ['api', 'health'],
      description: 'GET health'
    }
  },
  {
    method: 'GET',
    path: '/metrics',
    handler: (req, h) => handleRequest(api, req, h),
    config: {
      tags: ['api', 'metrics'],
      description: 'GET service metrics'
    }
  },
  {
    method: 'PUT',
    path: '/transactionRequests/{ID}/error',
    handler: (req, h) => handleRequest(api, req, h),
    config: {
      tags: ['api', 'transactioRequests', 'sampled'],
      description: 'PUT Transaction Request error by ID'
    }
  },
  {
    method: 'GET',
    path: '/transactionRequests/{ID}',
    handler: (req, h) => handleRequest(api, req, h),
    config: {
      tags: ['api', 'transactionRequests', 'sampled'],
      description: 'GET Transaction Requests by ID'
    }
  },
  {
    method: 'PUT',
    path: '/transactionRequests/{ID}',
    handler: (req, h) => handleRequest(api, req, h),
    config: {
      tags: ['api', 'transactionRequests', 'sampled'],
      description: 'PUT Transaction Request by ID'
    }
  },
  {
    method: 'POST',
    path: '/transactionRequests',
    handler: (req, h) => handleRequest(api, req, h),
    config: {
      tags: ['api', 'transactionRequests', 'sampled'],
      description: 'POST Transaction Request'
    }
  },
  {
    method: 'GET',
    path: '/authorizations/{ID}',
    handler: (req, h) => handleRequest(api, req, h),
    config: {
      tags: ['api', 'authorizations', 'sampled'],
      description: 'GET Authorization by ID'
    }
  },
  {
    method: 'PUT',
    path: '/authorizations/{ID}',
    handler: (req, h) => handleRequest(api, req, h),
    config: {
      tags: ['api', 'authorizations', 'sampled'],
      description: 'PUT Authorization by ID'
    }
  },
  {
    method: 'PUT',
    path: '/authorizations/{ID}/error',
    handler: (req, h) => handleRequest(api, req, h),
    config: {
      tags: ['api', 'authorizations', 'sampled'],
      description: 'PUT Authorization error by ID'
    }
  }
]

module.exports = { APIRoutes }
