/*****
 License
 --------------
 Copyright © 2020-2025 Mojaloop Foundation
 The Mojaloop files are made available by the Mojaloop Foundation under the Apache License, Version 2.0 (the "License") and you may not use these files except in compliance with the License. You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, the Mojaloop files are distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

 Contributors
 --------------
 This is the official list of the Mojaloop project contributors for this file.
 Names of the original copyright holders (individuals or organizations)
 should be listed with a '*' in the first column. People who have
 contributed from an organization can be listed under the organization
 that actually holds the copyright for their contributions (see the
 Mojaloop Foundation for an example). Those individuals should have
 their names indented and be marked with a '-'. Email address can be added
 optionally within square brackets <email>.

 * Mojaloop Foundation
 - Name Surname <name.surname@mojaloop.io>

 * Lewis Daly <lewisd@crosslaketech.com>

 --------------
 ******/

'use strict'

const mockRequestLogger = jest.fn()
jest.mock('../../../src/lib/requestLogger', () => ({
  logResponse: mockRequestLogger
}))

const { failActionHandler, onRequest, onPreHandler } = require('../../../src/handlers/server')

describe('Server Handlers', () => {
  afterEach(() => {
    mockRequestLogger.mockClear()
  })

  describe('failActionHandler', () => {
    it('throws the reformatted error', async () => {
      // Arrange
      const input = new Error('Generic error')

      // Act
      const action = async () => failActionHandler(null, null, input)

      // Assert
      await expect(action()).rejects.toThrow('Generic error')
    })
  })

  describe('onRequest', () => {
    const buildToolkit = () => {
      const takeover = jest.fn().mockReturnValue('takeover')
      const redirect = jest.fn().mockReturnValue({ takeover })
      return { h: { redirect, continue: 'continue' }, redirect, takeover }
    }

    it.each([
      '/swaggerui',
      '/swaggerui/',
      '/swaggerui/index.html'
    ])('redirects %s to /documentation', async (path) => {
      // Arrange
      const { h, redirect, takeover } = buildToolkit()

      // Act
      const result = await onRequest({ path, method: 'get' }, h)

      // Assert
      expect(redirect).toHaveBeenCalledWith('/documentation')
      expect(takeover).toHaveBeenCalled()
      expect(result).toBe('takeover')
    })

    it('redirects HEAD requests', async () => {
      // Arrange
      const { h, redirect } = buildToolkit()

      // Act
      await onRequest({ path: '/swaggerui/index.html', method: 'head' }, h)

      // Assert
      expect(redirect).toHaveBeenCalledWith('/documentation')
    })

    it('does not redirect other methods', async () => {
      // Arrange
      const { h, redirect } = buildToolkit()

      // Act
      const result = await onRequest({ path: '/swaggerui/index.html', method: 'post' }, h)

      // Assert
      expect(redirect).not.toHaveBeenCalled()
      expect(result).toBe('continue')
    })

    it.each([
      '/documentation',
      '/swaggerui/swagger-ui-bundle.js',
      '/swaggerui/extend.js',
      '/swagger.json',
      '/transactionRequests'
    ])('does not redirect %s', async (path) => {
      // Arrange
      const { h, redirect } = buildToolkit()

      // Act
      const result = await onRequest({ path, method: 'get' }, h)

      // Assert
      expect(redirect).not.toHaveBeenCalled()
      expect(result).toBe('continue')
    })
  })

  describe('onPreHandler', () => {
    it('logs the response', async () => {
      // Arrange
      const request = {}
      const h = jest.fn().mockImplementation(() => ({
        continue: jest.fn()
      }))

      // Act
      await onPreHandler(request, h)

      // Assert
      expect(mockRequestLogger).toHaveBeenCalled()
    })
  })
})
