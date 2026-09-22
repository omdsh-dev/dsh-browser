# Change Log

## 3.33.2

### Patch Changes

- 99c3f91: Restore npm provenance attestations. No functional changes.
- Updated dependencies [99c3f91]
  - @smithy/types@4.17.2

## 3.33.1

### Patch Changes

- b3958ad: fix for RPC protocol event stream initial messages
- d774f8d: chore: build packages with typescript 7. Packages continue to be compatible with TypeScript 3.4 through 7.0 in consumer applications.
- Updated dependencies [d774f8d]
  - @smithy/types@4.17.1

## 3.33.0

### Minor Changes

- cf69285: offer the client logger to request handlers as a fallback without overwriting a handler's own logger. A `NoOpLogger` is not offered, so handlers keep their console-based defaults.

## 3.32.0

### Minor Changes

- ec9b4b2: chore: update builds to use typescript 6. This should not affect consumers, who may continue to use TypeScript 3.4 through 7.0 as of this version.

### Patch Changes

- Updated dependencies [ec9b4b2]
  - @smithy/types@4.17.0

## 3.31.1

### Patch Changes

- fcf1366: switch cbor codec to use single-pass (v2) shape serializer and deserializer

## 3.31.0

### Minor Changes

- a14bb71: add single pass cbor serializer and deserializers

## 3.30.0

### Minor Changes

- 155bb56: updating errors list for clock skew errors (retryable)

### Patch Changes

- 54040ef: set NumericValue accepted values to Smithy RPCv2 JSON spec

## 3.29.8

### Patch Changes

- d6e6f8b: update large map threshold in cbor

## 3.29.7

### Patch Changes

- 44b21e6: fix for event stream events - throw the specific modeled error class instead of a generic Error

## 3.29.6

### Patch Changes

- 3248fbd: add missing service-specific endpoint features

## 3.29.5

### Patch Changes

- b44cb0a: handle early closure of underlying stream in ChecksumStream

## 3.29.4

### Patch Changes

- 5fca3a0: Add typesVersions entries for submodules so TypeScript <4.5 consumers resolve submodule types

## 3.29.3

### Patch Changes

- Updated dependencies [a97abc3]
  - @smithy/types@4.16.1

## 3.29.2

### Patch Changes

- 273e480: types updates for isolatedModules=true
- Updated dependencies [273e480]
- Updated dependencies [74b3d45]
  - @smithy/types@4.16.0

## 3.29.1

### Patch Changes

- 1fac409: Make ChecksumStream a Readable that consumes its source directly

## 3.29.0

### Minor Changes

- 12bceb2: add internal higher order factory for Command classes

### Patch Changes

- 4395dad: move endpoint instructions types from core to types to fix the type of the instruction supplier static method of Command classes
- Updated dependencies [4395dad]
  - @smithy/types@4.15.1

## 3.28.0

### Minor Changes

- d366537: Add IMDSv2 region fallback to NODE_REGION_CONFIG_OPTIONS default, consolidated with defaults-mode region inference.
- c0d7f5d: use internal checksum implementations

## 3.27.0

### Minor Changes

- c9575e1: add crc32 and sha256 checksum impls

### Patch Changes

- 2dcefdb: Clean up ChecksumStream's source stream when destroyed.
- 91280a5: validates hostLabel input

## 3.26.0

### Minor Changes

- 3cfda3b: CBOR performance improvements

## 3.25.1

### Patch Changes

- 63ddca4: deferred loading for core/event-streams for use in client config initializers

## 3.25.0

### Minor Changes

- 17e50e9: update dist-cjs output format to use plain require/exports statements

### Patch Changes

- Updated dependencies [17e50e9]
  - @smithy/types@4.15.0

## 3.24.7

### Patch Changes

- 1e5bdd3: Update author URL in package.json to be more specific
- 13e74d6: add upper bound for Retry-After delay in deprecated StandardRetryStrategy
- 3bc3322: fix call to setTimeout in DefaultRateLimiter, browser compatibility
- bcbadbc: package json updates
- Updated dependencies [1e5bdd3]
- Updated dependencies [bcbadbc]
  - @smithy/types@4.14.4

## 3.24.6

### Patch Changes

- 776bc52: update adaptive rate limiter to execute directly prior to outgoing requests & retries
- 5b92a54: Treat the Node.js DNS error code EAI_AGAIN as a transient (retryable) error
- Updated dependencies [776bc52]
  - @smithy/types@4.14.3

## 3.24.5

### Patch Changes

- 721fbed: remove and prevent circular file-level dependencies

## 3.24.4

### Patch Changes

- 9eaa5c6: add bundler compatibility for tsup

## 3.24.3

### Patch Changes

- Updated dependencies [cf00244]
  - @smithy/types@4.14.2

