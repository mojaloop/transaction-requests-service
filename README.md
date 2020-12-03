# Transaction Requests Service
[![Git Commit](https://img.shields.io/github/last-commit/mojaloop/transaction-requests-service.svg?style=flat)](https://github.com/mojaloop/transaction-requests-service/commits/master)
[![Git Releases](https://img.shields.io/github/release/mojaloop/transaction-requests-service.svg?style=flat)](https://github.com/mojaloop/transaction-requests-service/releases)
[![Docker pulls](https://img.shields.io/docker/pulls/mojaloop/transaction-requests-service.svg?style=flat)](https://hub.docker.com/r/mojaloop/transaction-requests-service)
[![CircleCI](https://circleci.com/gh/mojaloop/transaction-requests-service.svg?style=svg)](https://circleci.com/gh/mojaloop/transaction-requests-service)


## Interface Specifications
- OpenAPI v3 Interface Specification: [src/interface/openapi.yaml](src/interface/openapi.yaml)
- Swagger v2 Interface Specification: [src/interface/swagger.json](src/interface/swagger.json) (_Note: This file is generated from the [OpenAPI v3 interface specification](src/interface/openapi.yaml)_)

## Notes:
- If changes are made to [src/interface/openapi.yaml](src/interface/openapi.yaml) ensure you execute `npm run regenerate:spec:swagger2` script and commit the changes to the Swagger v2 document [src/interface/swagger.json](src/interface/swagger.json).
