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

const Logger = require('@mojaloop/central-services-logger')
const NullClient = require('../../../../src/lib/sidecar/nullClient')

Logger.debug = jest.fn()

/**
 * Tests for NullClient
 */
describe('Sidecar NullClient', () => {
  describe('', () => {
    describe('create() should', () => {
      it('instantiate new NullClient', () => {
        const client = NullClient.create()
        expect(client).toBeTruthy()
      })
    })
    describe('connect() should', () => {
      it('log sidecar status and return resolved promise', async () => {
        const client = NullClient.create()
        await client.connect()
        expect(Logger.debug).toHaveBeenCalledWith('Sidecar disabled: connecting in NullClient')
      })
    })
    describe('write(...) should', () => {
      it('log message passed in', async () => {
        const client = NullClient.create()
        const msg = 'Test log'
        client.write(msg)
        expect(Logger.debug).toHaveBeenCalledWith(`Sidecar disabled: writing message ${msg} in NullClient`)
      })
    })
  })
})