## 3.24.2

### Patch Changes

- 6d4eb8a: fix for browser utf8 variant not to include Buffer (Node.js)

## 3.24.1

### Patch Changes

- 2dc5cf6: fix for uuid generation in Node.js 18.x
- 1d0ff86: retrieve schemas with matching shape name if unambiguous

## 3.24.0

### Minor Changes

- 540aeb4: consolidate core/retry and related cleanup
- 4f30af1: consolidation for core/protocols
- 8963b91: consolidate packages into core/serde
- 9194e9f: consolidate into core/endpoints
- 7ec62a0: fix browser bundler metadata for @smithy/core
- 62fed78: package consolidation for core/config
- cad44fc: consolidate core/event-streams
- f21bf6b: consolidate packages into core/client

### Patch Changes

- ee92b6b: move core/serde checksum components to core/checksum
- 0be0b36: clean up exported API surface
- fb323fb: avoid sideEffects in core submodule indices
- 545589a: Avoid throwing from waiter 403 warning checks when no responses have been observed.
- 7fd6ac0: export surface equality for core, Node.js/browser/react-native

## 3.23.17

### Patch Changes

- @smithy/util-stream@4.5.25

## 3.23.16

### Patch Changes

- a029f0e: Reduce intermediate allocations in hot paths
  - @smithy/util-stream@4.5.24

## 3.23.15

### Patch Changes

- Updated dependencies [131fce4]
- Updated dependencies [52b4789]
  - @smithy/types@4.14.1
  - @smithy/util-stream@4.5.23
  - @smithy/protocol-http@5.3.14
  - @smithy/url-parser@4.2.14
  - @smithy/util-middleware@4.2.14

## 3.23.14

### Patch Changes

- Updated dependencies [cffd868]
  - @smithy/types@4.14.0
  - @smithy/protocol-http@5.3.13
  - @smithy/url-parser@4.2.13
  - @smithy/util-middleware@4.2.13
  - @smithy/util-stream@4.5.22

## 3.23.13

### Patch Changes

- 7198e09: Remove unnecessary shallow copy of input object and delete operations in `HttpBindingProtocol.serializeRequest` and `RpcProtocol.serializeRequest`. The body serializer is schema-driven and only reads members listed in the payload schema, making the spread and deletes redundant. This eliminates an O(n) copy and 5 delete operations per request.
  - @smithy/util-stream@4.5.21

## 3.23.12

### Patch Changes

- @smithy/util-stream@4.5.20

## 3.23.11

### Patch Changes

- 2edd638: feat(schema): add caching to NormalizedSchema.of() and translateTraits()
  - @smithy/util-stream@4.5.19

## 3.23.10

### Patch Changes

- 5340b11: apply resolved endpoint headers to final request
- Updated dependencies [5340b11]
  - @smithy/types@4.13.1
  - @smithy/protocol-http@5.3.12
  - @smithy/url-parser@4.2.12
  - @smithy/util-middleware@4.2.12
  - @smithy/util-stream@4.5.18

## 3.23.9

### Patch Changes

- 6ef5430: fix typo in thrown error message
- 6ef5430: default event stream body to empty byte array

## 3.23.8

### Patch Changes

- a4d95e6: Set downlevel types to be used in typescript@'<4.5'
- Updated dependencies [a4d95e6]
  - @smithy/util-body-length-browser@4.2.2
  - @smithy/middleware-serde@4.2.12
  - @smithy/util-middleware@4.2.11
  - @smithy/protocol-http@5.3.11
  - @smithy/util-base64@4.3.2
  - @smithy/util-stream@4.5.17
  - @smithy/util-utf8@4.2.2
  - @smithy/uuid@1.1.2

## 3.23.7

### Patch Changes

- 11569eb: preserve null values for non-sparse collections in cbor deserializing
  - @smithy/util-stream@4.5.16

## 3.23.6

### Patch Changes

- Updated dependencies [d0954cc]
  - @smithy/types@4.13.0
  - @smithy/middleware-serde@4.2.11
  - @smithy/protocol-http@5.3.10
  - @smithy/util-middleware@4.2.10
  - @smithy/util-stream@4.5.15

## 3.23.5

### Patch Changes

- 026b177: fix(protocols): remove unsafe type cast in resolvedPath to handle null/undefined from labelValueProvider
- cde9f09: fix extraneous serialization of idempotencyToken into http body

## 3.23.4

### Patch Changes

- 03c3dc8: update for rollup build externalLiveBindings=false
- Updated dependencies [03c3dc8]
  - @smithy/middleware-serde@4.2.10
  - @smithy/protocol-http@5.3.9
  - @smithy/types@4.12.1
  - @smithy/util-base64@4.3.1
  - @smithy/util-body-length-browser@4.2.1
  - @smithy/util-middleware@4.2.9
  - @smithy/util-stream@4.5.14
  - @smithy/util-utf8@4.2.1
  - @smithy/uuid@1.1.1

