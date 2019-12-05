'use strict'

jest.mock('@mojaloop/central-services-logger', () => {
  return {
    info: jest.fn() // suppress info output
  }
})

const Sinon = require('sinon')
const Hapi = require('@hapi/hapi')

const Mockgen = require('../../../../util/mockgen.js')
const Helper = require('../../../../util/helper')
const Handler = require('../../../../../src/domain/transactionRequests/transactionRequests')

let sandbox
const server = new Hapi.Server()

describe('/transactionRequests/{ID}/error', () => {
  beforeAll(async () => {
    sandbox = Sinon.createSandbox()
    sandbox.stub(Handler, 'forwardTransactionRequestError').returns(Promise.resolve())
    await server.register(Helper.defaultServerOptions)
  })

  afterAll(() => {
    server.stop()
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('PUT', () => {
    const requests = Mockgen().requestsAsync('/transactionRequests/{ID}/error', 'put')

    it('handles a PUT', async () => {
      // Arrange
      const mock = await requests
      const options = {
        method: 'put',
        url: '' + mock.request.path,
        headers: Helper.defaultHeaders(),
        payload: mock.request.body || mock.request.formData
      }

      // Act
      const response = await server.inject(options)

      // Assert
      expect(response.statusCode).toBe(200)
    })
  })
})
