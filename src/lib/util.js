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

 * Rajiv Mothilal <rajiv.mothilal@modusbox.com>

 --------------
 ******/
'use strict'

const Enum = require('@mojaloop/central-services-shared').Enum
const ErrorHandler = require('@mojaloop/central-services-error-handling')

/**
 * @function defaultHeaders
 *
 * @description This returns a set of default headers used for requests
 *
 * see https://nodejs.org/dist/latest-v10.x/docs/api/http.html#http_message_headers
 *
 * @param {string} destination - to who the request is being sent
 * @param {string} resource - the flow that is being requested i.e. participants
 * @param {string} source - from who the request is made
 * @param {string} version - the version for the accept and content-type headers
 *
 * @returns {object} Returns the default headers
 */
function defaultHeaders (destination, resource, source, version = '1.0') {
  // TODO: See API section 3.2.1; what should we do about X-Forwarded-For? Also, should we
  // add/append to this field in all 'queueResponse' calls?
  return {
    accept: `application/vnd.interoperability.${resource}+json;version=${version}`,
    'FSPIOP-Destination': destination || '',
    'content-type': `application/vnd.interoperability.${resource}+json;version=${version}`,
    date: (new Date()).toUTCString(),
    'FSPIOP-Source': source
  }
}

/**
 * Utility function to remove null and undefined keys from an object.
 * This is useful for removing "nulls" that come back from database queries
 * when projecting into API spec objects
 *
 * @returns {object}
 */
function removeEmptyKeys (originalObject) {
  const obj = { ...originalObject }
  Object.keys(obj).forEach(key => {
    if (obj[key] && typeof obj[key] === 'object') {
      if (Object.keys(obj[key]).length < 1) {
        // remove empty object
        delete obj[key]
      } else {
        // recurse
        obj[key] = removeEmptyKeys(obj[key])
      }
    } else if (obj[key] == null) {
      // null or undefined, remove it
      delete obj[key]
    }
  })
  return obj
}

/**
 * Generates and returns an object containing API spec compliant HTTP request headers
 *
 * @returns {object}
 */
function generateRequestHeaders (headers, noAccept) {
  const ret = {
    'Content-Type': 'application/vnd.interoperability.quotes+json;version=1.0',
    Date: new Date().toUTCString(),
    'FSPIOP-Source': headers['fspiop-source'],
    'FSPIOP-Destination': headers['fspiop-destination'],
    'FSPIOP-HTTP-Method': headers['fspiop-http-method'],
    'FSPIOP-Signature': headers['fspiop-signature'],
    'FSPIOP-URI': headers['fspiop-uri'],
    Accept: null
  }
  if (!noAccept) {
    ret['Accept'] = 'application/vnd.interoperability.quotes+json;version=1'
  }
  return removeEmptyKeys(ret)
}

/**
 * @function transformHeaders
 *
 * @description This will transform the headers before sending to kafka
 * NOTE: Assumes incoming headers keys are lowercased. This is a safe
 * assumption only if the headers parameter comes from node default http framework.
 *
 * see https://nodejs.org/dist/latest-v10.x/docs/api/http.html#http_message_headers
 *
 * @param {object} headers - the http header from the request
 * @param {object} config - the required headers you with to alter
 *
 * @returns {object} Returns the normalized headers
 */
const transformHeaders = (headers, config) => {
  // Normalized keys
  const normalizedKeys = Object.keys(headers).reduce(
    function (keys, k) {
      keys[k.toLowerCase()] = k
      return keys
    }, {})

  // Normalized headers
  const normalizedHeaders = {}

  // check to see if FSPIOP-Destination header has been left out of the initial request. If so then add it.
  if (!normalizedKeys[Enum.Http.Headers.FSPIOP.DESTINATION]) {
    headers[Enum.Http.Headers.FSPIOP.DESTINATION] = ''
  }

  for (const headerKey in headers) {
    const headerValue = headers[headerKey]
    switch (headerKey.toLowerCase()) {
      case (Enum.Http.Headers.GENERAL.DATE):
        let tempDate = {}
        if (typeof headerValue === 'object' && headerValue instanceof Date) {
          tempDate = headerValue.toUTCString()
        } else {
          try {
            tempDate = (new Date(headerValue)).toUTCString()
            if (tempDate === 'Invalid Date') {
              throw ErrorHandler.Factory.createInternalServerFSPIOPError('Invalid Date')
            }
          } catch (err) {
            tempDate = headerValue
          }
        }
        normalizedHeaders[headerKey] = tempDate
        break
      case (Enum.Http.Headers.GENERAL.CONTENT_LENGTH || Enum.Http.Headers.FSPIOP.URI || Enum.Http.Headers.GENERAL.HOST):
      // Do nothing here, do not map. This will be inserted correctly by the Hapi framework.
        break
      case (Enum.Http.Headers.FSPIOP.HTTP_METHOD):
        if (config.httpMethod.toLowerCase() === headerValue.toLowerCase()) {
        // HTTP Methods match, and thus no change is required
          normalizedHeaders[headerKey] = headerValue
        } else {
        // HTTP Methods DO NOT match, and thus a change is required for target HTTP Method
          normalizedHeaders[headerKey] = config.httpMethod
        }
        break
      case (Enum.Http.Headers.FSPIOP.SIGNATURE):
      // Check to see if we find a regex match the source header containing the switch name.
      // If so we include the signature otherwise we remove it.

        if (headers[normalizedKeys[Enum.Http.Headers.FSPIOP.SOURCE]].match(Enum.Http.Headers.FSPIOP.SWITCH.regex) === null) {
          normalizedHeaders[headerKey] = headerValue
        }
        break
      case (Enum.Http.Headers.FSPIOP.SOURCE):
        normalizedHeaders[headerKey] = config.sourceFsp
        break
      case (Enum.Http.Headers.FSPIOP.DESTINATION):
        if (config.destinationFsp) {
          normalizedHeaders[headerKey] = config.destinationFsp
        }
        break
      case (Enum.Http.Headers.GENERAL.ACCEPT || Enum.Http.Headers.GENERAL.CONTENT_TYPE):
        normalizedHeaders[headerKey] = headerValue
        break
      default:
        normalizedHeaders[headerKey] = headerValue
    }
  }

  if (config && config.httpMethod !== Enum.Http.RestMethods.POST) {
    delete normalizedHeaders[Enum.Http.Headers.GENERAL.ACCEPT]
  }
  return normalizedHeaders
}

module.exports = {
  defaultHeaders,
  transformHeaders,
  generateRequestHeaders
}
