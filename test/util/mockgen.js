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

 * Rajiv Mothilal <rajiv.mothilal@modusbox.com>

 --------------
 ******/

'use strict'
const { OpenApiMockGenerator } = require('@mojaloop/ml-testing-toolkit-shared-lib')

/**
 * Mock Span
 */
class Span {
  constructor () {
    this.isFinished = false
  }

  audit () {
    return jest.fn()
  }

  error () {
    return jest.fn()
  }

  finish () {
    return jest.fn()
  }

  debug () {
    return jest.fn()
  }

  info () {
    return jest.fn()
  }

  getChild () {
    return new Span()
  }
}

const mockSpan = () => {
  return new Span()
}

let openApiMockGenerator

// Factory generator for OpenApiRequestGenerator singleton
const init = async () => {
  if (!openApiMockGenerator) {
    openApiMockGenerator = new OpenApiMockGenerator()
    await openApiMockGenerator.load('./src/interface/openapi.yaml')
  }
  return openApiMockGenerator
}

const generateRequestHeaders = async (path, httpMethod, resource, protocolVersions, overrideRefs = null) => {
  const generator = await init()
  // Default header override refs
  const defaultHeaderRefs = [
    {
      id: 'content-type',
      pattern: `application/vnd\\.interoperability\\.${resource}\\+json;version=${protocolVersions.CONTENT.DEFAULT.toString().replace('.', '\\.')}`
    },
    {
      id: 'accept',
      pattern: `application/vnd\\.interoperability\\.${resource}\\+json;version=${protocolVersions.ACCEPT.DEFAULT.toString().replace('.', '\\.')}`
    },
    {
      id: 'date',
      pattern: `${new Date().toUTCString()}`
    }
  ]

  let localOverrideRefs
  if (overrideRefs == null) {
    localOverrideRefs = [...defaultHeaderRefs]
  } else {
    localOverrideRefs = [...overrideRefs]
  }

  const headers = await generator.generateRequestHeaders(path, httpMethod, localOverrideRefs)
  delete headers['content-length']
  return headers
}

const generateRequestBody = async (path, httpMethod, overrideRefs = null) => {
  const generator = await init()

  let localOverrideRefs
  if (overrideRefs == null) {
    localOverrideRefs = []
  } else {
    localOverrideRefs = [...overrideRefs]
  }
  const body = await generator.generateRequestBody(path, httpMethod, localOverrideRefs)
  return body
}

const generateRequestQueryParams = async (path, httpMethod, overrideRefs = null) => {
  const generator = await init()

  let localOverrideRefs
  if (overrideRefs == null) {
    localOverrideRefs = []
  } else {
    localOverrideRefs = [...overrideRefs]
  }

  const params = await generator.generateRequestQueryParams(path, httpMethod, localOverrideRefs)

  const result = {
    params,
    toString: () => {
      return Object.entries(result.params).reduce((acc, [k, v]) => {
        if (acc === '?') {
          return `${acc}${k}=${v}`
        } else {
          return `${acc}&${k}=${v}`
        }
      }, '?')
    },
    toURLEncodedString: () => {
      return encodeURI(result.toString())
    }
  }
  return result
}

const generateRequestPathParams = async (path, httpMethod, overrideRefs = null) => {
  const generator = await init()

  let localOverrideRefs
  if (overrideRefs == null) {
    localOverrideRefs = []
  } else {
    localOverrideRefs = [...overrideRefs]
  }

  const params = await generator.generateRequestPathParams(path, httpMethod, localOverrideRefs)

  const result = {
    params,
    toString: () => {
      return Object.entries(result.params).reduce((acc, [k, v]) => {
        if (acc === '?') {
          return `${acc}${k}=${v}`
        } else {
          return `${acc}&${k}=${v}`
        }
      }, '?')
    },
    toURLEncodedString: () => {
      return encodeURI(result.toString())
    }
  }
  return result
}

const generateRequest = async (path, httpMethod, resource, protocolVersions, override = null) => {
  const localOverride = {
    headers: null,
    request: null
  }
  if (override != null) {
    if (override.headers != null) {
      localOverride.headers = [...override.headers]
    }

    if (override.request != null) {
      localOverride.request = [...override.request]
    }
  }

  const headers = await generateRequestHeaders(path, httpMethod, resource, protocolVersions, localOverride.headers)

  let body
  if (httpMethod.toLowerCase() !== 'get') {
    body = await generateRequestBody(path, httpMethod, localOverride.request)
  }

  const query = await generateRequestQueryParams(path, httpMethod, localOverride.request)

  const pathParams = await generateRequestPathParams(path, httpMethod, localOverride.request)

  const request = {
    headers,
    body,
    pathParams,
    query
  }
  return request
}

module.exports = {
  mockSpan,
  generateRequest,
  generateRequestBody,
  generateRequestHeaders,
  generateRequestQueryParams,
  init
}
