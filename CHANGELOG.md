# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [12.0.1](https://github.com/mojaloop/transaction-requests-service/compare/v12.0.0...v12.0.1) (2021-11-05)


### Bug Fixes

* **mojaloop/#2537:** fspiop api version negotiation not handled ([#81](https://github.com/mojaloop/transaction-requests-service/issues/81)) ([32b899e](https://github.com/mojaloop/transaction-requests-service/commit/32b899e3784d72b3aa452d09e9f2bfc044fe0aa8)), closes [mojaloop/#2537](https://github.com/mojaloop/transaction-requests-service/issues/2537) [mojaloop/#2537](https://github.com/mojaloop/transaction-requests-service/issues/2537)

## [12.0.0](https://github.com/mojaloop/transaction-requests-service/compare/v11.1.7...v12.0.0) (2021-11-03)


### ⚠ BREAKING CHANGES

* **mojaloop/#2537:** Forcing a major version change for awareness of the config changes. The `LIB_RESOURCE_VERSIONS` env var is now deprecated, and this is now also controlled by the PROTOCOL_VERSIONS config in the default.json. This has been done for consistency between all API services going forward and unifies the config for both inbound and outbound Protocol API validation/transformation features.

### Bug Fixes

* **mojaloop/#2537:** fspiop api version negotiation not handled ([#80](https://github.com/mojaloop/transaction-requests-service/issues/80)) ([7109cf9](https://github.com/mojaloop/transaction-requests-service/commit/7109cf9fe3fe773b048da0bf5772172ff9dd438c)), closes [mojaloop/#2537](https://github.com/mojaloop/transaction-requests-service/issues/2537) [mojaloop/#2537](https://github.com/mojaloop/transaction-requests-service/issues/2537)

### [11.1.7](https://github.com/mojaloop/transaction-requests-service/compare/v11.1.6...v11.1.7) (2021-09-14)

### [11.1.6](https://github.com/mojaloop/transaction-requests-service/compare/v11.1.5...v11.1.6) (2021-09-14)


### Bug Fixes

* ci-cd caching issues ([#78](https://github.com/mojaloop/transaction-requests-service/issues/78)) ([c7716cc](https://github.com/mojaloop/transaction-requests-service/commit/c7716cca1acb96ab6a4fc64af5ce8bec47d434d3))
* **mojaloop-2358:** party name regex not supporting myanmar script unicode strings ([#77](https://github.com/mojaloop/transaction-requests-service/issues/77)) ([8afe278](https://github.com/mojaloop/transaction-requests-service/commit/8afe278ebf4366937ca777e1a9876a89b8cf7483))
