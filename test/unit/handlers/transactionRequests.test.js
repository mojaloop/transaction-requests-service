'use strict'

const Test = require('ava')
const Sinon = require('sinon')
const Hapi = require('@hapi/hapi')
const HapiOpenAPI = require('hapi-openapi')
const Path = require('path')
const Mockgen = require('../../util/mockgen.js')
const Logger = require('@mojaloop/central-services-shared')
const Handler = require('../../../src/domain/transactionRequests/transactionRequests')
const Helper = require('../../util/helper')

let sandbox

/**
 * Test for /transactionRequests
 */

Test.beforeEach(() => {
  try {
    sandbox = Sinon.createSandbox()
    sandbox.stub(Handler, 'forwardTransactionRequest').returns(Promise.resolve())
  } catch (e) {
    Logger.error(`setupTest failed with error - ${e}`)
  }
})

Test.afterEach(() => {
  sandbox.restore()
})

/**
 * summary: TransactionRequests
 * description: The HTTP request POST /transactionRequests is used to request the creation of a transaction request for the provided financial transaction in the server.
 * parameters: body, accept, content-length, content-type, date, x-forwarded-for, fspiop-source, fspiop-destination, fspiop-encryption, fspiop-signature, fspiop-uri, fspiop-http-method
 * produces: application/json
 * responses: 202, 400, 401, 403, 404, 405, 406, 501, 503
 */
Test('test TransactionRequests post operation', async function (t) {
  const server = new Hapi.Server()

  await server.register({
    plugin: HapiOpenAPI,
    options: {
      api: Path.resolve(__dirname, '../../../src/interface/swagger.json'),
      handlers: Path.join(__dirname, '../../../src/handlers'),
      outputvalidation: true
    }
  })

  const requests = new Promise((resolve, reject) => {
    Mockgen().requests({
      path: '/transactionRequests',
      operation: 'post'
    }, function (error, mock) {
      return error ? reject(error) : resolve(mock)
    })
  })

  const mock = await requests

  t.pass(mock)
  t.pass(mock.request)
  // Get the resolved path from mock request
  // Mock request Path templates({}) are resolved using path parameters
  const options = {
    method: 'post',
    url: '' + mock.request.path,
    headers: Helper.defaultHeaders()
  }
  if (mock.request.body) {
    // Send the request body
    options.payload = mock.request.body
  } else if (mock.request.formData) {
    // Send the request form data
    options.payload = mock.request.formData
    // Set the Content-Type as application/x-www-form-urlencoded
    options.headers = Helper.defaultHeaders()
  }
  const response = await server.inject(options)
  server.stop()
  t.is(response.statusCode, 202, 'Ok response status')
})
