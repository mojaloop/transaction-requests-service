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

jest.mock('@mojaloop/central-services-logger', () => {
  return {
    info: jest.fn(), // suppress info output
    debug: jest.fn()
  }
})

jest.mock('@mojaloop/central-services-metrics', () => {
  return {
    setup: jest.fn()
  }
})

/* Mock out the Hapi Server */
const mockStart = jest.fn()
jest.mock('@hapi/hapi', () => ({
  Server: jest.fn().mockImplementation(() => ({
    register: jest.fn(),
    ext: jest.fn(),
    route: jest.fn(),
    start: mockStart,
    plugins: {
      openapi: {
        setHost: jest.fn()
      }
    },
    info: {
      host: 'localhost',
      port: 3000
    }
  }))
}))

const { initialize } = require('../../src/server')

describe('server', () => {
  afterEach(() => {
    mockStart.mockClear()
  })

  describe('initialize', () => {
    it('initializes the server', async () => {
      // Arrange
      // Act
      await initialize(3000)

      // Assert
      expect(mockStart).toHaveBeenCalled()
    })

    it('initializes the server when no port is set', async () => {
      // Arrange
      // Act
      await initialize()

      // Assert
      expect(mockStart).toHaveBeenCalled()
    })
  })
})