## 3.23.3

### Patch Changes

- Updated dependencies [ffe1843]
  - @smithy/util-stream@4.5.13

## 3.23.2

### Patch Changes

- c5db01c: fix for Unit event stream union targets

## 3.23.1

### Patch Changes

- 6f96c01: omit absent resposne fields instead of assigning undefined

## 3.23.0

### Minor Changes

- 4f05c6a: compose error TypeRegistry on protocol

### Patch Changes

- @smithy/util-stream@4.5.12

## 3.22.1

### Patch Changes

- @smithy/util-stream@4.5.11

## 3.22.0

### Minor Changes

- 472bf01: avoid autoboxing in NormalizedSchema::getSchema()

## 3.21.1

### Patch Changes

- fa0e0c4: accept 0-byte event stream payloads as structure shapes

## 3.21.0

### Minor Changes

- c2a6f46: improve schema struct iterator performance

## 3.20.8

### Patch Changes

- 96cc077: limit scope of http label validation

## 3.20.7

### Patch Changes

- ae6ef2e: client side httpLabel validation

## 3.20.6

### Patch Changes

- 862c942: custom handling for \_\_type in structures

## 3.20.5

### Patch Changes

- Updated dependencies [745867a]
  - @smithy/types@4.12.0
  - @smithy/middleware-serde@4.2.9
  - @smithy/protocol-http@5.3.8
  - @smithy/util-middleware@4.2.8
  - @smithy/util-stream@4.5.10

## 3.20.4

### Patch Changes

- Updated dependencies [87a5f20]
  - @smithy/util-stream@4.5.9

## 3.20.3

### Patch Changes

- 681d6c4: fix cbor bigDecimal serialization

## 3.20.2

### Patch Changes

- dd55f1f: fix to conditionally set host prefix

## 3.20.1

### Patch Changes

- aa954bc: fix for CBOR shape deserialization of BigDecimals

## 3.20.0

### Minor Changes

- 9ccb841: add static union schema as a new type

### Patch Changes

- Updated dependencies [9ccb841]
  - @smithy/types@4.11.0
  - @smithy/middleware-serde@4.2.8
  - @smithy/protocol-http@5.3.7
  - @smithy/util-middleware@4.2.7
  - @smithy/util-stream@4.5.8

## 3.19.0

### Minor Changes

- 5a56762: make protocol selection easier

### Patch Changes

- Updated dependencies [5a56762]
  - @smithy/types@4.10.0
  - @smithy/middleware-serde@4.2.7
  - @smithy/protocol-http@5.3.6
  - @smithy/util-middleware@4.2.6
  - @smithy/util-stream@4.5.7

## 3.18.7

### Patch Changes

- 541a18f: fix for CBOR date deserialization

## 3.18.6

### Patch Changes

- 1d6db03: continue looking for event headers after event payload is found

## 3.18.5

### Patch Changes

- 77c149f: drain stream in httpBindingProtocol with unit output

## 3.18.4

### Patch Changes

- e659a06: set explicit enumerability on error.$response
- Updated dependencies [e659a06]
  - @smithy/middleware-serde@4.2.6

## 3.18.3

### Patch Changes

- 5bcd041: fix for event stream binding deserialization

## 3.18.2

### Patch Changes

- c8b148c: idempotency token generation for HttpBindingProtocol

## 3.18.1

### Patch Changes

- 0976f42: generate idempotency token in ToStringShapeSerializer

## 3.18.0

### Minor Changes

- 3926fd7: set release level for schemas

### Patch Changes

- e77f705: omit undefined values in cbor deserialization
- Updated dependencies [3926fd7]
  - @smithy/types@4.9.0
  - @smithy/middleware-serde@4.2.5
  - @smithy/protocol-http@5.3.5
  - @smithy/util-middleware@4.2.5
  - @smithy/util-stream@4.5.6

## 3.17.2

### Patch Changes

- 6da0ab3: export used types
- df00095: fix schema date utils date parsing
- Updated dependencies [6da0ab3]
  - @smithy/types@4.8.1
  - @smithy/middleware-serde@4.2.4
  - @smithy/protocol-http@5.3.4
  - @smithy/util-middleware@4.2.4
  - @smithy/util-stream@4.5.5

## 3.17.1

### Patch Changes

- @smithy/util-stream@4.5.4

## 3.17.0

### Minor Changes

- 8a2a912: remove usage of non-static schema classes

### Patch Changes

