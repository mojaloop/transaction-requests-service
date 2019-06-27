'use strict'

const Test = require('ava')
const Hapi = require('@hapi/hapi')
const Sinon = require('sinon')
const HapiOpenAPI = require('hapi-openapi')
const Path = require('path')
const Mockgen = require('../../../util/mockgen.js')
const Helper = require('../../../util/helper')
const Handler = require('../../../../src/domain/transactionRequests/transactionRequests')
const Logger = require('@mojaloop/central-services-shared').Logger

let sandbox
/**
 * Test for /transactionRequests/{ID}
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
 * summary: TransactionRequestsByID
 * description: The HTTP request GET /transactionRequests/&lt;ID&gt; is used to get information regarding an earlier created or requested transaction request. The &lt;ID&gt; in the URI should contain the transactionRequestId that was used for the creation of the transaction request.
 * parameters: accept
 * produces: application/json
 * responses: 202, 400, 401, 403, 404, 405, 406, 501, 503
 */
Test.serial('test TransactionRequestsByID get operation', async function (t) {

  const server = new Hapi.Server()

  await server.register({
    plugin: HapiOpenAPI,
    options: {
      api: Path.resolve(__dirname, '../../../../src/interface/swagger.json'),
      handlers: Path.join(__dirname, '../../../../src/handlers'),
      outputvalidation: true
    }
  })

  const requests = new Promise((resolve, reject) => {
    Mockgen().requests({
      path: '/transactionRequests/{ID}',
      operation: 'get'
    }, function (error, mock) {
      return error ? reject(error) : resolve(mock)
    })
  })

  const mock = await requests

  t.pass(mock)
  t.pass(mock.request)
  //Get the resolved path from mock request
  //Mock request Path templates({}) are resolved using path parameters
  const options = {
    method: 'get',
    url: '' + mock.request.path,
    headers: Helper.defaultHeaders()
  }
  if (mock.request.body) {
    //Send the request body
    options.payload = mock.request.body
  } else if (mock.request.formData) {
    //Send the request form data
    options.payload = mock.request.formData
    //Set the Content-Type as application/x-www-form-urlencoded
    options.headers = Helper.defaultHeaders()
  }

  const response = await server.inject(options)
  server.stop()
  t.is(response.statusCode, 202, 'Ok response status')
})
/**
 * summary: TransactionRequestsByID
 * description: The callback PUT /transactionRequests/&lt;ID&gt; is used to inform the client of a requested or created transaction request. The &lt;ID&gt; in the URI should contain the transactionRequestId that was used for the creation of the transaction request, or the &lt;ID&gt; that was used in the GET /transactionRequests/&lt;ID&gt;.
 * parameters: body, content-length
 * produces: application/json
 * responses: 200, 400, 401, 403, 404, 405, 406, 501, 503
 */
Test.serial('test TransactionRequestsByIDPut put operation', async function (t) {

  const server = new Hapi.Server()

  await server.register({
    plugin: HapiOpenAPI,
    options: {
      api: Path.resolve(__dirname, '../../../../src/interface/swagger.json'),
      handlers: Path.join(__dirname, '../../../../src/handlers'),
      outputvalidation: true
    }
  })

  const requests = new Promise((resolve, reject) => {
    Mockgen().requests({
      path: '/transactionRequests/{ID}',
      operation: 'put'
    }, function (error, mock) {
      return error ? reject(error) : resolve(mock)
    })
  })

  const mock = await requests

  t.pass(mock)
  t.pass(mock.request)
  //Get the resolved path from mock request
  //Mock request Path templates({}) are resolved using path parameters
  const options = {
    method: 'put',
    url: '' + mock.request.path,
    headers: Helper.defaultHeaders()
  }
  if (mock.request.body) {
    //Send the request body
    options.payload = mock.request.body
  } else if (mock.request.formData) {
    //Send the request form data
    options.payload = mock.request.formData
    //Set the Content-Type as application/x-www-form-urlencoded
    options.headers = Helper.defaultHeaders()
  }

  const response = await server.inject(options)
  server.stop()
  t.is(response.statusCode, 200, 'Ok response status')
})
