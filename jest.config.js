module.exports = {
  verbose: true,
  collectCoverageFrom: [
    '**/src/**/**/*.js'
  ],
  coverageThreshold: {
    global: {
      statements: 90,
      functions: 90,
      branches: 90,
      lines: 90
    }
  },
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@mojaloop/ml-testing-toolkit-shared-lib|@faker-js/faker)/)'
  ]
}