- Updated dependencies [8a2a912]
- Updated dependencies [7e359e2]
  - @smithy/types@4.8.0
  - @smithy/util-stream@4.5.3
  - @smithy/middleware-serde@4.2.3
  - @smithy/protocol-http@5.3.3
  - @smithy/util-middleware@4.2.3

## 3.16.1

### Patch Changes

- 052d261: fix ordering of static simple schema type
- Updated dependencies [052d261]
  - @smithy/types@4.7.1
  - @smithy/middleware-serde@4.2.2
  - @smithy/protocol-http@5.3.2
  - @smithy/util-middleware@4.2.2
  - @smithy/util-stream@4.5.2

## 3.16.0

### Minor Changes

- 7f8af58: generation of static schema
- 8a2873c: implement SerdeContext base class

### Patch Changes

- Updated dependencies [761d89c]
- Updated dependencies [7f8af58]
  - @smithy/types@4.7.0
  - @smithy/util-stream@4.5.1
  - @smithy/middleware-serde@4.2.1
  - @smithy/protocol-http@5.3.1
  - @smithy/util-middleware@4.2.1

## 3.15.0

### Minor Changes

- 813c9a5: refactoring to reduce code size

### Patch Changes

- Updated dependencies [813c9a5]
  - @smithy/util-base64@4.3.0
  - @smithy/util-stream@4.5.0

## 3.14.0

### Minor Changes

- 45ee67f: update dist-cjs generation to use rollup

### Patch Changes

- Updated dependencies [45ee67f]
  - @smithy/middleware-serde@4.2.0
  - @smithy/protocol-http@5.3.0
  - @smithy/types@4.6.0
  - @smithy/util-base64@4.2.0
  - @smithy/util-body-length-browser@4.2.0
  - @smithy/util-middleware@4.2.0
  - @smithy/util-stream@4.4.0
  - @smithy/util-utf8@4.2.0
  - @smithy/uuid@1.1.0

## 3.13.0

### Minor Changes

- 59e9952: separate error schema objects from error ctor

## 3.12.0

### Minor Changes

- 97fe0d8: Replace 'uuid' with '@smithy/uuid'

### Patch Changes

- 3eb73f3: fix detection of member idempotencyToken trait

## 3.11.1

### Patch Changes

- f8793be: prevent compilation from inserting Uint8Array type parameter
- Updated dependencies [f8793be]
  - @smithy/util-stream@4.3.2

## 3.11.0

### Minor Changes

- bb7c1c1: schema code size optimizations

### Patch Changes

- Updated dependencies [bb7c1c1]
  - @smithy/types@4.5.0
  - @smithy/middleware-serde@4.1.1
  - @smithy/protocol-http@5.2.1
  - @smithy/util-middleware@4.1.1
  - @smithy/util-stream@4.3.1

## 3.10.0

### Minor Changes

- 64cda93: set sideEffects bundler metadata

### Patch Changes

- f884df7: enforce consistent-type-imports
- Updated dependencies [64cda93]
- Updated dependencies [f884df7]
  - @smithy/util-body-length-browser@4.1.0
  - @smithy/middleware-serde@4.1.0
  - @smithy/util-middleware@4.1.0
  - @smithy/protocol-http@5.2.0
  - @smithy/util-base64@4.1.0
  - @smithy/util-stream@4.3.0
  - @smithy/util-utf8@4.1.0
  - @smithy/types@4.4.0

## 3.9.2

### Patch Changes

- 06ac1f6: set explicit return type for cbor alloc

## 3.9.1

### Patch Changes

- 29fad01: fix NumericValue typecheck

## 3.9.0

### Minor Changes

- ab4f33f: CBOR protocol error handling fallbacks
- d79dc91: schema serde eventstreams implementation

## 3.8.0

### Minor Changes

- fd00602: handle idempotency token generation for CBOR protocol

### Patch Changes

- 64e033f: schema serde: http binding and cbor serializer refactoring
- Updated dependencies [64e033f]
  - @smithy/types@4.3.2
  - @smithy/middleware-serde@4.0.9
  - @smithy/protocol-http@5.1.3
  - @smithy/util-middleware@4.0.5
  - @smithy/util-stream@4.2.4

## 3.7.2

### Patch Changes

- f4dcba0: fix offset calculation when decoding bigInteger in CBOR

## 3.7.1

### Patch Changes

- 312801c: increase priority of types conditional exports
- bb7975e: set sideEffects bundler metadata

## 3.7.0

### Minor Changes

- d105c97: add instanceof overrides for schema classes

### Patch Changes

- @smithy/util-stream@4.2.3

## 3.6.0

### Minor Changes

- 10a0534: support BigInt in cbor

## 3.5.3

### Patch Changes

- 4a31774: allow old signature in protected method

## 3.5.2

### Patch Changes

