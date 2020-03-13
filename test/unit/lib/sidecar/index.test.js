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

jest.mock('@mojaloop/forensic-logging-client', () => {
  return {
    create: jest.fn().mockReturnValue({ on: jest.fn() }),
    connect: jest.fn(),
    write: jest.fn()
  }
})
jest.mock('../../../../src/lib/sidecar/nullClient')

const src = '../../../../src'
const Client = require('@mojaloop/forensic-logging-client')
const NullClient = require(`${src}/lib/sidecar/nullClient`)
const Config = require('../../../../src/lib/config')

/**
 * Tests for Sidecar client
 */
describe('Sidecar client', () => {
  beforeEach(() => {
    jest.setMock(`${src}/lib/config`, { ...Config, SIDECAR_DISABLED: false })
    Client.create.mockClear()
    NullClient.create.mockClear()
  })
  describe('import should', () => {
    it('return NullClient if sidecar is disabled', () => {
      // Arrange
      jest.setMock(`${src}/lib/config`, { ...Config, SIDECAR_DISABLED: true })

      // Act
      jest.isolateModules(() => { require(`${src}/lib/sidecar`) })

      // Assert
      expect(NullClient.create).toHaveBeenCalledTimes(1)
      expect(Client.create).not.toHaveBeenCalled()
    })
    it('return sidecar client if sidecar is not disabled', () => {
      // Act
      jest.isolateModules(() => { require(`${src}/lib/sidecar`) })

      // Assert
      expect(Client.create).toHaveBeenCalledTimes(1)
      expect(NullClient.create).not.toHaveBeenCalled()
    })
  })

  describe('connect should', () => {
    it('call sidecar client connect', () => {
      // Arrange
      let Sidecar
      const sidecarStub = { on: jest.fn(), connect: jest.fn() }
      Client.create.mockReturnValue(sidecarStub)
      jest.isolateModules(() => { Sidecar = require(`${src}/lib/sidecar`) })

      // Act
      Sidecar.connect()

      // Assert
      expect(sidecarStub.connect).toHaveBeenCalledTimes(1)
    })
  })

  describe('write should', () => {
    it('write to sidecar client', () => {
      // Arrange
      let Sidecar
      const sidecarStub = { on: jest.fn(), write: jest.fn() }
      Client.create.mockReturnValue(sidecarStub)
      jest.isolateModules(() => { Sidecar = require(`${src}/lib/sidecar`) })

      // Act
      const msg = 'Test message'
      Sidecar.write(msg)

      // Assert
      expect(sidecarStub.write).toHaveBeenCalledTimes(1)
    })
  })
})
