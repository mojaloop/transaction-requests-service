# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [14.3.4](https://github.com/mojaloop/transaction-requests-service/compare/v14.3.3...v14.3.4) (2025-01-16)


### Bug Fixes

* downgrade nodejs to v18.20.4 ([#115](https://github.com/mojaloop/transaction-requests-service/issues/115)) ([ea59154](https://github.com/mojaloop/transaction-requests-service/commit/ea59154e6ede7005fac909ee82505ae5374f4eff))

### [14.3.3](https://github.com/mojaloop/transaction-requests-service/compare/v14.3.2...v14.3.3) (2025-01-15)


### Chore

* fix vulnerabilities, update deps ([#114](https://github.com/mojaloop/transaction-requests-service/issues/114)) ([a537b16](https://github.com/mojaloop/transaction-requests-service/commit/a537b167f9d15386b9b6e03bf092a8c79286fc8a))

### [14.3.2](https://github.com/mojaloop/transaction-requests-service/compare/v14.3.1...v14.3.2) (2024-11-25)


### Chore

* use the central-services-metrics plugin ([#110](https://github.com/mojaloop/transaction-requests-service/issues/110)) ([8d75eb3](https://github.com/mojaloop/transaction-requests-service/commit/8d75eb312b50e8d798fe7f23794ae8f7bb6f892d))

### [14.3.1](https://github.com/mojaloop/transaction-requests-service/compare/v14.3.0...v14.3.1) (2024-10-01)


### Bug Fixes

* uuid/ulid regex ([#108](https://github.com/mojaloop/transaction-requests-service/issues/108)) ([b0578c6](https://github.com/mojaloop/transaction-requests-service/commit/b0578c64fcda3f187df0ede5a0c8c2b17def1f4b))

## [14.3.0](https://github.com/mojaloop/transaction-requests-service/compare/v14.2.0...v14.3.0) (2024-09-25)


### Features

* add ULID support ([#107](https://github.com/mojaloop/transaction-requests-service/issues/107)) ([a40efa1](https://github.com/mojaloop/transaction-requests-service/commit/a40efa13b5e1d990231e386f1921aab3929b729f))

## [14.2.0](https://github.com/mojaloop/transaction-requests-service/compare/v14.1.3...v14.2.0) (2024-06-26)


### Features

* **csi-164:** parameterize switch id ([#103](https://github.com/mojaloop/transaction-requests-service/issues/103)) ([3910a66](https://github.com/mojaloop/transaction-requests-service/commit/3910a66c5512bba003140579d6a33a7d893d11d7))

### [14.1.3](https://github.com/mojaloop/transaction-requests-service/compare/v14.1.2...v14.1.3) (2024-06-12)


### Chore

* dependency updates and minor maintenance ([#102](https://github.com/mojaloop/transaction-requests-service/issues/102)) ([5dcaa41](https://github.com/mojaloop/transaction-requests-service/commit/5dcaa419b9adba10a3956996b7e72272b5672eec))

### [14.1.2](https://github.com/mojaloop/transaction-requests-service/compare/v14.1.1...v14.1.2) (2023-11-07)


### Bug Fixes

* **mojalooop/#3615:** upgrade dependencies ([#98](https://github.com/mojaloop/transaction-requests-service/issues/98)) ([6fb099b](https://github.com/mojaloop/transaction-requests-service/commit/6fb099b98a544c866a4cde25614edeecaddb1675)), closes [mojalooop/#3615](https://github.com/mojalooop/transaction-requests-service/issues/3615)

### [14.1.1](https://github.com/mojaloop/transaction-requests-service/compare/v14.1.0...v14.1.1) (2023-09-14)


### Chore

* **mojaloop/#3439:** nodejs upgrade ([#97](https://github.com/mojaloop/transaction-requests-service/issues/97)) ([a51ea79](https://github.com/mojaloop/transaction-requests-service/commit/a51ea79b8e7cd102190a0ee5fc49eb05b810a194)), closes [mojaloop/#3439](https://github.com/mojaloop/project/issues/3439)

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