- 4642e7e: allow http prefix header and header to read from same binding
- 147ceed: use smithy synthetic namespace for base errors
- ae8f1f4: allow struct iterator acquisition on unit schema

## 3.5.1

### Patch Changes

- Updated dependencies [358c1ff]
  - @smithy/types@4.3.1
  - @smithy/middleware-serde@4.0.8
  - @smithy/protocol-http@5.1.2
  - @smithy/util-middleware@4.0.4
  - @smithy/util-stream@4.2.2

## 3.5.0

### Minor Changes

- ae11e3a: add schema classes
- 23812a9: add cbor protocol (alpha)

### Patch Changes

- Updated dependencies [ae11e3a]
  - @smithy/middleware-serde@4.0.7

## 3.4.0

### Minor Changes

- 06b0ce8: move serde functions from smithy-client to core/serde

### Patch Changes

- efb27ee: read code property of errors case-insensitively
- Updated dependencies [0547fab]
  - @smithy/types@4.3.0
  - @smithy/middleware-serde@4.0.6
  - @smithy/protocol-http@5.1.1
  - @smithy/util-middleware@4.0.3
  - @smithy/util-stream@4.2.1

## 3.3.3

### Patch Changes

- Updated dependencies [786dd3a]
  - @smithy/middleware-serde@4.0.5

## 3.3.2

### Patch Changes

- Updated dependencies [103535a]
  - @smithy/middleware-serde@4.0.4

## 3.3.1

### Patch Changes

- 40ffcd5: copy input headers when building RPCv2 CBOR request

## 3.3.0

### Minor Changes

- 5896264: Resolve auth schemes based on the preference list

## 3.2.0

### Minor Changes

- 02ef79c: add numeric value container for serde

### Patch Changes

- Updated dependencies [e917e61]
  - @smithy/protocol-http@5.1.0
  - @smithy/util-stream@4.2.0
  - @smithy/types@4.2.0
  - @smithy/middleware-serde@4.0.3
  - @smithy/util-middleware@4.0.2

## 3.1.5

### Patch Changes

- @smithy/util-stream@4.1.2

## 3.1.4

### Patch Changes

- Updated dependencies [efedb20]
  - @smithy/util-stream@4.1.1

## 3.1.3

### Patch Changes

- Updated dependencies [d1d1f72]
  - @smithy/util-stream@4.1.0

## 3.1.2

### Patch Changes

- Updated dependencies [f5d0bac]
  - @smithy/middleware-serde@4.0.2

## 3.1.1

### Patch Changes

- @smithy/util-stream@4.0.2

## 3.1.0

### Minor Changes

- 2aff9df: Added middleware support to pagination
- 000b2ae: allow paginator token fallback to be specified by operation input

### Patch Changes

- Updated dependencies [2aff9df]
- Updated dependencies [000b2ae]
  - @smithy/types@4.1.0
  - @smithy/middleware-serde@4.0.1
  - @smithy/protocol-http@5.0.1
  - @smithy/util-middleware@4.0.1
  - @smithy/util-stream@4.0.1

## 3.0.0

### Major Changes

- 20d99be: major version bump for dropping node16 support

### Patch Changes

- Updated dependencies [20d99be]
  - @smithy/util-middleware@4.0.0
  - @smithy/util-stream@4.0.0
  - @smithy/util-utf8@4.0.0
  - @smithy/middleware-serde@4.0.0
  - @smithy/protocol-http@5.0.0
  - @smithy/types@4.0.0
  - @smithy/util-body-length-browser@4.0.0

## 2.5.7

### Patch Changes

- @smithy/util-stream@3.3.4

## 2.5.6

### Patch Changes

- @smithy/util-stream@3.3.3

## 2.5.5

### Patch Changes

- Updated dependencies [b52b4e8]
  - @smithy/types@3.7.2
  - @smithy/middleware-serde@3.0.11
  - @smithy/protocol-http@4.1.8
  - @smithy/util-middleware@3.0.11
  - @smithy/util-stream@3.3.2

## 2.5.4

### Patch Changes

- 9c40f7b: make CBOR tags more distinct in JS

## 2.5.3

### Patch Changes

- Updated dependencies [fcd5ca8]
  - @smithy/types@3.7.1
  - @smithy/middleware-serde@3.0.10
  - @smithy/protocol-http@4.1.7
  - @smithy/util-middleware@3.0.10
  - @smithy/util-stream@3.3.1

## 2.5.2

### Patch Changes

- c6ef519: avoid self referencing submodule import
- Updated dependencies [c8d257b]
- Updated dependencies [cd1929b]
  - @smithy/util-stream@3.3.0
  - @smithy/types@3.7.0
  - @smithy/middleware-serde@3.0.9
  - @smithy/protocol-http@4.1.6
  - @smithy/util-middleware@3.0.9

