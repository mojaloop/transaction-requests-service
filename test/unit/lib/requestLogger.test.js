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

 --------------
 ******/
'use strict'
const Sinon = require('sinon')
const Logger = require('@mojaloop/central-services-logger')

const { logResponse } = require('../../../src/lib/requestLogger')

let sandbox
describe('requestLogger', () => {
  beforeAll(() => {
    sandbox = Sinon.createSandbox()
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('logResponse', () => {
    it('does nothing if there is no request.response', () => {
      // Arrange
      const stub = sandbox.stub(Logger, 'info')

      // Act
      logResponse({ notARequest: true })

      // Assert
      expect(stub.called).toBe(false)
    })

    it('logs a valid json response', () => {
      // Arrange
      const stub = sandbox.stub(Logger, 'info')
      const input = {
        response: {
          source: 'localhost:3000',
          statusCode: 404
        }
      }

      // Act
      logResponse(input)

      // Assert
      expect(stub.calledOnce).toBe(true)
      const firstCallArgs = stub.getCall(0).args
      expect(firstCallArgs).toEqual(['TR-Trace - Response: "localhost:3000" Status: 404'])
    })

    it('logs a response that fails to serialize from json', () => {
      // Arrange
      const stub = sandbox.stub(Logger, 'info')
      const input = {
        response: {
          source: {
            itemA: 'localhost:3000'
          },
          statusCode: 404
        }
      }
      // make it circular
      input.response.source.nested = input

      // Act
      logResponse(input)

      // Assert
      expect(stub.calledOnce).toBe(true)
      const firstCallArgs = stub.getCall(0).args
      expect(firstCallArgs).toEqual(['TR-Trace - Response: { itemA: \'localhost:3000\',\n  nested: { response: { source: [Circular], statusCode: 404 } } } Status: 404'])
    })

    it('handles an undefined response', () => {
      // Arrange
      const stub = sandbox.stub(Logger, 'info')
      const input = {
        response: {
          source: undefined
        }
      }

      // Act
      logResponse(input)

      // Assert
      expect(stub.calledOnce).toBe(true)
      const firstCallArgs = stub.getCall(0).args
      expect(firstCallArgs).toEqual(['TR-Trace - Response: [object Object]'])
    })

    it('handles an undefined request', () => {
      // Arrange
      const stub = sandbox.stub(Logger, 'info')

      // Act
      logResponse(undefined)

      // Assert
      expect(stub.called).toBe(false)
    })
  })
})
