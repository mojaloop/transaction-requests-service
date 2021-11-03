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

 * ModusBox
 - Steven Oderayi <steven.oderayi@modusbox.com>

 --------------
 ******/
'use strict'

const { getStackOrInspect, getSpanTags } = require('../../../src/lib/util')
const Helper = require('../../util/helper')
const Config = require('../../../src/lib/config')

describe('util', () => {
  describe('getStackOrInspect', () => {
    it('handles an error without a stack', () => {
      // Arrange
      const input = new Error('This is a normal error')
      delete input.stack
      const expected = '[Error: This is a normal error]'

      // Act
      const output = getStackOrInspect(input)

      // Assert
      expect(output).toBe(expected)
    })
  })
  describe('getSpanTags', () => {
    it('create correct span tags', () => {
      // Arrange
      const headers = Helper.defaultHeaders('transactionRequests', Config.PROTOCOL_VERSIONS)
      const transactionType = 'transactionRequests'
      const transactionAction = 'POST'
      const transactionId = undefined
      const expected = {
        source: 'dfsp1',
        destination: 'dfsp2',
        transactionType,
        transactionAction,
        transactionId
      }

      // Act
      const output = getSpanTags({ headers }, transactionType, transactionAction)

      // Assert
      expect(output).toStrictEqual(expected)
    })
    it('create correct span tags when headers are not set', () => {
      // Arrange
      const headers = null
      const transactionType = 'transactionRequests'
      const transactionAction = 'POST'
      const transactionId = undefined
      const expected = {
        transactionType,
        transactionAction,
        transactionId
      }

      // Act
      const output = getSpanTags({ headers }, transactionType, transactionAction)

      // Assert
      expect(output).toStrictEqual(expected)
    })
  })
})