## 2.5.1

### Patch Changes

- Updated dependencies [ccdd49f]
  - @smithy/util-stream@3.2.1

## 2.5.0

### Minor Changes

- 84bec05: add feature identification map to smithy context
- d07b0ab: feature detection for custom endpoint and gzip

### Patch Changes

- d07b0ab: reorganize smithy/core to be upstream of smithy/smithy-client
- Updated dependencies [f4e0bd9]
- Updated dependencies [84bec05]
  - @smithy/util-stream@3.2.0
  - @smithy/types@3.6.0
  - @smithy/middleware-serde@3.0.8
  - @smithy/protocol-http@4.1.5
  - @smithy/util-middleware@3.0.8

## 2.4.8

### Patch Changes

- Updated dependencies [75e0125]
  - @smithy/smithy-client@3.4.0
  - @smithy/middleware-retry@3.0.23

## 2.4.7

### Patch Changes

- Updated dependencies [a4c1285]
  - @smithy/types@3.5.0
  - @smithy/middleware-endpoint@3.1.4
  - @smithy/middleware-retry@3.0.22
  - @smithy/middleware-serde@3.0.7
  - @smithy/protocol-http@4.1.4
  - @smithy/smithy-client@3.3.6
  - @smithy/util-middleware@3.0.7

## 2.4.6

### Patch Changes

- 18dd957: add compatibility types redirect
- Updated dependencies [64600d8]
  - @smithy/smithy-client@3.3.5
  - @smithy/middleware-retry@3.0.21

## 2.4.5

### Patch Changes

- @smithy/smithy-client@3.3.4
- @smithy/middleware-retry@3.0.20

## 2.4.4

### Patch Changes

- @smithy/smithy-client@3.3.3
- @smithy/middleware-retry@3.0.19

## 2.4.3

### Patch Changes

- Updated dependencies [e7b438b]
  - @smithy/types@3.4.2
  - @smithy/middleware-endpoint@3.1.3
  - @smithy/middleware-retry@3.0.18
  - @smithy/middleware-serde@3.0.6
  - @smithy/protocol-http@4.1.3
  - @smithy/smithy-client@3.3.2
  - @smithy/util-middleware@3.0.6

## 2.4.2

### Patch Changes

- Updated dependencies [cf9257e]
  - @smithy/types@3.4.1
  - @smithy/middleware-endpoint@3.1.2
  - @smithy/middleware-retry@3.0.17
  - @smithy/middleware-serde@3.0.5
  - @smithy/protocol-http@4.1.2
  - @smithy/smithy-client@3.3.1
  - @smithy/util-middleware@3.0.5

## 2.4.1

### Patch Changes

- Updated dependencies [c8c53ae]
- Updated dependencies [2dad138]
- Updated dependencies [d8df7bf]
- Updated dependencies [9f3f2f5]
  - @smithy/middleware-endpoint@3.1.1
  - @smithy/types@3.4.0
  - @smithy/smithy-client@3.3.0
  - @smithy/middleware-retry@3.0.16
  - @smithy/middleware-serde@3.0.4
  - @smithy/protocol-http@4.1.1
  - @smithy/util-middleware@3.0.4

## 2.4.0

### Minor Changes

- 5865b65: cbor (de)serializer for JS

### Patch Changes

- Updated dependencies [5865b65]
  - @smithy/smithy-client@3.2.0
  - @smithy/middleware-retry@3.0.15

## 2.3.2

### Patch Changes

- Updated dependencies [670553a]
  - @smithy/smithy-client@3.1.12
  - @smithy/middleware-retry@3.0.14

## 2.3.1

### Patch Changes

- @smithy/smithy-client@3.1.11
- @smithy/middleware-retry@3.0.13

## 2.3.0

### Minor Changes

- 86862ea: switch to static HttpRequest clone method

### Patch Changes

- Updated dependencies [4a40961]
- Updated dependencies [86862ea]
  - @smithy/middleware-endpoint@3.1.0
  - @smithy/protocol-http@4.1.0
  - @smithy/smithy-client@3.1.10
  - @smithy/middleware-retry@3.0.12
  - @smithy/middleware-serde@3.0.3

## 2.2.8

### Patch Changes

- @smithy/smithy-client@3.1.9
- @smithy/middleware-retry@3.0.11

## 2.2.7

### Patch Changes

- Updated dependencies [796567d]
  - @smithy/protocol-http@4.0.4
  - @smithy/middleware-retry@3.0.10
  - @smithy/smithy-client@3.1.8
  - @smithy/middleware-serde@3.0.3

## 2.2.6

### Patch Changes

