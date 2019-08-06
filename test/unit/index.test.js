'use strict'

const Test = require('ava')
const Sinon = require('sinon')
const Config = require('../../src/lib/config')
const Proxyquire = require('proxyquire')

let sandbox
let SetupStub

Test.beforeEach(() => {
  sandbox = Sinon.createSandbox()
  SetupStub = {
    initialize: sandbox.stub().returns(Promise.resolve())
  }
  process.argv = []
  Proxyquire.noPreserveCache() // enable no caching for module requires
})

Test.afterEach(() => {
  sandbox.restore()
  Proxyquire.preserveCache()
})

Test('Commander should start all Handlers up via all switches', async test => {
  process.argv = [
    'node',
    'index.js',
    'api'
  ]
  const Index = Proxyquire('../../src/index', {
    './server': SetupStub
  })
  const initOptions = {
    port: Config.PORT
  }
  test.pass(await Index)
  test.pass(SetupStub.initialize.calledWith(initOptions))
})

Test('Commander should start all prepare Handlers up with invalid args', async test => {
  // stub process.exit
  sandbox.stub(process, 'exit')

  const argv = []
  process.argv = argv
  const Index = Proxyquire('../../src/index', {
    './server': SetupStub
  })

  test.pass(Index)
  test.truthy(SetupStub.initialize.called)
  test.pass(process.exit.called)
})
