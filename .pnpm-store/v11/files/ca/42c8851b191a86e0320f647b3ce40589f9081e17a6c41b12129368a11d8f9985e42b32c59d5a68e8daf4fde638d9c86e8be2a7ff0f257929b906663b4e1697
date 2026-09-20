fast-sha256-js
==============

SHA-256 implementation for JavaScript/TypeScript with typed arrays
that works in modern browsers and Node.js.
Implements the hash function, HMAC, and PBKDF2.

Public domain. No warranty.

[![Build Status](https://travis-ci.org/dchest/fast-sha256-js.svg?branch=master)
](https://travis-ci.org/dchest/fast-sha256-js)


Installation
------------

You can install fast-sha256-js via [NPM](https://www.npmjs.org/):

    $ npm install fast-sha256

or [download source code](https://github.com/dchest/fast-sha256-js/releases).


Usage
-----

Functions accept and return `Uint8Array`s.
To convert strings, use external library (for example,
[nacl.util](https://github.com/dchest/tweetnacl-util-js/)).

### sha256(message)

Returns a SHA-256 hash of the message.


### sha256.hmac(key, message)

Returns an HMAC-SHA-256 of the message for the key.


### sha256.pbkdf2(password, salt, rounds, dkLen)

Returns a key of length dkLen derived using PBKDF2-HMAC-SHA256
from the given password, salt, and the number of rounds.


### sha256.hkdf(key, salt, info?, length?)

Returns a key of the given length derived using HKDF as
described in RFC 5869.

There are also classes `Hash` and `HMAC`:

### new sha256.Hash()

Constructor for hash instance. Should be used with `new`.
Available methods: `update()`, `digest()`, `reset()`, etc.

### new sha256.HMAC(key)

Constructor for HMAC instance. Should be used with `new`.
Available methods: `update()`, `digest()`, `reset()`, etc.

See comments in `src/sha256.ts` for details.


Usage with TypeScript
---------------------

```typescript
import sha256, { Hash, HMAC } from "fast-sha256";

sha256(data) // default export is hash

const h = new HMAC(key); // also Hash and HMAC classes
const mac = h.update(data).digest();

// alternatively:

import * as sha256 from "fast-sha256";

sha256.pbkdf2(password, salt, iterations, dkLen); // returns derived key
sha256.hash(data)

const hasher = new sha256.Hash();
hasher.update(data1);
hasher.update(data2);
const result = hasher.digest();
```


Testing and building
--------------------

Install development dependencies:

    $ npm install

Build JavaScript, minified version, and typings:

    $ npm run build

Run tests:

    $ npm test

Run tests on a different source file:

    $ SHA256_SRC=sha256.min.js npm test

Run benchmark:

    $ npm run bench

(or in a browser, open `tests/bench.html`).

Lint:

    $ npm run lint


Notes
-----

While this implementation is pretty fast compared to previous generation
implementations, if you need an even faster one, check out
[asmCrypto](https://github.com/vibornoff/asmcrypto.js).