- @smithy/middleware-endpoint@3.0.5
- @smithy/smithy-client@3.1.7
- @smithy/middleware-retry@3.0.9

## 2.2.5

### Patch Changes

- @smithy/smithy-client@3.1.6
- @smithy/middleware-retry@3.0.8

## 2.2.4

### Patch Changes

- Updated dependencies [4784fb9]
  - @smithy/types@3.3.0
  - @smithy/middleware-endpoint@3.0.4
  - @smithy/middleware-retry@3.0.7
  - @smithy/middleware-serde@3.0.3
  - @smithy/protocol-http@4.0.3
  - @smithy/smithy-client@3.1.5
  - @smithy/util-middleware@3.0.3

## 2.2.3

### Patch Changes

- Updated dependencies [c16e014]
- Updated dependencies [c2a5595]
  - @smithy/types@3.2.0
  - @smithy/middleware-endpoint@3.0.3
  - @smithy/middleware-retry@3.0.6
  - @smithy/middleware-serde@3.0.2
  - @smithy/protocol-http@4.0.2
  - @smithy/smithy-client@3.1.4
  - @smithy/util-middleware@3.0.2

## 2.2.2

### Patch Changes

- @smithy/smithy-client@3.1.3
- @smithy/middleware-retry@3.0.5

## 2.2.1

### Patch Changes

- Updated dependencies [38da9009]
  - @smithy/types@3.1.0
  - @smithy/middleware-endpoint@3.0.2
  - @smithy/middleware-retry@3.0.4
  - @smithy/middleware-serde@3.0.1
  - @smithy/protocol-http@4.0.1
  - @smithy/smithy-client@3.1.2
  - @smithy/util-middleware@3.0.1

## 2.2.0

### Minor Changes

- f9c50081: adds a module exports field in core

## 2.1.1

### Patch Changes

- Updated dependencies [3689c949]
  - @smithy/smithy-client@3.1.1
  - @smithy/middleware-retry@3.0.3

## 2.1.0

### Minor Changes

- ab3a90fa: enable package.json exports in core

### Patch Changes

- Updated dependencies [764047eb]
  - @smithy/smithy-client@3.1.0
  - @smithy/middleware-endpoint@3.0.1
  - @smithy/middleware-retry@3.0.2

## 2.0.1

### Patch Changes

- @smithy/smithy-client@3.0.1
- @smithy/middleware-retry@3.0.1

## 2.0.0

### Major Changes

- 671aa704: update to node16 minimum

### Patch Changes

- Updated dependencies [7a7c84d3]
- Updated dependencies [671aa704]
  - @smithy/types@3.0.0
  - @smithy/middleware-endpoint@3.0.0
  - @smithy/middleware-retry@3.0.0
  - @smithy/middleware-serde@3.0.0
  - @smithy/util-middleware@3.0.0
  - @smithy/protocol-http@4.0.0
  - @smithy/smithy-client@3.0.0

## 1.4.2

### Patch Changes

- Updated dependencies [cc54b8d1]
  - @smithy/middleware-endpoint@2.5.1
  - @smithy/smithy-client@2.5.1
  - @smithy/middleware-retry@2.3.1

## 1.4.1

### Patch Changes

- Updated dependencies [e03a10ac]
  - @smithy/middleware-retry@2.3.0

## 1.4.0

### Minor Changes

- 38f9a61f: Update package dependencies

### Patch Changes

- Updated dependencies [38f9a61f]
- Updated dependencies [661f1d60]
  - @smithy/middleware-endpoint@2.5.0
  - @smithy/middleware-retry@2.2.0
  - @smithy/middleware-serde@2.3.0
  - @smithy/util-middleware@2.2.0
  - @smithy/protocol-http@3.3.0
  - @smithy/smithy-client@2.5.0
  - @smithy/types@2.12.0

## 1.3.8

### Patch Changes

- @smithy/smithy-client@2.4.5
- @smithy/middleware-retry@2.1.7

## 1.3.7

### Patch Changes

- Updated dependencies [32e3f6ff]
  - @smithy/middleware-serde@2.2.1
  - @smithy/middleware-endpoint@2.4.6
  - @smithy/smithy-client@2.4.4
  - @smithy/middleware-retry@2.1.6

## 1.3.6

### Patch Changes

- Updated dependencies [43f3e1e2]
- Updated dependencies [49640d6c]
  - @smithy/middleware-serde@2.2.0
  - @smithy/types@2.11.0
  - @smithy/middleware-endpoint@2.4.5
  - @smithy/middleware-retry@2.1.5
  - @smithy/protocol-http@3.2.2
  - @smithy/smithy-client@2.4.3
  - @smithy/util-middleware@2.1.4

## 1.3.5

### Patch Changes

