# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [14.1.0](https://github.com/mojaloop/transaction-requests-service/compare/v14.0.1...v14.1.0) (2022-11-28)


### Features

* **mojaloop/#2740:** add test currencies to api ([#92](https://github.com/mojaloop/transaction-requests-service/issues/92)) ([1742336](https://github.com/mojaloop/transaction-requests-service/commit/1742336e059a0c401892470c8f91f5ddf5687bff)), closes [mojaloop/#2740](https://github.com/mojaloop/project/issues/2740)

### [14.0.1](https://github.com/mojaloop/transaction-requests-service/compare/v14.0.0...v14.0.1) (2022-07-14)


### Bug Fixes

* handle unhandled promise rejections ([#91](https://github.com/mojaloop/transaction-requests-service/issues/91)) ([9b9b7e4](https://github.com/mojaloop/transaction-requests-service/commit/9b9b7e4e54db84d4928be8cf768b0c386d049067))

## [14.0.0](https://github.com/mojaloop/transaction-requests-service/compare/v13.0.0...v14.0.0) (2022-07-13)


### ⚠ BREAKING CHANGES

* upgrade node to lts, ci, image, packages, audit (#90)

### Features

* upgrade node to lts, ci, image, packages, audit ([#90](https://github.com/mojaloop/transaction-requests-service/issues/90)) ([0b14d0a](https://github.com/mojaloop/transaction-requests-service/commit/0b14d0ad19d64924a4aba6892afd8e893579db33))

## [13.0.0](https://github.com/mojaloop/transaction-requests-service/compare/v12.0.1...v13.0.0) (2022-03-04)


### ⚠ BREAKING CHANGES

* **mojaloop/#2704:** - Config PROTOCOL_VERSIONS.CONTENT has now been modified to support backward compatibility for minor versions (i.e. v1.0 & 1.1) as follows:

> ```
>   "PROTOCOL_VERSIONS": {
>     "CONTENT": "1.1", <-- used when generating messages from the "SWITCH", and validate incoming FSPIOP API requests/callbacks CONTENT-TYPE headers
>     "ACCEPT": {
>       "DEFAULT": "1", <-- used when generating messages from the "SWITCH"
>       "VALIDATELIST": [ <-- used to validate incoming FSPIOP API requests/callbacks ACCEPT headers
>         "1",
>         "1.0",
>         "1.1"
>       ]
>     }
>   },
> ```
> 
> to be consistent with the ACCEPT structure as follows:
> 
> ```
>   "PROTOCOL_VERSIONS": {
>     "CONTENT": {
>       "DEFAULT": "1.1", <-- used when generating messages from the "SWITCH"
>       "VALIDATELIST": [ <-- used to validate incoming FSPIOP API requests/callbacks CONTENT-TYPE headers
>         "1.1",
>         "1.0"
>       ]
>     },
>     "ACCEPT": {
>       "DEFAULT": "1", <-- used when generating messages from the "SWITCH"
>       "VALIDATELIST": [ <-- used to validate incoming FSPIOP API requests/callbacks ACCEPT headers
>         "1",
>         "1.0",
>         "1.1"
>       ]
>     }
>   },
> ```

### Features

* **mojaloop/#2704:** core-services support for non-breaking backward api compatibility ([#85](https://github.com/mojaloop/transaction-requests-service/issues/85)) ([974c66d](https://github.com/mojaloop/transaction-requests-service/commit/974c66d517bc0e6becb6fe3c340dfe0b5eca303e)), closes [mojaloop/#2704](https://github.com/mojaloop/project/issues/2704)

### [12.0.1](https://github.com/mojaloop/transaction-requests-service/compare/v12.0.0...v12.0.1) (2021-11-05)


### Bug Fixes

* **mojaloop/#2537:** fspiop api version negotiation not handled ([#81](https://github.com/mojaloop/transaction-requests-service/issues/81)) ([32b899e](https://github.com/mojaloop/transaction-requests-service/commit/32b899e3784d72b3aa452d09e9f2bfc044fe0aa8)), closes [mojaloop/#2537](https://github.com/mojaloop/project/issues/2537)

## [12.0.0](https://github.com/mojaloop/transaction-requests-service/compare/v11.1.7...v12.0.0) (2021-11-03)


### ⚠ BREAKING CHANGES

* **mojaloop/#2537:** Forcing a major version change for awareness of the config changes. The `LIB_RESOURCE_VERSIONS` env var is now deprecated, and this is now also controlled by the PROTOCOL_VERSIONS config in the default.json. This has been done for consistency between all API services going forward and unifies the config for both inbound and outbound Protocol API validation/transformation features.

### Bug Fixes

* **mojaloop/#2537:** fspiop api version negotiation not handled ([#80](https://github.com/mojaloop/transaction-requests-service/issues/80)) ([7109cf9](https://github.com/mojaloop/transaction-requests-service/commit/7109cf9fe3fe773b048da0bf5772172ff9dd438c)), closes [mojaloop/#2537](https://github.com/mojaloop/project/issues/2537)

### [11.1.7](https://github.com/mojaloop/transaction-requests-service/compare/v11.1.6...v11.1.7) (2021-09-14)

### [11.1.6](https://github.com/mojaloop/transaction-requests-service/compare/v11.1.5...v11.1.6) (2021-09-14)


### Bug Fixes

* ci-cd caching issues ([#78](https://github.com/mojaloop/transaction-requests-service/issues/78)) ([c7716cc](https://github.com/mojaloop/transaction-requests-service/commit/c7716cca1acb96ab6a4fc64af5ce8bec47d434d3))
* **mojaloop-2358:** party name regex not supporting myanmar script unicode strings ([#77](https://github.com/mojaloop/transaction-requests-service/issues/77)) ([8afe278](https://github.com/mojaloop/transaction-requests-service/commit/8afe278ebf4366937ca777e1a9876a89b8cf7483))