- @smithy/middleware-endpoint@2.4.4
- @smithy/smithy-client@2.4.2
- @smithy/middleware-retry@2.1.4

## 1.3.4

### Patch Changes

- Updated dependencies [dd0d9b4b]
  - @smithy/middleware-retry@2.1.3
  - @smithy/types@2.10.1
  - @smithy/middleware-endpoint@2.4.3
  - @smithy/middleware-serde@2.1.3
  - @smithy/protocol-http@3.2.1
  - @smithy/smithy-client@2.4.1
  - @smithy/util-middleware@2.1.3

## 1.3.3

### Patch Changes

- Updated dependencies [d70a00ac]
- Updated dependencies [1e23f967]
- Updated dependencies [929801bc]
  - @smithy/types@2.10.0
  - @smithy/protocol-http@3.2.0
  - @smithy/smithy-client@2.4.0
  - @smithy/middleware-endpoint@2.4.2
  - @smithy/middleware-retry@2.1.2
  - @smithy/middleware-serde@2.1.2
  - @smithy/util-middleware@2.1.2

## 1.3.2

### Patch Changes

- 88980bc5: handle multi-part input token in paginator

## 1.3.1

### Patch Changes

- 2b1bf055: generate dist-cjs with runtime list of export names for esm
- Updated dependencies [2b1bf055]
  - @smithy/middleware-endpoint@2.4.1
  - @smithy/middleware-retry@2.1.1
  - @smithy/middleware-serde@2.1.1
  - @smithy/protocol-http@3.1.1
  - @smithy/smithy-client@2.3.1
  - @smithy/types@2.9.1
  - @smithy/util-middleware@2.1.1

## 1.3.0

### Minor Changes

- 9939f823: bundle dist-cjs index

### Patch Changes

- Updated dependencies [9939f823]
  - @smithy/middleware-endpoint@2.4.0
  - @smithy/middleware-retry@2.1.0
  - @smithy/middleware-serde@2.1.0
  - @smithy/util-middleware@2.1.0
  - @smithy/protocol-http@3.1.0
  - @smithy/smithy-client@2.3.0
  - @smithy/types@2.9.0

## 1.2.2

### Patch Changes

- Updated dependencies [590af6b7]
  - @smithy/middleware-endpoint@2.3.0
  - @smithy/types@2.8.0
  - @smithy/smithy-client@2.2.1
  - @smithy/middleware-retry@2.0.26
  - @smithy/middleware-serde@2.0.16
  - @smithy/protocol-http@3.0.12
  - @smithy/util-middleware@2.0.9

## 1.2.1

### Patch Changes

- Updated dependencies [164f3bbd]
- Updated dependencies [164f3bbd]
  - @smithy/smithy-client@2.2.0
  - @smithy/middleware-retry@2.0.25

## 1.2.0

### Minor Changes

- 12adf848: add paginator factory

### Patch Changes

- 3eb09aae: fix(core): strict core deps

## 1.1.0

### Minor Changes

- 75cbb3e8: add requestBuilder

## 1.0.5

### Patch Changes

- @smithy/middleware-endpoint@2.2.3
- @smithy/middleware-retry@2.0.24

## 1.0.4

### Patch Changes

- @smithy/middleware-retry@2.0.23

## 1.0.3

### Patch Changes

- Updated dependencies [44f78bd9]
- Updated dependencies [340634a5]
  - @smithy/middleware-retry@2.0.22
  - @smithy/types@2.7.0
  - @smithy/middleware-endpoint@2.2.2
  - @smithy/middleware-serde@2.0.15
  - @smithy/protocol-http@3.0.11

## 1.0.2

### Patch Changes

- 8c674e70: Copy `getSmithyContext()` and `normalizeProvider()` to `@smithy/core`.
- 9579a9a0: Add internal error and success handlers to `HttpSigner`.
- Updated dependencies [9bfc64ed]
- Updated dependencies [9579a9a0]
  - @smithy/types@2.6.0
  - @smithy/middleware-endpoint@2.2.1
  - @smithy/middleware-retry@2.0.21
  - @smithy/middleware-serde@2.0.14
  - @smithy/protocol-http@3.0.10

## 1.0.1

### Patch Changes

- 4fca874e: Fix test script.

## 1.0.0

### Major Changes

- 8044a814: feat(experimentalIdentityAndAuth): move `experimentalIdentityAndAuth` types and interfaces to `@smithy/types` and `@smithy/core`

### Patch Changes

- Updated dependencies [8044a814]
- Updated dependencies [9e0a5a74]
  - @smithy/middleware-endpoint@2.2.0
  - @smithy/types@2.5.0
  - @smithy/middleware-retry@2.0.20
  - @smithy/middleware-serde@2.0.13
  - @smithy/protocol-http@3.0.9

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.
